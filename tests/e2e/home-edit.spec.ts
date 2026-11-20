import { test, expect } from 'playwright/test';
import { alpha, button, clickMap, doc, drag, empty, home, menu, room } from './helpers';

test('Home lists templates, size presets and empty backgrounds', async ({ page }) => {
  await home(page);
  await expect(page.locator('.tpl strong')).toHaveText(['Dungeon', 'Cave', 'Forest', 'Tavern', 'Empty']);
  await expect(page.getByRole('group', { name: 'Size' }).locator('button')).toHaveText(['Small 20×15', 'Medium 30×22', 'Large 40×30']);
  await expect(page.getByText(/No maps yet/)).toBeVisible();
  await button(page, 'Large 40×30').click();
  await page.locator('.tpl.empty').click();
  for (const bg of ['Dark rock (dungeon)', 'Grass (outdoor)', 'Wood (indoor)']) await expect(button(page, bg)).toBeVisible();
  await button(page, 'Wood (indoor)').click();
  await expect.poll(() => doc(page)).toMatchObject({ cols: 40, rows: 30, bg: 'wood' });
});

test('map cards search, duplicate, open, clear history and delete', async ({ page }) => {
  await empty(page);
  const original = await doc(page);
  await room(page);
  await page.locator('.map-switch').click();
  await button(page, 'Duplicate').click();
  const copy = page.locator('.home-card').filter({ hasText: '(copy)' });
  await expect(copy.locator('strong')).toHaveText(original.name + ' (copy)');
  await page.getByLabel('Search maps').fill('(copy)');
  await expect(page.locator('.home-card')).toHaveCount(1);
  await copy.locator('.home-thumb').click();
  await expect(page.locator('.map-name')).toHaveText(original.name + ' (copy)');
  expect((await doc(page)).rooms).toHaveLength(1);
  await expect(page.getByRole('button', { name: /^Undo/ })).toBeDisabled();
  const id = (await doc(page)).id;
  await page.reload();
  await expect.poll(async () => (await doc(page)).id).toBe(id);
  await page.locator('.map-switch').click();
  page.once('dialog', d => d.accept());
  await page.locator('.home-card:not(.current)').getByRole('button', { name: 'Delete' }).click();
  await expect(page.locator('.home-card')).toHaveCount(1);
});

test('room drag snaps, selection edits, duplicates, deletes and traverses history', async ({ page }) => {
  await empty(page);
  await expect(page.locator('.rail button')).toHaveText(['Select', 'Paint', 'Build', 'Furnish', 'Annotate']);
  await room(page);
  const [r] = (await doc(page)).rooms;
  const corners = r.pts.flatMap((x, i) => i % 2 ? [] : [[x, r.pts[i + 1]]]);
  expect(corners).toHaveLength(4);
  expect(corners).toEqual(expect.arrayContaining([[600, 400], [1000, 400], [1000, 800], [600, 800]]));
  await page.keyboard.press('Escape');
  await drag(page, 1201, 301, 1220, 320);
  expect((await doc(page)).rooms).toHaveLength(1);
  await page.keyboard.press('Control+z');
  expect((await doc(page)).rooms).toHaveLength(0);
  await page.keyboard.press('Control+Shift+z');
  expect((await doc(page)).rooms).toEqual([r]);
  await button(page, 'Select').click();
  await clickMap(page, 750, 550);
  const card = page.locator('.inspector');
  await expect(card).toBeVisible();
  await card.getByLabel('Name').fill('Treasury');
  await card.getByRole('button', { name: 'Duplicate' }).click();
  expect((await doc(page)).rooms).toHaveLength(2);
  await page.keyboard.press('Backspace');
  expect((await doc(page)).rooms).toHaveLength(1);
  await clickMap(page, 750, 550);
  await page.keyboard.press('Control+d');
  expect((await doc(page)).rooms).toHaveLength(2);
  await card.getByRole('button', { name: 'Delete' }).click();
  await clickMap(page, 750, 550);
  await page.keyboard.press('Escape');
  await expect(card).toBeHidden();
  expect((await doc(page)).rooms[0].name).toBe('Treasury');
});

test('freeform, cave fill and wall tools change map geometry', async ({ page }) => {
  await empty(page);
  await button(page, 'Build').click();
  await button(page, 'Freeform').click();
  for (const [x, y] of [[500, 400], [900, 400], [700, 700]]) await clickMap(page, x, y);
  await page.keyboard.press('Enter');
  expect((await doc(page)).rooms[0].pts).toEqual([500, 400, 900, 400, 700, 700]);
  await page.keyboard.press('Escape');
  await button(page, 'Wall').click();
  await clickMap(page, 400, 300); await clickMap(page, 900, 300);
  await page.keyboard.press('Enter');
  expect((await doc(page)).walls[0].pts).toEqual([400, 300, 900, 300]);
  await page.keyboard.press('Escape');
  await button(page, 'Cave').click();
  await drag(page, 800, 500, 1100, 500);
  expect(await alpha(page, 'cave', 800, 500)).toBeGreaterThan(0);
  await button(page, 'Fill').click();
  await drag(page, 800, 500, 1100, 500);
  expect(await alpha(page, 'cave', 800, 500)).toBe(0);
});

