import { B, reset } from './genkit';
import { t } from './i18n';
import { CELL, DoorKind, Room, WallStyle } from './model';
import type { MapRuntime } from './runtime';
import { mix32, mulberry32, pick, pointInPoly, rint, Rng, rrange } from './util';

export type DungeonStyle = 'rooms' | 'mixed' | 'ruins';
export type RoomShape = 'rect' | 'round' | 'cross' | 'irregular';
export type RoomTheme = 'crypt' | 'ritual' | 'prison' | 'storage' | 'throne' | 'library' | 'barracks';
export type PresetId = 'crypt' | 'bandits' | 'mine' | 'temple' | 'fortress';
/** How rooms are laid out and connected. 'auto' follows the style. */
export type DungeonLayout = 'auto' | 'sparse' | 'compact' | 'organic' | 'hall' | 'gallery' | 'symmetric';
export const LAYOUTS: DungeonLayout[] = ['auto', 'sparse', 'compact', 'organic', 'hall', 'gallery', 'symmetric'];

export interface DungeonParams {
  style: DungeonStyle;
  layout: DungeonLayout;
  rooms: number;
  minSize: number;
  maxSize: number;
  shapes: RoomShape[];
  /** 1 or 2 squares; 0 = mixed. */
  corridorWidth: 0 | 1 | 2;
  /** 0..4 */
  loops: number;
  /** 0..4 */
  deadEnds: number;
  /** Percentage of rooms that become natural caves (mixed style only). */
  caveShare: number;
  /** Percentage of passages that get a door. */
  doors: number;
  /** Percentage of doors that are secret. */
  secretDoors: number;
  /** 0..4 */
  traps: number;
  themes: RoomTheme[];
  /** 0..4 */
  furniture: number;
  ambient: number;
  fog: boolean;
  numbers: boolean;
}

export interface DungeonStats { rooms: number; loops: number; doors: number; secretDoors: number; traps: number; caves: number }

export const ROOM_SHAPES: RoomShape[] = ['rect', 'round', 'cross', 'irregular'];
export const ROOM_THEMES: RoomTheme[] = ['crypt', 'ritual', 'prison', 'storage', 'throne', 'library', 'barracks'];
export const PRESET_ORDER: PresetId[] = ['crypt', 'bandits', 'mine', 'temple', 'fortress'];

export const PRESETS: Record<PresetId, DungeonParams> = {
  crypt: {
    layout: 'auto', style: 'rooms', rooms: 10, minSize: 3, maxSize: 6, shapes: ['rect', 'round'], corridorWidth: 1, loops: 1, deadEnds: 1, caveShare: 0,
    doors: 75, secretDoors: 15, traps: 1, themes: ['crypt', 'ritual', 'prison'], furniture: 2, ambient: 0.6, fog: true, numbers: true,
  },
  bandits: {
    layout: 'auto', style: 'mixed', rooms: 8, minSize: 4, maxSize: 8, shapes: ['rect', 'irregular'], corridorWidth: 0, loops: 1, deadEnds: 2, caveShare: 40,
    doors: 50, secretDoors: 10, traps: 2, themes: ['storage', 'barracks', 'throne'], furniture: 3, ambient: 0.45, fog: true, numbers: true,
  },
  mine: {
    layout: 'auto', style: 'mixed', rooms: 9, minSize: 3, maxSize: 6, shapes: ['rect'], corridorWidth: 1, loops: 2, deadEnds: 3, caveShare: 70,
    doors: 30, secretDoors: 5, traps: 1, themes: ['storage'], furniture: 2, ambient: 0.65, fog: true, numbers: true,
  },
  temple: {
    layout: 'auto', style: 'ruins', rooms: 9, minSize: 4, maxSize: 8, shapes: ['round', 'cross', 'irregular'], corridorWidth: 2, loops: 2, deadEnds: 0, caveShare: 0,
    doors: 30, secretDoors: 20, traps: 2, themes: ['ritual', 'throne', 'library'], furniture: 1, ambient: 0.5, fog: true, numbers: true,
  },
  fortress: {
    layout: 'compact', style: 'rooms', rooms: 14, minSize: 4, maxSize: 9, shapes: ['rect', 'cross'], corridorWidth: 2, loops: 3, deadEnds: 1, caveShare: 0,
    doors: 90, secretDoors: 10, traps: 1, themes: ['barracks', 'storage', 'throne', 'library', 'prison'], furniture: 3, ambient: 0.35, fog: true, numbers: true,
  },
};

export const presetName = (p: PresetId) => ({ crypt: t('Crypt'), bandits: t('Bandit hideout'), mine: t('Mine'), temple: t('Ruined temple'), fortress: t('Fortress') })[p];
export const presetDesc = (p: PresetId) => ({
  crypt: t('Many small rooms, sarcophagi and pillars, little light, a couple of secret doors.'),
  bandits: t('Hideout dug half into the rock: storerooms, bunks and the boss’s hall.'),
  mine: t('Mostly natural tunnels with a few shored-up rooms and many dead ends.'),
  temple: t('Crumbling halls of odd shapes, wide passages, rubble and moss.'),
  fortress: t('Many regular rooms, wide corridors and doors everywhere.'),
})[p];
export const layoutName = (l: DungeonLayout) => ({ auto: t('Automatic'), sparse: t('Sparse'), compact: t('Compact'), organic: t('Organic'), hall: t('Great hall'), gallery: t('Gallery'), symmetric: t('Symmetric') })[l];
export const layoutDesc = (l: DungeonLayout) => ({
  auto: t('A different layout for every seed, among those that suit the style.'),
  hall: t('A big pillared hall in the middle, the other rooms around it.'),
  gallery: t('A long colonnaded gallery crosses the map, rooms open off both sides.'),
  symmetric: t('Mirror-image plan around a central axis, like a temple or a palace.'),
  sparse: t('Isolated rooms in the rock, long corridors.'),
  compact: t('Rooms packed together to fill the map, short corridors.'),
  organic: t('Winding passages and irregular connections.'),
})[l];
/** Layouts that 'auto' picks from, per style (repeats make a layout more likely). */
const AUTO_LAYOUTS: Record<DungeonStyle, Exclude<DungeonLayout, 'auto'>[]> = {
  rooms: ['sparse', 'sparse', 'compact', 'hall', 'gallery', 'symmetric'],
  mixed: ['organic', 'organic', 'sparse', 'hall'],
  ruins: ['organic', 'symmetric', 'hall', 'gallery'],
};
/** The concrete layout used for a set of parameters: 'auto' picks one per seed. */
export function resolveLayout(p: DungeonParams, r: Rng): Exclude<DungeonLayout, 'auto'> {
  if (p.layout && p.layout !== 'auto') return p.layout;
  return pick(r, AUTO_LAYOUTS[p.style] ?? AUTO_LAYOUTS.rooms);
}

