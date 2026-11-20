import { expect, test, type Page } from 'playwright/test';
import type { MapDoc } from '../../src/model';
import { button, create, doc, empty, encounter, home, menu } from './helpers';

function bounds(d: MapDoc) {
  const points = [...d.rooms, ...d.walls].flatMap(o => o.pts.filter((_, i) => i % 2 === 0).map((x, i) => [x, o.pts[2 * i + 1]]));
  for (const group of [d.stamps, d.lights, d.labels, d.doors, d.markers, d.tokens]) {
    for (const o of group) points.push([o.x, o.y]);
  }
  return points.filter(([x, y]) => !(x >= 0 && x <= d.cols * 100 && y >= 0 && y <= d.rows * 100));
}

async function clippedProps(page: Page) {
  return page.evaluate(async () => {
    const path = '/src/render.ts';
    const { stampSize } = await import(path);
    const rt = window.editor.rt;
    return rt.doc.stamps.filter(stamp => {
      const { img, w, h, pad } = stampSize(stamp);
      const width = w + 2 * pad, height = h + 2 * pad;
      const reach = Math.hypot(width, height) * stamp.scale / 2;
      if (Math.min(stamp.x, stamp.y, rt.W - stamp.x, rt.H - stamp.y) >= reach) return false;
      // Inspect only painted sprite pixels, so transparent padding cannot fail the test.
      const pixels = img.getContext('2d').getImageData(0, 0, img.width, img.height).data;
      const sin = Math.sin(stamp.rot), cos = Math.cos(stamp.rot);
      for (let i = 0; i < pixels.length / 4; i++) {
        if (pixels[4 * i + 3] === 0) continue;
        const dx = ((i % img.width + 0.5) / img.width - 0.5) * width * stamp.scale * (stamp.flip ? -1 : 1);
        const dy = ((Math.floor(i / img.width) + 0.5) / img.height - 0.5) * height * stamp.scale;
        const x = stamp.x + cos * dx - sin * dy, y = stamp.y + sin * dx + cos * dy;
        if (x < 0 || x > rt.W || y < 0 || y > rt.H) return true;
      }
      return false;
    }).map(s => s.type);
  });
}

// Four-neighbour flood fill excludes diagonal contact and row-end wrapping.
function connected(cells: number[], width: number) {
  const remaining = new Set(cells);
  const queue = cells.slice(0, 1);
  remaining.delete(queue[0]);
  for (let i = 0; i < queue.length; i++) {
    const p = queue[i];
    const adjacent = [p - width, p + width];
    if (p % width) adjacent.push(p - 1);
    if (p % width < width - 1) adjacent.push(p + 1);
    for (const n of adjacent) if (remaining.delete(n)) queue.push(n);
  }
  return remaining.size === 0 && queue.length > 0;
}

function inside(x: number, y: number, points: number[]) {
  let odd = false;
  for (let i = 0, j = points.length - 2; i < points.length; j = i, i += 2) {
    const [ax, ay, bx, by] = [points[j], points[j + 1], points[i], points[i + 1]];
    if ((ay > y) !== (by > y) && x < ax + (y - ay) * (bx - ax) / (by - ay)) odd = !odd;
  }
  return odd;
}