test('furnish filters tiles and places the selected prop', async ({ page }) => {
  await empty(page);
  await button(page, 'Furnish').click();
  await expect(page.locator('.drawer .chips button')).toHaveText(['All', 'Furniture', 'Dungeon', 'Caves', 'Outdoor', 'Decorations', 'Lights', 'My assets']);
  await button(page, 'Lights').click();
  await expect(button(page, 'Invisible light')).toBeVisible();
  await page.getByLabel('Search props').fill('bArReL');
  await expect(button(page, 'Barrel')).toBeVisible();
  expect((await page.locator('.lib-tile').allTextContents()).every(s => /barrel/i.test(s))).toBe(true);
  await button(page, 'Barrel').click();
  await clickMap(page, 1050, 350);
  expect((await doc(page)).stamps).toMatchObject([{ type: 'barrel' }]);
  await button(page, 'Annotate').click();
  await expect(page.locator('.drawer')).toBeHidden();
  for (const name of ['Text', 'Marker', 'Token', 'Ruler']) await expect(button(page, name)).toBeVisible();
});

test('paint and room edits autosave and survive reload', async ({ page }) => {
  await empty(page);
  await room(page);
  await page.keyboard.press('Escape');
  // Record even fast save transitions between Playwright polling intervals.
  await page.evaluate(() => {
    const el = document.querySelector('.save-status')!;
    new MutationObserver(() => { if (el.textContent === 'Saving…') el.setAttribute('data-saw-saving', 'yes'); }).observe(el, { childList: true });
  });
  await page.locator('.rail').getByRole('button', { name: 'Paint' }).click();
  await drag(page, 600, 300, 1000, 300);
  const painted = await alpha(page, 'grass', 600, 300);
  expect(painted).toBeGreaterThan(0);
  await page.keyboard.press('Control+z');
  expect(await alpha(page, 'grass', 600, 300)).toBe(0);
  await page.keyboard.press('Control+y');
  expect(await alpha(page, 'grass', 600, 300)).toBe(painted);
  await button(page, 'Erase').click();
  await drag(page, 600, 300, 1000, 300);
  expect(await alpha(page, 'grass', 600, 300)).toBeLessThan(painted);
  await page.keyboard.press('Control+z');
  await expect(page.locator('.save-status')).toHaveAttribute('data-saw-saving', 'yes');
  await expect(page.locator('.save-status')).toHaveText('Saved');
  const before = await doc(page);
  await page.reload();
  // Fields set to undefined are dropped when saved, so compare JSON-normalised rooms.
  await expect.poll(async () => JSON.parse(JSON.stringify(await doc(page)))).toMatchObject({ id: before.id, rooms: JSON.parse(JSON.stringify(before.rooms)) });
  expect(await alpha(page, 'grass', 600, 300)).toBe(painted);
});

test('idle foreground fog edits autosave and survive reload', async ({ page }) => {
  await empty(page);
  await button(page, 'Play').click();
  await expect(page.locator('.save-status')).toHaveText('Saved');
  await button(page, 'Reveal').click();
  // Record even fast save transitions between Playwright polling intervals.
  await page.evaluate(() => {
    const el = document.querySelector('.save-status')!;
    new MutationObserver(() => { if (el.textContent === 'Saving…') el.setAttribute('data-saw-saving', 'yes'); }).observe(el, { childList: true });
  });
  await clickMap(page, 900, 500);
  expect(await alpha(page, 'fog', 900, 500)).toBe(0);
  // Give autosave several debounce intervals in the foreground, then inspect the
  // saved record before reload can trigger a visibility-change save of its own.
  await page.waitForTimeout(5500);
  const before = await doc(page);
  const status = await page.locator('.save-status').textContent();
  const sawSaving = await page.locator('.save-status').getAttribute('data-saw-saving');
  const savedAlpha = await page.evaluate(async () => {
    const path = '/src/storage.ts';
    const rt = window.editor.rt;
    const record = await (await import(path)).getMap(rt.doc.id);
    if (!record?.fog) return null;
    const blob = await createImageBitmap(record.fog);
    const c = document.createElement('canvas');
    c.width = blob.width; c.height = blob.height;
    const ctx = c.getContext('2d')!;
    ctx.drawImage(blob, 0, 0); blob.close();
    return ctx.getImageData(900 * c.width / rt.W, 500 * c.height / rt.H, 1, 1).data[3];
  });
  await page.reload();
  const loaded = await doc(page);
  expect(loaded.id).toBe(before.id);
  const restoredAlpha = await alpha(page, 'fog', 900, 500);
  expect(await alpha(page, 'fog', 50, 50)).toBe(255);
  expect({ sawSaving, status, savedAlpha, restoredAlpha, enabled: loaded.fogEnabled })
    .toEqual({ sawSaving: 'yes', status: 'Saved', savedAlpha: 0, restoredAlpha: 0, enabled: true });
});

