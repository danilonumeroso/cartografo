import { t } from '../i18n';
import {
  at, ball, blob, boulder, C2D, candle, circ, clip, coals, ell, flame, foliage, fs, gem, glow, GOLD, GOLD_D, GOLD_L, INK, leafShape, lin,
  line, METAL, pick, plankBox, poly, radial, rect, rod, rrange, rrect, shade, shadow, sparkle, StampDef, st, starPath, STONE, STONE_L, TAU,
  WOOD, WOOD_D, WOOD_L, LINEN,
} from '../art';
import type { Rng } from '../util';
import { mulberry32 } from '../util';
import { fir } from '../art';
import { mug, plate } from './furniture';

const XMAS = ['#c8102e', '#1e7a3a', '#f0c020', '#2a5ab8', '#e8e8f0', '#a030a0'];
const LIGHTS: [string, string][] = [['#ff4040', '255,70,70'], ['#40ff80', '70,255,130'], ['#ffd040', '255,210,70'], ['#40a0ff', '70,160,255'], ['#ff70e0', '255,120,230']];

/** Wrapped gift box with ribbon and bow. */
export function gift(c: C2D, r: Rng, x: number, y: number, S: number, rot: number) {
  const col = pick(r, XMAS), rib = pick(r, ['#f0c020', '#e8e8f0', '#c8102e', '#1e7a3a'].filter((k) => k !== col));
  at(c, x, y, rot, () => {
    shadow(c, true, 5, 2, 4, 0.5); rect(c, -S / 2, -S / 2, S, S); fs(c, lin(c, -S / 2, -S / 2, S / 2, S / 2, [[0, shade(col, 0.2)], [1, shade(col, -0.2)]]), 1.6); shadow(c, false);
    if (r() < 0.5) for (let i = 0; i < 6; i++) { circ(c, rrange(r, -S * 0.4, S * 0.4), rrange(r, -S * 0.4, S * 0.4), S * 0.05); c.fillStyle = 'rgba(255,255,255,0.5)'; c.fill(); }
    rect(c, -S * 0.08, -S / 2, S * 0.16, S); c.fillStyle = rib; c.fill(); rect(c, -S / 2, -S * 0.08, S, S * 0.16); c.fill();
    for (const s of [-1, 1]) { ell(c, s * S * 0.14, -S * 0.02, S * 0.16, S * 0.09, s * 0.5); fs(c, shade(rib, 0.1), 1); }
    circ(c, 0, 0, S * 0.07); fs(c, shade(rib, -0.15), 0.8);
    rect(c, -S / 2, -S / 2, S, S); st(c, INK, 1.6);
  });
}
function holly(c: C2D, r: Rng, x: number, y: number, s: number) {
  for (let i = 0; i < 3; i++) { const a = (i / 3) * TAU + r(); at(c, x + Math.cos(a) * s * 0.5, y + Math.sin(a) * s * 0.5, a, () => { leafShape(c, 0, 0, s, s * 0.45, 0); fs(c, lin(c, 0, -s * 0.2, 0, s * 0.2, [[0, '#3a8a3a'], [1, '#1a4a1e']]), 0.9); line(c, -s / 2, 0, s / 2, 0, '#1a3a1a', 0.7); }); }
  for (let i = 0; i < 3; i++) { const a = (i / 3) * TAU + 1; circ(c, x + Math.cos(a) * s * 0.14, y + Math.sin(a) * s * 0.14, s * 0.15); fs(c, ball(c, 0, 0, s * 0.15, '#d01020', 0.4), 0.7); }
}
function candyCane(c: C2D, x: number, y: number, L: number, rot: number) {
  at(c, x, y, rot, () => {
    c.beginPath(); c.moveTo(0, L / 2); c.lineTo(0, -L * 0.3); c.arc(L * 0.15, -L * 0.3, L * 0.15, Math.PI, 0); st(c, INK, L * 0.11 + 2);
    c.beginPath(); c.moveTo(0, L / 2); c.lineTo(0, -L * 0.3); c.arc(L * 0.15, -L * 0.3, L * 0.15, Math.PI, 0); st(c, '#f8f4f0', L * 0.11);
    c.save(); c.setLineDash([L * 0.06, L * 0.06]); c.beginPath(); c.moveTo(0, L / 2); c.lineTo(0, -L * 0.3); c.arc(L * 0.15, -L * 0.3, L * 0.15, Math.PI, 0); st(c, '#d01020', L * 0.11); c.restore();
  });
}
function bauble(c: C2D, x: number, y: number, R: number, col: string) {
  circ(c, x, y, R); fs(c, ball(c, x, y, R, col, 0.45), 0.9);
  circ(c, x - R * 0.35, y - R * 0.35, R * 0.25); c.fillStyle = 'rgba(255,255,255,0.75)'; c.fill();
}
function snowball(c: C2D, x: number, y: number, R: number) {
  circ(c, x, y, R); fs(c, radial(c, x, y, R, '#ffffff', '#b8c8d8', 0.4), 1.4, '#5a6a7a');
}