/** Look of a dungeon: wall style, room floors, corridor floor. One is picked per seed. */
interface Palette { wall: WallStyle; floors: string[]; corridor: string }
const PALETTES: Record<DungeonStyle, Palette[]> = {
  rooms: [
    { wall: 'stone', floors: ['flagstone', 'flagstone', 'stonetiles'], corridor: 'flagstone' },
    { wall: 'brick', floors: ['brickfloor', 'pavers'], corridor: 'pavers' },
    { wall: 'dark', floors: ['darktiles', 'wornflags'], corridor: 'darktiles' },
    { wall: 'marble', floors: ['marbledark', 'marbledark', 'hextiles'], corridor: 'marbledark' },
    { wall: 'sandstone', floors: ['sandstone', 'wornflags'], corridor: 'sandstone' },
  ],
  mixed: [
    { wall: 'stone', floors: ['flagstone', 'wornplanks'], corridor: 'flagstone' },
    { wall: 'brick', floors: ['pavers', 'brickfloor'], corridor: 'pavers' },
    { wall: 'dark', floors: ['darktiles', 'wornplanks'], corridor: 'darktiles' },
  ],
  ruins: [
    { wall: 'stone', floors: ['mossycobble', 'crazypaving', 'wornflags', 'cobble'], corridor: 'cobble' },
    { wall: 'sandstone', floors: ['sandstone', 'crazypaving', 'wornflags'], corridor: 'wornflags' },
    { wall: 'marble', floors: ['marbledark', 'mosaic', 'mossycobble'], corridor: 'crazypaving' },
  ],
};
/** Floors that suit a room's purpose; a themed room often gets one of them. */
const THEME_FLOORS: Record<RoomTheme, string[]> = {
  crypt: ['darktiles', 'marbledark', 'tiles'], ritual: ['runes', 'obsidian', 'mosaic'], prison: ['darktiles', 'wornflags', 'pavers'],
  storage: ['wornplanks', 'wood', 'brickfloor'], throne: ['marble', 'mosaic', 'tiles'], library: ['parquet', 'wornplanks', 'wood'],
  barracks: ['wornplanks', 'wood', 'pavers'],
};
export const styleName = (s: DungeonStyle) => ({ rooms: t('Rooms and corridors'), mixed: t('Mixed with caves'), ruins: t('Ruins') })[s];
export const shapeName = (s: RoomShape) => ({ rect: t('Rectangular'), round: t('Round'), cross: t('Cross-shaped'), irregular: t('Irregular') })[s];
export const themeName = (s: RoomTheme) => ({ crypt: t('Crypt'), ritual: t('Ritual'), prison: t('Prison'), storage: t('Storeroom'), throne: t('Throne room'), library: t('Library'), barracks: t('Barracks') })[s];
export const levelName = (n: number) => [t('None'), t('Few'), t('Some'), t('Many'), t('Lots')][Math.max(0, Math.min(4, Math.round(n)))];

/** FNV-1a hash: any text seed maps to a stable 32-bit number. */
export function seedNumber(seed: string): number {
  let h = 0x811c9dc5;
  for (const ch of seed.trim().toUpperCase()) { h ^= ch.charCodeAt(0); h = Math.imul(h, 0x01000193); }
  return h >>> 0;
}
export function randomSeed(prefix: string): string {
  return `${prefix}-${1000 + Math.floor(Math.random() * 9000)}`;
}
export const seedPrefix = (p: PresetId) => p.toUpperCase();

interface RoomInfo {
  x: number; y: number; w: number; h: number;
  shape: RoomShape; cave: boolean;
  cells: Set<number>;
  anchor: [number, number];
  floor: string;
  /** The room as stored in the map (built rooms only), so dressing can change its floor. */
  rm?: Room;
}

