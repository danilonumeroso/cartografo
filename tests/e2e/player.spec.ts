import { expect, test, type Page } from 'playwright/test';
import { button, clickMap, doc, encounter, home, create, menu } from './helpers';

async function connect(dm: Page) {
  const tv = await dm.context().newPage();
  await tv.goto('/?player=1');
  await expect(dm.locator('.tv-on')).toHaveText('TV connected');
  await expect(tv.locator('.player-wait')).toBeHidden();
  return tv;
}

test('TV waits alone and persists orientation and real-scale calibration', async ({ page }) => {
  await page.goto('/?player=1');
  await expect(page.getByText('Waiting for the Dungeon Master…')).toBeVisible();
  const gear = page.getByTitle('Screen settings');
  // A connected editor dismisses the waiting overlay.
  const dm = await page.context().newPage();
  await home(dm); await create(dm);
  await page.reload();
  await expect(dm.locator('.tv-on')).toBeVisible();
  await gear.click();
  for (const angle of [0, 180, 270, 90]) {
    await button(page, angle + '°').click();
    expect(await page.locator('.player-canvas').evaluate(el => (el as HTMLElement).style.transform)).toBe('rotate(' + angle + 'deg)');
  }
  await page.getByRole('checkbox').check();
  const slider = page.getByRole('slider');
  await slider.focus(); await page.keyboard.press('ArrowRight');
  const calibration = await slider.inputValue();
  await page.reload();
  await expect(page.locator('.player-wait')).toBeHidden();
  await gear.click();
  await expect(button(page, '90°')).toHaveClass(/on/);
  await expect(page.getByRole('checkbox')).toBeChecked();
  await expect(slider).toHaveValue(calibration);
});

test('TV shows visible turns and conditions live and disconnects on close', async ({ page }) => {
  await encounter(page);
  const tv = await connect(page);
  const initialDocument = await tv.evaluate(() => performance.timeOrigin);
  await expect(button(page, 'Send view')).toBeVisible();
  await expect(page.getByLabel('Follow my view')).toBeVisible();
  await button(page, 'Start combat').click();
  await expect(tv.locator('.init-chip b')).toHaveText(['Aria', 'Bran', 'Guide']);
  await expect(tv.locator('.init-round')).toHaveText('Round 1');
  await expect(tv.locator('.init-chip.turn')).toContainText('Aria');
  await expect(tv.getByTitle('Prone')).toBeVisible();
  await button(page, 'Next turn').click();
  await expect(tv.locator('.init-chip.turn')).toContainText('Bran');
  await expect(tv.locator('body')).not.toContainText(/Mimic|Bloodied|Wounded|Dying|Down\b|Hit points|\bHP\b|\d+\s*\/\s*\d+/i);
  await expect(tv.locator('.hpbar,[role="progressbar"]')).toHaveCount(0);
  await button(page, 'Mimic').click();
  await button(page, 'Token hidden from players: show').click();
  await expect(tv.locator('.init-chip b')).toHaveText(['Aria', 'Bran', 'Guide', 'Mimic']);
  expect(await tv.evaluate(() => performance.timeOrigin)).toBe(initialDocument);
  await tv.close({ runBeforeUnload: true });
  await expect(button(page, 'TV screen')).toBeVisible();
});

test('non-lethal HP changes never change player-facing combatant styling', async ({ page }) => {
  await encounter(page);
  const tv = await connect(page);
  await button(page, 'Start combat').click();
  const chip = tv.locator('.init-chip').filter({ hasText: 'Guide' });
  await expect(chip).toBeVisible();
  const style = () => chip.evaluate(el => [getComputedStyle(el).opacity, getComputedStyle(el).textDecorationLine]);
  const healthy = await style();
  await button(page, 'Guide').click();
  await page.getByLabel('Amount').fill('6'); await button(page, 'Damage').click();
  expect((await doc(page)).tokens[2].hp).toBe(4);
  // Wait for delivery of a later edit so a delayed update cannot give a false pass.
  await button(page, '+ Add').click();
  await page.getByRole('button', { name: /Stunned/ }).click();
  await expect(chip.getByTitle('Stunned')).toBeVisible();
  const damaged = await style();
  expect(damaged).toEqual(healthy);
});

