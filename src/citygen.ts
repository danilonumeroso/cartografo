import { Building, BuildingKind, CELL, Label, RoofStyle } from './model';
import type { MapRuntime } from './runtime';
import { B, reset, tavernName } from './genkit';
import { seedNumber } from './dungeon';
import { fantasyName } from './worldgen';
import { clamp, mulberry32, pick, pointInPoly, Rng, rrange, uid } from './util';
import { lang, t } from './i18n';

export type CityWater = 'none' | 'river' | 'coast';
export interface CityParams {
  /** 0..4: how much of the map the city fills. */
  size: number;
  walls: boolean;
  water: CityWater;
  castle: boolean;
  /** 0..4: how tightly packed the houses are. */
  density: number;
  roofs: 'mixed' | 'tile' | 'slate' | 'thatch';
}
export const DEFAULT_CITY: CityParams = { size: 2, walls: true, water: 'river', castle: true, density: 2, roofs: 'mixed' };
export interface CityStats { buildings: number; districts: number; taverns: number; name: string }


type P = [number, number];

/** Replace the map content with a generated city. Same seed + params = same city. Coordinates below are in cells. */
export function generateCity(rt: MapRuntime, params: CityParams, seed: string): CityStats {
  const doc = rt.doc;
  reset(doc);
  rt.engine.masks.clear();
  doc.paths = []; doc.buildings = [];
  doc.bg = 'grass'; doc.weather = 'none'; doc.ambient = 0; doc.fogEnabled = false;
  const seedN = seedNumber(seed), r = mulberry32(seedN), b = new B(rt, seedN ^ 0x5bd1e995);
  const C = doc.cols, R = doc.rows;
  const name = fantasyName(r);

  // ---- overall shape
  let cx = C / 2 + rrange(r, -C * 0.04, C * 0.04), cy = R / 2 + rrange(r, -R * 0.04, R * 0.04);
  const coastSide = Math.floor(r() * 4); // 0 south, 1 north, 2 east, 3 west
  const towardSea: P = [[0, 1], [0, -1], [1, 0], [-1, 0]][coastSide] as P;
  if (params.water === 'coast') { cx -= towardSea[0] * C * 0.12; cy -= towardSea[1] * R * 0.12; }
  const cityR = Math.min(C, R) * 0.5 * [0.5, 0.62, 0.74, 0.85, 0.94][clamp(Math.round(params.size), 0, 4)];
  const plazaR = clamp(cityR * 0.16, 2.2, 4.5);
  const nMain = 5 + Math.floor(r() * 3) + (params.size >= 3 ? 1 : 0);
  const radials = Array.from({ length: nMain }, (_, i) => ({ base: (i / nMain) * Math.PI * 2 + rrange(r, -0.25, 0.25), amp: rrange(r, 0.04, 0.12), ph: r() * 6.28 }));
  radials.sort((a, b2) => a.base - b2.base);
  const angleAt = (i: number, rad: number) => { const q = radials[(i + nMain) % nMain]; return q.base + q.amp * Math.sin(rad * 0.18 + q.ph) + (i >= nMain ? Math.PI * 2 : 0); };
  const ringStep = rrange(r, 3.6, 4.6) - params.density * 0.2;
  const rings: number[] = [plazaR];
  while (rings[rings.length - 1] + ringStep < cityR) rings.push(rings[rings.length - 1] + ringStep * rrange(r, 0.85, 1.15));
  const ringWob = rings.map(() => ({ a: rrange(r, 0.03, 0.07), k: 2 + Math.floor(r() * 3), ph: r() * 6.28 }));
  const ringR = (k: number, th: number) => rings[k] * (1 + ringWob[k].a * Math.sin(th * ringWob[k].k + ringWob[k].ph));
  const ax = clamp((C / R) * rrange(r, 0.75, 0.9), 1, 1.18), ay = 1;
  const polar = (rad: number, th: number): P => [cx + Math.cos(th) * rad * ax, cy + Math.sin(th) * rad * ay];
  const radOf = (x: number, y: number) => Math.hypot((x - cx) / ax, (y - cy) / ay);
  const inMap = ([x, y]: P, m = 0.6) => x > m && y > m && x < C - m && y < R - m;

  // ---- water
  let river: P[] = [];
  const riverW = 2.4;
  const shore = (x: number, y: number) => {
    // signed distance to the coastline, positive at sea
    const along = towardSea[1] ? x : y, base = towardSea[1] ? cy + towardSea[1] * cityR * 0.72 : cx + towardSea[0] * cityR * 0.72 * ax;
    const line = base + Math.sin(along * 0.25 + seedN) * 1.4 + Math.sin(along * 0.07) * 2;
    return towardSea[1] ? (y - line) * towardSea[1] : (x - line) * towardSea[0];
  };
  if (params.water === 'river') {
    const horiz = r() < 0.5, off = rrange(r, -0.2, 0.2);
    for (let i = 0; i <= 40; i++) {
      const k = i / 40;
      const p: P = horiz ? [-1 + k * (C + 2), cy + off * R + Math.sin(k * 6 + seedN) * R * 0.08] : [cx + off * C + Math.sin(k * 6 + seedN) * C * 0.06, -1 + k * (R + 2)];
      river.push(p);
    }
    b.stroke('water', river, riverW / 2 + 0.2, 0.3);
    b.stroke('deep', river, riverW / 4, 0.2);
  }
  const distRiver = (x: number, y: number) => { let d = Infinity; for (let i = 1; i < river.length; i++) d = Math.min(d, segDist(x, y, river[i - 1], river[i])); return d; };
  if (params.water === 'coast') {
    for (let y = 0; y < R; y += 0.5) for (let x = 0; x < C; x += 0.5) {
      const s2 = shore(x, y);
      if (s2 > -1.3 && s2 < 0.2) b.paint('sand', x, y, 0.7, 0.25, 0.8);
      if (s2 > -0.3) b.paint('water', x, y, 0.75, 0.3);
      if (s2 > 3) b.paint('deep', x, y, 0.75, 0.25);
    }
  }
  const wet = (x: number, y: number, pad = 0) => (params.water === 'river' && distRiver(x, y) < riverW / 2 + 0.3 + pad) || (params.water === 'coast' && shore(x, y) > -0.4 - pad);

  // ---- streets
  const occupied = new Grid(C, R, 4);
  const streetPts: { pts: P[]; w: number }[] = [];
  const street = (pts: P[], w: number, mask: string) => {
    const clipped = pts.filter((p) => inMap(p, -1));
    if (clipped.length < 2) return;
    b.stroke(mask, clipped, w / 2, 0.45);
    streetPts.push({ pts: clipped, w });
    for (let i = 1; i < clipped.length; i++) occupied.line(clipped[i - 1], clipped[i], w / 2 + 0.04);
  };
  // main radials run from the plaza out to the map edge
  const edgeR = rings[rings.length - 1] + 1.6;
  for (let i = 0; i < nMain; i++) {
    const inside: P[] = [], outside: P[] = [];
    for (let rad = plazaR * 0.8; rad < Math.max(C, R); rad += 0.8) (rad <= edgeR + 0.8 ? inside : outside).push(polar(rad, angleAt(i, rad)));
    street(inside, 1.0, 'cobble');
    if (outside.length) street([inside[inside.length - 1], ...outside], 0.8, 'dirt');
  }
  // ring roads inside the city
  for (let k = 1; k < rings.length; k++) {
    const pts: P[] = [];
    for (let th = 0; th <= Math.PI * 2 + 0.01; th += 0.06) pts.push(polar(ringR(k, th), th));
    street(pts, k === rings.length - 1 ? 0.9 : 0.75, 'cobble');
  }
  // packed earth inside the city, then the central plaza
  for (let rad = 0; rad <= edgeR + 0.5; rad += 1.6) for (let th = 0; th < Math.PI * 2; th += 1.4 / Math.max(rad, 1)) { const [x, y] = polar(rad, th); b.paint('dirt', x, y, 1.6, 0.2, 0.55); }
  b.paint('pavers', cx, cy, plazaR + 0.6, 0.5);
  occupied.disc(cx, cy, plazaR + 0.2);

  // ---- blocks between rings and radials, with alleys splitting the wide ones
  type Block = { pts: P[]; band: number; mid: P; area: number };
  const blocks: Block[] = [];
  for (let k = 0; k < rings.length - 1; k++) {
    for (let i = 0; i < nMain; i++) {
      const a0 = angleAt(i, rings[k]), a1raw = angleAt(i + 1, rings[k]);
      const a1 = a1raw <= a0 ? a1raw + Math.PI * 2 : a1raw;
      const midR = (rings[k] + rings[k + 1]) / 2, arc = (a1 - a0) * midR;
      const parts = Math.max(1, Math.round(arc / rrange(r, 7, 10)));
      for (let pI = 0; pI < parts; pI++) {
        const s0 = a0 + ((a1 - a0) * pI) / parts, s1 = a0 + ((a1 - a0) * (pI + 1)) / parts;
        if (pI > 0) { // alley between the parts
          const pts: P[] = []; for (let rad = rings[k]; rad <= rings[k + 1]; rad += 0.6) pts.push(polar(rad, s0)); street(pts, 0.5, 'dirt');
        }
        const pts: P[] = [], n = 8;
        for (let j = 0; j <= n; j++) { const th = s0 + ((s1 - s0) * j) / n; pts.push(polar(ringR(k, th), th)); }
        for (let j = n; j >= 0; j--) { const th = s0 + ((s1 - s0) * j) / n; pts.push(polar(ringR(k + 1, th), th)); }
        const mth = (s0 + s1) / 2, mid = polar(midR, mth);
        blocks.push({ pts, band: k, mid, area: (s1 - s0) * midR * (rings[k + 1] - rings[k]) });
      }
    }
  }

  // ---- special blocks
  const usable = blocks.filter((bl) => inMap(bl.mid, 2) && !wet(bl.mid[0], bl.mid[1], 1));
  const pickBlock = (ok: (bl: Block) => boolean) => { const l = usable.filter((bl) => !(bl as any).role && ok(bl)); return l.length ? pick(r, l) : null; };
  const castle = params.castle ? pickBlock((bl) => bl.band >= 1 && bl.area > 30) : null;
  if (castle) (castle as any).role = 'castle';
  const temple = pickBlock((bl) => bl.band <= 1);
  if (temple) (temple as any).role = 'temple';
  const market = pickBlock((bl) => bl.band === 0);
  if (market) (market as any).role = 'market';
  for (let i = 0; i < 1 + Math.floor(r() * 2); i++) { const park = pickBlock((bl) => bl.band >= 1); if (park) (park as any).role = 'park'; }

  // ---- buildings
  const roofFor = (band: number): RoofStyle => {
    if (params.roofs !== 'mixed') return params.roofs;
    const outer = band / Math.max(1, rings.length - 2);
    return r() < 0.12 ? 'slate' : outer > 0.7 && r() < 0.5 ? 'thatch' : r() < 0.1 ? 'wood' : 'tile';
  };
  // ids come from the seed, so roof colours and chimneys are the same every time
  const add = (bd: Omit<Building, 'id'>) => { const full = { ...bd, id: `b${seedN.toString(36)}-${doc.buildings.length}` }; doc.buildings.push(full); return full; };
  const tryPlace = (x: number, y: number, w: number, h: number, rot: number, poly: P[] | null, kind: BuildingKind, roof: RoofStyle) => {
    const corners = rect(x, y, w, h, rot);
    if (poly && !corners.every((p) => pointInPoly(p[0], p[1], poly.flat()))) return null;
    if (corners.some((p) => !inMap(p, 0.3) || wet(p[0], p[1]))) return null;
    if (!occupied.freeRect(corners)) return null;
    occupied.fillRect(corners);
    return add({ x: x * CELL, y: y * CELL, w: w * CELL, h: h * CELL, rot, roof, kind });
  };
  const gap = [0.35, 0.25, 0.15, 0.08, 0.04][clamp(Math.round(params.density), 0, 4)];
  /** Walk the whole block outline and line it with houses facing the street. */
  const fillEdges = (bl: Block, depth: [number, number], kindOf: () => BuildingKind, setback = 0.55) => {
    const poly = bl.pts, n = poly.length;
    const [mx, my] = centroid(poly);
    const cum = [0];
    for (let e = 0; e < n; e++) { const A = poly[e], Bp = poly[(e + 1) % n]; cum.push(cum[e] + Math.hypot(Bp[0] - A[0], Bp[1] - A[1])); }
    const total = cum[n];
    const at = (d: number): P => {
      d = ((d % total) + total) % total;
      let e = 0; while (e < n - 1 && cum[e + 1] < d) e++;
      const A = poly[e], Bp = poly[(e + 1) % n], k = (d - cum[e]) / Math.max(1e-6, cum[e + 1] - cum[e]);
      return [A[0] + (Bp[0] - A[0]) * k, A[1] + (Bp[1] - A[1]) * k];
    };
    let pos = rrange(r, 0, 0.5);
    while (pos < total - 0.3) {
      const d = rrange(r, depth[0], depth[1]), w = r() < 0.25 ? rrange(r, 0.6, 0.8) : d * rrange(r, 1.3, 1.9);
      const A = at(pos), Bp = at(pos + w), len = Math.hypot(Bp[0] - A[0], Bp[1] - A[1]);
      // a sharp turn (block corner) leaves a short chord: skip past it
      if (len < w * 0.85) { pos += 0.35; continue; }
      const dx = (Bp[0] - A[0]) / len, dy = (Bp[1] - A[1]) / len;
      let nx = -dy, ny = dx;
      const cxm = (A[0] + Bp[0]) / 2, cym = (A[1] + Bp[1]) / 2;
      if ((mx - cxm) * nx + (my - cym) * ny < 0) { nx = -nx; ny = -ny; }
      const off = setback + d / 2;
      const placed = tryPlace(cxm + nx * off, cym + ny * off, w, d, Math.atan2(dy, dx), poly, kindOf(), roofFor(bl.band));
      pos += placed ? w + gap + (r() < 0.06 ? rrange(r, 0.3, 0.9) : 0) : 0.3;
    }
  };
  for (const bl of blocks) {
    const role = (bl as any).role as string | undefined;
    if (!inMap(bl.mid, -2)) continue;
    if (role === 'park') {
      b.paint('grass', bl.mid[0], bl.mid[1], 2.5, 0.3);
      for (let i = 0; i < 8; i++) { const p = randomIn(r, bl.pts); if (p && occupied.free(p[0], p[1])) { b.stamp(pick(r, ['tree', 'tree', 'birch', 'cherry_tree', 'bush']), p[0], p[1], r() * 6.28, rrange(r, 0.6, 0.9)); occupied.disc(p[0], p[1], 0.8); } }
      continue;
    }
    if (role === 'castle') {
      const band = rings[bl.band + 1] - rings[bl.band], [x, y] = bl.mid, s = Math.min(4, Math.sqrt(bl.area) * 0.5, (band - 1.2) / 1.5), rot = Math.atan2(y - cy, x - cx);
      b.paint('flagstone', x, y, s * 0.9, 0.6);
      const ring = rect(x, y, s * 1.5, s * 1.5, rot);
      doc.paths.push({ id: uid(), kind: 'citywall', pts: [...ring, ring[0]].flatMap((p) => [p[0] * CELL, p[1] * CELL]), width: 18 });
      occupied.fillRect(ring);
      add({ x: x * CELL, y: y * CELL, w: s * 0.8 * CELL, h: s * 0.6 * CELL, rot, roof: 'slate', kind: 'keep', name: t('{name} Castle', { name }) });
      for (const [ox, oy] of [[-0.45, -0.45], [0.45, -0.45], [0.45, 0.45], [-0.45, 0.45]]) {
        const tx = x + (ox * Math.cos(rot) - oy * Math.sin(rot)) * s * 1.5, ty = y + (ox * Math.sin(rot) + oy * Math.cos(rot)) * s * 1.5;
        add({ x: tx * CELL, y: ty * CELL, w: 0.9 * CELL, h: 0.9 * CELL, rot: 0, roof: 'slate', kind: 'tower' });
      }
      fillEdges(bl, [0.6, 0.9], () => 'house');
      continue;
    }
    if (role === 'temple') {
      const [x, y] = bl.mid, rot = Math.atan2(y - cy, x - cx) + Math.PI / 2;
      tryPlace(x, y, 3.2, 1.8, rot, bl.pts, 'temple', 'slate') ?? tryPlace(x, y, 2.4, 1.4, rot, bl.pts, 'temple', 'slate');
      fillEdges(bl, [0.6, 0.9], () => 'house');
      continue;
    }
    if (role === 'market') {
      for (let i = 0; i < 6; i++) { const p = randomIn(r, bl.pts); if (p && occupied.free(p[0], p[1])) { b.stamp('market_stall', p[0], p[1], rrange(r, -0.3, 0.3), 0.6); occupied.disc(p[0], p[1], 0.7); } }
      fillEdges(bl, [0.6, 0.9], () => (r() < 0.4 ? 'shop' : 'house'));
      continue;
    }
    const outer = bl.band / Math.max(1, rings.length - 2);
    fillEdges(bl, outer > 0.7 ? [0.55, 0.75] : [0.65, 0.9], () => (r() < 0.06 ? 'tavern' : r() < 0.08 ? 'shop' : r() < 0.03 ? 'warehouse' : 'house'));
    // big inner blocks get a second row of houses or a garden
    if (bl.area > 22 && r() < 0.5 + params.density * 0.12) {
      const inner = shrink(bl.pts, 1.5);
      if (inner) fillEdges({ ...bl, pts: inner }, [0.6, 0.9], () => 'house', 0.05);
    } else if (r() < 0.5) { const p = randomIn(r, bl.pts); if (p && occupied.free(p[0], p[1])) { b.stamp(pick(r, ['tree', 'bush', 'fruit_tree']), p[0], p[1], r() * 6.28, 0.5); } }
  }

  // ---- walls with gates where the main streets leave the city
  const wallR = edgeR;
  if (params.walls) {
    const gates = radials.map((_, i) => angleAt(i, wallR)).map((a) => ((a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)).sort((a, c2) => a - c2);
    const gateHalf = 1.6 / wallR;
    for (let g = 0; g < gates.length; g++) {
      const a0 = gates[g] + gateHalf, a1 = (g + 1 < gates.length ? gates[g + 1] : gates[0] + Math.PI * 2) - gateHalf;
      const pts: P[] = [];
      const steps = Math.max(2, Math.round(((a1 - a0) * wallR) / 3.2));
      for (let j = 0; j <= steps; j++) { const th = a0 + ((a1 - a0) * j) / steps; pts.push(polar(wallR * (1 + 0.03 * Math.sin(th * 3 + seedN)), th)); }
      // walls stop at the water's edge
      let run: P[] = [];
      const flush = () => { if (run.length > 1) doc.paths.push({ id: uid(), kind: 'citywall', pts: run.flatMap((p) => [p[0] * CELL, p[1] * CELL]), width: 26 }); run = []; };
      for (const p of pts) { if (wet(p[0], p[1], 0.4) || !inMap(p, 0.4)) flush(); else run.push(p); }
      flush();
      for (const p of pts) occupied.disc(p[0], p[1], 1.0);
    }
  }

  // ---- bridges and docks
  if (params.water === 'river') {
    for (const st of streetPts) {
      for (let i = 1; i < st.pts.length; i++) {
        const a = st.pts[i - 1], c2 = st.pts[i];
        if (distRiver(c2[0], c2[1]) < 0.5 && st.w >= 0.9) { b.stamp('bridge_stone', c2[0], c2[1], Math.atan2(c2[1] - a[1], c2[0] - a[0]) - Math.PI / 2, 0.75); break; }
      }
    }
  }
  if (params.water === 'coast') {
    let docks = 0;
    for (let k2 = 0; k2 < 60 && docks < 4 + params.size; k2++) {
      const th = r() * Math.PI * 2, rad = rrange(r, cityR * 0.4, cityR * 1.1), [x, y] = polar(rad, th);
      if (!inMap([x, y], 2) || Math.abs(shore(x, y) - 0.4) > 0.5) continue;
      const rot = Math.atan2(towardSea[1], towardSea[0]) - Math.PI / 2;
      b.stamp('dock', x + towardSea[0] * 1.6, y + towardSea[1] * 1.6, rot, 0.8);
      if (r() < 0.7) b.stamp(pick(r, ['sailboat', 'rowboat', 'merchant_ship']), x + towardSea[0] * 3.6 + rrange(r, -1, 1), y + towardSea[1] * 3.6, rot, r() < 0.3 ? 0.6 : 0.8);
      tryPlace(x - towardSea[0] * 1.2, y - towardSea[1] * 1.2, 1.6, 1.1, rot, null, 'warehouse', 'wood');
      docks++;
    }
  }

  // ---- plaza dressing
  b.stamp(r() < 0.5 ? 'town_fountain' : 'hero_statue', cx, cy, 0, r() < 0.5 ? 0.9 : 0.7);
  for (let i = 0; i < 5; i++) { const a = r() * Math.PI * 2, d = rrange(r, plazaR * 0.45, plazaR * 0.8); b.stamp(pick(r, ['market_stall', 'fruit_stall', 'market_stall']), cx + Math.cos(a) * d, cy + Math.sin(a) * d, a + Math.PI / 2, 0.6); }

  // ---- countryside: farms along the roads, fields and trees
  for (let i = 0; i < nMain; i++) {
    for (let rad = wallR + 2; rad < Math.max(C, R) * 0.75; rad += rrange(r, 2.5, 4.5)) {
      const th = angleAt(i, rad), side = r() < 0.5 ? 1 : -1, off = 1.5;
      const [x, y] = polar(rad, th), x2 = x + Math.cos(th + Math.PI / 2) * off * side, y2 = y + Math.sin(th + Math.PI / 2) * off * side;
      if (!inMap([x2, y2], 1.5)) continue;
      if (r() < 0.55) tryPlace(x2, y2, rrange(r, 0.8, 1.2), rrange(r, 0.6, 0.9), th, null, 'house', 'thatch');
      else if (r() < 0.5 && occupied.free(x2 + Math.cos(th + Math.PI / 2) * side * 2, y2 + Math.sin(th + Math.PI / 2) * side * 2) && !wet(x2 + Math.cos(th + Math.PI / 2) * side * 2, y2 + Math.sin(th + Math.PI / 2) * side * 2, 1)) b.stamp('wheat', x2 + Math.cos(th + Math.PI / 2) * side * 2, y2 + Math.sin(th + Math.PI / 2) * side * 2, th, 1);
    }
  }
  for (let i = 0; i < C * R * 0.03; i++) {
    const x = rrange(r, 0.5, C - 0.5), y = rrange(r, 0.5, R - 0.5);
    if (radOf(x, y) < wallR + 1.5 || wet(x, y, 0.5) || !occupied.free(x, y)) continue;
    b.stamp(pick(r, ['tree', 'tree', 'pine', 'bush', 'birch']), x, y, r() * 6.28, rrange(r, 0.6, 1));
    occupied.disc(x, y, 0.7);
  }

  // ---- names: taverns, districts, streets, the city itself
  const label = (text: string, x: number, y: number, size: number, opts: Partial<Label> = {}) => {
    const l = b.label(text, x, y, size, false);
    Object.assign(l, { font: 'IM Fell English', color: '#2a1e14', stroke: 'rgba(244,236,216,0.9)', bold: false }, opts);
    return l;
  };
  let taverns = 0;
  for (const bd of doc.buildings) if (bd.kind === 'tavern') {
    bd.name = tavernName(r);
    label(bd.name, bd.x / CELL, bd.y / CELL + 0.8, 24, { italic: true });
    taverns++;
  }
  const districtNames = [t('Market Ward'), t('Old Town'), t('Temple Quarter'), t('Craftsmen’s Row'), t('Noble Quarter'), t('Poor Quarter'), t('Tanners’ Lane'), t('Lantern Ward')];
  if (params.water === 'coast') districtNames.splice(3, 0, t('The Docks'));
  let districts = 0;
  for (let i = 0; i < nMain && districts < districtNames.length; i += 2) {
    const k = Math.max(1, Math.floor((rings.length - 1) * 0.6)), rad = (rings[Math.min(k, rings.length - 1)] + rings[Math.max(0, k - 1)]) / 2;
    const th = (angleAt(i, rad) + angleAt(i + 1, rad) + (angleAt(i + 1, rad) < angleAt(i, rad) ? Math.PI * 2 : 0)) / 2;
    const [x, y] = polar(rad, th);
    if (!inMap([x, y], 2) || wet(x, y) || doc.labels.some((l) => Math.abs(l.x / CELL - x) < 4.5 && Math.abs(l.y / CELL - y) < 1.5)) continue;
    label(districtNames[districts++].toUpperCase(), x, y, 52, { font: 'Cinzel', color: 'rgba(60,30,20,0.62)', stroke: 'rgba(244,236,216,0.55)', bold: true });
  }
  // main streets get names along their direction
  for (let i = 0; i < nMain; i++) {
    const rad = (plazaR + (rings[1] ?? plazaR + 4)) / 2 + 1.5, th = angleAt(i, rad), [x, y] = polar(rad, th);
    if (!inMap([x, y], 1.5)) continue;
    let rot = th; if (Math.cos(rot) < 0) rot += Math.PI;
    label(t('{name} Street', { name: fantasyName(r) }), x, y, 24, { rot, color: '#3a2a1a' });
  }
  label(name.toUpperCase(), cx, Math.max(1, cy - edgeR - 1.6), 96, { font: 'Cinzel', bold: true, color: '#2a1e14' });

  for (const k2 of rt.engine.masks.keys()) rt.engine.changed.add(k2);
  rt.fog.fillAll();
  rt.engine.invalidateAll();
  return { buildings: doc.buildings.length, districts, taverns, name };
}

// ------------------------------------------------------------------ geometry
function segDist(x: number, y: number, a: P, b: P) {
  const dx = b[0] - a[0], dy = b[1] - a[1], l2 = dx * dx + dy * dy;
  const k = l2 ? clamp(((x - a[0]) * dx + (y - a[1]) * dy) / l2, 0, 1) : 0;
  return Math.hypot(x - (a[0] + dx * k), y - (a[1] + dy * k));
}
function rect(x: number, y: number, w: number, h: number, rot: number): P[] {
  const c = Math.cos(rot), s = Math.sin(rot);
  return ([[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]] as const).map(([u, v]) => [x + u * c - v * s, y + u * s + v * c] as P);
}
function centroid(pts: P[]): P { let x = 0, y = 0; for (const p of pts) { x += p[0]; y += p[1]; } return [x / pts.length, y / pts.length]; }
/** Move every vertex towards the centroid by d (good enough for the convex-ish blocks). */
function shrink(pts: P[], d: number): P[] | null {
  const [mx, my] = centroid(pts);
  const out = pts.map(([x, y]) => { const l = Math.hypot(x - mx, y - my); return l <= d ? null : [mx + ((x - mx) * (l - d)) / l, my + ((y - my) * (l - d)) / l] as P; });
  return out.every(Boolean) ? (out as P[]) : null;
}
function randomIn(r: Rng, pts: P[]): P | null {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [x, y] of pts) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  for (let i = 0; i < 20; i++) { const x = rrange(r, x0, x1), y = rrange(r, y0, y1); if (pointInPoly(x, y, pts.flat())) return [x, y]; }
  return null;
}