test('deleting the open map survives pending autosave and reload', async ({ page }) => {
  await empty(page);
  await menu(page, 'Map settings…');
  await page.getByLabel('Name', { exact: true }).fill('Pending save');
  page.once('dialog', d => d.accept());
  await button(page, 'Delete this map').click();
  await expect(page.getByText(/No maps yet/)).toBeVisible();
  // Allow the pending debounce to fire before reopening storage in a new document.
  await page.waitForTimeout(2200);
  await page.reload();
  await expect(page.getByText(/No maps yet/)).toBeVisible();
  await expect(page.locator('.home-card')).toHaveCount(0);
});

test('sub-square room drag crossing snap midpoints creates nothing', async ({ page }) => {
  await empty(page);
  await button(page, 'Build').click();
  await button(page, 'Room').click();
  await drag(page, 740, 440, 760, 460);
  const rooms = (await doc(page)).rooms;
  expect(rooms).toHaveLength(0);
});

test('map settings resize from top left and apply terrain, walls, grid, darkness and fog', async ({ page }) => {
  await empty(page);
  await room(page);
  const geometry = (await doc(page)).rooms;
  await menu(page, 'Map settings…');
  const settings = page.locator('.settings');
  await settings.getByLabel('Name', { exact: true }).fill('Watchtower');
  await settings.locator('.num-sm').nth(0).fill('25');
  await settings.locator('.num-sm').nth(1).fill('17');
  await button(page, 'Apply').click();
  await settings.getByRole('button', { name: 'Grass', exact: true }).click();
  await settings.getByLabel('Show', { exact: true }).uncheck();
  await settings.getByLabel('Also on the TV').uncheck();
  await settings.getByLabel('Feet per square').fill('10');
  await settings.getByLabel('Feet per square').press('Tab');
  await settings.getByLabel('Ambient darkness').press('End');
  await settings.getByLabel('Fog of war enabled').check();
  await settings.getByRole('button', { name: /Room walls/ }).click();
  await page.locator('.pop-list').getByRole('button', { name: 'Brick' }).click();
  const d = await doc(page);
  expect(d).toMatchObject({ name: 'Watchtower', cols: 25, rows: 17, rooms: geometry, bg: 'grass', wallStyle: 'brick',
    grid: { show: false, showPlayers: false, feet: 10 }, fogEnabled: true });
  expect(d.ambient).toBeGreaterThan(0);
});

test('a slow in-flight autosave cannot put a deleted map back in IndexedDB', async ({ page }) => {
  await empty(page);
  const id = (await doc(page)).id;
  await menu(page, 'Map settings…');
  // Hold one real encoder callback to reproduce deletion on a slow device.
  await page.evaluate(() => {
    const encode = HTMLCanvasElement.prototype.toBlob;
    HTMLCanvasElement.prototype.toBlob = function (callback, type, quality) {
      HTMLCanvasElement.prototype.toBlob = encode;
      encode.call(this, blob => {
        window.addEventListener('release-test-encode', () => callback(blob), { once: true });
        document.documentElement.dataset.pendingEncode = 'yes';
      }, type, quality);
    };
  });
  await page.getByLabel('Name', { exact: true }).fill('Slow save');
  await expect(page.locator('html')).toHaveAttribute('data-pending-encode', 'yes');
  page.once('dialog', d => d.accept());
  await button(page, 'Delete this map').click();
  const stored = () => page.evaluate(async id => {
    const path = '/src/storage.ts';
    return !!await (await import(path)).getMap(id);
  }, id);
  await expect.poll(stored).toBe(false);
  await page.evaluate(() => window.dispatchEvent(new Event('release-test-encode')));
  await expect(page.locator('.save-status')).toHaveText('Saved');
  const resurrected = await stored();
  expect(resurrected).toBe(false);
});

test('a new room paints its floor and boundary on the map', async ({ page }) => {
  await empty(page);
  const sample = () => page.evaluate(() => {
    const ctx = window.editor.rt.engine.cache.getContext('2d')!;
    return { floor: ctx.getImageData(710, 520, 4, 8).data.toString(),
      edge: ctx.getImageData(570, 510, 65, 50).data.toString() };
  });
  const before = await sample();
  await room(page);
  await expect.poll(async () => (await sample()).floor).not.toBe(before.floor);
  const stone = await sample();
  await page.locator('.dock').getByRole('button', { name: /Walls/ }).click();
  await page.locator('.pop-list').getByRole('button', { name: 'Brick' }).click();
  // A new wall material should affect the boundary while keeping the same floor.
  await expect.poll(async () => (await sample()).edge).not.toBe(stone.edge);
  expect((await sample()).floor).toBe(stone.floor);
});