/** Replace the map content with a dungeon built from the given parameters. Same seed + params = same layout. */
export function generateDungeon(rt: MapRuntime, params: DungeonParams, seed: string): DungeonStats {
  const doc = rt.doc;
  reset(doc);
  rt.engine.masks.clear();
  const b = new B(rt, seedNumber(seed));
  const r = b.r;
  const C = doc.cols, R = doc.rows;
  const idx = (x: number, y: number) => y * C + x;
  const stats: DungeonStats = { rooms: 0, loops: 0, doors: 0, secretDoors: 0, traps: 0, caves: 0 };
  // the dungeon's character (look and layout) comes from its own, well-mixed stream: similar seeds
  // such as CRYPT-1234 and CRYPT-1240 must not keep getting the same palette or layout
  const rc = mulberry32(mix32(seedNumber(seed) ^ 0x5bd1e995));
  const pal = pick(rc, PALETTES[params.style] ?? PALETTES.rooms);
  doc.bg = 'rock'; doc.wallStyle = pal.wall; doc.caveFloor = 'cave';
  doc.ambient = params.ambient; doc.fogEnabled = params.fog;
  const shapes = params.shapes.length ? params.shapes : ['rect' as RoomShape];
  let minS = Math.max(2, Math.min(params.minSize, params.maxSize)), maxS = Math.max(minS, params.maxSize);
  let gap = params.style === 'ruins' ? 0 : 2;
  // small maps: cap room size so that at least two rooms fit side by side
  const cap = Math.max(2, Math.floor((Math.min(C, R) - 3) / 2));
  if (cap < 4) gap = Math.min(gap, 1);
  maxS = Math.min(maxS, cap); minS = Math.min(minS, maxS);

  // ------------------------------------------------------------------ rooms
  const layout = resolveLayout(params, rc);
  const owner = new Int16Array(C * R).fill(-1);
  const rooms: RoomInfo[] = [];
  const polys: number[][] = [];
  const target = Math.max(2, Math.round(params.rooms));
  /** Turn a rectangle into a room of a random allowed shape (or the given shape/outline); returns its index, or -1 if it covers no cell. */
  const addRoom = (x: number, y: number, w: number, h: number, force: { shape?: RoomShape; pts?: number[] } = {}) => {
    let shape = force.shape ?? pick(r, shapes);
    if ((shape === 'round' || shape === 'cross') && (w < 3 || h < 3)) shape = 'rect';
    if (shape === 'irregular' && (w < 4 || h < 4)) shape = 'rect';
    const pts = force.pts ?? roomPolygon(r, shape, x, y, w, h);
    const cells = new Set<number>();
    for (let cy = y; cy < y + h; cy++) for (let cx = x; cx < x + w; cx++) if (pointInPoly(cx + 0.5, cy + 0.5, pts)) cells.add(idx(cx, cy));
    if (!cells.size) return -1;
    let best = [x, y] as [number, number], bd = Infinity;
    for (const c of cells) { const cx = c % C, cy = (c / C) | 0; const d = Math.hypot(cx + 0.5 - (x + w / 2), cy + 0.5 - (y + h / 2)); if (d < bd) { bd = d; best = [cx, cy]; } }
    const i = rooms.length;
    for (const c of cells) owner[c] = i;
    const floor = r() < 0.12 ? 'tiles' : pick(r, pal.floors);
    rooms.push({ x, y, w, h, shape, cave: false, cells, anchor: best, floor });
    polys.push(pts);
    return i;
  };
  const overlaps = (x: number, y: number, w: number, h: number) => rooms.some((o) => x < o.x + o.w + gap && o.x < x + w + gap && y < o.y + o.h + gap && o.y < y + h + gap);
  /** Scatter rooms at random free spots until there are `count`; `ok` limits where they may go. */
  const scatter = (count: number, ok: (x: number, y: number, w: number, h: number) => boolean = () => true) => {
    for (let a = 0; a < 600 && rooms.length < count; a++) {
      // small maps: shrink rooms and spacing until they fit
      if (a > 0 && a % 120 === 0 && rooms.length < Math.min(count, 3)) {
        if (maxS > minS) maxS--; else if (minS > 2) { minS--; maxS = Math.max(maxS, minS); }
        gap = Math.min(gap, 1);
      }
      const w = rint(r, minS, Math.min(maxS, C - 4)), h = rint(r, minS, Math.min(maxS, R - 4));
      const x = rint(r, 1, C - w - 1), y = rint(r, 1, R - h - 1);
      if (x < 1 || y < 1 || x + w > C - 1 || y + h > R - 1) continue;
      if (!ok(x, y, w, h) || overlaps(x, y, w, h)) continue;
      addRoom(x, y, w, h);
    }
  };
  /** Special rooms of some layouts: the great hall, the gallery, and each room's mirror image. */
  let hub = -1, gallery = -1, galleryHoriz = true;
  const mirror = new Map<number, number>();
  const mirrorPts = (pts: number[]) => pts.map((v, k) => (k % 2 ? v : C - v));

  if (layout === 'compact') {
    // Binary space partition: split the largest area until there is one leaf per room, then put a room in each leaf.
    const minLeaf = minS + 1;
    const nodes = [{ x: 1, y: 1, w: C - 2, h: R - 2 }];
    while (nodes.length < target) {
      nodes.sort((p1, p2) => p2.w * p2.h - p1.w * p1.h);
      const n = nodes.find((q) => q.w >= minLeaf * 2 || q.h >= minLeaf * 2);
      if (!n) break;
      const canV = n.w >= minLeaf * 2, canH = n.h >= minLeaf * 2;
      const vertical = canV && (!canH || (n.w > n.h ? r() < 0.8 : r() < 0.2));
      nodes.splice(nodes.indexOf(n), 1);
      if (vertical) { const cut = rint(r, minLeaf, n.w - minLeaf); nodes.push({ ...n, w: cut }, { ...n, x: n.x + cut, w: n.w - cut }); }
      else { const cut = rint(r, minLeaf, n.h - minLeaf); nodes.push({ ...n, h: cut }, { ...n, y: n.y + cut, h: n.h - cut }); }
    }
    for (const n of nodes) {
      // leave one cell free on the right/bottom so neighbouring rooms keep a wall between them
      const w = rint(r, Math.min(minS, n.w - 1), Math.max(Math.min(minS, n.w - 1), Math.min(maxS, n.w - 1)));
      const h = rint(r, Math.min(minS, n.h - 1), Math.max(Math.min(minS, n.h - 1), Math.min(maxS, n.h - 1)));
      if (w < 2 || h < 2) continue;
      addRoom(n.x + rint(r, 0, n.w - 1 - w), n.y + rint(r, 0, n.h - 1 - h), w, h);
    }
  }
  else if (layout === 'hall') {
    // one big hall near the middle; the other rooms are scattered around it
    const w = Math.min(C - 6, Math.round(maxS * rrange(r, 1.5, 1.9))), h = Math.min(R - 6, Math.round(maxS * rrange(r, 1.2, 1.5)));
    if (w >= minS + 2 && h >= minS + 2) {
      const x = Math.max(1, Math.min(C - w - 1, Math.round((C - w) / 2 + rrange(r, -0.15, 0.15) * C)));
      const y = Math.max(1, Math.min(R - h - 1, Math.round((R - h) / 2 + rrange(r, -0.15, 0.15) * R)));
      hub = addRoom(x, y, w, h, { shape: pick(r, ['rect', 'rect', 'round', 'cross'] as RoomShape[]) });
    }
  } else if (layout === 'gallery') {
    // a long colonnaded hall across the map, rooms on both sides
    galleryHoriz = C > R * 1.15 ? true : R > C * 1.15 ? false : r() < 0.5;
    const L = galleryHoriz ? C : R, across = galleryHoriz ? R : C, thick = across >= 18 ? 3 : 2;
    if (across >= thick + 2 * (minS + gap) + 2 && L >= 8) {
      const len = Math.max(6, Math.round((L - 2) * rrange(r, 0.72, 0.94)));
      const a0 = rint(r, 1, Math.max(1, L - 1 - len));
      const b0 = Math.max(1 + minS + gap, Math.min(across - 1 - minS - gap - thick, Math.round((across - thick) / 2 + rrange(r, -0.12, 0.12) * across)));
      gallery = galleryHoriz ? addRoom(a0, b0, len, thick, { shape: 'rect' }) : addRoom(b0, a0, thick, len, { shape: 'rect' });
    }
  } else if (layout === 'symmetric') {
    // rooms on the central axis first, then rooms on the left half mirrored onto the right
    for (let k = 0, tries = 0, want = rint(r, 1, 2); k < want && tries < 40; tries++) {
      let w = rint(r, minS, Math.min(maxS, C - 4));
      if ((C - w) % 2) w += w > minS ? -1 : 1; // same parity as the map: exactly centred
      const h = rint(r, minS, Math.min(maxS, R - 4)), x = (C - w) / 2, y = rint(r, 1, R - h - 1);
      if (w < 2 || x < 1 || y + h > R - 1 || overlaps(x, y, w, h)) continue;
      if (addRoom(x, y, w, h, { shape: pick(r, [...shapes.filter((sh) => sh !== 'irregular'), 'rect'] as RoomShape[]) }) >= 0) k++;
    }
    const firstSide = rooms.length;
    scatter(firstSide + Math.max(1, Math.round((target - firstSide) / 2)), (x, _y, w) => x + w <= Math.floor((C - gap) / 2));
    for (let i = firstSide, n = rooms.length; i < n; i++) {
      const o = rooms[i];
      const j = addRoom(C - o.x - o.w, o.y, o.w, o.h, { shape: o.shape, pts: mirrorPts(polys[i]) });
      if (j < 0) continue;
      rooms[j].floor = o.floor;
      mirror.set(i, j); mirror.set(j, i);
    }
  }
  // sparse/organic layouts, the rooms around a hall or a gallery, and fallback when a partition could not fit two rooms
  if (layout !== 'compact' && layout !== 'symmetric' || rooms.length < 2) scatter(target + (hub >= 0 || gallery >= 0 ? 1 : 0));
  stats.rooms = rooms.length;
  if (!rooms.length) return stats;
  // the entrance: far from the great hall, at one end of the gallery, on the axis of a symmetric plan
  const anchorD = (i: number, j: number) => Math.hypot(rooms[i].anchor[0] - rooms[j].anchor[0], rooms[i].anchor[1] - rooms[j].anchor[1]);
  let entrance = 0;
  const others = rooms.map((_, i) => i).filter((i) => i !== hub && i !== gallery);
  if (hub >= 0 && others.length) entrance = others.reduce((a, i) => (anchorD(i, hub) > anchorD(a, hub) ? i : a), others[0]);
  else if (gallery >= 0) entrance = others.length ? others.reduce((a, i) => (rooms[i].anchor[galleryHoriz ? 0 : 1] < rooms[a].anchor[galleryHoriz ? 0 : 1] ? i : a), others[0]) : gallery;
  else if (layout === 'symmetric') {
    const axis = rooms.map((_, i) => i).filter((i) => !mirror.has(i));
    if (axis.length) entrance = axis.reduce((a, i) => (rooms[i].y > rooms[a].y ? i : a), axis[0]);
  }

  // natural caves (mixed style): never the entrance
  if (params.style === 'mixed' && params.caveShare > 0) {
    const n = Math.min(rooms.length - 1, Math.round((rooms.length * params.caveShare) / 100));
    const order = rooms.map((_, i) => i).filter((i) => i !== entrance && i !== hub && i !== gallery && !(mirror.has(i) && mirror.get(i)! < i)).sort(() => r() - 0.5);
    for (const i of order.slice(0, mirror.size ? Math.ceil(n / 2) : n)) { rooms[i].cave = true; if (mirror.has(i)) rooms[mirror.get(i)!].cave = true; }
  }
  stats.caves = rooms.filter((o) => o.cave).length;
  rooms.forEach((o, i) => {
    if (o.cave) {
      for (const c of o.cells) b.paint('cave', (c % C) + 0.5 + rrange(r, -0.3, 0.3), ((c / C) | 0) + 0.5 + rrange(r, -0.3, 0.3), rrange(r, 0.8, 1.1), 0.5, 1);
    } else {
      const rm = b.room(0, 0, 0, 0, o.floor, i === hub ? t('Great hall') : i === gallery ? t('Gallery') : t('Room {n}', { n: i + 1 }));
      rm.pts = polys[i].map((v) => v * CELL);
      o.rm = rm;
    }
  });

  // ------------------------------------------------------------------ connections
  const dist = (a: RoomInfo, c: RoomInfo) => Math.abs(a.anchor[0] - c.anchor[0]) + Math.abs(a.anchor[1] - c.anchor[1]);
  const links: [number, number][] = [];
  const linked = new Set<string>();
  const key = (i: number, j: number) => `${Math.min(i, j)}-${Math.max(i, j)}`;
  const extra = Math.round([0, 1, 2, 3, 5][Math.max(0, Math.min(4, params.loops))] * (rooms.length >= 6 ? 1 : 0.5));
  if (layout === 'organic') {
    // Delaunay graph of the room anchors: spanning tree first (Kruskal), loops from the remaining edges.
    const pts = rooms.map((o) => [o.anchor[0] + r() * 1e-3, o.anchor[1] + r() * 1e-3] as [number, number]);
    let edges = delaunayEdges(pts);
    if (!edges.length) for (let i = 0; i < rooms.length; i++) for (let j = i + 1; j < rooms.length; j++) edges.push([i, j]);
    const len = ([i, j]: [number, number]) => Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1]);
    edges = edges.sort((e1, e2) => len(e1) - len(e2));
    const parent = rooms.map((_, i) => i);
    const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i])));
    const rest: [number, number][] = [];
    for (const e of edges) {
      const [ri, rj] = [find(e[0]), find(e[1])];
      if (ri !== rj) { parent[ri] = rj; links.push(e); linked.add(key(e[0], e[1])); } else rest.push(e);
    }
    // safety net for degenerate triangulations: join any group still apart to its nearest room
    for (let i = 1; i < rooms.length; i++) {
      if (find(i) === find(0)) continue;
      let best: [number, number] | null = null, bd = Infinity;
      for (let j = 0; j < rooms.length; j++) if (find(j) === find(0) && dist(rooms[i], rooms[j]) < bd) { bd = dist(rooms[i], rooms[j]); best = [i, j]; }
      if (best) { parent[find(i)] = find(0); links.push(best); }
    }
    for (const e of rest.sort(() => r() - 0.5).slice(0, extra)) { links.push(e); stats.loops++; }
  } else if (gallery >= 0) {
    // every room opens onto the gallery; loops join neighbouring rooms
    for (let i = 0; i < rooms.length; i++) if (i !== gallery) { links.push([gallery, i]); linked.add(key(gallery, i)); }
    const candidates: [number, number, number][] = [];
    for (let i = 0; i < rooms.length; i++) for (let j = i + 1; j < rooms.length; j++) if (i !== gallery && j !== gallery) candidates.push([i, j, dist(rooms[i], rooms[j])]);
    candidates.sort((p1, p2) => p1[2] - p2[2]);
    for (const [i, j] of candidates.slice(0, extra * 2).sort(() => r() - 0.5).slice(0, extra)) { links.push([i, j]); stats.loops++; }
  } else {
    // nearest-neighbour spanning tree (from the hall, which is "closer" to everything); a symmetric plan
    // only builds its axis and left half, the right half copies it
    const pool = rooms.map((_, i) => i).filter((i) => !(mirror.has(i) && mirror.get(i)! < i));
    const w8 = (i: number, j: number) => dist(rooms[i], rooms[j]) * (i === hub || j === hub ? 0.55 : 1);
    const inTree = new Set([hub >= 0 ? hub : pool[0]]);
    while (inTree.size < pool.length) {
      let bestL: [number, number, number] | null = null;
      for (const i of inTree) for (const j of pool) {
        if (inTree.has(j)) continue;
        const d = w8(i, j);
        if (!bestL || d < bestL[2]) bestL = [i, j, d];
      }
      if (!bestL) break;
      links.push([bestL[0], bestL[1]]); linked.add(key(bestL[0], bestL[1])); inTree.add(bestL[1]);
    }
    // symmetric plan without axis rooms: join the two halves across the middle
    if (mirror.size && pool.every((i) => mirror.has(i))) {
      const i = pool.reduce((a, k) => (rooms[k].x + rooms[k].w > rooms[a].x + rooms[a].w ? k : a), pool[0]);
      links.push([i, mirror.get(i)!]); linked.add(key(i, mirror.get(i)!));
    }
    const candidates: [number, number, number][] = [];
    for (const i of pool) for (const j of pool) if (i < j && !linked.has(key(i, j))) candidates.push([i, j, dist(rooms[i], rooms[j])]);
    candidates.sort((p1, p2) => p1[2] - p2[2]);
    for (const [i, j] of candidates.slice(0, Math.max(0, Math.min(candidates.length, extra * 2))).sort(() => r() - 0.5).slice(0, extra)) { links.push([i, j]); stats.loops++; }
  }

  // symmetric plan: every link touching the left half gets a mirror image (carved as the mirrored path)
  const linkTwin = links.map(() => -1);
  if (mirror.size) for (let k = 0, n = links.length; k < n; k++) {
    const [i, j] = links[k], mi = mirror.get(i) ?? i, mj = mirror.get(j) ?? j;
    if (mirror.get(i) === j || (mi === i && mj === j)) continue;
    links.push([mi, mj]); linkTwin.push(k);
  }
  const corridorCells = new Set<number>();
  const doorAt = new Set<string>();
  const doorKind = (): DoorKind => {
    if (r() * 100 < params.secretDoors) return 'secret';
    if (params.style === 'ruins') return r() < 0.6 ? 'arch' : 'wood';
    return r() < 0.12 ? 'iron' : 'wood';
  };
  const addDoor = (ex: number, ey: number, vertical: boolean, w: number) => {
    const key = `${ex},${ey}`;
    if (doorAt.has(key) || r() * 100 >= params.doors) return;
    doorAt.add(key);
    const kind = doorKind();
    b.door(ex, ey, vertical, w === 2 && kind === 'wood' ? 'double' : kind, w === 2 && kind !== 'secret' ? 2 : 1);
    stats.doors++;
    if (kind === 'secret') stats.secretDoors++;
  };
  const isBuiltDoorable = (cell: number) => {
    const o = owner[cell];
    return o >= 0 && !rooms[o].cave && rooms[o].shape !== 'round';
  };

  /** Cells covered by built corridors; turned into rectangles once all paths are carved. */
  const corrGrid = new Uint8Array(C * R);
  const markCorridor = (x: number, y: number, width: number) => {
    for (let dy = 0; dy < width; dy++) for (let dx = 0; dx < width; dx++) {
      const X = Math.min(C - 2, x + dx), Y = Math.min(R - 2, y + dy);
      if (X >= 1 && Y >= 1) corrGrid[idx(X, Y)] = 1;
    }
  };

  /** Carve a corridor along a list of cells (4-connected): built corridors, natural tunnels and doors. */
  const carve = (path: [number, number][], width: number, tunnel: boolean) => {
    for (let k = 0; k < path.length; k++) {
      const [cx, cy] = path[k];
      const c = idx(cx, cy);
      const inside = owner[c] >= 0;
      if (tunnel) {
        if (inside && !rooms[owner[c]].cave) continue;
        b.paint('cave', cx + 0.5 + rrange(r, -0.25, 0.25), cy + 0.5 + rrange(r, -0.25, 0.25), 0.7 * width + rrange(r, 0, 0.25), 0.5, 1);
        if (!inside) corridorCells.add(c);
        continue;
      }
      // cells outside rooms, plus the first cell inside a room, so corridors always overlap the rooms they join
      const prevOut = k > 0 && owner[idx(path[k - 1][0], path[k - 1][1])] < 0;
      const nextOut = k < path.length - 1 && owner[idx(path[k + 1][0], path[k + 1][1])] < 0;
      if (!inside || prevOut || nextOut) markCorridor(cx, cy, width);
      if (!inside) corridorCells.add(c);
      if (k > 0) {
        const [px, py] = path[k - 1];
        const a = owner[idx(px, py)];
        if ((a >= 0) !== inside) {
          const roomCell = a >= 0 ? idx(px, py) : c;
          if (isBuiltDoorable(roomCell)) {
            const vertical = px !== cx;
            const ex = vertical ? Math.max(px, cx) : cx + (width === 2 ? 1 : 0.5);
            const ey = vertical ? cy + (width === 2 ? 1 : 0.5) : Math.max(py, cy);
            addDoor(ex, ey, vertical, width);
          }
        }
      }
    }
  };

  const lPath = (ax: number, ay: number, bx: number, by: number): [number, number][] => {
    const path: [number, number][] = [[ax, ay]];
    let x = ax, y = ay;
    const step = (tx: number, ty: number) => {
      while (x !== tx) { x += Math.sign(tx - x); path.push([x, y]); }
      while (y !== ty) { y += Math.sign(ty - y); path.push([x, y]); }
    };
    if (r() < 0.5) { step(bx, ay); step(bx, by); } else { step(ax, by); step(bx, by); }
    return path;
  };
  /** Biased random walk towards the target (a "drunkard walk"), finished with an L if it runs out of steps. */
  const windingPath = (ax: number, ay: number, bx: number, by: number, wiggle = 0.3): [number, number][] => {
    const path: [number, number][] = [[ax, ay]];
    let x = ax, y = ay;
    const limit = (Math.abs(bx - ax) + Math.abs(by - ay)) * 4 + 20;
    for (let steps = 0; (x !== bx || y !== by) && steps < limit; steps++) {
      const dx = Math.sign(bx - x), dy = Math.sign(by - y);
      let mx = 0, my = 0;
      if (r() >= wiggle) {
        if (dx && dy) { if (r() < Math.abs(bx - x) / (Math.abs(bx - x) + Math.abs(by - y))) mx = dx; else my = dy; }
        else if (dx) mx = dx; else my = dy;
      } else if (r() < 0.5) mx = r() < 0.5 ? 1 : -1; else my = r() < 0.5 ? 1 : -1;
      const nx = x + mx, ny = y + my;
      if (nx < 1 || ny < 1 || nx > C - 2 || ny > R - 2) continue;
      x = nx; y = ny;
      path.push([x, y]);
    }
    if (x !== bx || y !== by) path.push(...lPath(x, y, bx, by).slice(1));
    return path;
  };
  // built corridors wiggle less than natural tunnels, to avoid a staircase look
  const route = (ax: number, ay: number, bx: number, by: number, tunnel: boolean) =>
    layout === 'organic' ? windingPath(ax, ay, bx, by, tunnel ? 0.3 : 0.12) : lPath(ax, ay, bx, by);
  /** A path's mirror image across the vertical axis (a corridor of width w covers x..x+w-1). */
  const mirrorPath = (path: [number, number][], w: number) => path.map(([x, y]) => [C - x - w, y] as [number, number]);
  const carved: { path: [number, number][]; w: number; tunnel: boolean }[] = [];
  links.forEach(([i, j], k) => {
    const A = rooms[i], Bm = rooms[j];
    if (linkTwin[k] >= 0) { const o = carved[linkTwin[k]]; carve(mirrorPath(o.path, o.w), o.w, o.tunnel); carved.push(o); return; }
    // gallery: straight to the nearest point of the gallery, not to its middle
    let [bx, by] = Bm.anchor;
    if (i === gallery) {
      const G = rooms[gallery];
      [bx, by] = galleryHoriz ? [Math.max(G.x, Math.min(G.x + G.w - 1, Bm.anchor[0])), G.anchor[1]] : [G.anchor[0], Math.max(G.y, Math.min(G.y + G.h - 1, Bm.anchor[1]))];
    }
    const [ax, ay] = i === gallery ? [bx, by] : A.anchor;
    if (i === gallery) [bx, by] = Bm.anchor;
    const w = params.corridorWidth || (r() < 0.5 ? 1 : 2);
    const tunnel = params.style === 'mixed' && (A.cave || Bm.cave) && (A.cave && Bm.cave ? true : r() < 0.5);
    const path = route(ax, ay, bx, by, tunnel);
    carve(path, w, tunnel);
    carved.push({ path, w, tunnel });
  });

  // dead ends: short blind passages leaving a room
  const nDead = [0, 1, 2, 4, 6][Math.max(0, Math.min(4, params.deadEnds))];
  for (let k = 0, tries = 0; k < nDead && tries < 60; tries++) {
    const i = rint(r, 0, rooms.length - 1), o = rooms[i];
    const [dx, dy] = pick(r, [[1, 0], [-1, 0], [0, 1], [0, -1]] as [number, number][]);
    let [x, y] = o.anchor;
    const path: [number, number][] = [[x, y]];
    while (owner[idx(x, y)] === i) { x += dx; y += dy; if (x < 1 || y < 1 || x >= C - 1 || y >= R - 1) break; path.push([x, y]); }
    let len = 0;
    const want = rint(r, 3, 6);
    let [ddx, ddy] = [dx, dy];
    while (len < want) {
      // organic layouts: occasionally turn sideways, without ever turning back
      if (layout === 'organic' && len > 0 && r() < 0.3) [ddx, ddy] = r() < 0.5 ? [ddy, ddx] : [-ddy, -ddx];
      if (ddx === -dx && ddy === -dy) [ddx, ddy] = [dx, dy];
      const nx = x + ddx, ny = y + ddy;
      if (nx < 1 || ny < 1 || nx >= C - 2 || ny >= R - 2 || owner[idx(nx, ny)] >= 0 || corridorCells.has(idx(nx, ny))) break;
      x = nx; y = ny; path.push([x, y]); len++;
    }
    if (len < 2 || x < 1 || y < 1 || x >= C - 1 || y >= R - 1) continue;
    carve(path, 1, params.style === 'mixed' && o.cave);
    if (mirror.has(i)) carve(mirrorPath(path, 1), 1, params.style === 'mixed' && o.cave);
    k++;
  }

  // turn corridor cells into as few rectangles as possible
  const done = new Uint8Array(C * R);
  for (let y = 0; y < R; y++) for (let x = 0; x < C; x++) {
    const i0 = idx(x, y);
    if (!corrGrid[i0] || done[i0]) continue;
    let w = 1;
    while (x + w < C && corrGrid[idx(x + w, y)] && !done[idx(x + w, y)]) w++;
    let hh = 1;
    grow: while (y + hh < R) {
      for (let k = 0; k < w; k++) if (!corrGrid[idx(x + k, y + hh)] || done[idx(x + k, y + hh)]) break grow;
      hh++;
    }
    for (let yy = y; yy < y + hh; yy++) for (let xx = x; xx < x + w; xx++) done[idx(xx, yy)] = 1;
    b.room(x, y, w, hh, pal.corridor, t('Corridor'));
  }

  // ------------------------------------------------------------------ dressing
  const m = [0, 0.5, 1, 1.5, 2][Math.max(0, Math.min(4, params.furniture))];
  const themes = params.themes.length ? params.themes : (['crypt', 'storage'] as RoomTheme[]);
  rooms.forEach((o, i) => {
    const used = new Set<number>();
    const isIn = (x: number, y: number) => x >= 0 && y >= 0 && x < C && y < R && o.cells.has(idx(x, y));
    const wall: { c: number; side: number }[] = [], center: number[] = [];
    for (const c of o.cells) {
      const x = c % C, y = (c / C) | 0;
      const sides = [!isIn(x, y - 1), !isIn(x + 1, y), !isIn(x, y + 1), !isIn(x - 1, y)];
      const s = sides.findIndex(Boolean);
      if (s >= 0) wall.push({ c, side: s }); else center.push(c);
    }
    const free = <T extends number | { c: number }>(list: T[]) => list.filter((e) => !used.has(typeof e === 'number' ? e : e.c));
    const takeWall = () => { const l = free(wall); if (!l.length) return null; const e = pick(r, l); used.add(e.c); return e; };
    const takeCenter = () => { const l = free(center); if (!l.length) return null; const e = pick(r, l); used.add(e); return e; };
    const cxy = (c: number): [number, number] => [(c % C) + 0.5, ((c / C) | 0) + 0.5];
    // side: 0 top, 1 right, 2 bottom, 3 left -> rotation that puts an object's back against that wall
    const rotFor = (side: number) => [0, Math.PI / 2, Math.PI, -Math.PI / 2][side];
    const towardWall = (side: number, k: number): [number, number] => [[0, -k], [k, 0], [0, k], [-k, 0]][side] as [number, number];
    const onWall = (type: string, k = 0.25, scale = 1) => {
      const e = takeWall(); if (!e) return;
      const [x, y] = cxy(e.c), [ox, oy] = towardWall(e.side, k);
      b.stamp(type, x + ox, y + oy, rotFor(e.side), scale);
    };
    const inCenter = (type: string, rot = r() * Math.PI * 2, scale = 1) => { const c = takeCenter(); if (c === null) return; const [x, y] = cxy(c); b.stamp(type, x, y, rot, scale); };
    const times = (n: number, fn: () => void) => { for (let k = 0; k < Math.round(n); k++) fn(); };

    if (params.numbers) {
      const first = [...o.cells].sort((a, c) => ((a / C) | 0) - ((c / C) | 0) || (a % C) - (c % C))[0];
      const [lx, ly] = cxy(first);
      b.label(String(i + 1), lx + 0.05, ly, 44);
    }
    if (o.cave) {
      times(wall.length * 0.2 * m + 1, () => onWall(pick(r, ['stalagmite', 'rocks', 'boulder', 'stalagmites']), 0.1, rrange(r, 0.7, 1.1)));
      if (r() < 0.6) times(rint(r, 1, 2), () => onWall(pick(r, ['crystals', 'glowshrooms', 'mushrooms', 'crystals_blue', 'geode']), 0.1, 0.8));
      if (r() < 0.4) inCenter(pick(r, ['cave_moss', 'glowmoss', 'ore_vein']));
      if (r() < 0.4) { const c = takeCenter(); if (c !== null) { const [x, y] = cxy(c); b.paint('water', x, y, rrange(r, 0.7, 1.3), 0.2); } }
      if (r() < 0.3) inCenter('bones');
      return;
    }
    if (i === hub || i === gallery) {
      // rows of pillars along the long walls, something grand in the middle of a hall
      const horiz = i === gallery ? galleryHoriz : o.w >= o.h;
      const len = horiz ? o.w : o.h, across = horiz ? o.h : o.w;
      const step = i === gallery ? 3 : 2, inset = across >= 5 ? 1.5 : 0.75;
      for (let a = 1.5; a <= len - 1.5 + 1e-6; a += step) for (const side of [inset, across - inset]) {
        const px = horiz ? o.x + a : o.x + side, py = horiz ? o.y + side : o.y + a;
        const c = idx(Math.floor(px), Math.floor(py));
        if (!o.cells.has(c) || used.has(c)) continue;
        used.add(c);
        b.stamp(o.shape === 'round' ? 'pillar_round' : 'pillar', px, py, 0, 0.9);
      }
      if (i === hub) inCenter(pick(r, ['statue', 'fountain', 'brazier', 'statue_knight']), 0);
      if (i === gallery && r() < 0.6) times(rint(r, 1, 2), () => inCenter(pick(r, ['statue_knight', 'brazier', 'rug']), horiz ? Math.PI / 2 : 0));
    }
    if (i === entrance) {
      onWall('stairs', 0, 1);
      const c = center[0] ?? [...o.cells][0];
      const [x, y] = cxy(c);
      b.label(t('Entrance'), x, y + 0.3, 30);
    } else if (i !== hub && i !== gallery) {
      const theme = pick(r, themes);
      // a themed room often has its own floor (a library in parquet, a throne room in marble…)
      if (o.rm && r() < 0.55) { o.rm.floor = pick(r, THEME_FLOORS[theme]); if (mirror.has(i)) { const m2 = rooms[mirror.get(i)!].rm; if (m2) m2.floor = o.rm.floor; } }
      switch (theme) {
        case 'crypt':
          times(Math.max(1, center.length / 6) * m, () => inCenter(pick(r, ['sarcophagus', 'sarcophagus', 'coffin', 'tomb_slab']), pick(r, [0, Math.PI / 2])));
          onWall(pick(r, ['candles', 'prayer_candles']), 0.2, 0.8);
          if (r() < 0.5) onWall('urns', 0.15, 0.8);
          if (r() < 0.6) inCenter(pick(r, ['bones', 'skulls', 'coffin_open']));
          break;
        case 'ritual': {
          const c = center.length ? center[Math.floor(center.length / 2)] : null;
          if (c !== null && center.length >= 4) { used.add(c); const [x, y] = cxy(c); b.stamp(r() < 0.5 ? 'pentagram' : 'summoning_circle', x, y, 0, Math.min(1, Math.sqrt(center.length) / 4) * 0.75); }
          onWall(r() < 0.5 ? 'altar' : 'sacrificial_altar', 0.2, 0.8);
          times(2 * m, () => inCenter(pick(r, ['candles', 'candle_stubs']), 0));
          if (r() < 0.6) inCenter(pick(r, ['blood', 'blood_trail', 'skulls']));
          if (r() < 0.4) onWall('green_brazier', 0.1, 0.8);
          break;
        }
        case 'prison':
          times(Math.max(1, wall.length * 0.3 * m), () => onWall(pick(r, ['cage', 'cage', 'shackles', 'chained_skeleton']), 0.05));
          times(1 + m, () => inCenter(pick(r, ['bones', 'bed_straw', 'bucket', 'rats'])));
          if (r() < 0.4) onWall(pick(r, ['iron_maiden', 'torture_rack', 'stocks']), 0.1, 0.9);
          onWall('chest', 0.2);
          break;
        case 'storage':
          times(Math.max(2, wall.length * 0.45 * m), () => onWall(pick(r, ['barrel', 'crate', 'crate', 'sacks', 'barrels', 'crate_stack', 'cask', 'grain_sack', 'weapon_barrel']), 0.15, rrange(r, 0.8, 1)));
          break;
        case 'throne':
          onWall('throne', 0.15);
          if (center.length >= 6) inCenter('rug', Math.PI / 2, 0.8);
          times(2 * m, () => inCenter('pillar', 0));
          times(2, () => onWall('brazier', 0.1, 0.9));
          if (r() < 0.5) onWall('statue_knight', 0.1, 0.9);
          break;
        case 'library':
          times(Math.max(1, wall.length * 0.18 * m), () => onWall(r() < 0.25 ? 'arcane_bookcase' : 'bookshelf', 0.32));
          inCenter(r() < 0.5 ? 'desk' : 'table', pick(r, [0, Math.PI / 2]), 0.9);
          inCenter(pick(r, ['candles', 'book_piles', 'scroll_pile', 'spellbook_lectern']), 0, 0.8);
          break;
        case 'barracks':
          times(Math.max(1, wall.length * 0.25 * m), () => onWall(r() < 0.4 ? 'bunk_bed' : 'bed', 0.0));
          times(1 + m, () => onWall(pick(r, ['chest', 'chest', 'weapon_rack', 'armor_stand']), 0.2));
          inCenter('table', 0, 0.9);
          break;
      }
    }
    if (params.ambient > 0.05) times(o.w * o.h > 20 ? 2 : 1, () => onWall('torch', 0.38, 1));
    if (r() < 0.6) onWall('cobweb', 0.2);
    if (r() < 0.25) inCenter(pick(r, ['floor_crack', 'papers', 'pottery_shards', 'scorch', 'skulls']));
    if (params.style === 'ruins') {
      times(rint(r, 1, 3), () => { const c = takeCenter() ?? takeWall()?.c; if (c == null) return; const [x, y] = cxy(c); b.paint(pick(r, ['moss', 'dirt', 'gravel']), x, y, rrange(r, 0.8, 1.6), 0.1, 0.7); });
      times(rint(r, 1, 3), () => inCenter('rubble'));
    } else if (r() < 0.3) { const c = takeCenter(); if (c !== null) { const [x, y] = cxy(c); b.paint(pick(r, ['water', 'moss']), x, y, rrange(r, 0.6, 1.2), 0.2, 0.8); } }
  });

  // traps: hidden, mostly in corridors
  const nTraps = Math.round([0, 0.25, 0.5, 0.9, 1.4][Math.max(0, Math.min(4, params.traps))] * rooms.length);
  const corr = [...corridorCells].filter((c) => owner[c] < 0);
  const roomCells = rooms.flatMap((o) => [...o.cells]);
  const trapAt = new Set<number>();
  for (let k = 0, tries = 0; k < nTraps && tries < nTraps * 10; tries++) {
    const list = r() < 0.6 && corr.length ? corr : roomCells;
    if (!list.length) break;
    const c = pick(r, list);
    if (trapAt.has(c)) continue;
    trapAt.add(c);
    b.stamp('trap', (c % C) + 0.5, ((c / C) | 0) + 0.5, 0, 0.9).hidden = true;
    k++;
  }
  stats.traps = trapAt.size;

  for (const k of rt.engine.masks.keys()) rt.engine.changed.add(k);
  rt.fog.fillAll();
  rt.engine.invalidateAll();
  return stats;
}

