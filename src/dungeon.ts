import { B, reset } from './genkit';
import { t } from './i18n';
import { CELL, DoorKind } from './model';
import type { MapRuntime } from './runtime';
import { pick, pointInPoly, rint, rrange } from './util';

export type DungeonStyle = 'rooms' | 'mixed' | 'ruins';
export type RoomShape = 'rect' | 'round' | 'cross' | 'irregular';
export type RoomTheme = 'crypt' | 'ritual' | 'prison' | 'storage' | 'throne' | 'library' | 'barracks';
export type PresetId = 'crypt' | 'bandits' | 'mine' | 'temple' | 'fortress';

export interface DungeonParams {
  style: DungeonStyle;
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
    style: 'rooms', rooms: 10, minSize: 3, maxSize: 6, shapes: ['rect', 'round'], corridorWidth: 1, loops: 1, deadEnds: 1, caveShare: 0,
    doors: 75, secretDoors: 15, traps: 1, themes: ['crypt', 'ritual', 'prison'], furniture: 2, ambient: 0.6, fog: true, numbers: true,
  },
  bandits: {
    style: 'mixed', rooms: 8, minSize: 4, maxSize: 8, shapes: ['rect', 'irregular'], corridorWidth: 0, loops: 1, deadEnds: 2, caveShare: 40,
    doors: 50, secretDoors: 10, traps: 2, themes: ['storage', 'barracks', 'throne'], furniture: 3, ambient: 0.45, fog: true, numbers: true,
  },
  mine: {
    style: 'mixed', rooms: 9, minSize: 3, maxSize: 6, shapes: ['rect'], corridorWidth: 1, loops: 2, deadEnds: 3, caveShare: 70,
    doors: 30, secretDoors: 5, traps: 1, themes: ['storage'], furniture: 2, ambient: 0.65, fog: true, numbers: true,
  },
  temple: {
    style: 'ruins', rooms: 9, minSize: 4, maxSize: 8, shapes: ['round', 'cross', 'irregular'], corridorWidth: 2, loops: 2, deadEnds: 0, caveShare: 0,
    doors: 30, secretDoors: 20, traps: 2, themes: ['ritual', 'throne', 'library'], furniture: 1, ambient: 0.5, fog: true, numbers: true,
  },
  fortress: {
    style: 'rooms', rooms: 14, minSize: 4, maxSize: 9, shapes: ['rect', 'cross'], corridorWidth: 2, loops: 3, deadEnds: 1, caveShare: 0,
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
  doc.bg = 'rock'; doc.wallStyle = 'stone'; doc.caveFloor = 'cave';
  doc.ambient = params.ambient; doc.fogEnabled = params.fog;
  const shapes = params.shapes.length ? params.shapes : ['rect' as RoomShape];
  let minS = Math.max(2, Math.min(params.minSize, params.maxSize)), maxS = Math.max(minS, params.maxSize);
  let gap = params.style === 'ruins' ? 0 : 2;
  // small maps: cap room size so that at least two rooms fit side by side
  const cap = Math.max(2, Math.floor((Math.min(C, R) - 3) / 2));
  if (cap < 4) gap = Math.min(gap, 1);
  maxS = Math.min(maxS, cap); minS = Math.min(minS, maxS);

  // ------------------------------------------------------------------ rooms
  const owner = new Int16Array(C * R).fill(-1);
  const rooms: RoomInfo[] = [];
  const polys: number[][] = [];
  const target = Math.max(2, Math.round(params.rooms));
  for (let a = 0; a < 600 && rooms.length < target; a++) {
    // small maps: shrink rooms and spacing until they fit
    if (a > 0 && a % 120 === 0 && rooms.length < Math.min(target, 3)) {
      if (maxS > minS) maxS--; else if (minS > 2) { minS--; maxS = Math.max(maxS, minS); }
      gap = Math.min(gap, 1);
    }
    const w = rint(r, minS, Math.min(maxS, C - 4)), h = rint(r, minS, Math.min(maxS, R - 4));
    const x = rint(r, 1, C - w - 1), y = rint(r, 1, R - h - 1);
    if (x < 1 || y < 1 || x + w > C - 1 || y + h > R - 1) continue;
    if (rooms.some((o) => x < o.x + o.w + gap && o.x < x + w + gap && y < o.y + o.h + gap && o.y < y + h + gap)) continue;
    let shape = pick(r, shapes);
    if ((shape === 'round' || shape === 'cross') && (w < 3 || h < 3)) shape = 'rect';
    if (shape === 'irregular' && (w < 4 || h < 4)) shape = 'rect';
    const pts = roomPolygon(r, shape, x, y, w, h);
    const cells = new Set<number>();
    for (let cy = y; cy < y + h; cy++) for (let cx = x; cx < x + w; cx++) if (pointInPoly(cx + 0.5, cy + 0.5, pts)) cells.add(idx(cx, cy));
    if (!cells.size) continue;
    let best = [x, y] as [number, number], bd = Infinity;
    for (const c of cells) { const cx = c % C, cy = (c / C) | 0; const d = Math.hypot(cx + 0.5 - (x + w / 2), cy + 0.5 - (y + h / 2)); if (d < bd) { bd = d; best = [cx, cy]; } }
    const i = rooms.length;
    for (const c of cells) owner[c] = i;
    const floor = params.style === 'ruins' ? pick(r, ['flagstone', 'cobble', 'cave', 'tiles']) : r() < 0.2 ? 'tiles' : 'flagstone';
    rooms.push({ x, y, w, h, shape, cave: false, cells, anchor: best, floor });
    polys.push(pts);
  }
  stats.rooms = rooms.length;
  if (!rooms.length) return stats;

  // natural caves (mixed style): never the entrance
  if (params.style === 'mixed' && params.caveShare > 0) {
    const n = Math.min(rooms.length - 1, Math.round((rooms.length * params.caveShare) / 100));
    const order = rooms.map((_, i) => i).slice(1).sort(() => r() - 0.5);
    for (const i of order.slice(0, n)) rooms[i].cave = true;
  }
  stats.caves = rooms.filter((o) => o.cave).length;
  rooms.forEach((o, i) => {
    if (o.cave) {
      for (const c of o.cells) b.paint('cave', (c % C) + 0.5 + rrange(r, -0.3, 0.3), ((c / C) | 0) + 0.5 + rrange(r, -0.3, 0.3), rrange(r, 0.8, 1.1), 0.5, 1);
    } else {
      const rm = b.room(0, 0, 0, 0, o.floor, t('Room {n}', { n: i + 1 }));
      rm.pts = polys[i].map((v) => v * CELL);
    }
  });

  // ------------------------------------------------------------------ connections
  const dist = (a: RoomInfo, c: RoomInfo) => Math.abs(a.anchor[0] - c.anchor[0]) + Math.abs(a.anchor[1] - c.anchor[1]);
  const links: [number, number][] = [];
  const linked = new Set<string>();
  const inTree = new Set([0]);
  while (inTree.size < rooms.length) {
    let bestL: [number, number, number] | null = null;
    for (const i of inTree) for (let j = 0; j < rooms.length; j++) {
      if (inTree.has(j)) continue;
      const d = dist(rooms[i], rooms[j]);
      if (!bestL || d < bestL[2]) bestL = [i, j, d];
    }
    if (!bestL) break;
    links.push([bestL[0], bestL[1]]); linked.add(`${Math.min(bestL[0], bestL[1])}-${Math.max(bestL[0], bestL[1])}`); inTree.add(bestL[1]);
  }
  const extra = Math.round([0, 1, 2, 3, 5][Math.max(0, Math.min(4, params.loops))] * (rooms.length >= 6 ? 1 : 0.5));
  const candidates: [number, number, number][] = [];
  for (let i = 0; i < rooms.length; i++) for (let j = i + 1; j < rooms.length; j++) if (!linked.has(`${i}-${j}`)) candidates.push([i, j, dist(rooms[i], rooms[j])]);
  candidates.sort((a, c) => a[2] - c[2]);
  for (const [i, j] of candidates.slice(0, Math.max(0, Math.min(candidates.length, extra * 2))).sort(() => r() - 0.5).slice(0, extra)) { links.push([i, j]); stats.loops++; }

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
  for (const [i, j] of links) {
    const A = rooms[i], Bm = rooms[j];
    const w = params.corridorWidth || (r() < 0.5 ? 1 : 2);
    const tunnel = params.style === 'mixed' && (A.cave || Bm.cave) && (A.cave && Bm.cave ? true : r() < 0.5);
    carve(lPath(A.anchor[0], A.anchor[1], Bm.anchor[0], Bm.anchor[1]), w, tunnel);
  }

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
    while (len < want) {
      const nx = x + dx, ny = y + dy;
      if (nx < 1 || ny < 1 || nx >= C - 2 || ny >= R - 2 || owner[idx(nx, ny)] >= 0 || corridorCells.has(idx(nx, ny))) break;
      x = nx; y = ny; path.push([x, y]); len++;
    }
    if (len < 2 || x < 1 || y < 1 || x >= C - 1 || y >= R - 1) continue;
    carve(path, 1, params.style === 'mixed' && o.cave);
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
    b.room(x, y, w, hh, params.style === 'ruins' ? 'cobble' : 'flagstone', t('Corridor'));
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
      times(wall.length * 0.2 * m + 1, () => onWall(pick(r, ['stalagmite', 'rocks', 'boulder']), 0.1, rrange(r, 0.7, 1.1)));
      if (r() < 0.6) times(rint(r, 1, 2), () => onWall(pick(r, ['crystals', 'glowshrooms', 'mushrooms']), 0.1));
      if (r() < 0.4) { const c = takeCenter(); if (c !== null) { const [x, y] = cxy(c); b.paint('water', x, y, rrange(r, 0.7, 1.3), 0.2); } }
      if (r() < 0.3) inCenter('bones');
      return;
    }
    if (i === 0) {
      onWall('stairs', 0, 1);
      const c = center[0] ?? [...o.cells][0];
      const [x, y] = cxy(c);
      b.label(t('Entrance'), x, y + 0.3, 30);
    } else {
      const theme = pick(r, themes);
      switch (theme) {
        case 'crypt':
          times(Math.max(1, center.length / 6) * m, () => inCenter('sarcophagus', pick(r, [0, Math.PI / 2])));
          onWall('candles', 0.2);
          if (r() < 0.6) inCenter('bones');
          break;
        case 'ritual': {
          const c = center.length ? center[Math.floor(center.length / 2)] : null;
          if (c !== null && center.length >= 4) { used.add(c); const [x, y] = cxy(c); b.stamp('pentagram', x, y, 0, Math.min(1, Math.sqrt(center.length) / 4)); }
          onWall('altar', 0.2, 0.8);
          times(2 * m, () => inCenter('candles', 0));
          if (r() < 0.6) inCenter('blood');
          break;
        }
        case 'prison':
          times(Math.max(1, wall.length * 0.3 * m), () => onWall('cage', 0.05));
          times(1 + m, () => inCenter('bones'));
          onWall('chest', 0.2);
          break;
        case 'storage':
          times(Math.max(2, wall.length * 0.45 * m), () => onWall(pick(r, ['barrel', 'crate', 'crate', 'sacks', 'barrels']), 0.15, rrange(r, 0.85, 1.05)));
          break;
        case 'throne':
          onWall('throne', 0.15);
          if (center.length >= 6) inCenter('rug', Math.PI / 2, 0.8);
          times(2 * m, () => inCenter('pillar', 0));
          times(2, () => onWall('brazier', 0.1, 0.9));
          break;
        case 'library':
          times(Math.max(1, wall.length * 0.18 * m), () => onWall('bookshelf', 0.32));
          inCenter('table', pick(r, [0, Math.PI / 2]), 0.9);
          inCenter('candles', 0, 0.8);
          break;
        case 'barracks':
          times(Math.max(1, wall.length * 0.25 * m), () => onWall('bed', 0.0));
          times(1 + m, () => onWall('chest', 0.2));
          inCenter('table', 0, 0.9);
          break;
      }
    }
    if (params.ambient > 0.05) times(o.w * o.h > 20 ? 2 : 1, () => onWall('torch', 0.38, 1));
    if (r() < 0.6) onWall('cobweb', 0.2);
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
