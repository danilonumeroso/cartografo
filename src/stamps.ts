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
import { REAL } from './packs/real';
import { propPhoto } from './photos';

export type { StampDef } from './art';

export const CATEGORIES = ['furniture', 'kitchen', 'workshop', 'arcane', 'temple', 'dungeon', 'caves', 'nature', 'town', 'camp', 'nautical', 'treasure', 'christmas', 'fantasy', 'decor', 'real'] as const;
/** Library categories offered on world/region maps. */
export const WORLD_CATEGORIES = ['w_terrain', 'w_places', 'w_sea'] as const;
export const categoryName = (c: string) => ({
  w_terrain: t('Terrain'), w_places: t('Places'), w_sea: t('Seas & decorations'),
  furniture: t('Furniture'), kitchen: t('Kitchen & tavern'), workshop: t('Workshop & forge'), arcane: t('Magic & alchemy'),
  temple: t('Temple & graveyard'), dungeon: t('Dungeon'), caves: t('Caves'), nature: t('Nature'), town: t('Town & farm'),
  camp: t('Camp & war'), nautical: t('Docks & ships'), treasure: t('Treasure'), christmas: t('Christmas & winter'),
  fantasy: t('Fey & wonders'), decor: t('Clutter'), real: t('Realistic'),
} as Record<string, string>)[c] || c;

export const STAMP_PAD = 16;

const ALL: StampDef[] = [...CLASSIC, ...FURNITURE, ...KITCHEN, ...WORKSHOP, ...ARCANE, ...TEMPLE, ...DUNGEON, ...CAVES, ...NATURE, ...TOWN, ...CAMP, ...NAUTICAL, ...TREASURE, ...CHRISTMAS, ...FANTASY, ...DECOR, ...EXTRAS, ...REAL, ...WORLD];
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
    const rng = mulberry32((variant % VARIANTS) * 7919 + id.length * 131 + 1);
    const ph = def.photo, im = ph ? propPhoto(ph.files[(variant % VARIANTS) % ph.files.length]) : null;
    if (ph && im) {
      // rendered model: life size times e (one cell is 5 ft = 1.524 m), centred, shadow baked in
      const k = (ph.e * CELL) / (1.524 * ph.ppm);
      c.drawImage(im, (-im.naturalWidth * k) / 2, (-im.naturalHeight * k) / 2, im.naturalWidth * k, im.naturalHeight * k);
      ph.over?.(c, rng, w, h);
    } else (ph ? STAMP_BY_ID.get(ph.like) ?? def : def).draw(c, rng, w, h);
    cache.set(key, cv);
  }
  return cv;
}

/** Every prop render file, for the startup loader. */
export const PROP_FILES = STAMPS.flatMap((s) => s.photo?.files ?? []);

export function stampThumb(id: string, size = 56): string {
  // a rendered prop fills its tile on its own: its box is sized for the largest variant
  const ph = STAMP_BY_ID.get(id)?.photo;
  const img: CanvasImageSource & { width: number; height: number } = (ph && propPhoto(ph.files[0])) || stampImage(id, 0)!;
  const c = makeCanvas(size, size);
  const x = ctx2d(c);
  const k = Math.min(size / img.width, size / img.height) * 0.95;
  x.drawImage(img, (size - img.width * k) / 2, (size - img.height * k) / 2, img.width * k, img.height * k);
  return c.toDataURL();
}