/** Occupancy raster used to keep houses, streets and walls from overlapping. */
class Grid {
  w: number; h: number; k: number; a: Uint8Array;
  constructor(C: number, R: number, k: number) { this.k = k; this.w = Math.ceil(C * k); this.h = Math.ceil(R * k); this.a = new Uint8Array(this.w * this.h); }
  private at(x: number, y: number) { const X = Math.floor(x * this.k), Y = Math.floor(y * this.k); return X >= 0 && Y >= 0 && X < this.w && Y < this.h ? Y * this.w + X : -1; }
  free(x: number, y: number) { const i = this.at(x, y); return i < 0 || !this.a[i]; }
  disc(x: number, y: number, rad: number) { for (let yy = y - rad; yy <= y + rad; yy += 1 / this.k) for (let xx = x - rad; xx <= x + rad; xx += 1 / this.k) if (Math.hypot(xx - x, yy - y) <= rad) { const i = this.at(xx, yy); if (i >= 0) this.a[i] = 1; } }
  line(a: P, b: P, rad: number) { const n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) * this.k); for (let j = 0; j <= n; j++) this.disc(a[0] + ((b[0] - a[0]) * j) / n, a[1] + ((b[1] - a[1]) * j) / n, rad); }
  private cells(c: P[], fn: (i: number) => boolean | void) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const [x, y] of c) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
    const flat = c.flat();
    for (let y = y0; y <= y1; y += 1 / this.k) for (let x = x0; x <= x1; x += 1 / this.k) {
      if (!pointInPoly(x, y, flat)) continue;
      const i = this.at(x, y); if (i >= 0 && fn(i) === false) return false;
    }
    return true;
  }
  freeRect(c: P[]) { return this.cells(c, (i) => !this.a[i]); }
  fillRect(c: P[]) { this.cells(c, (i) => { this.a[i] = 1; }); }
}
