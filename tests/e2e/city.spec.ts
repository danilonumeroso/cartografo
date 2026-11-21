import { expect, test, type Page } from 'playwright/test';
import { button, doc, home } from './helpers';

async function newCity(page: Page, seed = 'CITY-TEST', again = false) {
  // later launches reopen the last map, so the second city starts from the map switcher
  if (again) await page.locator('.map-switch').click();
  else await home(page);
  await button(page, 'Small 20×15').click();
  await page.locator('.tpl').filter({ has: page.getByText('City', { exact: true }) }).click();
  await expect(page.locator('.gen h1')).toHaveText('New city');
  const seedBox = page.getByRole('textbox', { name: 'Seed' });
  await seedBox.fill(seed);
  await seedBox.press('Enter');
  await expect(page.locator('.gen-preview')).not.toHaveClass(/busy/, { timeout: 30_000 });
  // a second map of the same kind is already open, so wait for a different map id
  const before = await page.evaluate(() => window.editor?.rt?.doc.id ?? null);
  await page.locator('.gen').getByRole('button', { name: 'Create map' }).click();
  await page.waitForFunction(([k, id]) => window.editor?.rt?.doc.kind === k && window.editor.rt.doc.id !== id, ['city', before] as const);
  await expect(page.locator('.save-status')).toHaveText('Saved');
}

test('the City template generates streets, houses, walls and named places', async ({ page }) => {
  await newCity(page);
  const d = await doc(page);
  expect([d.kind, d.cols, d.rows]).toEqual(['city', 44, 32]);
  expect(d.grid).toMatchObject({ unit: 'm', feet: 10 });
  expect(d.fogEnabled).toBe(false);
  expect(d.buildings.length).toBeGreaterThan(60);
  expect(d.paths.some((p) => p.kind === 'citywall')).toBe(true);
  // every building lies inside the map and has a real size
  for (const b of d.buildings) {
    expect(b.x).toBeGreaterThan(0); expect(b.x).toBeLessThan(d.cols * 100);
    expect(b.y).toBeGreaterThan(0); expect(b.y).toBeLessThan(d.rows * 100);
    expect(b.w).toBeGreaterThan(20); expect(b.h).toBeGreaterThan(20);
  }
  // the city's name and its taverns are written on the map, visible to players
  expect(d.labels.some((l) => l.text === d.name.toUpperCase())).toBe(true);
  for (const tv of d.buildings.filter((b) => b.kind === 'tavern')) {
    expect(tv.name).toBeTruthy();
    expect(d.labels.some((l) => l.text === tv.name && !l.hidden)).toBe(true);
  }
});

test('the same seed rebuilds the same city', async ({ page }) => {
  await newCity(page, 'CITY-SAME');
  const a = await doc(page);
  await newCity(page, 'CITY-SAME', true);
  const b = await doc(page);
  expect(b.id).not.toBe(a.id);
  const sig = (d: typeof a) => d.buildings.map((x) => [x.id, x.kind, x.roof, Math.round(x.x), Math.round(x.y)]);
  expect(sig(b)).toEqual(sig(a));
  expect(b.labels.map((l) => l.text)).toEqual(a.labels.map((l) => l.text));
});

test('city maps build buildings and city walls; buildings can be edited', async ({ page }) => {
  await newCity(page);
  await button(page, 'Build').click();
  for (const name of ['Building', 'City wall']) await expect(button(page, name)).toBeVisible();
  await expect(button(page, 'Room')).toHaveCount(0);
  const before = (await doc(page)).buildings.length;
  // draw a new building by dragging in an empty corner of the map
  const box = await page.evaluate(() => {
    const ed = window.editor, r = ed.canvas.getBoundingClientRect();
    const sx = (x: number) => r.left + ed.view.x + x * ed.view.z, sy = (y: number) => r.top + ed.view.y + y * ed.view.z;
    return [sx(150), sy(150), sx(350), sy(280)];
  });
  await page.mouse.move(box[0], box[1]);
  await page.mouse.down();
  await page.mouse.move(box[2], box[3], { steps: 6 });
  await page.mouse.up();
  const after = await doc(page);
  expect(after.buildings.length).toBe(before + 1);
  const nb = after.buildings[after.buildings.length - 1];
  expect(Math.round(nb.w)).toBe(200);
  expect(Math.round(nb.h)).toBe(125);
  // the new building is selected: rename it from its card
  const name = page.locator('.inspector .title-input');
  await name.fill('Wizard tower');
  expect((await doc(page)).buildings.find((b) => b.id === nb.id)!.name).toBe('Wizard tower');
});

test('a building opens its own linked interior, and a world city opens a city map', async ({ page }) => {
  await newCity(page);
  const city = await doc(page);
  const tavern = city.buildings.find((b) => b.kind === 'tavern') ?? city.buildings[0];
  await page.evaluate(async (id) => {
    const ed = window.editor;
    await ed.createLinkedMap(ed.rt.doc.buildings.find((b) => b.id === id)!, 'tavern');
  }, tavern.id);
  const inside = await doc(page);
  expect(inside.kind).toBe('battle');
  expect(inside.parent).toBe(city.id);
  expect(inside.name).toBe(tavern.name ?? 'House');
  await page.locator('.parent-btn').click();
  await page.waitForFunction((id) => window.editor.rt.doc.id === id, city.id);
  expect((await doc(page)).buildings.find((b) => b.id === tavern.id)!.link).toBe(inside.id);
  // double-clicking the linked building opens the interior again
  const pt = await page.evaluate((id) => {
    const ed = window.editor, b = ed.rt.doc.buildings.find((x) => x.id === id)!, r = ed.canvas.getBoundingClientRect();
    return [r.left + ed.view.x + b.x * ed.view.z, r.top + ed.view.y + b.y * ed.view.z];
  }, tavern.id);
  await page.mouse.dblclick(pt[0], pt[1]);
  await page.waitForFunction((id) => window.editor.rt.doc.id === id, inside.id);
  // world cities suggest a whole city map
  const tpl = await page.evaluate(async () => {
    const path = '/src/places.ts';
    const { suggestedTemplate } = await import(path);
    return [suggestedTemplate('w_city'), suggestedTemplate('w_port'), suggestedTemplate('w_village')];
  });
  expect(tpl).toEqual(['city', 'city', 'tavern']);
});