/** Room outline in grid units. */
function roomPolygon(r: () => number, shape: RoomShape, x: number, y: number, w: number, h: number): number[] {
  switch (shape) {
    case 'round': {
      const pts: number[] = [];
      const n = 24;
      for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; pts.push(x + w / 2 + (Math.cos(a) * w) / 2, y + h / 2 + (Math.sin(a) * h) / 2); }
      return pts;
    }
    case 'cross': {
      const a = Math.max(1, Math.floor(w / 3)), c = Math.max(1, Math.floor(h / 3));
      return [x + a, y, x + w - a, y, x + w - a, y + c, x + w, y + c, x + w, y + h - c, x + w - a, y + h - c, x + w - a, y + h, x + a, y + h, x + a, y + h - c, x, y + h - c, x, y + c, x + a, y + c];
    }
    case 'irregular': {
      // L shape: cut one corner
      const cw = rint(r, 1, Math.floor(w / 2)), ch = rint(r, 1, Math.floor(h / 2));
      let pts = [x, y, x + w - cw, y, x + w - cw, y + ch, x + w, y + ch, x + w, y + h, x, y + h];
      if (r() < 0.5) pts = pts.map((v, i) => (i % 2 === 0 ? 2 * x + w - v : v));
      if (r() < 0.5) pts = pts.map((v, i) => (i % 2 === 1 ? 2 * y + h - v : v));
      return pts;
    }
    default:
      return [x, y, x + w, y, x + w, y + h, x, y + h];
  }
}