test('language follows the DM, persists and keeps generated names', async ({ page }) => {
  await home(page); await create(page, 'Dungeon');
  const rooms = (await doc(page)).rooms;
  expect(rooms.some(r => r.name === 'Room 1')).toBe(true);
  const tv = await connect(page);
  await menu(page, 'Language: English');
  await expect(page.locator('html')).toHaveAttribute('lang', 'it');
  await expect(tv).toHaveTitle(/Vista giocatori/i);
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'it');
  await expect(page.locator('.map-name')).toHaveText('Crypt');
  expect((await doc(page)).rooms).toEqual(rooms);
  await tv.close({ runBeforeUnload: true });
  await page.locator('[data-v="edit"]').click();
  await button(page, 'Arreda').click();
  await page.getByLabel('Cerca oggetti').fill('barile');
  await expect(button(page, 'Barile')).toBeVisible();
  await page.locator('.top-right button').last().click();
  await page.getByRole('button', { name: /Lingua: Italiano/ }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
});

test('token moves, door toggles, fog and pings reach the live TV canvas', async ({ page }) => {
  await encounter(page);
  await page.evaluate(() => window.editor.rt.doc.doors.push({ id: 'gate', x: 1150, y: 800, width: 1, rot: 0, kind: 'wood', open: false }));
  const tv = await connect(page);
  const origin = await tv.evaluate(() => performance.timeOrigin);
  await tv.evaluate(() => document.fonts.ready.then(() => true));
  const frame = () => tv.locator('canvas').evaluate(c => {
    // Downsample for comparison without transmitting a full-resolution TV frame.
    const sample = document.createElement('canvas');
    sample.width = 320; sample.height = 200;
    sample.getContext('2d')!.drawImage(c as HTMLCanvasElement, 0, 0, 320, 200);
    return sample.toDataURL();
  });
  await button(page, 'Send view').click();
  // Wait through the camera transition before measuring changes to a static scene.
  await tv.waitForTimeout(800);
  const baseline = await frame();
  await button(page, 'Guide').click();
  await page.keyboard.press('ArrowRight');
  await expect.poll(frame).not.toBe(baseline);
  await page.keyboard.press('ArrowLeft');
  await expect.poll(frame).toBe(baseline);
  await page.keyboard.press('Escape');
  await clickMap(page, 1150, 800);
  await expect.poll(frame).not.toBe(baseline);
  await clickMap(page, 1150, 800);
  await expect.poll(frame).toBe(baseline);
  await button(page, 'Ping').click();
  await clickMap(page, 1150, 800);
  await expect.poll(frame, { timeout: 1500, intervals: [30] }).not.toBe(baseline);
  await expect.poll(frame).toBe(baseline);
  await button(page, 'Cover').click();
  await button(page, 'Cover all').click();
  await expect.poll(frame).not.toBe(baseline);
  const covered = await frame();
  await button(page, 'Reveal').click();
  await clickMap(page, 1150, 800);
  await expect.poll(frame).not.toBe(covered);
  expect(await tv.evaluate(() => performance.timeOrigin)).toBe(origin);
});

test('marker popups expose player notes and keep DM notes private', async ({ page }) => {
  await encounter(page);
  await page.evaluate(() => {
    window.editor.rt.doc.markers.push({ id: 'pin', x: 1000, y: 700, color: '#ffc000', icon: '📍', title: 'Waystone', notes: 'Trap behind altar', playerNotes: 'North to town', visible: true });
  });
  const tv = await connect(page);
  const camera = await page.evaluate(() => {
    const { vw, vh, view } = window.editor;
    return { cx: (vw / 2 - view.x) / view.z, cy: (vh / 2 - view.y) / view.z, w: vw / view.z, h: vh / view.z };
  });
  const size = tv.viewportSize()!;
  const z = Math.min(size.width / camera.w, size.height / camera.h);
  await button(page, 'Send view').click();
  await tv.waitForTimeout(800);
  await tv.mouse.click(size.width / 2 + (1000 - camera.cx) * z, size.height / 2 + (700 - camera.cy) * z - 18);
  await expect(tv.locator('.popup')).toContainText('Waystone');
  await expect(tv.locator('.popup')).toContainText('North to town');
  await expect(tv.locator('body')).not.toContainText('Trap behind altar');
});