for (const template of ['Dungeon', 'Cave', 'Forest', 'Tavern']) {
  test(template + ' creates populated, bounded terrain', async ({ page }) => {
    await home(page);
    await page.clock.setFixedTime(new Date('2026-01-01T00:00:00.042Z'));
    await create(page, template);
    const d = await doc(page);
    expect([d.cols, d.rows]).toEqual([30, 22]);

    // Sample the actual rendered stage, ignoring overlays outside the canvas.
    const colors = await page.evaluate(() => {
      const ed = window.editor;
      const ctx = ed.canvas.getContext('2d')!;
      const colors = new Set<string>();
      for (let x = 1; x < 29; x++) for (let y = 1; y < 21; y++) {
        const sx = (ed.view.x + (x + 0.5) * 100 * ed.view.z) * ed.dpr;
        const sy = (ed.view.y + (y + 0.5) * 100 * ed.view.z) * ed.dpr;
        colors.add(ctx.getImageData(sx, sy, 1, 1).data.toString());
      }
      return colors.size;
    });
    expect(colors).toBeGreaterThan(1);
    if (template === 'Forest') expect(d.stamps.length).toBeGreaterThan(0);
    if (template === 'Tavern') {
      for (const objects of [d.rooms, d.walls, d.doors]) expect(objects.length).toBeGreaterThan(0);
    }
    if (template === 'Dungeon') {
      const chambers = d.rooms.filter(r => /^Room \d+$/.test(r.name ?? ''));
      expect(chambers.length).toBeGreaterThan(1);
      expect(d.fogEnabled).toBe(true);
      const numbers = d.labels.filter(l => /^\d+$/.test(l.text));
      expect(numbers.length).toBe(chambers.length);
      expect(numbers.every(l => l.hidden)).toBe(true);
      const walkable: number[] = [];
      for (let y = 0; y < d.rows; y++) for (let x = 0; x < d.cols; x++) {
        if (d.rooms.some(r => inside((x + 0.5) * 100, (y + 0.5) * 100, r.pts))) walkable.push(y * d.cols + x);
      }
      expect(connected(walkable, d.cols)).toBe(true);
      expect(d.doors.length).toBeGreaterThan(0);
      for (const { x, y } of d.doors) {
        expect(chambers.some(({ pts }) => pts.some((ax, i) => {
          if (i % 2) return false;
          const ay = pts[i + 1], bx = pts[(i + 2) % pts.length], by = pts[(i + 3) % pts.length];
          return (x - ax) * (by - ay) === (y - ay) * (bx - ax) &&
            x >= Math.min(ax, bx) && x <= Math.max(ax, bx) && y >= Math.min(ay, by) && y <= Math.max(ay, by);
        }))).toBe(true);
      }
    }
    if (template === 'Cave') {
      const mask = await page.evaluate(() => {
        const c = window.editor.rt.engine.mask('cave')!;
        const data = c.getContext('2d')!.getImageData(0, 0, c.width, c.height).data;
        const cells = [];
        // Read at half-square resolution to include narrow traversable passages.
        const width = window.editor.rt.doc.cols * 2, height = window.editor.rt.doc.rows * 2;
        for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
          const idx = Math.floor((y + 0.5) * c.height / height) * c.width + Math.floor((x + 0.5) * c.width / width);
          if (data[4 * idx + 3] >= 128) cells.push(y * width + x);
        }
        return { cells, width };
      });
      expect(connected(mask.cells, mask.width)).toBe(true);
    }
    const outside = { coordinates: bounds(d), clippedProps: await clippedProps(page) };
    expect(outside).toEqual({ coordinates: [], clippedProps: [] });
  });
}

test('regeneration is blocked during combat and clears the previous encounter', async ({ page }) => {
  await encounter(page);
  await button(page, 'Start combat').click();
  const during = await doc(page);
  await menu(page, 'Map settings…');
  await page.locator('.settings select').selectOption('tavern');
  let confirmations = 0;
  page.on('dialog', d => { confirmations++; return d.accept(); });
  await button(page, 'Regenerate').click();
  await expect(page.locator('.toast')).toHaveText('End combat before regenerating the map');
  expect(confirmations).toBe(0);
  expect(await doc(page)).toMatchObject({ rooms: during.rooms, tokens: during.tokens, combat: { active: true } });
  await page.keyboard.press('Escape');
  await page.locator('.modal-back').click({ position: { x: 5, y: 5 } });
  await button(page, 'End combat').click();
  await menu(page, 'Map settings…');
  await page.locator('.settings select').selectOption('tavern');
  await button(page, 'Regenerate').click();
  await expect.poll(async () => (await doc(page)).rooms.length).toBeGreaterThan(0);
  expect(confirmations).toBe(1);
  expect(await doc(page)).toMatchObject({ tokens: [], combat: { active: false, turn: null, members: [] } });
});

test('maps cannot be smaller than 10×10 and Tavern fits the minimum size', async ({ page }) => {
  await empty(page);
  await menu(page, 'Map settings…');
  const dimensions = page.locator('.settings .num-sm');
  await dimensions.nth(0).fill('5');
  await dimensions.nth(1).fill('5');
  await button(page, 'Apply').click();
  expect(await doc(page)).toMatchObject({ cols: 10, rows: 10 });
  await page.locator('.settings select').selectOption('tavern');
  page.once('dialog', d => d.accept());
  await button(page, 'Regenerate').click();
  await expect.poll(async () => (await doc(page)).rooms.length).toBeGreaterThan(0);
  expect(bounds(await doc(page))).toEqual([]);
  expect(await clippedProps(page)).toEqual([]);
});
