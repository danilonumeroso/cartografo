import { existsSync } from 'node:fs';
import { expect, it } from 'vitest';
import { CATEGORIES, STAMP_BY_ID, STAMPS, WORLD_CATEGORIES } from '../../src/stamps';
import { TEXTURES, WALL_TEXTURES } from '../../src/textures';
import { WALL_TEX } from '../../src/engine';
import { WALL_NAMES, WALL_SWATCH } from '../../src/ui/common';

// Stamp ids are persisted in saved maps: the original set must never disappear.
const ORIGINAL_IDS = [
  'table', 'table_round', 'chair', 'stool', 'bench', 'bed', 'bed_double', 'bookshelf', 'wardrobe', 'chest', 'crate', 'barrel', 'barrels', 'sacks',
  'counter', 'fireplace', 'cauldron', 'candles', 'throne', 'rug', 'pillar', 'pillar_round', 'statue', 'altar', 'sarcophagus', 'brazier', 'torch',
  'stairs', 'trapdoor', 'cage', 'well', 'fountain', 'pentagram', 'bones', 'cobweb', 'rubble', 'blood', 'trap', 'stalagmite', 'boulder', 'rocks',
  'crystals', 'mushrooms', 'glowshrooms', 'tree', 'tree_big', 'tree_autumn', 'pine', 'bush', 'stump', 'log', 'campfire', 'tent', 'cart', 'fence',
  'signpost', 'gravestone', 'menhir', 'lamppost', 'boat', 'tallgrass', 'flowers', 'puddle',
];

it('keeps every stamp id unique and every original id available', () => {
  expect(new Set(STAMPS.map((s) => s.id)).size).toBe(STAMPS.length);
  for (const id of ORIGINAL_IDS) expect(STAMP_BY_ID.has(id), id).toBe(true);
  expect(STAMPS.length).toBeGreaterThan(400);
});

it('gives every stamp a known category, a sane size, layer and light', () => {
  const cats = new Set<string>(CATEGORIES), worldCats = new Set<string>(WORLD_CATEGORIES);
  for (const s of STAMPS) {
    expect((s.world ? worldCats : cats).has(s.cat), `${s.id} category ${s.cat}`).toBe(true);
    expect(s.w > 0 && s.w <= 6 && s.h > 0 && s.h <= 12, `${s.id} size`).toBe(true);
    expect([0, 1, 2]).toContain(s.layer);
    expect(s.name.trim()).not.toBe('');
    if (s.light) {
      expect(s.light.radius, s.id).toBeGreaterThan(0);
      expect(s.light.intensity, s.id).toBeGreaterThan(0);
      expect(s.light.color, s.id).toMatch(/^#[0-9a-f]{6}$/i);
    }
  }
  // Every category has something in it.
  for (const c of [...CATEGORIES, ...WORLD_CATEGORIES]) expect(STAMPS.some((s) => s.cat === c), c).toBe(true);
});

it('ships every rendered prop file and a painted fallback for it', () => {
  const photos = STAMPS.filter((s) => s.photo);
  expect(photos.length).toBeGreaterThan(20);
  for (const s of photos) {
    expect(s.cat, s.id).toBe('real');
    expect(STAMP_BY_ID.get(s.photo!.like)?.photo, `${s.id} falls back to ${s.photo!.like}`).toBeUndefined();
    for (const f of s.photo!.files) expect(existsSync(`public/props/${f}`), f).toBe(true);
  }
});

it('defines textures and wall styles consistently', () => {
  expect(new Set(TEXTURES.map((t) => t.id)).size).toBe(TEXTURES.length);
  for (const t of TEXTURES) if (t.liquid) expect(t.foam, t.id).toHaveLength(4);
  for (const [style] of WALL_NAMES) {
    expect(WALL_TEX[style], style).toBeTruthy();
    expect(WALL_TEXTURES).toContain(WALL_TEX[style]);
    expect(WALL_SWATCH[style], style).toMatch(/^#[0-9a-f]{6}$/i);
  }
  expect(Object.keys(WALL_TEX).sort()).toEqual(WALL_NAMES.map(([s]) => s).sort());
});