/** Edges of the Delaunay triangulation of a small point set (Bowyer–Watson). */
function delaunayEdges(pts: [number, number][]): [number, number][] {
  const n = pts.length;
  if (n < 2) return [];
  if (n === 2) return [[0, 1]];
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [x, y] of pts) { minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y); }
  const d = Math.max(maxX - minX, maxY - minY, 1) * 20, mx = (minX + maxX) / 2, my = (minY + maxY) / 2;
  const P: [number, number][] = [...pts, [mx - d, my - d], [mx, my + d], [mx + d, my - d]];
  type Tri = { a: number; b: number; c: number; cx: number; cy: number; r2: number };
  const tri = (a: number, b: number, c: number): Tri => {
    const [ax, ay] = P[a], [bx, by] = P[b], [cx, cy] = P[c];
    const D = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by)) || 1e-9;
    const ux = ((ax * ax + ay * ay) * (by - cy) + (bx * bx + by * by) * (cy - ay) + (cx * cx + cy * cy) * (ay - by)) / D;
    const uy = ((ax * ax + ay * ay) * (cx - bx) + (bx * bx + by * by) * (ax - cx) + (cx * cx + cy * cy) * (bx - ax)) / D;
    return { a, b, c, cx: ux, cy: uy, r2: (ax - ux) ** 2 + (ay - uy) ** 2 };
  };
  let tris: Tri[] = [tri(n, n + 1, n + 2)];
  for (let i = 0; i < n; i++) {
    const [px, py] = P[i];
    const bad = tris.filter((t) => (px - t.cx) ** 2 + (py - t.cy) ** 2 < t.r2);
    const count = new Map<string, [number, number, number]>();
    for (const t of bad) for (const [u, v] of [[t.a, t.b], [t.b, t.c], [t.c, t.a]]) {
      const k = u < v ? `${u}-${v}` : `${v}-${u}`;
      const e = count.get(k);
      count.set(k, e ? [e[0], e[1], e[2] + 1] : [u, v, 1]);
    }
    tris = tris.filter((t) => !bad.includes(t));
    for (const [u, v, c] of count.values()) if (c === 1) tris.push(tri(u, v, i));
  }
  const out = new Map<string, [number, number]>();
  for (const t of tris) for (const [u, v] of [[t.a, t.b], [t.b, t.c], [t.c, t.a]]) {
    if (u >= n || v >= n) continue;
    out.set(u < v ? `${u}-${v}` : `${v}-${u}`, [Math.min(u, v), Math.max(u, v)]);
  }
  return [...out.values()];
}
