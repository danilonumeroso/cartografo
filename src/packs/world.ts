import { t } from '../i18n';
import {
  at, ball, blob, C2D, circ, clip, ell, flame, fs, glow, GOLD, GOLD_D, GOLD_L, INK, lin, line, pick, poly, radial, rect, rrange, rrect,
  shade, shadow, skull, sparkle, StampDef, st, starPath, TAU,
} from '../art';
import type { Rng } from '../util';

/*
 * World-map icons, drawn in the classic three-quarter view of fantasy maps:
 * light from the left, ink outlines, a soft shadow falling to the lower right.
 * Sizes are in map cells (one cell is a hex/square of the overland grid).
 */

const ROCK = '#9a8f7c', ROCK_D = '#5f5648', SNOW = '#f4f7fa';
const ROOFS = ['#b0503a', '#8a3a2a', '#4a5a7a', '#6a4a8a', '#3a6a4a'];
const WALL_C = '#e6dcc4';

/** One mountain peak with a lit left face, a shaded right face and an optional snow cap. */
export function peak(c: C2D, r: Rng, x: number, y: number, w: number, h: number, snow: boolean, col = ROCK) {
  const tipX = x + rrange(r, -w * 0.08, w * 0.08), tipY = y - h;
  const L = [x - w / 2, y], Rr = [x + w / 2, y];
  shadow(c, true, 6, 4, 3, 0.35);
  poly(c, [L[0], L[1], tipX, tipY, Rr[0], Rr[1]]); c.fillStyle = shade(col, -0.25); c.fill();
  shadow(c, false);
  // lit face: from the tip down a ridge that wanders to the base
  const ridge: number[] = [tipX, tipY];
  const steps = 4;
  for (let i = 1; i <= steps; i++) { const k = i / steps; ridge.push(tipX + (x + w * 0.08 - tipX) * k + rrange(r, -w * 0.06, w * 0.06), tipY + h * k); }
  poly(c, [L[0], L[1], ...ridge]); c.fillStyle = lin(c, L[0], y, tipX, tipY, [[0, shade(col, 0.05)], [1, shade(col, 0.32)]]); c.fill();
  poly(c, [...ridge, Rr[0], Rr[1]]); c.fillStyle = lin(c, Rr[0], y, tipX, tipY, [[0, shade(col, -0.45)], [1, shade(col, -0.2)]]); c.fill();
  // hatching on the dark face
  for (let i = 1; i < 6; i++) { const k = i / 6; line(c, tipX + (Rr[0] - tipX) * k * 0.9, tipY + h * k * 0.9, tipX + (Rr[0] - tipX) * k * 0.6 + w * 0.05, y - 2, 'rgba(30,25,20,0.35)', 1); }
  if (snow) {
    const sh = h * rrange(r, 0.28, 0.38);
    const sl = tipX - (tipX - L[0]) * (sh / h), sr = tipX + (Rr[0] - tipX) * (sh / h);
    c.beginPath(); c.moveTo(tipX, tipY); c.lineTo(sl, tipY + sh);
    for (let i = 1; i <= 4; i++) { const k = i / 4; c.lineTo(sl + (sr - sl) * k - w * 0.03, tipY + sh + (i % 2 ? -h * 0.08 : h * 0.04)); }
    c.lineTo(sr, tipY + sh); c.closePath();
    c.fillStyle = lin(c, sl, 0, sr, 0, [[0, SNOW], [0.55, SNOW], [0.56, '#c8d4e0'], [1, '#aebccc']]); c.fill();
  }
  poly(c, [L[0], L[1], tipX, tipY, Rr[0], Rr[1]], false); st(c, INK, 2);
  c.beginPath(); c.moveTo(ridge[0], ridge[1]); for (let i = 2; i < ridge.length; i += 2) c.lineTo(ridge[i], ridge[i + 1]); st(c, 'rgba(28,21,16,0.7)', 1.2);
}
/** Rounded hill with a few hatch strokes. */
function hill(c: C2D, x: number, y: number, w: number, h: number, col = '#9aae6a') {
  shadow(c, true, 5, 3, 2, 0.3);
  c.beginPath(); c.moveTo(x - w / 2, y); c.bezierCurveTo(x - w * 0.35, y - h, x + w * 0.3, y - h, x + w / 2, y); c.closePath();
  c.fillStyle = lin(c, x - w / 2, y - h, x + w / 2, y, [[0, shade(col, 0.2)], [1, shade(col, -0.3)]]); c.fill();
  shadow(c, false);
  c.beginPath(); c.moveTo(x - w / 2, y); c.bezierCurveTo(x - w * 0.35, y - h, x + w * 0.3, y - h, x + w / 2, y); st(c, INK, 1.8);
  for (let i = 0; i < 3; i++) { const k = 0.25 + i * 0.18; line(c, x + w * k - w * 0.05, y - h * (0.55 - i * 0.12), x + w * k + w * 0.02, y - 2, 'rgba(30,40,20,0.4)', 1); }
}
/** Lollipop tree: trunk plus a round crown, lit from the left. */
function roundTree(c: C2D, x: number, y: number, s: number, col: string) {
  line(c, x, y, x, y - s * 0.45, '#3a2614', s * 0.12 + 1);
  shadow(c, true, 3, 2, 2, 0.3);
  circ(c, x, y - s * 0.75, s * 0.42); fs(c, radial(c, x - s * 0.15, y - s * 0.9, s * 0.5, shade(col, 0.35), shade(col, -0.3), 0), 1.4);
  shadow(c, false);
  c.beginPath(); c.arc(x - s * 0.1, y - s * 0.82, s * 0.24, Math.PI * 1.1, Math.PI * 1.7); st(c, 'rgba(255,255,255,0.35)', 1);
}
function pineTree(c: C2D, x: number, y: number, s: number, col: string, snow = false) {
  line(c, x, y, x, y - s * 0.2, '#3a2614', s * 0.1 + 1);
  shadow(c, true, 3, 2, 2, 0.3);
  for (let k = 0; k < 3; k++) {
    const yy = y - s * 0.15 - k * s * 0.3, ww = s * (0.42 - k * 0.1);
    poly(c, [x - ww, yy, x, yy - s * 0.48, x + ww, yy]); fs(c, lin(c, x - ww, 0, x + ww, 0, [[0, shade(col, 0.25)], [0.5, col], [1, shade(col, -0.35)]]), 1.2);
    if (snow) { poly(c, [x - ww * 0.4, yy - s * 0.3, x, yy - s * 0.48, x + ww * 0.3, yy - s * 0.32]); c.fillStyle = SNOW; c.fill(); }
    shadow(c, false);
  }
}
function palm(c: C2D, x: number, y: number, s: number) {
  c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + s * 0.15, y - s * 0.4, x + s * 0.05, y - s * 0.8); st(c, INK, s * 0.1 + 2); st(c, '#8a6a3a', s * 0.1);
  for (let i = 0; i < 6; i++) { const a = -Math.PI / 2 + (i - 2.5) * 0.55; c.beginPath(); c.moveTo(x + s * 0.05, y - s * 0.8); c.quadraticCurveTo(x + s * 0.05 + Math.cos(a) * s * 0.3, y - s * 0.8 + Math.sin(a) * s * 0.3 - s * 0.05, x + s * 0.05 + Math.cos(a) * s * 0.5, y - s * 0.8 + Math.sin(a) * s * 0.4 + s * 0.12); st(c, INK, 4); st(c, '#3f8a3a', 2.6); }
}
/** Gabled house in three-quarter view. */
function house(c: C2D, x: number, y: number, s: number, roof: string) {
  const w = s, h = s * 0.55;
  shadow(c, true, 3, 2, 2, 0.35);
  rect(c, x - w / 2, y - h, w, h); fs(c, lin(c, x - w / 2, 0, x + w / 2, 0, [[0, WALL_C], [1, shade(WALL_C, -0.25)]]), 1.3);
  shadow(c, false);
  poly(c, [x - w / 2 - s * 0.08, y - h, x - w * 0.2, y - h - s * 0.45, x + w * 0.2, y - h - s * 0.45, x + w / 2 + s * 0.08, y - h]); fs(c, lin(c, 0, y - h - s * 0.45, 0, y - h, [[0, shade(roof, 0.15)], [1, shade(roof, -0.2)]]), 1.3);
  rect(c, x - s * 0.08, y - h * 0.55, s * 0.16, h * 0.55); c.fillStyle = '#4a3020'; c.fill();
}
/** Round tower with a conical roof. */
function tower(c: C2D, x: number, y: number, s: number, h: number, roof: string, flag = false) {
  shadow(c, true, 4, 3, 2, 0.35);
  rect(c, x - s / 2, y - h, s, h); fs(c, lin(c, x - s / 2, 0, x + s / 2, 0, [[0, '#ece4d0'], [0.4, '#d8ccb0'], [1, '#9a8e76']]), 1.4);
  shadow(c, false);
  ell(c, x, y, s / 2, s * 0.15); st(c, INK, 1.4);
  poly(c, [x - s * 0.62, y - h, x, y - h - s * 1.2, x + s * 0.62, y - h]); fs(c, lin(c, x - s * 0.6, 0, x + s * 0.6, 0, [[0, shade(roof, 0.2)], [1, shade(roof, -0.35)]]), 1.4);
  rect(c, x - s * 0.1, y - h * 0.6, s * 0.2, s * 0.3); c.fillStyle = '#2a1a10'; c.fill();
  if (flag) { line(c, x, y - h - s * 1.2, x, y - h - s * 1.9, INK, 1.4); poly(c, [x, y - h - s * 1.9, x + s * 0.7, y - h - s * 1.72, x, y - h - s * 1.55]); fs(c, '#c8302a', 1); }
}
/** Crenellated wall segment. */
function cityWall(c: C2D, x0: number, x1: number, y: number, h: number) {
  rect(c, x0, y - h, x1 - x0, h); fs(c, lin(c, 0, y - h, 0, y, [[0, '#ddd2b8'], [1, '#a89c80']]), 1.4);
  for (let x = x0; x < x1 - 4; x += 8) { rect(c, x, y - h - 4, 5, 4); fs(c, '#d8ccb0', 1); }
}
function waveMarks(c: C2D, r: Rng, w: number, h: number, n: number) {
  for (let i = 0; i < n; i++) { const x = rrange(r, -w * 0.45, w * 0.45), y = rrange(r, -h * 0.4, h * 0.45); c.beginPath(); c.moveTo(x - 9, y); c.quadraticCurveTo(x - 4, y - 5, x, y); c.quadraticCurveTo(x + 4, y - 5, x + 9, y); st(c, 'rgba(240,250,255,0.75)', 1.6); }
}

