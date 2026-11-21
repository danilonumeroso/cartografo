import { t } from '../i18n';
import { coals, flame, StampDef } from '../art';

/**
 * Realistic props: CC0 Poly Haven models rendered straight down with the map's upper-left light, an ink
 * outline and a baked drop shadow (see CREDITS.md). Each file is one variant. When a file cannot be
 * loaded the painted stamp named by `like` is drawn instead.
 */
type Real = Omit<StampDef, 'cat' | 'draw' | 'photo'> & { files: string[]; ppm: number; e: number; like: string; over?: StampDef['draw'] };

const files = (id: string, n: number) => Array.from({ length: n }, (_, i) => `${id}-${i}.webp`);

const DEFS: Real[] = [
  // ----- rocks and plants: life size
  { id: 'r_boulder', name: t('Mossy crag'), w: 1.55, h: 2.3, layer: 1, files: files('boulder', 4), ppm: 128, e: 1, like: 'boulder', tags: 'rock stone cave realistic photo' },
  { id: 'r_rock', name: t('Mossy rock'), w: 1.5, h: 1.05, layer: 1, files: files('rock', 4), ppm: 128, e: 1, like: 'boulder', tags: 'boulder stone cave realistic photo' },
  { id: 'r_redrock', name: t('Red boulder'), w: 1.75, h: 2.1, layer: 1, files: files('redrock', 4), ppm: 128, e: 1, like: 'boulder', tags: 'rock stone desert canyon sandstone realistic photo' },
  { id: 'r_stones', name: t('Stones'), w: 1.2, h: 0.65, layer: 1, files: files('stones', 3), ppm: 256, e: 1.3, like: 'rocks', tags: 'rocks pebbles realistic photo' },
  { id: 'r_gravel', name: t('Stony ground'), w: 3.15, h: 2.65, layer: 0, files: files('gravel', 1), ppm: 128, e: 1, like: 'rubble', tags: 'gravel rubble scree sand rocks realistic photo' },
  { id: 'r_tree', name: t('Leafy tree'), w: 4.8, h: 4.1, layer: 2, files: files('tree', 3), ppm: 128, e: 1, like: 'tree_big', tags: 'oak forest canopy realistic photo' },
  { id: 'r_sapling', name: t('Young fir'), w: 0.75, h: 0.75, layer: 1, files: files('sapling', 4), ppm: 256, e: 1.3, like: 'pine', tags: 'pine sapling shrub bush conifer realistic photo' },
  { id: 'r_fern', name: t('Fern'), w: 0.8, h: 0.75, layer: 1, files: files('fern', 4), ppm: 256, e: 1.2, like: 'bush', tags: 'plant undergrowth forest bush realistic photo' },
  { id: 'r_branch', name: t('Dry branch'), w: 0.3, h: 1.05, layer: 1, files: files('branch', 3), ppm: 256, e: 1.2, like: 'log', tags: 'stick wood twig deadwood realistic photo' },
  // ----- furniture and clutter: a little larger than life, like the painted props
  { id: 'r_barrel', name: t('Oak barrel'), w: 0.66, h: 0.67, layer: 1, files: files('barrel', 2), ppm: 256, e: 1.3, like: 'barrel', tags: 'cask keg wine ale realistic photo' },
  { id: 'r_barrel_side', name: t('Barrel on its side'), w: 0.67, h: 0.78, layer: 1, files: files('barrel_side', 2), ppm: 256, e: 1.3, like: 'barrel', tags: 'cask keg lying realistic photo' },
  { id: 'r_bucket', name: t('Wooden bucket'), w: 0.6, h: 0.6, layer: 1, files: files('bucket', 2), ppm: 256, e: 1.4, like: 'barrel', tags: 'pail water tub realistic photo' },
  { id: 'r_basket', name: t('Wicker basket'), w: 0.4, h: 0.3, layer: 1, files: files('basket', 2), ppm: 256, e: 1.5, like: 'sacks', tags: 'basket wicker market realistic photo' },
  { id: 'r_chest', name: t('Iron-bound chest'), w: 0.85, h: 0.46, layer: 1, files: files('chest', 1), ppm: 256, e: 1.3, like: 'chest', tags: 'treasure trunk loot realistic photo' },
  { id: 'r_crate_long', name: t('Long crate'), w: 0.47, h: 1.03, layer: 1, files: files('crate_long', 1), ppm: 256, e: 1.3, like: 'crate', tags: 'box cargo storage realistic photo' },
  { id: 'r_bed', name: t('Gothic bed'), w: 1.22, h: 1.67, layer: 1, files: files('bed', 1), ppm: 256, e: 1.2, like: 'bed_double', tags: 'bedroom double bed inn realistic photo' },
  { id: 'r_chandelier', name: t('Candle chandelier'), w: 0.85, h: 0.9, layer: 2, light: { radius: 6, color: '#ffd896', intensity: 0.8 }, files: files('chandelier', 3), ppm: 256, e: 1.6, like: 'chandelier', tags: 'light candles ceiling realistic photo' },
  {
    id: 'r_firepit', name: t('Stone fire pit'), w: 1.2, h: 1.17, layer: 1, light: { radius: 6, color: '#ffa04a', intensity: 1 }, files: files('firepit', 1), ppm: 256, e: 1.2, like: 'campfire',
    tags: 'campfire hearth fire camp realistic photo',
    over: (c, r, w) => { coals(c, r, 0, 0, w * 0.24, 14); flame(c, -3, 2, w * 0.13); flame(c, 4, -3, w * 0.1); },
  },
  { id: 'r_chess', name: t('Chess board'), w: 0.56, h: 0.56, layer: 1, files: files('chess', 1), ppm: 256, e: 1.5, like: 'crate', tags: 'chess game board table realistic photo' },
  { id: 'r_goblets', name: t('Brass goblets'), w: 0.46, h: 0.3, layer: 1, files: files('goblets', 1), ppm: 256, e: 1.5, like: 'tankards', tags: 'cups wine drink table realistic photo' },
  { id: 'r_spinning', name: t('Old spinning wheel'), w: 0.44, h: 0.91, layer: 1, files: files('spinning', 1), ppm: 256, e: 1.3, like: 'crate', tags: 'spinning wheel wool weaving cottage realistic photo' },
  { id: 'r_shield', name: t('Kite shield'), w: 0.49, h: 1.24, layer: 1, files: files('shield', 1), ppm: 256, e: 1.3, like: 'shields', tags: 'shield armour knight armory realistic photo' },
  { id: 'r_weapons', name: t('Weapon on the floor'), w: 0.33, h: 1.32, layer: 1, files: files('weapons', 4), ppm: 256, e: 1.3, like: 'weapon_rack', tags: 'sword hammer mace axe armory loot realistic photo' },
  { id: 'r_angel', name: t('Mourning angel'), w: 1.11, h: 1.18, layer: 1, files: files('angel', 1), ppm: 256, e: 1.1, like: 'statue', tags: 'statue angel graveyard temple marble realistic photo' },
];

export const REAL: StampDef[] = DEFS.map(({ files, ppm, e, like, over, ...d }) => ({
  ...d, cat: 'real', photo: { files, ppm, e, like, over }, draw: () => {},
}));
