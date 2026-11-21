import { expect, test, type Page } from 'playwright/test';
import { button, doc, home } from './helpers';

async function newWorld(page: Page, seed = 'WORLD-TEST', again = false) {
  // later launches reopen the last map, so the second world starts from the map switcher
  if (again) await page.locator('.map-switch').click();
  else await home(page);
  await button(page, 'Small 20×15').click();
  await page.locator('.tpl').filter({ has: page.getByText('World', { exact: true }) }).click();
  await expect(page.locator('.gen h1')).toHaveText('New world');
  const seedBox = page.getByRole('textbox', { name: 'Seed' });
  await seedBox.fill(seed);
  await seedBox.press('Enter');
  await expect(page.locator('.gen-preview')).not.toHaveClass(/busy/, { timeout: 30_000 });
  await page.locator('.gen').getByRole('button', { name: 'Create map' }).click();
  await page.waitForFunction(() => window.editor?.rt?.doc.kind === 'world');
  await expect(page.locator('.save-status')).toHaveText('Saved');
}

test('the World template generates a populated, bounded world from a seed', async ({ page }) => {
  await newWorld(page);
  const d = await doc(page);
  expect([d.kind, d.cols, d.rows]).toEqual(['world', 36, 24]);
  expect(d.name).toMatch(/^Kingdom of /);
  expect(d.grid).toMatchObject({ shape: 'hex', unit: 'mi' });
  expect(d.fogEnabled).toBe(true);
  expect(d.paths.some((p) => p.kind === 'river')).toBe(true);
  expect(d.stamps.length).toBeGreaterThan(50);
  // only world icons, all inside the map
  const kinds = await page.evaluate(async () => {
    const path = '/src/stamps.ts';
    const { STAMP_BY_ID } = await import(path);
    return window.editor.rt.doc.stamps.map((s) => !!STAMP_BY_ID.get(s.type)?.world);
  });
  expect(kinds.every(Boolean)).toBe(true);
  for (const s of d.stamps) {
    expect(s.x).toBeGreaterThanOrEqual(0); expect(s.x).toBeLessThanOrEqual(d.cols * 100);
    expect(s.y).toBeGreaterThanOrEqual(0); expect(s.y).toBeLessThanOrEqual(d.rows * 100);
  }
  // the land mask exists and both land and sea are present
  const share = await page.evaluate(() => {
    const m = window.editor.rt.engine.mask('land')!;
    const px = m.getContext('2d')!.getImageData(0, 0, m.width, m.height).data;
    let land = 0; for (let i = 3; i < px.length; i += 4) if (px[i] > 128) land++;
    return land / (px.length / 4);
  });
  expect(share).toBeGreaterThan(0.2);
  expect(share).toBeLessThan(0.7);
});

test('the same seed rebuilds the same world', async ({ page }) => {
  await newWorld(page, 'WORLD-SAME');
  const a = await doc(page);
  await newWorld(page, 'WORLD-SAME', true);
  const b = await doc(page);
  expect(b.id).not.toBe(a.id);
  const sig = (d: typeof a) => d.stamps.map((s) => [s.type, Math.round(s.x), Math.round(s.y)]);
  expect(sig(b)).toEqual(sig(a));
  expect(b.labels.map((l) => l.text)).toEqual(a.labels.map((l) => l.text));
});

test('world maps offer routes and world icons instead of rooms and furniture', async ({ page }) => {
  await newWorld(page);
  await button(page, 'Build').click();
  for (const name of ['River', 'Road', 'Trail', 'Border']) await expect(button(page, name)).toBeVisible();
  await expect(button(page, 'Room')).toHaveCount(0);
  await button(page, 'Furnish').click();
  const cats = await page.locator('.drawer .chips button').evaluateAll((els) => els.map((el) => el.getAttribute('aria-label')));
  expect(cats).toContain('Terrain');
  expect(cats).not.toContain('Furniture');
});

test('moving the party in Play clears the fog around it', async ({ page }) => {
  await newWorld(page);
  await button(page, 'Play').click();
  const fogAt = (x: number, y: number) => page.evaluate(([x, y]) => {
    const rt = window.editor.rt, m = rt.fog.mask;
    return m.getContext('2d')!.getImageData(x * m.width / rt.W, y * m.height / rt.H, 1, 1).data[3];
  }, [x, y]);
  const [x, y] = [1500, 1000];
  expect(await fogAt(x, y)).toBe(255);
  await page.evaluate(async ([x, y]) => {
    const path = '/src/model.ts';
    const { newToken } = await import(path);
    const ed = window.editor;
    const tok = newToken(x, y, 'pc', 'Party');
    ed.rt.doc.tokens.push(tok);
    ed.revealAround(tok);
  }, [x, y]);
  expect(await fogAt(x, y)).toBe(0);
  expect(await fogAt(x + 600, y)).toBe(255);
});

test('a place on the world map gets its own linked battle map', async ({ page }) => {
  await newWorld(page);
  const world = await doc(page);
  const town = world.stamps.find((s) => ['w_town', 'w_city', 'w_village', 'w_capital', 'w_port'].includes(s.type))!;
  await page.evaluate(async (id) => {
    const ed = window.editor;
    await ed.createLinkedMap(ed.rt.doc.stamps.find((s) => s.id === id)!, 'tavern');
  }, town.id);
  const child = await doc(page);
  expect(child.kind).toBe('battle');
  expect(child.parent).toBe(world.id);
  expect(child.rooms.length).toBeGreaterThan(0);
  await expect(page.locator('.parent-btn')).toHaveText(`Back to ${world.name}`);
  await page.locator('.parent-btn').click();
  await page.waitForFunction((id) => window.editor.rt.doc.id === id, world.id);
  expect((await doc(page)).stamps.find((s) => s.id === town.id)!.link).toBe(child.id);
});
