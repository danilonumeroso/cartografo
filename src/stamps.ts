import { CELL } from './model';
import { ctx2d, makeCanvas, mulberry32 } from './util';
import { t } from './i18n';
import { RES, StampDef } from './art';
import { CLASSIC } from './packs/classic';
import { FURNITURE } from './packs/furniture';
import { KITCHEN } from './packs/kitchen';
import { WORKSHOP } from './packs/workshop';
import { ARCANE } from './packs/arcane';
import { TEMPLE } from './packs/temple';
import { DUNGEON } from './packs/dungeon';
import { CAVES } from './packs/caves';
import { NATURE } from './packs/nature';
import { TOWN } from './packs/town';
import { CAMP } from './packs/camp';
import { NAUTICAL } from './packs/nautical';
import { TREASURE } from './packs/treasure';
import { CHRISTMAS } from './packs/christmas';
import { FANTASY } from './packs/fantasy';
import { DECOR } from './packs/decor';
import { EXTRAS } from './packs/extras';
import { WORLD } from './packs/world';

export type { StampDef } from './art';

export const CATEGORIES = ['furniture', 'kitchen', 'workshop', 'arcane', 'temple', 'dungeon', 'caves', 'nature', 'town', 'camp', 'nautical', 'treasure', 'christmas', 'fantasy', 'decor'] as const;
/** Library categories offered on world/region maps. */
export const WORLD_CATEGORIES = ['w_terrain', 'w_places', 'w_sea'] as const;
export const categoryName = (c: string) => ({
  w_terrain: t('Terrain'), w_places: t('Places'), w_sea: t('Seas & decorations'),
  furniture: t('Furniture'), kitchen: t('Kitchen & tavern'), workshop: t('Workshop & forge'), arcane: t('Magic & alchemy'),
  temple: t('Temple & graveyard'), dungeon: t('Dungeon'), caves: t('Caves'), nature: t('Nature'), town: t('Town & farm'),
  camp: t('Camp & war'), nautical: t('Docks & ships'), treasure: t('Treasure'), christmas: t('Christmas & winter'),
  fantasy: t('Fey & wonders'), decor: t('Clutter'),
} as Record<string, string>)[c] || c;

export const STAMP_PAD = 16;

const ALL: StampDef[] = [...CLASSIC, ...FURNITURE, ...KITCHEN, ...WORKSHOP, ...ARCANE, ...TEMPLE, ...DUNGEON, ...CAVES, ...NATURE, ...TOWN, ...CAMP, ...NAUTICAL, ...TREASURE, ...CHRISTMAS, ...FANTASY, ...DECOR, ...EXTRAS, ...WORLD];
const order = new Map<string, number>([...CATEGORIES, ...WORLD_CATEGORIES].map((c, i) => [c, i]));
/** All built-in stamps, grouped by category (stable within a category). */
export const STAMPS: StampDef[] = ALL.map((s, i) => [s, i] as const)
  .sort((a, b) => (order.get(a[0].cat) ?? 99) - (order.get(b[0].cat) ?? 99) || a[1] - b[1]).map((x) => x[0]);
export const STAMP_BY_ID = new Map(STAMPS.map((s) => [s.id, s]));

// ---------------------------------------------------------------- cache
const cache = new Map<string, HTMLCanvasElement>();
export const VARIANTS = 4;

export function stampImage(id: string, variant: number): HTMLCanvasElement | null {
  const def = STAMP_BY_ID.get(id);
  if (!def) return null;
  const key = id + '|' + (variant % VARIANTS);
  let cv = cache.get(key);
  if (!cv) {
    const w = def.w * CELL, h = def.h * CELL;
    cv = makeCanvas((w + STAMP_PAD * 2) * RES, (h + STAMP_PAD * 2) * RES);
    const c = ctx2d(cv);
    c.scale(RES, RES);
    c.translate(STAMP_PAD + w / 2, STAMP_PAD + h / 2);
    c.lineJoin = 'round'; c.lineCap = 'round';
    def.draw(c, mulberry32((variant % VARIANTS) * 7919 + id.length * 131 + 1), w, h);
    cache.set(key, cv);
  }
  return cv;
}

export function stampThumb(id: string, size = 56): string {
  const img = stampImage(id, 0)!;
  const c = makeCanvas(size, size);
  const x = ctx2d(c);
  const k = Math.min(size / img.width, size / img.height) * 0.95;
  x.drawImage(img, (size - img.width * k) / 2, (size - img.height * k) / 2, img.width * k, img.height * k);
  return c.toDataURL();
}
