import { expect, type Page } from 'playwright/test';
import type { Editor } from '../../src/editor';

declare global { interface Window { editor: Editor } }

export const button = (page: Page, name: string) => page.getByRole('button', { name, exact: true });
export async function doc(page: Page) {
  await page.waitForFunction(() => !!window.editor?.rt);
  return page.evaluate(() => window.editor.rt.doc);
}

export async function home(page: Page) {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'New map' })).toBeVisible();
}

export async function create(page: Page, template = 'Empty', background = 'Dark rock (dungeon)') {
  const previous = await page.evaluate(() => window.editor.rt?.doc.id);
  await page.locator('.tpl').filter({ has: page.getByText(template, { exact: true }) }).click();
  if (template === 'Empty') await button(page, background).click();
  await expect(page.locator('.home')).toBeHidden();
  await page.waitForFunction(old => window.editor?.rt?.doc.id !== old && window.editor?.maps.some(m => m.id === window.editor.rt?.doc.id), previous ?? null);
  await expect(page.locator('.save-status')).toHaveText('Saved');
}

export async function empty(page: Page) {
  await home(page);
  await button(page, 'Small 20×15').click();
  await create(page);
}

export async function menu(page: Page, name: string) {
  await button(page, 'More actions').click();
  await button(page, name).click();
}

async function point(page: Page, x: number, y: number) {
  return page.evaluate(([x, y]) => {
    const { view, canvas } = window.editor;
    const r = canvas.getBoundingClientRect();
    return [r.left + view.x + x * view.z, r.top + view.y + y * view.z] as const;
  }, [x, y]);
}

export async function clickMap(page: Page, x: number, y: number) {
  await page.mouse.click(...await point(page, x, y));
}

export async function drag(page: Page, x: number, y: number, endX: number, endY: number) {
  await page.mouse.move(...await point(page, x, y));
  await page.mouse.down();
  await page.mouse.move(...await point(page, endX, endY), { steps: 8 });
  await page.mouse.up();
}

export async function room(page: Page) {
  await button(page, 'Build').click();
  await button(page, 'Room').click();
  await drag(page, 610, 410, 990, 790);
}

export const alpha = (page: Page, key: string, x: number, y: number) => page.evaluate(({ key, x, y }) => {
  const rt = window.editor.rt;
  const mask = key === 'fog' ? rt.fog.mask : rt.engine.mask(key);
  return mask?.getContext('2d')!.getImageData(x * mask.width / rt.W, y * mask.height / rt.H, 1, 1).data[3] ?? 0;
}, { key, x, y });

// Seed an encounter with ties, a hidden monster and scores outside the d20 range.
export async function encounter(page: Page) {
  await empty(page);
  await page.evaluate(async () => {
    const path = '/src/model.ts';
    const { newToken } = await import(path);
    const ed = window.editor;
    ed.rt.doc.tokens = ['Aria', 'Bran', 'Guide', 'Mimic'].map((name, i) => ({
      ...newToken(850 + i * 200, 550, ['pc', 'ally', 'npc', 'monster'][i], name),
      init: [61, 60, 12, 9][i], initMod: i, hidden: i === 3, conditions: i === 0 ? ['prone'] : [],
    }));
  });
  await button(page, 'Play').click();
  await button(page, 'Add all').click();
}
