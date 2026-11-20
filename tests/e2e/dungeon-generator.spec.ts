import { expect, test, type Page } from 'playwright/test';
import { button, doc, encounter, home, menu } from './helpers';

/** Layout fingerprint that ignores generated ids. */
const layout = (d: Awaited<ReturnType<typeof doc>>) => JSON.stringify({
  rooms: d.rooms.map(r => [r.name, r.floor, r.pts]),
  doors: d.doors.map(x => [x.x, x.y, x.rot, x.kind, x.width]),
  stamps: d.stamps.map(s => [s.type, Math.round(s.x), Math.round(s.y)]),
});

async function openGenerator(page: Page) {
  await home(page);
  await page.locator('.tpl').filter({ has: page.getByText('Dungeon', { exact: true }) }).click();
  await expect(page.locator('.gen')).toBeVisible();
  await expect(page.locator('.gen-variant.loading')).toHaveCount(0, { timeout: 30_000 });
  await expect(page.locator('.gen-preview')).not.toHaveClass(/busy/);
}

test('the Dungeon template opens the generator with a preview, stats and five variants', async ({ page }) => {
  await openGenerator(page);
  await expect(page.locator('.gen-variant')).toHaveCount(5);
  await expect(page.locator('.gen-variant.on')).toHaveCount(1);
  await expect(page.locator('.gen-stats')).toContainText(/\d+ rooms?/);
  // Picking another variant makes its seed the current one.
  const second = page.locator('.gen-variant').nth(1);
  const seed = (await second.locator('span').textContent())!;
  await second.click();
  await expect(page.locator('.gen-seed')).toHaveValue(seed);
  await page.locator('.gen').getByRole('button', { name: 'Create map' }).click();
  await expect(page.locator('.gen')).toBeHidden();
  await expect.poll(async () => (await doc(page)).rooms.length).toBeGreaterThan(1);
  expect((await doc(page)).name).toBe('Crypt');
});

test('the same seed and options rebuild the same dungeon', async ({ page }) => {
  await openGenerator(page);
  await page.locator('.gen-seed').fill('CRYPT-4242');
  await page.locator('.gen-seed').press('Enter');
  await page.locator('.gen').getByRole('button', { name: 'Create map' }).click();
  await expect(page.locator('.gen')).toBeHidden();
  await expect.poll(async () => (await doc(page)).rooms.length).toBeGreaterThan(1);
  const first = layout(await doc(page));
  // Regenerate the open map with the same seed typed by hand.
  await menu(page, 'Map settings…');
  await page.locator('.settings select').selectOption('dungeon');
  await button(page, 'Regenerate').click();
  await expect(page.locator('.gen-warn')).toContainText('Crypt');
  await page.locator('.gen-seed').fill('CRYPT-4242');
  await page.locator('.gen-seed').press('Enter');
  await page.locator('.gen').getByRole('button', { name: /Apply to/ }).click();
  await expect(page.locator('.gen')).toBeHidden();
  await expect.poll(async () => layout(await doc(page))).toBe(first);
});

test('every preset produces connected, bounded dungeons with hidden traps', async ({ page }) => {
  await home(page);
  const report = await page.evaluate(async () => {
    const [{ MapRuntime }, { newDoc }, D, { pointInPoly }] = await Promise.all(
      ['/src/runtime.ts', '/src/model.ts', '/src/dungeon.ts', '/src/util.ts'].map(p => import(/* @vite-ignore */ p)));
    const problems: string[] = [];
    for (const preset of D.PRESET_ORDER) for (const [C, R] of [[10, 10], [30, 22], [40, 30]]) for (let s = 0; s < 4; s++) {
      const seed = `${preset}-${s}`;
      const rt = new MapRuntime(newDoc('t', C, R));
      const stats = D.generateDungeon(rt, D.PRESETS[preset], seed);
      const d = rt.doc;
      const open = new Uint8Array(C * R);
      const cave = rt.engine.mask('cave');
      const cd = cave ? cave.getContext('2d').getImageData(0, 0, cave.width, cave.height).data : null;
      for (let y = 0; y < R; y++) for (let x = 0; x < C; x++) {
        const px = (x + 0.5) * 100, py = (y + 0.5) * 100;
        if (d.rooms.some((r: any) => pointInPoly(px, py, r.pts))) open[y * C + x] = 1;
        else if (cd && cd[(Math.floor(py / 2) * cave.width + Math.floor(px / 2)) * 4 + 3] > 100) open[y * C + x] = 1;
      }
      const start = open.indexOf(1), seen = new Uint8Array(C * R), stack = [start];
      let reached = 0;
      if (start >= 0) seen[start] = 1;
      while (stack.length) {
        const k = stack.pop()!; reached++;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const X = (k % C) + dx, Y = Math.floor(k / C) + dy;
          if (X < 0 || Y < 0 || X >= C || Y >= R) continue;
          const j = Y * C + X;
          if (open[j] && !seen[j]) { seen[j] = 1; stack.push(j); }
        }
      }
      const total = open.reduce((a: number, b: number) => a + b, 0);
      if (stats.rooms < 2) problems.push(`${seed} ${C}x${R}: only ${stats.rooms} rooms`);
      if (reached !== total) problems.push(`${seed} ${C}x${R}: reached ${reached}/${total}`);
      if (d.rooms.some((r: any) => r.pts.some((v: number, i: number) => v < 0 || v > (i % 2 ? R : C) * 100))) problems.push(`${seed} ${C}x${R}: room outside the map`);
      if (d.stamps.some((s: any) => s.x < 0 || s.y < 0 || s.x > C * 100 || s.y > R * 100)) problems.push(`${seed} ${C}x${R}: prop outside the map`);
      if (d.stamps.some((s: any) => s.type === 'trap' && !s.hidden)) problems.push(`${seed}: visible trap`);
      if (d.stamps.filter((s: any) => s.type === 'trap').length !== stats.traps) problems.push(`${seed}: trap count mismatch`);
      if (d.doors.filter((x: any) => x.kind === 'secret').length !== stats.secretDoors) problems.push(`${seed}: secret door count mismatch`);
    }
    return problems;
  });
  expect(report).toEqual([]);
});

test('regenerating a dungeon is blocked during combat', async ({ page }) => {
  await encounter(page);
  await button(page, 'Start combat').click();
  const before = layout(await doc(page));
  await menu(page, 'Map settings…');
  await page.locator('.settings select').selectOption('dungeon');
  await button(page, 'Regenerate').click();
  await expect(page.locator('.toast')).toHaveText('End combat before regenerating the map');
  await expect(page.locator('.gen')).toBeHidden();
  expect(layout(await doc(page))).toBe(before);
});