const W = (def: Omit<StampDef, 'world'>): StampDef => ({ ...def, world: true });

export const WORLD: StampDef[] = [
  // ------------------------------------------------ terrain
  W({ id: 'w_mountain', name: t('Mountain'), cat: 'w_terrain', w: 1.4, h: 1.2, layer: 1, tags: 'mountain peak', draw: (c, r, w, h) => peak(c, r, 0, h * 0.4, w * 0.85, h * 0.85, r() < 0.4) }),
  W({ id: 'w_mountains', name: t('Mountain range'), cat: 'w_terrain', w: 2.6, h: 1.6, layer: 1, tags: 'mountains range ridge peaks', draw: (c, r, w, h) => {
    const n = 4 + Math.floor(r() * 2), snow = r() < 0.5;
    const ps = Array.from({ length: n }, (_, i) => ({ x: -w * 0.38 + (i / (n - 1)) * w * 0.76 + rrange(r, -8, 8), y: h * 0.42 - (i % 2) * h * 0.14, s: rrange(r, 0.75, 1.15) }));
    ps.sort((a, b) => a.y - b.y);
    for (const p of ps) peak(c, r, p.x, p.y, w * 0.34 * p.s, h * 0.68 * p.s, snow && p.s > 0.9);
  } }),
  W({ id: 'w_snowpeaks', name: t('Snowy peaks'), cat: 'w_terrain', w: 2.2, h: 1.6, layer: 1, tags: 'snow mountains peaks alpine', draw: (c, r, w, h) => {
    const ps = [[-0.22, 0.32, 0.9], [0.2, 0.36, 0.85], [0, 0.44, 1.15]];
    for (const [x, y, s] of ps) peak(c, r, x * w, y * h, w * 0.42 * s, h * 0.75 * s, true, '#a8a4a0');
  } }),
  W({ id: 'w_hills', name: t('Hills'), cat: 'w_terrain', w: 1.6, h: 0.9, layer: 1, tags: 'hills downs', draw: (c, r, w, h) => {
    const col = pick(r, ['#9aae6a', '#a8a070', '#8ea060']);
    hill(c, -w * 0.18, h * 0.28, w * 0.5, h * 0.55, col); hill(c, w * 0.18, h * 0.38, w * 0.56, h * 0.6, col);
  } }),
  W({ id: 'w_volcano', name: t('Volcano'), cat: 'w_terrain', w: 1.8, h: 1.8, layer: 1, light: { radius: 3, color: '#ff7a3a', intensity: 0.6 }, tags: 'volcano lava fire mountain', draw: (c, r, w, h) => {
    const y = h * 0.38, bw = w * 0.85, ht = h * 0.62, top = w * 0.16;
    for (let i = 0; i < 5; i++) { blob(c, r, w * rrange(r, 0.08, 0.14), 8, 0.3, rrange(r, -w * 0.1, w * 0.15), -h * 0.32 - i * h * 0.08); c.fillStyle = `rgba(90,85,85,${0.5 - i * 0.07})`; c.fill(); }
    shadow(c, true, 6, 4, 3, 0.35);
    poly(c, [-bw / 2, y, -top, y - ht, top, y - ht, bw / 2, y]); fs(c, lin(c, -bw / 2, 0, bw / 2, 0, [[0, '#7a6a62'], [0.5, '#5a4c46'], [1, '#2e2624']]), 2);
    shadow(c, false);
    ell(c, 0, y - ht, top, top * 0.32); fs(c, radial(c, 0, y - ht, top, '#ffd060', '#c8301a', 0), 1.4);
    for (let i = 0; i < 3; i++) { const x0 = rrange(r, -top * 0.6, top * 0.6); c.beginPath(); c.moveTo(x0, y - ht + 2); c.quadraticCurveTo(x0 + rrange(r, -20, 20), y - ht * 0.5, x0 + rrange(r, -30, 30), y - rrange(r, 4, ht * 0.4)); st(c, '#2a1008', 5); st(c, '#ff7a2a', 3); st(c, '#ffd060', 1); }
    glow(c, 0, y - ht, top * 1.6, '255,120,40', 0.5);
  } }),
  W({ id: 'w_forest', name: t('Forest'), cat: 'w_terrain', w: 1.4, h: 1.2, layer: 1, tags: 'forest woods trees', draw: (c, r, w, h) => {
    const n = 9, pts = Array.from({ length: n }, () => [rrange(r, -w * 0.36, w * 0.36), rrange(r, -h * 0.05, h * 0.42)] as [number, number]).sort((a, b) => a[1] - b[1]);
    for (const [x, y] of pts) roundTree(c, x, y, rrange(r, 22, 30), pick(r, ['#4f8a3a', '#5a9a40', '#3e7a32', '#6aa048']));
  } }),
  W({ id: 'w_pines', name: t('Pine forest'), cat: 'w_terrain', w: 1.4, h: 1.2, layer: 1, tags: 'pine forest conifer taiga trees', draw: (c, r, w, h) => {
    const snow = r() < 0.25, pts = Array.from({ length: 10 }, () => [rrange(r, -w * 0.36, w * 0.36), rrange(r, -h * 0.05, h * 0.42)] as [number, number]).sort((a, b) => a[1] - b[1]);
    for (const [x, y] of pts) pineTree(c, x, y, rrange(r, 26, 36), pick(r, ['#2e5a36', '#3a6a40', '#24502e']), snow);
  } }),
  W({ id: 'w_jungle', name: t('Jungle'), cat: 'w_terrain', w: 1.4, h: 1.2, layer: 1, tags: 'jungle rainforest palms tropical', draw: (c, r, w, h) => {
    const pts = Array.from({ length: 8 }, () => [rrange(r, -w * 0.36, w * 0.36), rrange(r, -h * 0.05, h * 0.42)] as [number, number]).sort((a, b) => a[1] - b[1]);
    for (const [x, y] of pts) r() < 0.5 ? palm(c, x, y, rrange(r, 30, 40)) : roundTree(c, x, y, rrange(r, 24, 32), pick(r, ['#2f7a32', '#3e8a3a', '#226a2a']));
  } }),
  W({ id: 'w_deadwood', name: t('Dead forest'), cat: 'w_terrain', w: 1.3, h: 1, layer: 1, tags: 'dead forest blighted haunted trees', draw: (c, r, w, h) => {
    for (let i = 0; i < 7; i++) {
      const x = rrange(r, -w * 0.36, w * 0.36), y = rrange(r, 0, h * 0.4), s = rrange(r, 24, 34);
      c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - s);
      for (let k = 0; k < 3; k++) { const yy = y - s * (0.45 + k * 0.18), d = (k % 2 ? 1 : -1) * s * 0.3; c.moveTo(x, yy); c.lineTo(x + d, yy - s * 0.2); }
      st(c, INK, 3.4); st(c, '#5a4a3e', 2);
    }
  } }),
  W({ id: 'w_swamp', name: t('Swamp'), cat: 'w_terrain', w: 1.3, h: 0.9, layer: 0, tags: 'swamp marsh bog reeds', draw: (c, r, w, h) => {
    for (let i = 0; i < 5; i++) { const x = rrange(r, -w * 0.35, w * 0.35), y = rrange(r, -h * 0.25, h * 0.3); ell(c, x, y, rrange(r, 10, 18), rrange(r, 3, 5)); fs(c, 'rgba(70,110,110,0.6)', 1, 'rgba(30,50,40,0.6)'); }
    for (let i = 0; i < 9; i++) { const x = rrange(r, -w * 0.38, w * 0.38), y = rrange(r, -h * 0.2, h * 0.38); for (let k = -2; k <= 2; k++) line(c, x, y, x + k * 3, y - rrange(r, 8, 14), '#4a5a2a', 1.4); }
  } }),
  W({ id: 'w_dunes', name: t('Dunes'), cat: 'w_terrain', w: 1.6, h: 0.9, layer: 0, tags: 'dunes desert sand', draw: (c, r, w, h) => {
    for (let i = 0; i < 4; i++) { const x = rrange(r, -w * 0.3, w * 0.25), y = -h * 0.25 + i * h * 0.17; c.beginPath(); c.moveTo(x - w * 0.18, y + 6); c.quadraticCurveTo(x, y - 10, x + w * 0.2, y + 5); st(c, 'rgba(120,80,40,0.7)', 1.8); c.beginPath(); c.moveTo(x, y - 3); c.quadraticCurveTo(x + w * 0.08, y + 2, x + w * 0.2, y + 5); st(c, 'rgba(160,110,60,0.4)', 4); }
  } }),
  W({ id: 'w_mesa', name: t('Mesa'), cat: 'w_terrain', w: 1.4, h: 1, layer: 1, tags: 'mesa butte plateau canyon rock', draw: (c, r, w, h) => {
    const y = h * 0.36, bw = w * 0.7, ht = h * 0.42;
    shadow(c, true, 5, 4, 3, 0.35); poly(c, [-bw / 2, y, -bw * 0.36, y - ht, bw * 0.3, y - ht, bw / 2, y]); fs(c, lin(c, -bw / 2, 0, bw / 2, 0, [[0, '#d0905a'], [1, '#7a4a2a']]), 1.8); shadow(c, false);
    ell(c, -bw * 0.03, y - ht, bw * 0.33, 6); fs(c, '#e0b07a', 1.4);
    for (let i = 1; i < 4; i++) line(c, -bw * 0.45 + i * 3, y - ht * (i / 4), bw * 0.45 - i * 3, y - ht * (i / 4), 'rgba(90,50,25,0.4)', 1.2);
    void r;
  } }),
  W({ id: 'w_cactus', name: t('Cacti'), cat: 'w_terrain', w: 0.9, h: 0.8, layer: 1, tags: 'cactus desert', draw: (c, r, w, h) => {
    for (let i = 0; i < 3; i++) { const x = rrange(r, -w * 0.3, w * 0.3), y = rrange(r, 0, h * 0.35), s = rrange(r, 22, 32); rrect(c, x - 4, y - s, 8, s, 4); fs(c, '#4a8a4a', 1.2); rrect(c, x - 12, y - s * 0.7, 6, s * 0.3, 3); fs(c, '#4a8a4a', 1); rrect(c, x + 6, y - s * 0.8, 6, s * 0.35, 3); fs(c, '#4a8a4a', 1); }
  } }),
  W({ id: 'w_sea_rocks', name: t('Sea rocks'), cat: 'w_sea', w: 1, h: 0.8, layer: 1, tags: 'rocks reef sea stacks', draw: (c, r, w, h) => {
    for (let i = 0; i < 4; i++) { const x = rrange(r, -w * 0.3, w * 0.3), y = rrange(r, -h * 0.05, h * 0.3); peak(c, r, x, y, rrange(r, 12, 22), rrange(r, 12, 22), false, '#8a847a'); ell(c, x, y + 1, 14, 4); st(c, 'rgba(240,250,255,0.8)', 1.4); }
  } }),
  // ------------------------------------------------ places
  W({ id: 'w_capital', name: t('Capital'), cat: 'w_places', w: 1.8, h: 1.6, layer: 1, tags: 'capital city walls castle kingdom', draw: (c, r, w, h) => {
    const base = h * 0.4;
    cityWall(c, -w * 0.4, w * 0.4, base, h * 0.16);
    for (let i = 0; i < 5; i++) house(c, -w * 0.3 + i * w * 0.15, base - h * 0.16 - 2 + (i % 2) * 4, w * 0.11, pick(r, ROOFS));
    tower(c, 0, base - h * 0.2, w * 0.14, h * 0.4, '#3a4a7a', true);
    for (const s of [-1, 1]) tower(c, s * w * 0.4, base, w * 0.1, h * 0.3, '#8a3a2a', s > 0);
    cityWall(c, -w * 0.4, w * 0.4, base + 2, h * 0.08);
    starPath(c, 0, base + h * 0.12, 5, 7, 3); fs(c, GOLD_L, 1);
  } }),
  W({ id: 'w_city', name: t('City'), cat: 'w_places', w: 1.4, h: 1.2, layer: 1, tags: 'city walls town', draw: (c, r, w, h) => {
    const base = h * 0.38;
    cityWall(c, -w * 0.36, w * 0.36, base, h * 0.14);
    for (let i = 0; i < 4; i++) house(c, -w * 0.24 + i * w * 0.16, base - h * 0.14 - 2 + (i % 2) * 4, w * 0.13, pick(r, ROOFS));
    tower(c, w * 0.06, base - h * 0.14, w * 0.1, h * 0.3, pick(r, ROOFS));
    for (const s of [-1, 1]) tower(c, s * w * 0.36, base, w * 0.09, h * 0.26, '#8a3a2a');
  } }),
  W({ id: 'w_town', name: t('Town'), cat: 'w_places', w: 1.1, h: 0.9, layer: 1, tags: 'town settlement', draw: (c, r, w, h) => {
    const pts = [[-0.28, 0.3], [0.05, 0.36], [0.3, 0.28], [-0.12, 0.12], [0.18, 0.1]];
    tower(c, -w * 0.02, h * 0.1, w * 0.1, h * 0.3, '#4a5a7a');
    for (const [x, y] of pts.sort((a, b) => a[1] - b[1])) house(c, x * w, y * h, w * 0.2, pick(r, ROOFS));
  } }),
  W({ id: 'w_village', name: t('Village'), cat: 'w_places', w: 0.9, h: 0.7, layer: 1, tags: 'village hamlet', draw: (c, r, w, h) => {
    for (const [x, y] of [[-0.22, 0.22], [0.2, 0.18], [0, 0.36]]) house(c, x * w, y * h, w * 0.26, pick(r, ['#b08a4a', '#a8783a', '#b0503a']));
  } }),
  W({ id: 'w_castle', name: t('Castle'), cat: 'w_places', w: 1.3, h: 1.3, layer: 1, tags: 'castle fortress keep stronghold', draw: (c, r, w, h) => {
    const base = h * 0.4, roof = pick(r, ['#3a4a7a', '#8a3a2a', '#4a4a4a']);
    shadow(c, true, 5, 3, 2, 0.35); rect(c, -w * 0.18, base - h * 0.5, w * 0.36, h * 0.5); fs(c, lin(c, -w * 0.18, 0, w * 0.18, 0, [[0, '#e6dcc4'], [1, '#9a8e76']]), 1.6); shadow(c, false);
    for (let x = -w * 0.18; x < w * 0.16; x += 9) { rect(c, x, base - h * 0.5 - 6, 6, 6); fs(c, '#d8ccb0', 1); }
    rect(c, -6, base - h * 0.18, 12, h * 0.18); fs(c, '#2a1a10', 1.2);
    for (const s of [-1, 1]) tower(c, s * w * 0.3, base, w * 0.13, h * 0.42, roof, s < 0);
    cityWall(c, -w * 0.3, w * 0.3, base + 2, h * 0.1);
  } }),
  W({ id: 'w_tower', name: t('Lone tower'), cat: 'w_places', w: 0.6, h: 1, layer: 1, tags: 'tower wizard watchtower', draw: (c, r, w, h) => tower(c, 0, h * 0.4, w * 0.3, h * 0.55, pick(r, ['#5a3a8a', '#3a4a7a', '#8a3a2a']), true) }),
  W({ id: 'w_ruins', name: t('Ruins'), cat: 'w_places', w: 1.1, h: 0.8, layer: 1, tags: 'ruins ancient broken columns', draw: (c, r, w, h) => {
    rect(c, -w * 0.4, h * 0.3, w * 0.8, 6); fs(c, '#b8b0a0', 1.2);
    for (let i = 0; i < 5; i++) { const x = -w * 0.32 + i * w * 0.16, ht = h * rrange(r, 0.15, 0.5); rect(c, x - 5, h * 0.3 - ht, 10, ht); fs(c, lin(c, x - 5, 0, x + 5, 0, [[0, '#e8e0d0'], [1, '#9a9080']]), 1.2); poly(c, [x - 5, h * 0.3 - ht, x - 1, h * 0.3 - ht - 4, x + 5, h * 0.3 - ht + 2]); c.fillStyle = '#e8e0d0'; c.fill(); }
    for (let i = 0; i < 4; i++) { rect(c, rrange(r, -w * 0.4, w * 0.3), h * rrange(r, 0.32, 0.42), 12, 5); fs(c, '#c8c0b0', 1); }
  } }),
  W({ id: 'w_temple', name: t('Temple'), cat: 'w_places', w: 1.1, h: 0.9, layer: 1, tags: 'temple shrine monastery holy', draw: (c, r, w, h) => {
    const base = h * 0.36, ww = w * 0.7;
    rect(c, -ww / 2 - 4, base - 4, ww + 8, 6); fs(c, '#d8d0c0', 1.2);
    for (let i = 0; i < 5; i++) { const x = -ww / 2 + 4 + i * (ww - 8) / 4; rect(c, x - 3, base - h * 0.32, 6, h * 0.28); fs(c, '#f0e8d8', 1); }
    poly(c, [-ww / 2 - 6, base - h * 0.32, 0, base - h * 0.55, ww / 2 + 6, base - h * 0.32]); fs(c, lin(c, 0, base - h * 0.55, 0, base - h * 0.32, [[0, '#f4ece0'], [1, '#c8bca8']]), 1.4);
    circ(c, 0, base - h * 0.4, 4); fs(c, GOLD, 1);
    void r;
  } }),
  W({ id: 'w_port', name: t('Port'), cat: 'w_places', w: 1.4, h: 1, layer: 1, tags: 'port harbor docks town', draw: (c, r, w, h) => {
    for (const [x, y] of [[-0.3, 0.1], [-0.08, 0.04], [-0.2, 0.28]]) house(c, x * w, y * h, w * 0.16, pick(r, ROOFS));
    rect(c, w * 0.02, h * 0.18, w * 0.42, 7); fs(c, '#8a6038', 1.2);
    for (let i = 0; i < 4; i++) line(c, w * 0.06 + i * w * 0.12, h * 0.18 + 7, w * 0.06 + i * w * 0.12, h * 0.18 + 14, '#4a2e18', 2);
    at(c, w * 0.3, h * 0.38, 0, () => { c.beginPath(); c.moveTo(-14, 0); c.quadraticCurveTo(0, 8, 14, 0); c.lineTo(10, -4); c.lineTo(-10, -4); c.closePath(); fs(c, '#6a4024', 1.2); line(c, 0, -4, 0, -24, INK, 1.4); poly(c, [1, -23, 12, -10, 1, -8]); fs(c, '#f0e6d0', 1); });
    waveMarks(c, r, w * 0.5, h * 0.3, 2);
  } }),
  W({ id: 'w_mine', name: t('Mine'), cat: 'w_places', w: 1, h: 0.8, layer: 1, tags: 'mine dwarves shaft ore', draw: (c, r, w, h) => {
    hill(c, 0, h * 0.36, w * 0.8, h * 0.6, '#a09070');
    rrect(c, -w * 0.12, h * 0.36 - h * 0.28, w * 0.24, h * 0.28, [10, 10, 0, 0]); fs(c, '#1a120c', 1.4);
    line(c, -w * 0.14, h * 0.36 - h * 0.26, w * 0.14, h * 0.36 - h * 0.26, '#6a4428', 4);
    for (const s of [-1, 1]) line(c, s * w * 0.12, h * 0.36, s * w * 0.12, h * 0.36 - h * 0.26, '#6a4428', 3.4);
    at(c, w * 0.3, h * 0.32, 0, () => { rrect(c, -8, -8, 16, 8, 2); fs(c, '#5a5e64', 1); for (const s of [-1, 1]) { circ(c, s * 5, 1, 2.5); fs(c, '#2a2a2a', 0.8); } });
    void r;
  } }),
  W({ id: 'w_cave', name: t('Cave entrance'), cat: 'w_places', w: 1, h: 0.8, layer: 1, tags: 'cave dungeon entrance lair', draw: (c, r, w, h) => {
    peak(c, r, 0, h * 0.38, w * 0.8, h * 0.6, false, '#8a8070');
    ell(c, 0, h * 0.3, w * 0.13, h * 0.13); fs(c, '#0a0806', 1.4);
  } }),
  W({ id: 'w_camp', name: t('Camp'), cat: 'w_places', w: 1, h: 0.7, layer: 1, light: { radius: 1.5, color: '#ffa04a', intensity: 0.5 }, tags: 'camp tents nomads bandits', draw: (c, r, w, h) => {
    for (const [x, y] of [[-0.24, 0.26], [0.22, 0.2]]) { const col = pick(r, ['#c8b48a', '#8a6a4a', '#b05040']); shadow(c, true, 3, 2, 2, 0.35); poly(c, [x * w - 18, y * h, x * w, y * h - 22, x * w + 18, y * h]); fs(c, lin(c, x * w - 18, 0, x * w + 18, 0, [[0, shade(col, 0.15)], [1, shade(col, -0.3)]]), 1.4); shadow(c, false); poly(c, [x * w - 4, y * h, x * w, y * h - 10, x * w + 4, y * h]); c.fillStyle = '#2a1a10'; c.fill(); }
    flame(c, 0, h * 0.36, 5);
  } }),
  W({ id: 'w_lair', name: t('Monster lair'), cat: 'w_places', w: 1, h: 0.8, layer: 1, tags: 'lair monster danger skull dragon', draw: (c, r, w, h) => {
    for (let i = 0; i < 3; i++) peak(c, r, (i - 1) * w * 0.22, h * 0.36, w * 0.3, h * rrange(r, 0.3, 0.45), false, '#6a5e52');
    skull(c, 0, h * 0.18, 20, 0);
  } }),
  W({ id: 'w_portal', name: t('Ancient portal'), cat: 'w_places', w: 0.9, h: 1, layer: 1, light: { radius: 2, color: '#b07aff', intensity: 0.6 }, tags: 'portal gate arch magic', draw: (c, r, w, h) => {
    const base = h * 0.38;
    glow(c, 0, base - h * 0.28, w * 0.4, '170,110,255', 0.6);
    c.beginPath(); c.moveTo(-w * 0.25, base); c.lineTo(-w * 0.25, base - h * 0.4); c.arc(0, base - h * 0.4, w * 0.25, Math.PI, 0); c.lineTo(w * 0.25, base); st(c, INK, 11); st(c, '#9a9488', 8);
    ell(c, 0, base - h * 0.3, w * 0.16, h * 0.26); fs(c, radial(c, 0, base - h * 0.3, w * 0.2, '#f0e0ff', '#5a2a9a', 0), 0);
    sparkle(c, 0, base - h * 0.34, 5);
    void r;
  } }),
  W({ id: 'w_lighthouse', name: t('Lighthouse'), cat: 'w_places', w: 0.6, h: 1, layer: 1, light: { radius: 2.5, color: '#fff2c0', intensity: 0.6 }, tags: 'lighthouse beacon coast', draw: (c, r, w, h) => {
    const base = h * 0.4, s = w * 0.26;
    shadow(c, true, 4, 3, 2, 0.35); poly(c, [-s * 0.6, base, -s * 0.4, base - h * 0.55, s * 0.4, base - h * 0.55, s * 0.6, base]); fs(c, '#f0ece2', 1.4); shadow(c, false);
    clip(c, () => poly(c, [-s * 0.6, base, -s * 0.4, base - h * 0.55, s * 0.4, base - h * 0.55, s * 0.6, base]), () => { for (let k = 0; k < 3; k++) { rect(c, -s, base - h * (0.12 + k * 0.18), s * 2, h * 0.08); c.fillStyle = '#c8302a'; c.fill(); } });
    rect(c, -s * 0.45, base - h * 0.7, s * 0.9, h * 0.15); fs(c, '#fff4c0', 1.2);
    poly(c, [-s * 0.55, base - h * 0.7, 0, base - h * 0.82, s * 0.55, base - h * 0.7]); fs(c, '#2a2c30', 1.2);
    glow(c, 0, base - h * 0.62, w * 0.6, '255,240,180', 0.6);
    void r;
  } }),
  W({ id: 'w_stones', name: t('Standing stones'), cat: 'w_places', w: 1, h: 0.6, layer: 1, tags: 'standing stones henge druid', draw: (c, r, w, h) => {
    for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU, x = Math.cos(a) * w * 0.3, y = Math.sin(a) * h * 0.2 + h * 0.15, ht = rrange(r, 14, 22); rect(c, x - 4, y - ht, 8, ht); fs(c, lin(c, x - 4, 0, x + 4, 0, [[0, '#b8b2a6'], [1, '#6a655c']]), 1.2); }
  } }),
  W({ id: 'w_battlefield', name: t('Battlefield'), cat: 'w_places', w: 0.8, h: 0.8, layer: 1, tags: 'battle war crossed swords', draw: (c, r, w) => {
    for (const s of [-1, 1]) at(c, 0, 0, s * 0.8, () => { line(c, 0, -w * 0.32, 0, w * 0.22, INK, 6); line(c, 0, -w * 0.32, 0, w * 0.22, '#d8dce0', 3.6); line(c, -9, w * 0.16, 9, w * 0.16, INK, 5); line(c, -9, w * 0.16, 9, w * 0.16, GOLD, 3); line(c, 0, w * 0.18, 0, w * 0.3, '#5a3a22', 4); });
    void r;
  } }),
  // ------------------------------------------------ sea and decorations
  W({ id: 'w_ship', name: t('Ship'), cat: 'w_sea', w: 1, h: 0.9, layer: 1, tags: 'ship sail boat vessel', draw: (c, r, w, h) => {
    waveMarks(c, r, w, h * 0.4, 3);
    at(c, 0, h * 0.2, 0, () => {
      c.beginPath(); c.moveTo(-w * 0.34, -6); c.quadraticCurveTo(0, 14, w * 0.36, -8); c.lineTo(w * 0.28, -14); c.lineTo(-w * 0.28, -14); c.closePath(); fs(c, lin(c, 0, -14, 0, 10, [[0, '#8a5a32'], [1, '#4a2e18']]), 1.6);
      for (const [x, sh] of [[-w * 0.08, 0.6], [w * 0.12, 0.48]]) { line(c, x, -14, x, -14 - h * sh, INK, 2); c.beginPath(); c.moveTo(x - 2, -18 - h * sh * 0.1); c.quadraticCurveTo(x + w * 0.16, -14 - h * sh * 0.55, x - 2, -14 - h * sh * 0.95); c.closePath(); fs(c, '#f4ece0', 1.2); }
      poly(c, [-w * 0.08, -14 - h * 0.6, -w * 0.08 + 12, -14 - h * 0.56, -w * 0.08, -14 - h * 0.52]); fs(c, pick(r, ['#c8302a', '#2a5a9a', GOLD]), 0.8);
    });
  } }),
  W({ id: 'w_serpent', name: t('Sea serpent'), cat: 'w_sea', w: 1.8, h: 0.9, layer: 1, tags: 'sea serpent monster leviathan', draw: (c, r, w, h) => {
    const col = pick(r, ['#3a7a6a', '#4a6a8a', '#6a4a8a']);
    for (let i = 0; i < 3; i++) { const x = -w * 0.3 + i * w * 0.24, y = h * 0.22; c.beginPath(); c.arc(x, y, w * 0.08, Math.PI, 0); st(c, INK, 13); st(c, col, 10); for (let k = 0; k < 3; k++) { poly(c, [x - 6 + k * 6, y - w * 0.08 - 2, x - 3 + k * 6, y - w * 0.08 - 10, x + k * 6, y - w * 0.08 - 2]); c.fillStyle = shade(col, -0.3); c.fill(); } ell(c, x, y + 1, w * 0.1, 4); st(c, 'rgba(240,250,255,0.7)', 1.4); }
    at(c, w * 0.38, h * 0.0, 0, () => { c.beginPath(); c.moveTo(-14, h * 0.22); c.quadraticCurveTo(-10, -h * 0.2, 6, -h * 0.25); st(c, INK, 13); st(c, col, 10); ell(c, 10, -h * 0.25, 14, 9, -0.3); fs(c, col, 1.6); circ(c, 13, -h * 0.28, 2.2); c.fillStyle = '#f0e040'; c.fill(); poly(c, [20, -h * 0.22, 30, -h * 0.25, 22, -h * 0.18]); c.fillStyle = '#c83030'; c.fill(); });
  } }),
  W({ id: 'w_kraken', name: 'Kraken', cat: 'w_sea', w: 1.4, h: 1, layer: 1, tags: 'kraken tentacles monster sea octopus', draw: (c, r, w, h) => {
    for (let i = 0; i < 5; i++) {
      const x = -w * 0.36 + i * w * 0.18, y = h * 0.32, ht = h * rrange(r, 0.35, 0.6), d = rrange(r, -14, 14);
      c.beginPath(); c.moveTo(x, y); c.bezierCurveTo(x - 8, y - ht * 0.5, x + d + 10, y - ht * 0.8, x + d, y - ht); st(c, INK, 11); st(c, '#9a3a5a', 8);
      for (let k = 1; k < 4; k++) { circ(c, x + (d * k) / 4 - 2, y - (ht * k) / 4, 1.6); c.fillStyle = '#f0c0d0'; c.fill(); }
      ell(c, x, y + 1, 10, 3); st(c, 'rgba(240,250,255,0.75)', 1.4);
    }
  } }),
  W({ id: 'w_whirlpool', name: t('Whirlpool'), cat: 'w_sea', w: 1, h: 1, layer: 0, tags: 'whirlpool maelstrom vortex sea', draw: (c, r, w) => {
    c.beginPath(); for (let i = 0; i < 160; i++) { const a = i * 0.14, d = 2 + i * 0.26; i ? c.lineTo(Math.cos(a) * d, Math.sin(a) * d * 0.7) : c.moveTo(Math.cos(a) * d, Math.sin(a) * d * 0.7); } st(c, 'rgba(230,245,255,0.8)', 1.8);
    circ(c, 0, 0, 6); c.fillStyle = 'rgba(10,30,50,0.8)'; c.fill();
    void r; void w;
  } }),
  W({ id: 'w_iceberg', name: t('Icebergs'), cat: 'w_sea', w: 1, h: 0.8, layer: 1, tags: 'icebergs ice floes arctic', draw: (c, r, w, h) => {
    for (let i = 0; i < 3; i++) { const x = rrange(r, -w * 0.28, w * 0.28), y = rrange(r, 0, h * 0.3); peak(c, r, x, y, rrange(r, 18, 30), rrange(r, 14, 26), false, '#d8ecf6'); ell(c, x, y + 1, 16, 4); st(c, 'rgba(240,250,255,0.8)', 1.4); }
  } }),
  W({ id: 'w_compass', name: t('Compass rose'), cat: 'w_sea', w: 2, h: 2, layer: 2, tags: 'compass rose north directions', draw: (c, r, w) => {
    const R = w * 0.42;
    circ(c, 0, 0, R * 0.72); st(c, 'rgba(40,30,20,0.6)', 1.4); circ(c, 0, 0, R * 0.66); st(c, 'rgba(40,30,20,0.4)', 1);
    for (let i = 0; i < 32; i++) { const a = (i / 32) * TAU; line(c, Math.cos(a) * R * 0.66, Math.sin(a) * R * 0.66, Math.cos(a) * R * (i % 4 ? 0.7 : 0.74), Math.sin(a) * R * (i % 4 ? 0.7 : 0.74), 'rgba(40,30,20,0.6)', 1); }
    const point = (a: number, len: number, wd: number, lit: string, dark: string) => { const x = Math.cos(a) * len, y = Math.sin(a) * len, px = Math.cos(a + Math.PI / 2) * wd, py = Math.sin(a + Math.PI / 2) * wd; poly(c, [0, 0, px, py, x, y]); fs(c, lit, 1); poly(c, [0, 0, -px, -py, x, y]); fs(c, dark, 1); };
    for (let i = 0; i < 4; i++) point((i / 4) * TAU + Math.PI / 4, R * 0.55, R * 0.08, '#e8dcc0', '#9a8a6a');
    for (let i = 0; i < 4; i++) point((i / 4) * TAU - Math.PI / 2, R, R * 0.12, i === 0 ? '#e0402a' : '#f4ecd8', i === 0 ? '#8a1a10' : '#3a3028');
    circ(c, 0, 0, R * 0.08); fs(c, GOLD, 1);
    c.font = `700 ${R * 0.22}px Cinzel, serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#2a1e14'; c.fillText('N', 0, -R * 1.12);
    void r;
  } }),
  W({ id: 'w_cartouche', name: t('Title banner'), cat: 'w_sea', w: 4, h: 1, layer: 2, tags: 'banner scroll title cartouche ribbon', draw: (c, r, w, h) => {
    const W2 = w * 0.42, H2 = h * 0.26;
    for (const s of [-1, 1]) { poly(c, [s * W2 * 0.9, -H2 * 0.6, s * W2 * 1.15, -H2 * 0.6, s * W2 * 1.05, 0, s * W2 * 1.15, H2 * 0.9, s * W2 * 0.9, H2 * 0.9]); fs(c, lin(c, 0, -H2, 0, H2, [[0, '#d8c08a'], [1, '#a88a50']]), 1.6); }
    shadow(c, true, 6, 3, 4, 0.35); c.beginPath(); c.moveTo(-W2, -H2); c.quadraticCurveTo(0, -H2 * 1.5, W2, -H2); c.lineTo(W2, H2 * 0.6); c.quadraticCurveTo(0, H2 * 0.1, -W2, H2 * 0.6); c.closePath(); fs(c, lin(c, 0, -H2, 0, H2, [[0, '#f4e6c0'], [1, '#d4bc88']]), 2); shadow(c, false);
    for (const s of [-1, 1]) { ell(c, s * W2, (-H2 + H2 * 0.6) / 2, 6, H2 * 0.82); fs(c, '#c8a868', 1.4); }
    void r; void GOLD_D;
  } }),
];
