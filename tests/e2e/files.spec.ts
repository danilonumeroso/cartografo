import { readFile } from 'node:fs/promises';
import { expect, test, type Page } from 'playwright/test';
import { button, create, doc, empty, menu, room } from './helpers';

async function download(page: Page, action: () => Promise<void>) {
  const pending = page.waitForEvent('download');
  await action();
  const file = await pending;
  expect(await file.failure()).toBeNull();
  return readFile((await file.path())!);
}

for (const scale of [100, 200]) {
  test('PNG exports the whole map at ' + scale + ' pixels per square', async ({ page }) => {
    await empty(page);
    await menu(page, 'Export PNG image…');
    if (scale === 200) await button(page, '200 px/square (print)').click();
    const png = await download(page, () => button(page, 'Export').click());
    expect(png.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
    expect(png.toString('ascii', 12, 16)).toBe('IHDR');
    expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([20 * scale, 15 * scale]);
  });
}

async function importJSON(page: Page, buffer: Buffer) {
  const pending = page.waitForEvent('filechooser');
  await menu(page, 'Import map or backup…');
  await (await pending).setFiles({ name: 'maps.json', mimeType: 'application/json', buffer });
}

test('single map JSON restores map content with a new ID', async ({ page }) => {
  await empty(page); await room(page);
  const original = await doc(page);
  const json = await download(page, () => menu(page, 'Export this map (.json)'));
  await importJSON(page, json);
  await expect.poll(async () => (await doc(page)).id).not.toBe(original.id);
  const { id, updatedAt, ...content } = original;
  // Fields set to undefined are dropped by JSON serialisation, so compare JSON-normalised documents.
  const plain = <T,>(v: T): T => JSON.parse(JSON.stringify(v));
  expect(plain(await doc(page))).toMatchObject(plain(content));
  expect(await page.evaluate(() => window.editor.maps.length)).toBe(2);
});

test('backup import remaps links to the imported destination', async ({ page }) => {
  await empty(page);
  const target = await doc(page);
  await page.locator('.map-switch').click();
  await create(page, 'Empty', 'Wood (indoor)');
  const source = await doc(page);
  await page.evaluate(link => {
    window.editor.rt.doc.markers.push({ id: 'stairs', x: 250, y: 250, title: 'Downstairs', notes: 'Secret', playerNotes: 'Steps', icon: '📍', color: '#ff0000', visible: true, link });
  }, target.id);
  const json = await download(page, () => menu(page, 'Back up all maps'));
  await importJSON(page, json);
  await expect.poll(() => page.evaluate(() => window.editor.maps.length)).toBe(4);
  const originals = [source.id, target.id];
  const imported = await page.evaluate(async originals => {
    const path = '/src/storage.ts';
    const { listMaps } = await import(path);
    return (await listMaps()).filter((r: { id: string }) => !originals.includes(r.id)).map((r: { doc: typeof source }) => r.doc);
  }, originals);
  const from = imported.find((d: typeof source) => d.name === source.name);
  const to = imported.find((d: typeof target) => d.name === target.name);
  expect(from.markers[0]).toMatchObject({ title: 'Downstairs', notes: 'Secret', playerNotes: 'Steps', link: to.id });
});

test('PNG omits fog, markers, hidden tokens and hidden furnishings', async ({ page }) => {
  await empty(page);
  async function exportVisible() {
    await menu(page, 'Export PNG image…');
    await page.getByLabel('Include visible tokens').check();
    return download(page, () => button(page, 'Export').click());
  }
  const baseline = await exportVisible();
  await page.evaluate(async () => {
    const path = '/src/model.ts';
    const { newToken } = await import(path);
    const d = window.editor.rt.doc;
    d.fogEnabled = true;
    d.tokens.push({ ...newToken(550, 550, 'monster', 'Ambush'), hidden: true });
    d.markers.push({ id: 'pin', x: 300, y: 300, color: '#f00', icon: '📍', title: 'Exit', notes: 'Private', playerNotes: '', visible: true });
    d.labels.push({ id: 'label', text: 'Secret', x: 400, y: 200, font: 'serif', size: 40, color: '#fff', stroke: '#000', rot: 0, hidden: true });
    d.stamps.push({ id: 'stash', type: 'barrel', x: 600, y: 400, scale: 1, variant: 0, rot: 0, hidden: true });
    d.doors.push({ id: 'secret', x: 250, y: 200, rot: 0, kind: 'secret', width: 1, open: false });
  });
  expect((await exportVisible()).equals(baseline)).toBe(true);
  await page.evaluate(() => { window.editor.rt.doc.tokens[0].hidden = false; });
  expect((await exportVisible()).equals(baseline)).toBe(false);
});
