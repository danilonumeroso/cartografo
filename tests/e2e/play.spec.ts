import { expect, test } from 'playwright/test';
import { alpha, button, clickMap, doc, drag, empty, encounter, room } from './helpers';

test('combat starts in order, wraps, reverses and removes the current combatant', async ({ page }) => {
  await encounter(page);
  for (const name of ['Move', 'Reveal', 'Cover', 'Reveal room', 'Ping', 'Ruler', 'Token']) await expect(button(page, name)).toBeVisible();
  await button(page, 'Start combat').click();
  const turn = page.locator('.init-row.turn .link');
  for (const name of ['Aria', 'Bran', 'Guide', 'Mimic']) {
    await expect(turn).toHaveText(name);
    await expect(page.locator('.init-head strong')).toHaveText('Round 1');
    await button(page, 'Next turn').click();
  }
  await expect(turn).toHaveText('Aria');
  await expect(page.locator('.init-head strong')).toHaveText('Round 2');
  await button(page, 'Previous turn').click();
  await expect(turn).toHaveText('Mimic');
  await expect(page.locator('.init-head strong')).toHaveText('Round 1');
  await page.locator('.init-row.turn').getByRole('button', { name: 'Remove from combat' }).click();
  await expect(turn).toHaveText('Aria');
  await button(page, 'End combat').click();
  await expect(button(page, 'Start combat')).toBeVisible();
  expect((await doc(page)).combat.active).toBe(false);
});

test('Roll changes only NPC and monster scores', async ({ page }) => {
  await encounter(page);
  await button(page, 'Roll').click();
  const [pc, ally, npc, monster] = (await doc(page)).tokens;
  expect(pc.init).toBe(61);
  for (const t of [npc, monster]) {
    expect(t.init).toBeGreaterThanOrEqual(1 + t.initMod);
    expect(t.init).toBeLessThanOrEqual(20 + t.initMod);
  }
  expect(ally.init).toBe(60);
});

test('token card damages, caps healing, toggles visibility and manages conditions', async ({ page }) => {
  await encounter(page);
  await button(page, 'Guide').click();
  await page.getByLabel('Amount').fill('3');
  await button(page, 'Damage').click();
  expect((await doc(page)).tokens[2].hp).toBe(7);
  await page.getByLabel('Amount').fill('100');
  await button(page, 'Heal').click();
  expect((await doc(page)).tokens[2].hp).toBe(10);
  await button(page, '+ Add').click();
  await page.getByRole('button', { name: /Poisoned/ }).click();
  await expect(page.locator('.init-row').filter({ hasText: 'Guide' })).toContainText('Poisoned');
  await page.locator('.inspector').getByRole('button', { name: /Poisoned/ }).click();
  expect((await doc(page)).tokens[2].conditions).toEqual([]);
  await button(page, 'Visible to players: hide').click();
  expect((await doc(page)).tokens[2].hidden).toBe(true);
});

test('placed monsters start hidden, snap to the grid and nudge one square', async ({ page }) => {
  await empty(page);
  await button(page, 'Play').click();
  await button(page, 'Token').click();
  await clickMap(page, 1075, 536);
  expect((await doc(page)).tokens[0]).toMatchObject({ kind: 'monster', x: 1050, y: 550, hidden: true });
  // Placing does not select the new token (its card would block further placements), so select it first.
  await button(page, 'Move').click();
  await clickMap(page, 1050, 550);
  await page.keyboard.press('ArrowRight');
  expect((await doc(page)).tokens[0].x).toBe(1150);
});

test('room and brush fog reveal, cover and whole-map actions', async ({ page }) => {
  await empty(page);
  await room(page);
  await button(page, 'Play').click();
  expect((await doc(page)).fogEnabled).toBe(false);
  await button(page, 'Reveal room').click();
  await clickMap(page, 800, 600);
  for (const [x, y] of [[630, 430], [970, 770]]) expect(await alpha(page, 'fog', x, y)).toBe(0);
  expect(await alpha(page, 'fog', 1400, 900)).toBe(255);
  expect((await doc(page)).fogEnabled).toBe(true);
  await button(page, 'Cover').click();
  await clickMap(page, 800, 600);
  expect(await alpha(page, 'fog', 800, 600)).toBe(255);
  await button(page, 'Reveal').click();
  await clickMap(page, 800, 600);
  expect(await alpha(page, 'fog', 800, 600)).toBe(0);
  for (const [name, value] of [['Reveal all', 0], ['Cover all', 255]] as const) {
    await button(page, name).click();
    for (const [x, y] of [[1, 1], [1998, 1498]]) expect(await alpha(page, 'fog', x, y)).toBe(value);
  }
});

test('fog edits undo and redo one step at a time', async ({ page }) => {
  await empty(page);
  await room(page);
  await button(page, 'Play').click();
  await button(page, 'Reveal room').click();
  await clickMap(page, 800, 600);
  await button(page, 'Cover').click();
  await clickMap(page, 800, 600);
  expect(await alpha(page, 'fog', 800, 600)).toBe(255);
  await button(page, 'Reveal all').click();
  expect(await alpha(page, 'fog', 1400, 900)).toBe(0);
  const undo = page.getByRole('button', { name: 'Undo (Ctrl/Cmd+Z)' });
  // Reveal all, then the cover dab, then the room reveal come back one by one.
  await undo.click();
  expect(await alpha(page, 'fog', 1400, 900)).toBe(255);
  expect(await alpha(page, 'fog', 800, 600)).toBe(255);
  await undo.click();
  expect(await alpha(page, 'fog', 800, 600)).toBe(0);
  await undo.click();
  expect(await alpha(page, 'fog', 800, 600)).toBe(255);
  await page.keyboard.press('ControlOrMeta+Shift+Z');
  expect(await alpha(page, 'fog', 800, 600)).toBe(0);
  expect(await alpha(page, 'fog', 1400, 900)).toBe(255);
});

test('doors align with a grid edge and toggle in Prepare and Play', async ({ page }) => {
  await empty(page);
  await button(page, 'Build').click();
  await button(page, 'Door').click();
  await clickMap(page, 954, 505);
  expect((await doc(page)).doors).toMatchObject([{ x: 950, y: 500, open: false, rot: 0 }]);
  await page.keyboard.press('Escape');
  await clickMap(page, 950, 500);
  expect((await doc(page)).doors).toMatchObject([{ open: true }]);
  await button(page, 'Play').click();
  await clickMap(page, 950, 500);
  expect((await doc(page)).doors).toMatchObject([{ open: false }]);
});

test('dropping a large token aligns its two-square footprint', async ({ page }) => {
  await empty(page);
  await button(page, 'Play').click();
  await button(page, 'Token').click();
  await page.getByRole('button', { name: /Creature size/ }).click();
  await button(page, 'Large').click();
  await clickMap(page, 930, 530);
  await page.keyboard.press('Escape');
  await button(page, 'Move').click();
  const [token] = (await doc(page)).tokens;
  expect(token.size).toBe('large');
  await drag(page, token.x, token.y, 1167, 627);
  const [moved] = (await doc(page)).tokens;
  expect([moved.x, moved.y]).toEqual([1200, 600]);
});