export const CHRISTMAS: StampDef[] = [
  { id: 'xmas_tree', name: t('Christmas tree'), cat: 'christmas', w: 2.2, h: 2.2, layer: 2, light: { radius: 4.5, color: '#ffd890', intensity: 0.7 }, tags: 'christmas tree xmas decorated ornaments lights star', draw: (c, r, w) => {
    const R = w * 0.44;
    fir(c, r, R, 0);
    // tinsel spiral
    for (const k of [0.8, 0.58, 0.38]) { const n = Math.round(k * 16); c.beginPath(); for (let i = 0; i <= n; i++) { const a0 = (i / n) * TAU + k * 3, a1 = ((i + 0.5) / n) * TAU + k * 3, a2 = ((i + 1) / n) * TAU + k * 3; if (!i) c.moveTo(Math.cos(a0) * R * k, Math.sin(a0) * R * k); c.quadraticCurveTo(Math.cos(a1) * R * (k - 0.08), Math.sin(a1) * R * (k - 0.08), Math.cos(a2) * R * k, Math.sin(a2) * R * k); } st(c, 'rgba(120,80,10,0.6)', 3.2); st(c, '#f0c840', 1.8); }
    for (let i = 0; i < 26; i++) { const a = r() * TAU, d = R * rrange(r, 0.2, 0.85); bauble(c, Math.cos(a) * d, Math.sin(a) * d, rrange(r, 3.5, 5.5), pick(r, XMAS)); }
    for (let i = 0; i < 40; i++) { const a = r() * TAU, d = R * rrange(r, 0.15, 0.95); const [col, rgb] = pick(r, LIGHTS); glow(c, Math.cos(a) * d, Math.sin(a) * d, 7, rgb, 0.55); circ(c, Math.cos(a) * d, Math.sin(a) * d, 1.6); c.fillStyle = col; c.fill(); }
    glow(c, 0, 0, R * 0.4, '255,230,120', 0.6);
    starPath(c, 0, 0, 5, R * 0.17, R * 0.07); fs(c, radial(c, 0, 0, R * 0.17, '#fff8c0', GOLD_D, 0.2), 1.4);
    sparkle(c, -2, -2, 6);
  } },
  { id: 'presents', name: t('Presents'), cat: 'christmas', w: 1.3, h: 1.3, layer: 1, tags: 'presents gifts boxes christmas ribbons', draw: (c, r, w) => {
    const items: [number, number, number][] = [];
    for (let i = 0; i < 6; i++) items.push([rrange(r, -w * 0.25, w * 0.25), rrange(r, -w * 0.25, w * 0.25), rrange(r, w * 0.18, w * 0.3)]);
    items.sort((a, b) => b[2] - a[2]);
    for (const [x, y, S] of items) gift(c, r, x, y, S, rrange(r, -0.5, 0.5));
  } },
  { id: 'big_present', name: t('Big present'), cat: 'christmas', w: 0.9, h: 0.9, layer: 1, tags: 'present gift box christmas', draw: (c, r, w) => gift(c, r, 0, 0, w * 0.7, rrange(r, -0.2, 0.2)) },
  { id: 'snowman', name: t('Snowman'), cat: 'christmas', w: 1.2, h: 1.2, layer: 1, tags: 'snowman snow winter carrot scarf', draw: (c, r, w) => {
    const R = w * 0.3;
    for (const s of [-1, 1]) { c.beginPath(); c.moveTo(s * R * 0.5, -R * 0.1); c.lineTo(s * R * 1.45, -R * 0.4); c.lineTo(s * R * 1.6, -R * 0.6); c.moveTo(s * R * 1.35, -R * 0.37); c.lineTo(s * R * 1.5, -R * 0.15); st(c, INK, 4); st(c, '#6a4a2a', 2.4); }
    shadow(c, true, 8, 5, 7, 0.4); snowball(c, 0, R * 0.25, R); shadow(c, false);
    shadow(c, true, 5, 3, 5, 0.35); snowball(c, 0, -R * 0.15, R * 0.72); shadow(c, false);
    const scarf = pick(r, ['#c8102e', '#2a5ab8', '#1e7a3a']);
    c.beginPath(); c.arc(0, -R * 0.15, R * 0.6, 0, TAU); st(c, INK, 7); st(c, scarf, 5);
    c.beginPath(); c.moveTo(R * 0.4, -R * 0.0); c.quadraticCurveTo(R * 0.7, R * 0.3, R * 0.6, R * 0.6); st(c, INK, 7); st(c, scarf, 5);
    shadow(c, true, 4, 2, 4, 0.4); snowball(c, 0, -R * 0.4, R * 0.46); shadow(c, false);
    circ(c, 0, -R * 0.5, R * 0.32); fs(c, '#1a1a1e', 1.6); circ(c, 0, -R * 0.5, R * 0.22); fs(c, radial(c, 0, -R * 0.5, R * 0.22, '#4a4a52', '#121214'), 1); rect(c, -R * 0.32, -R * 0.4, R * 0.64, 4); c.fillStyle = '#c8102e'; c.fill();
    poly(c, [-2.4, -R * 0.2, 2.4, -R * 0.2, 0, R * 0.12]); fs(c, '#f07a1a', 0.8);
    for (let i = 0; i < 3; i++) { circ(c, 0, R * 0.05 + i * R * 0.22, 2.4); c.fillStyle = '#1a1a1e'; c.fill(); }
  } },
  { id: 'wreath', name: t('Christmas wreath'), cat: 'christmas', w: 1, h: 1, layer: 1, tags: 'wreath christmas door holly bow', draw: (c, r, w) => {
    const R = w * 0.32;
    shadow(c, true, 5, 3, 4, 0.45);
    for (let i = 0; i < 60; i++) { const a = (i / 60) * TAU, d = R + rrange(r, -R * 0.2, R * 0.2); leafShape(c, Math.cos(a) * d, Math.sin(a) * d, rrange(r, 9, 13), 3, a + Math.PI / 2 + rrange(r, -0.6, 0.6)); c.fillStyle = pick(r, ['#1e4a2a', '#2e6a3a', '#3a7a44']); c.fill(); }
    shadow(c, false);
    for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU + r() * 0.3; circ(c, Math.cos(a) * R, Math.sin(a) * R, 3); fs(c, ball(c, 0, 0, 3, i % 3 ? '#d01020' : GOLD, 0.4), 0.7); }
    for (let i = 0; i < 4; i++) { const a = (i / 4) * TAU + 0.5; at(c, Math.cos(a) * R, Math.sin(a) * R, a, () => { ell(c, 0, 0, 3, 5); fs(c, '#8a5a2a', 0.8); }); }
    at(c, 0, R, 0, () => { for (const s of [-1, 1]) { ell(c, s * 9, 0, 10, 6, s * 0.4); fs(c, '#c8102e', 1.4); poly(c, [s * 2, 2, s * 8, 18, s * 3, 16]); fs(c, '#a80c24', 1); } circ(c, 0, 0, 4); fs(c, '#a80c24', 1.2); });
  } },
  { id: 'candy_canes', name: t('Candy canes'), cat: 'christmas', w: 0.9, h: 0.9, layer: 0, tags: 'candy cane sweets christmas', draw: (c, r, w) => { for (let i = 0; i < 4; i++) candyCane(c, rrange(r, -w * 0.18, w * 0.18), rrange(r, -w * 0.1, w * 0.1), w * rrange(r, 0.45, 0.6), r() * TAU); } },
  { id: 'gingerbread_house', name: t('Gingerbread house'), cat: 'christmas', w: 1.5, h: 1.5, layer: 1, tags: 'gingerbread house candy icing sweets', draw: (c, r, w) => {
    const S = w * 0.6;
    shadow(c, true, 10, 5, 7); rect(c, -S / 2, -S / 2, S, S); fs(c, '#a8642a', 2.2); shadow(c, false);
    for (const k of [0, 1]) { poly(c, k ? [-S / 2, -S / 2, S / 2, -S / 2, 0, 0] : [-S / 2, S / 2, S / 2, S / 2, 0, 0]); c.fillStyle = shade('#a8642a', k ? 0.12 : -0.18); c.fill(); poly(c, k ? [-S / 2, -S / 2, -S / 2, S / 2, 0, 0] : [S / 2, -S / 2, S / 2, S / 2, 0, 0]); c.fillStyle = shade('#a8642a', k ? 0.02 : -0.08); c.fill(); }
    clip(c, () => rect(c, -S / 2, -S / 2, S, S), () => { for (let d = 8; d < S / 2; d += 9) { rect(c, -S / 2 + d, -S / 2 + d, S - 2 * d, S - 2 * d); c.save(); c.setLineDash([4, 3]); st(c, '#fffaf0', 2.2); c.restore(); } });
    line(c, -S / 2, -S / 2, S / 2, S / 2, '#fffaf0', 3.4); line(c, S / 2, -S / 2, -S / 2, S / 2, '#fffaf0', 3.4);
    for (let i = 0; i < 18; i++) { const x = rrange(r, -S * 0.45, S * 0.45), y = rrange(r, -S * 0.45, S * 0.45); circ(c, x, y, rrange(r, 2, 3.5)); fs(c, ball(c, x, y, 3, pick(r, ['#d01020', '#20a040', '#f0c020', '#3060d0', '#f070c0'])), 0.7); }
    rect(c, -S / 2, -S / 2, S, S); st(c, INK, 2.2);
    for (let i = 0; i < 10; i++) { const a = (i / 10) * TAU; candyCane(c, Math.cos(a) * S * 0.72, Math.sin(a) * S * 0.72, 18, a); }
  } },
  { id: 'cookies', name: t('Christmas cookies'), cat: 'christmas', w: 0.8, h: 0.8, layer: 1, tags: 'cookies gingerbread men plate milk', draw: (c, r, w) => {
    const R = w * 0.36;
    shadow(c, true, 4, 2, 3, 0.4); circ(c, 0, 0, R); fs(c, radial(c, 0, 0, R, '#ffffff', '#cfc8b8', 0.2), 1.2); shadow(c, false);
    circ(c, 0, 0, R * 0.8); st(c, '#c8102e', 1.6);
    for (let i = 0; i < 4; i++) { const a = (i / 4) * TAU + r(); at(c, Math.cos(a) * R * 0.45, Math.sin(a) * R * 0.45, a, () => {
      const s = R * 0.32; c.beginPath(); circ(c, 0, -s * 0.55, s * 0.3); fs(c, '#b8743a', 0.9);
      poly(c, [-s * 0.25, -s * 0.3, s * 0.25, -s * 0.3, s * 0.5, -s * 0.15, s * 0.5, 0, s * 0.25, -s * 0.05, s * 0.3, s * 0.55, s * 0.08, s * 0.55, 0, s * 0.25, -s * 0.08, s * 0.55, -s * 0.3, s * 0.55, -s * 0.25, -s * 0.05, -s * 0.5, 0, -s * 0.5, -s * 0.15]); fs(c, '#b8743a', 0.9);
      for (let k = 0; k < 2; k++) { circ(c, 0, -s * 0.1 + k * s * 0.2, 1); c.fillStyle = '#d01020'; c.fill(); }
    }); }
    starPath(c, 0, 0, 5, R * 0.22, R * 0.1); fs(c, '#f0d080', 0.8);
  } },
  { id: 'yule_log', name: t('Yule log'), cat: 'christmas', w: 1.6, h: 0.7, layer: 1, light: { radius: 3, color: '#ffd38a', intensity: 0.6 }, tags: 'yule log candles holly christmas centerpiece', draw: (c, r, w, h) => {
    const W = w * 0.8, H = h * 0.5;
    shadow(c, true, 7, 3, 5); rrect(c, -W / 2, -H / 2, W, H, H / 2); fs(c, lin(c, 0, -H / 2, 0, H / 2, [[0, '#8a6a4a'], [1, '#4a3420']])); shadow(c, false);
    for (let i = 0; i < 5; i++) line(c, -W * 0.42, rrange(r, -H * 0.3, H * 0.3), W * 0.36, rrange(r, -H * 0.3, H * 0.3), 'rgba(20,10,0,0.35)', 1.4);
    ell(c, W / 2 - H * 0.3, 0, H * 0.3, H / 2); fs(c, '#d8b080', 1.6);
    for (let k = 1; k < 3; k++) { ell(c, W / 2 - H * 0.3, 0, H * 0.1 * k, H * 0.16 * k); st(c, 'rgba(90,50,20,0.55)', 0.9); }
    for (let i = 0; i < 3; i++) { const x = -W * 0.28 + i * W * 0.25; candle(c, x, 0, 4.5, '#d01020'); }
    holly(c, r, -W * 0.42, H * 0.1, 14); holly(c, r, W * 0.05, H * 0.3, 12);
  } },
  { id: 'xmas_fireplace', name: t('Festive fireplace'), cat: 'christmas', w: 2.2, h: 1, layer: 1, light: { radius: 5, color: '#ffb15a', intensity: 0.9 }, tags: 'fireplace stockings garland christmas hearth', draw: (c, r, w, h) => {
    const W = w * 0.9, H = h * 0.6;
    shadow(c, true); rect(c, -W / 2, -H / 2, W, H); fs(c, STONE); shadow(c, false);
    for (let i = 0; i < 9; i++) { rect(c, -W / 2 + (i * W) / 9, -H / 2, W / 9, H / 2); st(c, 'rgba(0,0,0,0.3)', 1.4); }
    rrect(c, -W * 0.25, -H * 0.15, W * 0.5, H * 0.6, 6); fs(c, '#1e1712', 2);
    clip(c, () => rrect(c, -W * 0.25, -H * 0.15, W * 0.5, H * 0.6, 6), () => coals(c, r, 0, H * 0.25, W * 0.2, 12));
    flame(c, 0, H * 0.1, 11);
    c.beginPath(); c.moveTo(-W / 2, H / 2 + 2); for (let i = 0; i <= 10; i++) { const x = -W / 2 + (i * W) / 10; c.quadraticCurveTo(x - W / 20, H / 2 + 12, x, H / 2 + 2); } st(c, '#1e4a2a', 7);
    for (let i = 0; i < 10; i++) { const x = -W / 2 + ((i + 0.5) * W) / 10; const [col, rgb] = pick(r, LIGHTS); glow(c, x, H / 2 + 8, 7, rgb, 0.6); circ(c, x, H / 2 + 8, 2); c.fillStyle = col; c.fill(); }
    for (let i = 0; i < 4; i++) { const x = -W * 0.38 + i * W * 0.25 + (i > 1 ? W * 0.02 : 0); if (Math.abs(x) < W * 0.22) continue; at(c, x, H / 2 + 14, 0, () => { const col = pick(r, ['#c8102e', '#1e7a3a', '#2a5ab8']); shadow(c, true, 3, 2, 3, 0.4); c.beginPath(); c.moveTo(-6, 0); c.lineTo(6, 0); c.lineTo(6, 18); c.quadraticCurveTo(6, 24, 14, 24); c.lineTo(14, 30); c.lineTo(-2, 30); c.quadraticCurveTo(-6, 30, -6, 24); c.closePath(); fs(c, col, 1.2); shadow(c, false); rect(c, -7, -2, 14, 7); fs(c, '#f8f4f0', 1); }); }
    for (const s of [-1, 1]) { candle(c, s * W * 0.42, -H * 0.15, 3.5, '#d01020'); holly(c, r, s * W * 0.34, -H * 0.2, 10); }
  } },
  { id: 'garland', name: t('Garland with lights'), cat: 'christmas', w: 2.5, h: 0.5, layer: 1, light: { radius: 2.5, color: '#ffd890', intensity: 0.5 }, tags: 'garland lights christmas decoration fir', draw: (c, r, w, h) => {
    const W = w * 0.96;
    for (let i = 0; i < 90; i++) { const x = rrange(r, -W / 2, W / 2), y = Math.sin((x / W) * Math.PI * 4) * h * 0.12 + rrange(r, -h * 0.12, h * 0.12); leafShape(c, x, y, rrange(r, 7, 10), 2.2, r() * TAU); c.fillStyle = pick(r, ['#1e4a2a', '#2e6a3a', '#3a7a44']); c.fill(); }
    for (let i = 0; i < 16; i++) { const x = -W / 2 + ((i + 0.5) * W) / 16, y = Math.sin((x / W) * Math.PI * 4) * h * 0.12; const [col, rgb] = LIGHTS[i % LIGHTS.length]; glow(c, x, y, 9, rgb, 0.6); circ(c, x, y, 2.4); fs(c, col, 0.6); }
    for (let i = 0; i < 4; i++) bauble(c, -W * 0.36 + i * W * 0.24, h * 0.05, 4.5, pick(r, XMAS));
  } },
  { id: 'mistletoe', name: t('Mistletoe'), cat: 'christmas', w: 0.7, h: 0.7, layer: 2, tags: 'mistletoe kiss hanging christmas ribbon', draw: (c, r, w) => {
    shadow(c, true, 4, 8, 12, 0.35);
    for (let i = 0; i < 10; i++) { const a = (i / 10) * TAU + rrange(r, -0.2, 0.2); at(c, Math.cos(a) * w * 0.12, Math.sin(a) * w * 0.12, a, () => { leafShape(c, 0, 0, w * 0.28, w * 0.09, 0); fs(c, lin(c, 0, -5, 0, 5, [[0, '#8ab05a'], [1, '#4a7a32']]), 0.9); }); }
    shadow(c, false);
    for (let i = 0; i < 6; i++) { const a = r() * TAU; circ(c, Math.cos(a) * 5, Math.sin(a) * 5, 2.6); fs(c, ball(c, 0, 0, 3, '#f4f0e6', 0.3), 0.6); }
    for (const s of [-1, 1]) { ell(c, s * 6, -w * 0.18, 6, 3.4, s * 0.4); fs(c, '#c8102e', 1); }
    circ(c, 0, -w * 0.18, 2.4); fs(c, '#a80c24', 0.8);
  } },
  { id: 'sleigh', name: t('Sleigh'), cat: 'christmas', w: 1.6, h: 2.6, layer: 1, tags: 'sleigh santa presents sack christmas sled', draw: (c, r, w, h) => {
    const W = w * 0.6, H = h * 0.66;
    for (const s of [-1, 1]) { c.beginPath(); c.moveTo(s * W * 0.55, H * 0.55); c.lineTo(s * W * 0.55, -H * 0.5); c.quadraticCurveTo(s * W * 0.55, -H * 0.72, s * W * 0.35, -H * 0.7); st(c, INK, 6); st(c, GOLD, 4); }
    shadow(c, true, 12, 6, 9); c.beginPath(); c.moveTo(-W / 2, -H * 0.3); c.quadraticCurveTo(-W / 2, -H / 2, 0, -H / 2); c.quadraticCurveTo(W / 2, -H / 2, W / 2, -H * 0.3); c.lineTo(W / 2, H * 0.45); c.quadraticCurveTo(W / 2, H * 0.55, W * 0.35, H * 0.55); c.lineTo(-W * 0.35, H * 0.55); c.quadraticCurveTo(-W / 2, H * 0.55, -W / 2, H * 0.45); c.closePath();
    fs(c, lin(c, -W / 2, 0, W / 2, 0, [[0, '#e8303a'], [0.4, '#c8102e'], [1, '#7a0818']]), 2.4); shadow(c, false);
    for (const s of [-1, 1]) { c.beginPath(); c.moveTo(s * W * 0.42, -H * 0.3); c.lineTo(s * W * 0.42, H * 0.42); st(c, GOLD, 2); }
    rect(c, -W * 0.36, H * 0.05, W * 0.72, H * 0.38); fs(c, '#5a1020', 1.4);
    rect(c, -W * 0.36, H * 0.05, W * 0.72, 6); fs(c, '#8a2030', 1);
    shadow(c, true, 6, 3, 5); blob(c, r, W * 0.36, 10, 0.1, 0, -H * 0.18); fs(c, ball(c, 0, -H * 0.18, W * 0.4, '#a87a4a', 0.3), 1.8); shadow(c, false);
    for (let i = 0; i < 5; i++) gift(c, r, rrange(r, -W * 0.22, W * 0.22), -H * 0.18 + rrange(r, -W * 0.22, W * 0.22), rrange(r, 12, 18), r() * 2);
  } },
  { id: 'snow_drift', name: t('Snow drift'), cat: 'christmas', w: 2, h: 1.5, layer: 0, tags: 'snow drift pile winter', draw: (c, r, w, h) => {
    for (let i = 0; i < 9; i++) { const x = rrange(r, -w * 0.3, w * 0.3), y = rrange(r, -h * 0.25, h * 0.25), R = rrange(r, w * 0.12, w * 0.22); shadow(c, true, 6, 3, 5, 0.2); blob(c, r, R, 10, 0.18, x, y, 0.7); c.fillStyle = radial(c, x, y, R, '#ffffff', '#c8d8e8', 0.4); c.fill(); shadow(c, false); }
    for (let i = 0; i < 30; i++) { circ(c, rrange(r, -w * 0.35, w * 0.35), rrange(r, -h * 0.3, h * 0.3), rrange(r, 0.8, 1.6)); c.fillStyle = 'rgba(255,255,255,0.95)'; c.fill(); }
  } },
  { id: 'snowy_pine', name: t('Snowy pine'), cat: 'christmas', w: 1.8, h: 1.8, layer: 2, tags: 'pine fir tree snow winter forest', draw: (c, r, w) => fir(c, r, w * 0.44, 2.2) },
  { id: 'frozen_pond', name: t('Frozen pond'), cat: 'christmas', w: 2.6, h: 2, layer: 0, tags: 'ice pond frozen lake skating winter', draw: (c, r, w, h) => {
    const seed = Math.floor(r() * 1e9), shape = () => { c.save(); c.scale(1, h / w); blob(c, mulberry32(seed), w * 0.42, 14, 0.16); c.restore(); };
    shape(); fs(c, radial(c, -w * 0.1, -h * 0.1, w * 0.5, '#e8f6ff', '#8ab8d8', 0.1), 3, '#6a8aa8');
    clip(c, shape, () => {
      for (let i = 0; i < 8; i++) { let x = rrange(r, -w * 0.3, w * 0.3), y = rrange(r, -h * 0.3, h * 0.3), a = r() * TAU; c.beginPath(); c.moveTo(x, y); for (let k = 0; k < 5; k++) { a += rrange(r, -0.8, 0.8); x += Math.cos(a) * 14; y += Math.sin(a) * 14; c.lineTo(x, y); } st(c, 'rgba(255,255,255,0.7)', 1.2); }
      for (let i = 0; i < 5; i++) { const y = rrange(r, -h * 0.3, h * 0.3); c.beginPath(); c.ellipse(rrange(r, -w * 0.2, w * 0.2), y, w * rrange(r, 0.1, 0.25), h * 0.05, rrange(r, -0.3, 0.3), 0, TAU); st(c, 'rgba(255,255,255,0.35)', 1); }
      ell(c, -w * 0.15, -h * 0.15, w * 0.18, h * 0.06, -0.3); c.fillStyle = 'rgba(255,255,255,0.35)'; c.fill();
    });
    for (let i = 0; i < 12; i++) { const a = r() * TAU; blob(c, r, rrange(r, 8, 14), 8, 0.25, Math.cos(a) * w * 0.42, Math.sin(a) * h * 0.42); c.fillStyle = 'rgba(250,252,255,0.95)'; c.fill(); }
  } },
  { id: 'ice_spikes', name: t('Ice spikes'), cat: 'christmas', w: 1.4, h: 1.4, layer: 1, light: { radius: 2, color: '#b0e8ff', intensity: 0.4 }, tags: 'ice spikes crystals frozen icicles winter', draw: (c, r, w) => {
    glow(c, 0, 0, w * 0.45, '180,230,255', 0.35);
    const sh: [number, number, number, number][] = [];
    for (let i = 0; i < 12; i++) sh.push([rrange(r, -w * 0.2, w * 0.2), rrange(r, -w * 0.2, w * 0.2), r() * TAU, rrange(r, w * 0.15, w * 0.4)]);
    sh.sort((a, b) => a[3] - b[3]);
    for (const [x, y, a, L] of sh) at(c, x, y, a, () => { shadow(c, true, 4, 2, 3, 0.4); poly(c, [0, -L * 0.1, L, 0, 0, L * 0.1]); fs(c, lin(c, 0, -L * 0.1, 0, L * 0.1, [[0, '#f4fbff'], [1, '#7ab8d8']]), 1.2, '#2a4a6a'); shadow(c, false); line(c, 0, 0, L * 0.9, 0, 'rgba(255,255,255,0.8)', 1); });
  } },
  { id: 'winter_lantern', name: t('Winter lantern'), cat: 'christmas', w: 0.6, h: 0.6, layer: 1, light: { radius: 3.5, color: '#ffd890', intensity: 0.75 }, tags: 'lantern light candle winter holiday', draw: (c, r, w) => {
    const S = w * 0.4;
    shadow(c, true, 5, 3, 4); rect(c, -S / 2, -S / 2, S, S); fs(c, '#2a2a2e', 1.8); shadow(c, false);
    rect(c, -S / 2 + 4, -S / 2 + 4, S - 8, S - 8); fs(c, radial(c, 0, 0, S * 0.4, '#fff6c0', '#e8a030', 0), 1);
    line(c, -S / 2, -S / 2, S / 2, S / 2, '#2a2a2e', 1.4); line(c, S / 2, -S / 2, -S / 2, S / 2, '#2a2a2e', 1.4);
    flame(c, 0, 0, 3.4);
    blob(c, r, S * 0.32, 7, 0.3, -S * 0.15, -S * 0.4); c.fillStyle = 'rgba(250,252,255,0.95)'; c.fill();
    holly(c, r, S * 0.45, -S * 0.45, 9);
  } },
  { id: 'hot_cocoa', name: t('Hot cocoa'), cat: 'christmas', w: 0.6, h: 0.6, layer: 1, tags: 'cocoa chocolate mugs marshmallows drink winter', draw: (c, r, w) => {
    for (let i = 0; i < 2; i++) { const x = (i ? 1 : -1) * w * 0.15, y = (i ? -1 : 1) * w * 0.08; mug(c, x, y, w * 0.16, r() * TAU); circ(c, x, y, w * 0.11); c.fillStyle = '#6a3a1e'; c.fill(); for (let k = 0; k < 3; k++) { rrect(c, x + rrange(r, -5, 3), y + rrange(r, -5, 3), 4, 4, 1); fs(c, '#fff8f0', 0.5); } }
  } },
  { id: 'poinsettia', name: t('Poinsettia'), cat: 'christmas', w: 0.8, h: 0.8, layer: 1, tags: 'poinsettia plant flower red christmas pot', draw: (c, r, w) => {
    const R = w * 0.22;
    shadow(c, true, 5, 3, 4); circ(c, 0, 0, R); fs(c, ball(c, 0, 0, R, '#c8a050', 0.3), 1.6); shadow(c, false);
    for (let k = 0; k < 2; k++) for (let i = 0; i < 7; i++) { const a = (i / 7) * TAU + k * 0.45, L = w * (k ? 0.24 : 0.36); leafShape(c, Math.cos(a) * L * 0.5, Math.sin(a) * L * 0.5, L, L * 0.38, a); fs(c, k ? lin(c, 0, 0, 1, 1, [[0, '#e8202e'], [1, '#a00818']]) : '#2a6a2a', 1); if (k) line(c, 0, 0, Math.cos(a) * L * 0.9, Math.sin(a) * L * 0.9, 'rgba(90,0,10,0.45)', 0.8); }
    for (let i = 0; i < 6; i++) { circ(c, rrange(r, -3, 3), rrange(r, -3, 3), 1.6); c.fillStyle = '#f0d030'; c.fill(); }
  } },
  { id: 'holly_bush', name: t('Holly bush'), cat: 'christmas', w: 1.1, h: 1.1, layer: 1, tags: 'holly bush berries winter', draw: (c, r, w) => {
    foliage(c, r, w * 0.36, { base: '#1e5a2a', light: '#3a7a3a', dark: '#103a18' }, { lobes: 7 });
    for (let i = 0; i < 14; i++) { const a = r() * TAU, d = Math.sqrt(r()) * w * 0.3; circ(c, Math.cos(a) * d, Math.sin(a) * d, 3); fs(c, ball(c, 0, 0, 3, '#d01020', 0.45), 0.7); }
    for (let i = 0; i < 8; i++) { const a = r() * TAU, d = Math.sqrt(r()) * w * 0.3; blob(c, r, rrange(r, 4, 7), 6, 0.3, Math.cos(a) * d - 3, Math.sin(a) * d - 3); c.fillStyle = 'rgba(250,252,255,0.9)'; c.fill(); }
  } },
  { id: 'toy_pile', name: t('Pile of toys'), cat: 'christmas', w: 1.4, h: 1.4, layer: 1, tags: 'toys workshop teddy bear soldier drum ball', draw: (c, r, w) => {
    // drum
    at(c, -w * 0.18, w * 0.15, 0, () => { shadow(c, true, 4, 2, 3); circ(c, 0, 0, 14); fs(c, '#c8102e', 1.6); shadow(c, false); circ(c, 0, 0, 11); fs(c, '#f4ead8', 1); for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU; line(c, Math.cos(a) * 11, Math.sin(a) * 11, Math.cos(a + 0.4) * 14, Math.sin(a + 0.4) * 14, GOLD, 1); } });
    // teddy bear
    at(c, w * 0.16, -w * 0.12, rrange(r, -0.4, 0.4), () => {
      shadow(c, true, 4, 2, 3); for (const s of [-1, 1]) { circ(c, s * 11, 4, 5); fs(c, '#a8703a', 1.2); circ(c, s * 6, 16, 5.5); fs(c, '#a8703a', 1.2); } ell(c, 0, 6, 11, 13); fs(c, ball(c, 0, 6, 12, '#b07a42', 0.3), 1.4); shadow(c, false);
      ell(c, 0, 8, 6, 7); c.fillStyle = '#d8a870'; c.fill();
      for (const s of [-1, 1]) { circ(c, s * 7, -14, 4); fs(c, '#a8703a', 1.2); }
      circ(c, 0, -9, 9); fs(c, ball(c, 0, -9, 9, '#b07a42', 0.3), 1.4); ell(c, 0, -6, 4, 3); fs(c, '#d8a870', 0.8); circ(c, 0, -7, 1.3); c.fillStyle = INK; c.fill(); for (const s of [-1, 1]) { circ(c, s * 3.5, -11, 1.2); c.fill(); }
      rect(c, -5, -1, 10, 3); c.fillStyle = '#c8102e'; c.fill();
    });
    // toy soldier
    at(c, -w * 0.2, -w * 0.18, rrange(r, -0.6, 0.6), () => { rect(c, -5, -14, 10, 28); fs(c, '#c8102e', 1.2); rect(c, -5, 4, 10, 10); fs(c, '#1a2a5a', 1); circ(c, 0, -17, 5); fs(c, '#f0c8a0', 1); rect(c, -5, -26, 10, 8); fs(c, '#1a1a1e', 1); line(c, -5, -8, 5, -8, GOLD, 1.4); });
    // ball
    at(c, w * 0.22, w * 0.22, 0, () => { circ(c, 0, 0, 10); fs(c, ball(c, 0, 0, 10, '#f0c020', 0.4), 1.4); clip(c, () => circ(c, 0, 0, 10), () => { rect(c, -10, -3, 20, 6); c.fillStyle = '#2a5ab8'; c.fill(); }); circ(c, 0, 0, 10); st(c, INK, 1.4); });
    gift(c, r, w * 0.0, w * 0.32, 18, 0.3);
  } },
  { id: 'rocking_horse', name: t('Rocking horse'), cat: 'christmas', w: 0.8, h: 1.4, layer: 1, tags: 'rocking horse toy wooden child', draw: (c, r, w, h) => {
    for (const s of [-1, 1]) { c.beginPath(); c.moveTo(s * w * 0.28, -h * 0.42); c.quadraticCurveTo(s * w * 0.38, 0, s * w * 0.28, h * 0.42); st(c, INK, 6); st(c, '#c8102e', 4); }
    for (const y of [-h * 0.25, h * 0.25]) rod(c, -w * 0.3, y, w * 0.3, y, WOOD_D, 3);
    shadow(c, true, 6, 3, 5); ell(c, 0, h * 0.05, w * 0.16, h * 0.26); fs(c, ball(c, 0, 0, w * 0.2, '#f0e8d8', 0.25), 1.6); shadow(c, false);
    for (let i = 0; i < 6; i++) { circ(c, rrange(r, -w * 0.1, w * 0.1), rrange(r, -h * 0.1, h * 0.25), 2.2); c.fillStyle = '#5a4a3a'; c.fill(); }
    ell(c, 0, -h * 0.28, w * 0.1, h * 0.12); fs(c, ball(c, 0, -h * 0.28, w * 0.12, '#f0e8d8', 0.25), 1.4);
    for (let i = 0; i < 7; i++) line(c, 0, -h * 0.2 + i * 4, rrange(r, -6, 6), -h * 0.17 + i * 4, '#8a4a22', 2);
    rect(c, -w * 0.15, -h * 0.02, w * 0.3, h * 0.12); fs(c, '#c8102e', 1.2);
    for (const s of [-1, 1]) { ell(c, s * 4, -h * 0.38, 2.4, 4); fs(c, '#f0e8d8', 0.8); }
  } },
  { id: 'candy_pole', name: t('Striped pole'), cat: 'christmas', w: 0.6, h: 0.6, layer: 1, tags: 'north pole striped candy christmas sign', draw: (c, r, w) => {
    const R = w * 0.22;
    shadow(c, true, 6, 6, 9, 0.45); circ(c, 0, 0, R); fs(c, '#f8f4f0', 1.8); shadow(c, false);
    clip(c, () => circ(c, 0, 0, R), () => { for (let i = 0; i < 6; i++) { c.beginPath(); c.arc(0, 0, R, (i / 6) * TAU, (i / 6) * TAU + 0.5); c.lineTo(0, 0); c.closePath(); c.fillStyle = '#d01020'; c.fill(); } });
    circ(c, 0, 0, R * 0.5); fs(c, ball(c, 0, 0, R * 0.5, GOLD, 0.4), 1.2);
    circ(c, 0, 0, R); st(c, INK, 1.8);
    void r;
  } },
  { id: 'snowballs', name: t('Snowballs'), cat: 'christmas', w: 0.8, h: 0.8, layer: 1, tags: 'snowballs snow fight winter pile', draw: (c, r, w) => {
    const pos: [number, number][] = [[-1, 0.6], [1, 0.6], [0, -0.9], [-2, -0.3], [2, -0.3], [0, 0.2]];
    const R = w * 0.1;
    for (const [x, y] of pos) { shadow(c, true, 3, 2, 3, 0.3); snowball(c, x * R, y * R, R); shadow(c, false); }
    void r;
  } },
  { id: 'sled', name: t('Sled'), cat: 'christmas', w: 0.8, h: 1.5, layer: 1, tags: 'sled toboggan snow winter', draw: (c, r, w, h) => {
    const W = w * 0.5, H = h * 0.7;
    for (const s of [-1, 1]) { c.beginPath(); c.moveTo(s * W * 0.55, H * 0.5); c.lineTo(s * W * 0.55, -H * 0.45); c.quadraticCurveTo(s * W * 0.55, -H * 0.62, s * W * 0.3, -H * 0.6); st(c, INK, 5); st(c, '#8a9098', 3); }
    shadow(c, true, 6, 3, 5); plankBox(c, r, -W / 2, -H * 0.42, W, H * 0.88, 3, pick(r, ['#c8102e', WOOD_L, '#2a5ab8']), true, 4); shadow(c, false);
    c.beginPath(); c.moveTo(0, -H * 0.42); c.quadraticCurveTo(-W * 0.6, -H * 0.7, -W * 0.4, -H * 0.85); st(c, INK, 3); st(c, '#c8a868', 1.6);
  } },
  { id: 'advent_wreath', name: t('Advent wreath'), cat: 'christmas', w: 1, h: 1, layer: 1, light: { radius: 3, color: '#ffd38a', intensity: 0.65 }, tags: 'advent wreath candles christmas table', draw: (c, r, w) => {
    const R = w * 0.3;
    for (let i = 0; i < 50; i++) { const a = (i / 50) * TAU, d = R + rrange(r, -R * 0.2, R * 0.2); leafShape(c, Math.cos(a) * d, Math.sin(a) * d, rrange(r, 8, 12), 2.6, a + Math.PI / 2 + rrange(r, -0.6, 0.6)); c.fillStyle = pick(r, ['#1e4a2a', '#2e6a3a', '#3a7a44']); c.fill(); }
    for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU + 0.3; circ(c, Math.cos(a) * R, Math.sin(a) * R, 2.6); fs(c, ball(c, 0, 0, 3, '#d01020', 0.4), 0.6); }
    for (let i = 0; i < 4; i++) { const a = (i / 4) * TAU + Math.PI / 4; candle(c, Math.cos(a) * R, Math.sin(a) * R, 5, i === 2 ? '#f0a0c0' : '#a02a8a', i < 2 + Math.floor(r() * 3)); }
  } },
  { id: 'santa_sack', name: t('Sack of presents'), cat: 'christmas', w: 1.1, h: 1.1, layer: 1, tags: 'sack bag presents santa gifts', draw: (c, r, w) => {
    const R = w * 0.32;
    shadow(c, true, 6, 3, 5); blob(c, r, R, 10, 0.1); fs(c, ball(c, 0, 0, R, '#c8102e', 0.3), 2); shadow(c, false);
    for (let i = 0; i < 6; i++) { const a = r() * TAU; line(c, 0, 0, Math.cos(a) * R * 0.8, Math.sin(a) * R * 0.8, 'rgba(80,0,10,0.35)', 1.4); }
    circ(c, R * 0.1, -R * 0.1, R * 0.5); c.fillStyle = '#5a0010'; c.fill();
    for (let i = 0; i < 4; i++) gift(c, r, R * 0.1 + rrange(r, -R * 0.25, R * 0.25), -R * 0.1 + rrange(r, -R * 0.25, R * 0.25), rrange(r, 12, 18), r() * 2);
    c.beginPath(); c.moveTo(-R * 0.2, R * 0.6); c.quadraticCurveTo(-R * 0.6, R * 1.1, -R * 0.1, R * 1.25); st(c, INK, 4); st(c, GOLD, 2.4);
  } },
  { id: 'ornaments', name: t('Scattered ornaments'), cat: 'christmas', w: 1.2, h: 1.2, layer: 0, tags: 'ornaments baubles decorations christmas', draw: (c, r, w) => {
    for (let i = 0; i < 9; i++) { const x = rrange(r, -w * 0.38, w * 0.38), y = rrange(r, -w * 0.38, w * 0.38), R = rrange(r, 5, 8); shadow(c, true, 3, 2, 3, 0.4); bauble(c, x, y, R, pick(r, XMAS)); shadow(c, false); rect(c, x - 2, y - R - 3, 4, 4); fs(c, GOLD, 0.6); }
    c.beginPath(); c.moveTo(-w * 0.4, w * 0.2); c.bezierCurveTo(-w * 0.1, -w * 0.2, w * 0.1, w * 0.4, w * 0.4, 0); st(c, 'rgba(240,200,60,0.9)', 2);
  } },
  { id: 'jingle_bells', name: t('Jingle bells'), cat: 'christmas', w: 0.7, h: 0.7, layer: 1, tags: 'bells jingle ribbon christmas', draw: (c, r, w) => {
    for (let i = 0; i < 3; i++) { const a = (i / 3) * TAU + 0.5, x = Math.cos(a) * w * 0.14, y = Math.sin(a) * w * 0.14; shadow(c, true, 3, 2, 3, 0.4); circ(c, x, y, w * 0.13); fs(c, radial(c, x, y, w * 0.13, GOLD_L, GOLD_D, 0.4), 1.2); shadow(c, false); line(c, x - w * 0.06, y + w * 0.02, x + w * 0.06, y + w * 0.02, '#4a3008', 1.4); circ(c, x, y + w * 0.06, 1.6); c.fillStyle = '#4a3008'; c.fill(); }
    for (const s of [-1, 1]) { ell(c, s * 7, -w * 0.32, 7, 4, s * 0.4); fs(c, '#c8102e', 1); }
    circ(c, 0, -w * 0.32, 2.4); fs(c, '#a80c24', 0.8);
    void r;
  } },
  { id: 'xmas_pudding', name: t('Christmas pudding'), cat: 'christmas', w: 0.6, h: 0.6, layer: 1, tags: 'pudding cake dessert christmas holly', draw: (c, r, w) => {
    plate(c, r, 0, 0, w * 0.36, false);
    circ(c, 0, 0, w * 0.24); fs(c, ball(c, 0, 0, w * 0.24, '#5a2a14', 0.3), 1.4);
    for (let i = 0; i < 10; i++) { circ(c, rrange(r, -w * 0.18, w * 0.18), rrange(r, -w * 0.18, w * 0.18), 1.4); c.fillStyle = '#2a0a04'; c.fill(); }
    blob(c, r, w * 0.15, 9, 0.35, -2, -2); c.fillStyle = '#fffaf0'; c.fill();
    holly(c, r, 0, -2, 8);
  } },
  { id: 'elf_workbench', name: t('Toymaker bench'), cat: 'christmas', w: 2, h: 1, layer: 1, light: { radius: 2, color: '#ffd38a', intensity: 0.45 }, tags: 'workbench toys elf workshop christmas', draw: (c, r, w, h) => {
    const W = w * 0.92, H = h * 0.76;
    shadow(c, true); plankBox(c, r, -W / 2, -H / 2, W, H, 2, WOOD_L); shadow(c, false);
    for (let i = 0; i < 3; i++) gift(c, r, -W * 0.36 + i * 18, -H * 0.18, 14, r());
    at(c, W * 0.05, 0, 0.2, () => { rect(c, -10, -14, 20, 28); fs(c, '#c8102e', 1.2); circ(c, 0, -18, 6); fs(c, '#f0c8a0', 1); rect(c, -6, -30, 12, 9); fs(c, '#1a1a1e', 1); });
    for (let i = 0; i < 4; i++) { circ(c, W * 0.25 + rrange(r, -10, 10), rrange(r, -H * 0.3, H * 0.3), 4); fs(c, ball(c, 0, 0, 4, pick(r, XMAS)), 0.8); }
    candle(c, W * 0.42, -H * 0.3, 3.5, '#d01020');
    for (let i = 0; i < 10; i++) { c.beginPath(); c.arc(rrange(r, -W * 0.2, W * 0.3), rrange(r, H * 0.05, H * 0.4), rrange(r, 2, 4), 0, 4); st(c, '#e0b878', 1.1); }
  } },
];
void boulder; void gem; void GOLD; void METAL; void rod; void STONE_L; void WOOD; void WOOD_D; void LINEN; void sparkle;
