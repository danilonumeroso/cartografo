import { t } from '../i18n';
import {
  at, ball, barrelTop, blob, boulder, C2D, circ, clip, cloth, CLOTH, ell, foliage, fs, glow, GOLD, grain, INK, IRON, jar, lin, line, LEAF,
  LEAF_D, LEAF_L, METAL, METAL_D, pick, plankBox, poly, radial, rect, rock, rod, ropeCoil, rrange, rrect, scroll, shade, shadow, StampDef, st,
  STONE, STONE_D, STONE_L, STRAW, STRAW_D, TAU, tub, WOOD, WOOD_D, WOOD_L, PINE_W, PARCH, MARBLE, MARBLE_D,
} from '../art';
import type { Rng } from '../util';
import { mulberry32 } from '../util';

const AWNING: [string, string][] = [['#b83a3a', '#f0e6d0'], ['#2e5a9a', '#f0e6d0'], ['#3a7a3a', '#f0e0a0'], ['#c88a2a', '#7a3a1a'], ['#7a3a8a', '#f0d860']];

/** Striped awning over a rectangle, sloping toward +y. */
function awning(c: C2D, r: Rng, x: number, y: number, w: number, h: number) {
  const [a, b] = pick(r, AWNING), n = Math.max(4, Math.round(w / 16));
  shadow(c, true, 12, 6, 9, 0.5); rect(c, x, y, w, h); c.fillStyle = a; c.fill(); shadow(c, false);
  for (let i = 0; i < n; i++) { rect(c, x + (i * w) / n, y, w / n, h); c.fillStyle = i % 2 ? b : a; c.fill(); }
  rect(c, x, y, w, h); c.fillStyle = lin(c, 0, y, 0, y + h, [[0, 'rgba(255,255,255,0.18)'], [1, 'rgba(0,0,0,0.25)']]); c.fill();
  for (let i = 0; i < n; i++) { c.beginPath(); c.arc(x + ((i + 0.5) * w) / n, y + h, w / n / 2, 0, Math.PI); c.fillStyle = i % 2 ? b : a; c.fill(); st(c, INK, 1.4); }
  rect(c, x, y, w, h); st(c, INK, 2.2);
  line(c, x, y + 2, x + w, y + 2, 'rgba(0,0,0,0.3)', 3);
}
/** Hip roof seen from above. */
export function hipRoof(c: C2D, r: Rng, W: number, H: number, col: string, kind: 'tile' | 'thatch' | 'slate' | 'wood' = 'tile') {
  const ridge = Math.max(0, W - H) / 2;
  const faces: [number[], number][] = [
    [[-W / 2, -H / 2, W / 2, -H / 2, ridge, 0, -ridge, 0], 0.18],
    [[-W / 2, H / 2, W / 2, H / 2, ridge, 0, -ridge, 0], -0.22],
    [[-W / 2, -H / 2, -W / 2, H / 2, -ridge, 0], 0.06],
    [[W / 2, -H / 2, W / 2, H / 2, ridge, 0], -0.12],
  ];
  shadow(c, true, 18, 10, 14, 0.55); rect(c, -W / 2, -H / 2, W, H); c.fillStyle = col; c.fill(); shadow(c, false);
  for (const [pts, k] of faces) {
    clip(c, () => poly(c, pts), () => {
      rect(c, -W / 2, -H / 2, W, H); c.fillStyle = shade(col, k); c.fill();
      const step = kind === 'thatch' ? 5 : kind === 'slate' ? 9 : 11;
      for (let d = 0; d < Math.max(W, H) / 2; d += step) {
        rect(c, -W / 2 + d, -H / 2 + d, W - 2 * d, H - 2 * d); st(c, `rgba(0,0,0,${kind === 'thatch' ? 0.12 : 0.28})`, kind === 'thatch' ? 1 : 1.6);
      }
      if (kind === 'thatch') for (let i = 0; i < W * H / 60; i++) { const x = rrange(r, -W / 2, W / 2), y = rrange(r, -H / 2, H / 2), a = Math.atan2(y, x * (H / W)); line(c, x, y, x + Math.cos(a) * 7, y + Math.sin(a) * 7, pick(r, ['rgba(255,230,150,0.35)', 'rgba(90,60,20,0.35)']), 1); }
      else for (let i = 0; i < W * H / 220; i++) { const x = rrange(r, -W / 2, W / 2), y = rrange(r, -H / 2, H / 2); rect(c, x, y, rrange(r, 6, 12), rrange(r, 4, 8)); c.fillStyle = `rgba(${r() < 0.5 ? '0,0,0' : '255,255,255'},0.08)`; c.fill(); }
      if (kind === 'tile' || kind === 'wood') for (let d = 0; d < Math.max(W, H) / 2; d += 11) for (let s = -W / 2; s < W / 2; s += 14) { line(c, s + ((d / 11) % 2) * 7, -H / 2 + d, s + ((d / 11) % 2) * 7, -H / 2 + d + 11, 'rgba(0,0,0,0.15)', 1); line(c, s + ((d / 11) % 2) * 7, H / 2 - d, s + ((d / 11) % 2) * 7, H / 2 - d - 11, 'rgba(0,0,0,0.15)', 1); }
    });
    poly(c, pts); st(c, 'rgba(20,12,6,0.6)', 1.6);
  }
  line(c, -ridge, 0, ridge, 0, shade(col, -0.45), 5); line(c, -ridge, -1, ridge, -1, shade(col, 0.2), 1.4);
  for (const s of [-1, 1]) for (const t2 of [-1, 1]) line(c, s * W / 2, t2 * H / 2, s * ridge, 0, shade(col, -0.4), 3.4);
  rect(c, -W / 2, -H / 2, W, H); st(c, INK, 2.6);
}
function chimney(c: C2D, x: number, y: number, s = 22) {
  shadow(c, true, 6, 4, 6, 0.5); rect(c, x - s / 2, y - s / 2, s, s); fs(c, '#8a5a44', 1.8); shadow(c, false);
  rect(c, x - s / 2 + 3, y - s / 2 + 3, s - 6, s - 6); c.fillStyle = '#1a100a'; c.fill();
  for (let i = 0; i < 4; i++) { circ(c, x + 8 + i * 6, y - 8 - i * 7, 6 + i * 2.5); c.fillStyle = `rgba(220,220,225,${0.28 - i * 0.05})`; c.fill(); }
}
function goods(c: C2D, r: Rng, x: number, y: number, w: number, h: number) {
  const kind = Math.floor(r() * 4);
  clip(c, () => rect(c, x, y, w, h), () => {
    const n = Math.round(w * h / 60);
    for (let i = 0; i < n; i++) {
      const px = x + r() * w, py = y + r() * h;
      if (kind === 0) { circ(c, px, py, 4.5); fs(c, ball(c, px, py, 4.5, pick(r, ['#c0392b', '#e6b422', '#6aa84f', '#e8822a'])), 0.8); }
      else if (kind === 1) { ell(c, px, py, 7, 3, r() * 3); fs(c, ball(c, px, py, 7, pick(r, ['#a8b8c0', '#8a9aa8'])), 0.8); }
      else if (kind === 2) { rect(c, px - 4, py - 4, 8, 8); fs(c, pick(r, CLOTH), 0.8); }
      else { circ(c, px, py, 5); fs(c, ball(c, px, py, 5, pick(r, ['#b06a3e', '#8a6a4a', '#c8b898'])), 0.8); circ(c, px, py, 2); c.fillStyle = '#1e120a'; c.fill(); }
    }
  });
}

export const TOWN: StampDef[] = [
  { id: 'market_stall', name: t('Market stall'), cat: 'town', w: 2, h: 2, layer: 1, tags: 'market stall shop merchant awning bazaar', draw: (c, r, w, h) => {
    const W = w * 0.86;
    shadow(c, true); plankBox(c, r, -W / 2, h * 0.08, W, h * 0.3, 1, WOOD); shadow(c, false);
    goods(c, r, -W / 2 + 4, h * 0.1, W - 8, h * 0.26);
    awning(c, r, -W / 2 - 4, -h * 0.44, W + 8, h * 0.46);
    for (let i = 0; i < 3; i++) { const x = -W * 0.3 + i * W * 0.3; rect(c, x - 9, h * 0.4, 18, 14); fs(c, WOOD_L, 1.4); }
  } },
  { id: 'fruit_stall', name: t('Produce cart'), cat: 'town', w: 2, h: 1.4, layer: 1, tags: 'market cart vegetables fruit vendor', draw: (c, r, w, h) => {
    const W = w * 0.7, H = h * 0.6;
    for (const s of [-1, 1]) { ell(c, s * (W / 2 + 4), H * 0.15, 6, H * 0.36); fs(c, WOOD_D, 1.6); }
    rod(c, W / 2, -H * 0.1, w * 0.48, -H * 0.2, WOOD_D, 4); rod(c, W / 2, H * 0.3, w * 0.48, H * 0.4, WOOD_D, 4);
    shadow(c, true); rect(c, -W / 2, -H / 2, W, H); fs(c, WOOD); shadow(c, false);
    for (let i = 0; i < 3; i++) { rect(c, -W / 2 + 4 + i * (W - 8) / 3, -H / 2 + 4, (W - 8) / 3 - 3, H - 8); c.fillStyle = '#3a2614'; c.fill(); goods(c, r, -W / 2 + 4 + i * (W - 8) / 3, -H / 2 + 4, (W - 8) / 3 - 3, H - 8); }
    at(c, -W * 0.05, -H * 0.15, 0, () => { c.save(); c.globalAlpha = 0.92; ell(c, 0, 0, W * 0.35, W * 0.35); c.fillStyle = pick(r, AWNING)[0]; c.fill(); c.restore(); for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU; line(c, 0, 0, Math.cos(a) * W * 0.35, Math.sin(a) * W * 0.35, 'rgba(255,255,255,0.4)', 1.4); } ell(c, 0, 0, W * 0.35, W * 0.35); st(c, INK, 2); circ(c, 0, 0, 3); fs(c, WOOD_D, 1); });
  } },
  { id: 'covered_wagon', name: t('Covered wagon'), cat: 'town', w: 1.6, h: 3, layer: 1, tags: 'wagon caravan travel cart canvas', draw: (c, r, w, h) => {
    const W = w * 0.64, H = h * 0.62;
    for (const sx of [-1, 1]) for (const sy of [-0.32, 0.32]) { rrect(c, sx * (W / 2 + 3) - 5, sy * H - 16, 10, 32, 4); fs(c, WOOD_D, 1.6); }
    rod(c, -W * 0.15, -H / 2, -W * 0.1, -h * 0.48, WOOD_D, 5); rod(c, W * 0.15, -H / 2, W * 0.1, -h * 0.48, WOOD_D, 5); rod(c, -W * 0.25, -h * 0.4, W * 0.25, -h * 0.4, WOOD_D, 4);
    shadow(c, true, 12, 6, 8); rrect(c, -W / 2 - 4, -H / 2, W + 8, H, 12); fs(c, lin(c, -W / 2, 0, W / 2, 0, [[0, '#d8ccb0'], [0.35, '#f4ecd8'], [1, '#a89a7a']]), 2.2); shadow(c, false);
    for (let i = 1; i < 6; i++) { const y = -H / 2 + (i * H) / 6; line(c, -W / 2 - 4, y, W / 2 + 4, y, 'rgba(90,70,40,0.35)', 3); }
    rrect(c, -W / 2 - 4, -H / 2, W + 8, H, 12); st(c, INK, 2.2);
    ell(c, 0, -H / 2 + 6, W * 0.3, 7); c.fillStyle = '#2a1a0e'; c.fill();
  } },
  { id: 'wheelbarrow', name: t('Wheelbarrow'), cat: 'town', w: 0.8, h: 1.4, layer: 1, tags: 'barrow cart farm garden', draw: (c, r, w, h) => {
    const W = w * 0.62, H = h * 0.5;
    rrect(c, -4, -h * 0.44, 8, 16, 3); fs(c, '#3a3a3a', 1.4);
    for (const s of [-1, 1]) rod(c, s * W * 0.32, -H * 0.4, s * W * 0.38, h * 0.44, WOOD, 3.5);
    shadow(c, true, 6, 3, 5); poly(c, [-W / 2, -H / 2, W / 2, -H / 2, W * 0.4, H / 2, -W * 0.4, H / 2]); fs(c, lin(c, 0, -H / 2, 0, H / 2, [[0, '#8a9098'], [1, '#4a5058']])); shadow(c, false);
    poly(c, [-W / 2 + 5, -H / 2 + 5, W / 2 - 5, -H / 2 + 5, W * 0.4 - 4, H / 2 - 5, -W * 0.4 + 4, H / 2 - 5]); c.fillStyle = '#3a2a1a'; c.fill();
    const k = r();
    clip(c, () => poly(c, [-W / 2 + 5, -H / 2 + 5, W / 2 - 5, -H / 2 + 5, W * 0.4 - 4, H / 2 - 5, -W * 0.4 + 4, H / 2 - 5]), () => {
      for (let i = 0; i < 18; i++) { const x = rrange(r, -W / 2, W / 2), y = rrange(r, -H / 2, H / 2); if (k < 0.5) rock(c, r, x, y, rrange(r, 4, 7), '#8a8276'); else { circ(c, x, y, 4); fs(c, ball(c, x, y, 4, '#7a5a3a'), 0.8); } }
    });
  } },
  { id: 'hay_bales', name: t('Hay bales'), cat: 'town', w: 1.6, h: 1.2, layer: 1, tags: 'hay straw bales farm barn', draw: (c, r, w, h) => {
    const bale = (x: number, y: number, rot: number) => at(c, x, y, rot, () => {
      shadow(c, true, 6, 3, 5); rrect(c, -w * 0.22, -h * 0.17, w * 0.44, h * 0.34, 4); fs(c, lin(c, 0, -h * 0.17, 0, h * 0.17, [[0, '#e8cc78'], [1, '#b8963c']]), 1.8); shadow(c, false);
      clip(c, () => rrect(c, -w * 0.22, -h * 0.17, w * 0.44, h * 0.34, 4), () => { for (let i = 0; i < 60; i++) { const x0 = rrange(r, -w * 0.22, w * 0.22), y0 = rrange(r, -h * 0.17, h * 0.17); line(c, x0, y0, x0 + rrange(r, -6, 6), y0 + rrange(r, -2, 2), pick(r, ['#f8e090', '#a08030', '#d0b060']), 1); } });
      for (const s of [-1, 1]) line(c, s * w * 0.1, -h * 0.17, s * w * 0.1, h * 0.17, '#6a4a1a', 2);
    });
    bale(-w * 0.2, h * 0.18, 0.05); bale(w * 0.22, h * 0.15, -0.05); bale(0, -h * 0.18, rrange(r, -0.2, 0.2));
  } },
  { id: 'haystack', name: t('Haystack'), cat: 'town', w: 1.8, h: 1.8, layer: 1, tags: 'hay stack straw farm', draw: (c, r, w) => {
    const R = w * 0.4;
    shadow(c, true, 12, 6, 9); blob(c, r, R, 16, 0.08); fs(c, radial(c, 0, 0, R, '#f0d888', '#a8883a', 0.35), 2.2); shadow(c, false);
    for (let i = 0; i < 260; i++) { const a = r() * TAU, d = Math.sqrt(r()) * R * 0.95; const x = Math.cos(a) * d, y = Math.sin(a) * d; line(c, x, y, x + Math.cos(a) * 7, y + Math.sin(a) * 7, (-x - y) > 0 ? 'rgba(255,240,180,0.6)' : 'rgba(110,80,20,0.5)', 1); }
    circ(c, 0, 0, 4); fs(c, WOOD_D, 1);
  } },
  { id: 'trough', name: t('Water trough'), cat: 'town', w: 1.5, h: 0.6, layer: 1, tags: 'trough water horses stable farm', draw: (c, r, w, h) => {
    const W = w * 0.9, H = h * 0.7;
    shadow(c, true, 6, 2, 4); plankBox(c, r, -W / 2, -H / 2, W, H, 1, WOOD_D); shadow(c, false);
    rect(c, -W / 2 + 5, -H / 2 + 5, W - 10, H - 10); fs(c, radial(c, 0, 0, W * 0.45, '#5a9ab0', '#1e4a5a', 0), 1.2);
    for (let i = 0; i < 3; i++) { ell(c, rrange(r, -W * 0.3, W * 0.3), rrange(r, -H * 0.15, H * 0.15), rrange(r, 6, 12), 2, 0); c.fillStyle = 'rgba(255,255,255,0.25)'; c.fill(); }
    for (const s of [-1, 1]) { rect(c, s * W * 0.3 - 3, -H / 2, 6, H); fs(c, METAL_D, 1); }
  } },
  { id: 'scarecrow', name: t('Scarecrow'), cat: 'town', w: 1.2, h: 1, layer: 1, tags: 'scarecrow farm field crows', draw: (c, r, w, h) => {
    rod(c, -w * 0.42, 0, w * 0.42, 0, WOOD_D, 5);
    shadow(c, true, 6, 4, 6); cloth(c, r, -w * 0.38, -h * 0.12, w * 0.76, h * 0.24, pick(r, ['#7a4a2a', '#4a5a7a', '#8a2a2a']), 3); shadow(c, false);
    for (const s of [-1, 1]) for (let i = 0; i < 5; i++) line(c, s * w * 0.4, rrange(r, -5, 5), s * w * 0.48, rrange(r, -8, 8), STRAW, 1.4);
    shadow(c, true, 4, 3, 4); circ(c, 0, 0, h * 0.16); fs(c, ball(c, 0, 0, h * 0.16, '#d8c090', 0.25), 1.6); shadow(c, false);
    circ(c, 0, 0, h * 0.22); st(c, INK, 6); circ(c, 0, 0, h * 0.22); st(c, '#8a6a3a', 4);
    circ(c, 0, 0, h * 0.13); fs(c, ball(c, 0, 0, h * 0.13, '#9a7a42', 0.3), 1.4);
    for (let i = 0; i < 3; i++) { const a = r() * TAU, d = rrange(r, w * 0.3, w * 0.45); at(c, Math.cos(a) * d, Math.sin(a) * d, r() * TAU, () => { ell(c, 0, 0, 5, 3); c.fillStyle = '#1a1a1e'; c.fill(); poly(c, [5, -1, 9, 0, 5, 1]); c.fillStyle = '#d0a030'; c.fill(); }); }
  } },
  { id: 'chicken_coop', name: t('Chicken coop'), cat: 'town', w: 1.6, h: 1.4, layer: 1, tags: 'chickens coop hens farm', draw: (c, r, w, h) => {
    at(c, 0, -h * 0.08, 0, () => hipRoof(c, r, w * 0.7, h * 0.5, '#8a5a3a', 'wood'));
    rod(c, -w * 0.4, h * 0.2, w * 0.4, h * 0.2, WOOD, 3); rod(c, -w * 0.4, h * 0.2, -w * 0.4, h * 0.46, WOOD, 3); rod(c, w * 0.4, h * 0.2, w * 0.4, h * 0.46, WOOD, 3); rod(c, -w * 0.4, h * 0.46, w * 0.4, h * 0.46, WOOD, 3);
    for (let i = 0; i < 4; i++) { const x = rrange(r, -w * 0.34, w * 0.34), y = rrange(r, h * 0.26, h * 0.42); at(c, x, y, r() * TAU, () => { ell(c, 0, 0, 6, 4.5); fs(c, pick(r, ['#f4f0e8', '#c8783a', '#8a4a22']), 1); circ(c, 5, 0, 2.6); fs(c, '#f4f0e8', 0.6); poly(c, [7, -0.8, 9.5, 0, 7, 0.8]); c.fillStyle = '#e0a020'; c.fill(); circ(c, 5, -1.2, 1); c.fillStyle = '#c02020'; c.fill(); }); }
    for (let i = 0; i < 16; i++) { circ(c, rrange(r, -w * 0.38, w * 0.38), rrange(r, h * 0.22, h * 0.44), 0.9); c.fillStyle = '#e8d080'; c.fill(); }
  } },
  { id: 'outhouse', name: t('Outhouse'), cat: 'town', w: 1, h: 1, layer: 1, tags: 'latrine toilet privy', draw: (c, r, w) => { hipRoof(c, r, w * 0.66, w * 0.66, '#7a5a3a', 'wood'); at(c, 0, -w * 0.25, 0, () => { c.beginPath(); c.arc(0, 0, 4, 0.2, Math.PI - 0.2, true); st(c, '#f0d860', 2); }); } },
  { id: 'water_pump', name: t('Water pump'), cat: 'town', w: 0.7, h: 0.7, layer: 1, tags: 'pump well water', draw: (c, r, w) => {
    const R = w * 0.18;
    blob(c, r, w * 0.3, 9, 0.2, w * 0.05, w * 0.12); c.fillStyle = 'rgba(40,80,110,0.4)'; c.fill();
    shadow(c, true, 5, 2, 4); circ(c, 0, 0, R); fs(c, ball(c, 0, 0, R, '#3a5a4a', 0.3), 1.8); shadow(c, false);
    rod(c, 0, 0, w * 0.3, -w * 0.25, '#2a3a32', 3); circ(c, w * 0.3, -w * 0.25, 3); fs(c, '#2a3a32', 1);
    rod(c, 0, 0, 0, w * 0.22, '#2a3a32', 4);
  } },
  { id: 'town_fountain', name: t('Town fountain'), cat: 'town', w: 3, h: 3, layer: 1, tags: 'fountain plaza square statue water', draw: (c, r, w) => {
    const R = w * 0.44, n = 8;
    const oct = (rad: number) => poly(c, Array.from({ length: n * 2 }, (_, i) => (i % 2 ? Math.sin : Math.cos)((Math.floor(i / 2) / n) * TAU + Math.PI / n) * rad));
    shadow(c, true, 12, 5, 8); oct(R); fs(c, lin(c, -R, -R, R, R, [[0, MARBLE], [1, MARBLE_D]]), 2.4); shadow(c, false);
    oct(R * 0.86); fs(c, radial(c, 0, 0, R * 0.86, '#8ad0e0', '#2a7090', 0), 1.8);
    clip(c, () => oct(R * 0.86), () => { for (let k = 1; k < 6; k++) { circ(c, 0, 0, R * 0.18 * k + rrange(r, -3, 3)); st(c, 'rgba(230,250,255,0.35)', 1.6); } for (let i = 0; i < 6; i++) { const a = r() * TAU, d = rrange(r, R * 0.3, R * 0.7); circ(c, Math.cos(a) * d, Math.sin(a) * d, 2.4); c.fillStyle = GOLD; c.fill(); } });
    circ(c, 0, 0, R * 0.32); fs(c, lin(c, -R * 0.3, -R * 0.3, R * 0.3, R * 0.3, [[0, MARBLE], [1, MARBLE_D]]), 2);
    circ(c, 0, 0, R * 0.24); fs(c, radial(c, 0, 0, R * 0.24, '#a8e0f0', '#3a88a8', 0), 1.4);
    for (let i = 0; i < 4; i++) { const a = (i / 4) * TAU + Math.PI / 4; c.beginPath(); c.moveTo(Math.cos(a) * R * 0.1, Math.sin(a) * R * 0.1); c.quadraticCurveTo(Math.cos(a) * R * 0.3, Math.sin(a) * R * 0.3 - 10, Math.cos(a) * R * 0.5, Math.sin(a) * R * 0.5); st(c, 'rgba(240,252,255,0.7)', 2.4); }
    circ(c, 0, 0, R * 0.1); fs(c, ball(c, 0, 0, R * 0.1, MARBLE), 1.6);
  } },
  { id: 'notice_board', name: t('Notice board'), cat: 'town', w: 1.3, h: 0.5, layer: 1, tags: 'bounty board quests notices', draw: (c, r, w, h) => {
    const W = w * 0.86, H = h * 0.5;
    for (const s of [-1, 1]) { shadow(c, true, 4, 2, 3); rect(c, s * W / 2 - 5, -5, 10, 10); fs(c, WOOD_D, 1.4); shadow(c, false); }
    shadow(c, true, 6, 3, 5); plankBox(c, r, -W / 2, -H / 2, W, H, 1, WOOD); shadow(c, false);
    rrect(c, -W / 2 - 3, -H / 2 - 7, W + 6, 8, 2); fs(c, WOOD_D, 1.4);
    for (let i = 0; i < 5; i++) at(c, -W * 0.38 + i * W * 0.19, rrange(r, -2, 2), rrange(r, -0.12, 0.12), () => { rect(c, -9, -H * 0.36, 18, H * 0.72); fs(c, pick(r, [PARCH, '#f0e8d0', '#e8d8b0']), 0.8); for (let k = 0; k < 3; k++) line(c, -6, -H * 0.2 + k * 4, 6, -H * 0.2 + k * 4, 'rgba(40,30,20,0.5)', 0.8); circ(c, 0, -H * 0.3, 1.4); c.fillStyle = '#a02020'; c.fill(); });
  } },
  { id: 'stone_bench', name: t('Stone bench'), cat: 'town', w: 1.6, h: 0.6, layer: 1, tags: 'bench seat park plaza', draw: (c, r, w, h) => {
    const W = w * 0.86, H = h * 0.5;
    for (const s of [-1, 1]) { shadow(c, true, 4, 2, 3); rect(c, s * W * 0.38 - 7, -H / 2 - 2, 14, H + 4); fs(c, STONE_D, 1.4); shadow(c, false); }
    shadow(c, true, 6, 3, 5); rrect(c, -W / 2, -H / 2, W, H, 4); fs(c, lin(c, 0, -H / 2, 0, H / 2, [[0, STONE_L], [1, STONE]]), 1.8); shadow(c, false);
    for (let i = 0; i < 3; i++) { blob(c, r, rrange(r, 2, 5), 6, 0.3, rrange(r, -W * 0.4, W * 0.4), rrange(r, -H * 0.3, H * 0.3)); c.fillStyle = 'rgba(90,120,50,0.4)'; c.fill(); }
  } },
  { id: 'planter', name: t('Flower planter'), cat: 'town', w: 1.2, h: 0.5, layer: 1, tags: 'flower box planter garden window', draw: (c, r, w, h) => {
    const W = w * 0.88, H = h * 0.66;
    shadow(c, true, 5, 2, 4); plankBox(c, r, -W / 2, -H / 2, W, H, 1, WOOD_D); shadow(c, false);
    rect(c, -W / 2 + 4, -H / 2 + 4, W - 8, H - 8); c.fillStyle = '#3a2614'; c.fill();
    const col = pick(r, ['#e83a5a', '#f0d030', '#b070e0', '#ff8a3a', '#ffffff']);
    for (let i = 0; i < 14; i++) { const x = rrange(r, -W * 0.42, W * 0.42), y = rrange(r, -H * 0.35, H * 0.35); circ(c, x + 3, y + 2, 4); c.fillStyle = pick(r, ['#4a8a3a', '#3a7a2a']); c.fill(); }
    for (let i = 0; i < 9; i++) { const x = rrange(r, -W * 0.42, W * 0.42), y = rrange(r, -H * 0.3, H * 0.3); for (let p = 0; p < 5; p++) { const q = (p / 5) * TAU; circ(c, x + Math.cos(q) * 2.4, y + Math.sin(q) * 2.4, 2.2); c.fillStyle = col; c.fill(); } circ(c, x, y, 1.2); c.fillStyle = '#f0c030'; c.fill(); }
  } },
  { id: 'crate_stack', name: t('Crate stack'), cat: 'town', w: 1.6, h: 1.6, layer: 1, tags: 'crates boxes cargo warehouse storage', draw: (c, r, w) => {
    const crate = (x: number, y: number, S: number, rot: number, lift: number) => at(c, x, y, rot, () => {
      shadow(c, true, 6 + lift * 4, 3 + lift * 2, 5 + lift * 3); rect(c, -S / 2, -S / 2, S, S); fs(c, shade(WOOD_L, lift * 0.1)); shadow(c, false);
      rect(c, -S / 2, -S / 2, S, S); woodPlanksLocal(c, S);
      c.strokeStyle = WOOD_D; c.lineWidth = 5; c.strokeRect(-S / 2 + 3, -S / 2 + 3, S - 6, S - 6);
      line(c, -S / 2 + 4, -S / 2 + 4, S / 2 - 4, S / 2 - 4, WOOD_D, 5);
      rect(c, -S / 2, -S / 2, S, S); st(c, INK, 2);
    });
    const S = w * 0.36;
    crate(-S * 0.55, S * 0.5, S, rrange(r, -0.1, 0.1), 0); crate(S * 0.55, S * 0.45, S, rrange(r, -0.1, 0.1), 0); crate(S * 0.1, -S * 0.6, S, rrange(r, -0.1, 0.1), 0);
    crate(0, S * 0.05, S * 0.9, rrange(r, -0.3, 0.3), 1);
  } },
  { id: 'hero_statue', name: t('Hero statue'), cat: 'town', w: 1.6, h: 1.6, layer: 1, tags: 'statue monument plaza founder', draw: (c, r, w) => {
    const S = w * 0.8;
    shadow(c, true, 14, 7, 10); rect(c, -S / 2, -S / 2, S, S); fs(c, STONE_D); shadow(c, false);
    rect(c, -S / 2 + 6, -S / 2 + 6, S - 12, S - 12); fs(c, STONE, 1.4); rect(c, -S / 2 + 14, -S / 2 + 14, S - 28, S - 28); fs(c, STONE_L, 1.2);
    shadow(c, true, 8, 4, 6); ell(c, 0, 4, S * 0.3, S * 0.18); fs(c, ball(c, 0, 4, S * 0.3, '#5a8a7a', 0.25), 1.6);
    c.beginPath(); c.moveTo(S * 0.22, 0); c.lineTo(S * 0.42, -S * 0.32); st(c, INK, 6); st(c, '#5a8a7a', 4);
    circ(c, 0, -2, S * 0.12); fs(c, ball(c, 0, -2, S * 0.12, '#6a9a8a', 0.3), 1.6); shadow(c, false);
    rect(c, -S * 0.2, S / 2 - 10, S * 0.4, 6); c.fillStyle = GOLD; c.fill();
  } },
  { id: 'stone_wall', name: t('Low stone wall'), cat: 'town', w: 2, h: 0.5, layer: 1, tags: 'wall dry stone field boundary', draw: (c, r, w, h) => {
    let x = -w * 0.48;
    while (x < w * 0.46) { const R = rrange(r, 8, 13); boulder(c, r, x + R, rrange(r, -3, 3), R, pick(r, ['#8e897e', '#9a958c', '#7e796f'])); x += R * 1.6; }
    void h;
  } },
  { id: 'picket_fence', name: t('Picket fence'), cat: 'town', w: 2, h: 0.3, layer: 1, tags: 'fence white picket garden', draw: (c, r, w) => {
    const W = w * 0.98, col = pick(r, ['#f0ece2', '#e8e0cc', '#c8a070']);
    shadow(c, true, 3, 2, 3); rod(c, -W / 2, 0, W / 2, 0, shade(col, -0.2), 3); shadow(c, false);
    for (let i = 0; i <= 14; i++) { const x = -W / 2 + (W * i) / 14; rect(c, x - 3, -6, 6, 12); fs(c, col, 1.2); }
  } },
  { id: 'gate', name: t('Wooden gate'), cat: 'town', w: 2, h: 0.4, layer: 1, tags: 'gate fence farm entrance', draw: (c, r, w, h) => {
    const W = w * 0.9;
    for (const s of [-1, 1]) { shadow(c, true, 4, 2, 3); rect(c, s * W / 2 - 7, -7, 14, 14); fs(c, WOOD_D, 1.6); shadow(c, false); }
    at(c, -W / 2 + 7, 0, -0.35, () => { shadow(c, true, 4, 2, 3); rect(c, 0, -4, W * 0.46, 8); fs(c, WOOD, 1.4); shadow(c, false); line(c, 4, -2, W * 0.44, 2, WOOD_D, 1.4); });
    at(c, W / 2 - 7, 0, Math.PI + 0.35, () => { shadow(c, true, 4, 2, 3); rect(c, 0, -4, W * 0.46, 8); fs(c, WOOD, 1.4); shadow(c, false); line(c, 4, -2, W * 0.44, 2, WOOD_D, 1.4); });
    void h; void r;
  } },
  { id: 'well_roofed', name: t('Roofed well'), cat: 'town', w: 2, h: 2, layer: 2, tags: 'well water roof village', draw: (c, r, w) => {
    const R = w * 0.28;
    shadow(c, true, 8, 4, 6); circ(c, 0, 0, R); fs(c, STONE); shadow(c, false);
    hipRoof(c, r, w * 0.84, w * 0.56, '#8a4a2e', 'tile');
    rod(c, w * 0.42, 0, w * 0.48, 0, WOOD_D, 4); circ(c, w * 0.48, 0, 5); fs(c, WOOD, 1.2);
  } },
  { id: 'cottage_roof', name: t('Thatched cottage'), cat: 'town', w: 4, h: 3, layer: 2, tags: 'house roof cottage village thatch building', draw: (c, r, w, h) => { hipRoof(c, r, w * 0.9, h * 0.88, '#c8a050', 'thatch'); chimney(c, w * 0.22, -h * 0.12); } },
  { id: 'house_roof', name: t('Tiled house'), cat: 'town', w: 4, h: 3, layer: 2, tags: 'house roof building town tiles red', draw: (c, r, w, h) => { hipRoof(c, r, w * 0.9, h * 0.88, pick(r, ['#a8482e', '#8a3a28', '#b8583a']), 'tile'); chimney(c, -w * 0.25, h * 0.15); } },
  { id: 'manor_roof', name: t('Slate manor'), cat: 'town', w: 5, h: 4, layer: 2, tags: 'manor roof slate house noble building', draw: (c, r, w, h) => { hipRoof(c, r, w * 0.92, h * 0.9, pick(r, ['#4a525e', '#3a4250', '#5a5a66']), 'slate'); chimney(c, -w * 0.3, -h * 0.2, 24); chimney(c, w * 0.3, h * 0.2, 24); } },
  { id: 'tower_roof', name: t('Round tower'), cat: 'town', w: 3, h: 3, layer: 2, tags: 'tower roof cone turret castle', draw: (c, r, w) => {
    const R = w * 0.44, n = 16, col = pick(r, ['#4a525e', '#8a3a28', '#3a5a7a']);
    shadow(c, true, 18, 10, 14, 0.55); circ(c, 0, 0, R); c.fillStyle = col; c.fill(); shadow(c, false);
    for (let i = 0; i < n; i++) { const a0 = (i / n) * TAU, a1 = ((i + 1) / n) * TAU; poly(c, [0, 0, Math.cos(a0) * R, Math.sin(a0) * R, Math.cos(a1) * R, Math.sin(a1) * R]); c.fillStyle = shade(col, -Math.cos((a0 + a1) / 2 - Math.PI * 1.25) * 0.25); c.fill(); st(c, 'rgba(0,0,0,0.25)', 1.2); }
    for (let k = 1; k < 8; k++) { circ(c, 0, 0, (R * k) / 8); st(c, 'rgba(0,0,0,0.2)', 1); }
    circ(c, 0, 0, R); st(c, INK, 2.6);
    circ(c, 0, 0, 6); fs(c, GOLD, 1.4);
  } },
  { id: 'bridge_wood', name: t('Wooden bridge'), cat: 'town', w: 2, h: 4, layer: 1, tags: 'bridge planks river crossing', draw: (c, r, w, h) => {
    const W = w * 0.7, H = h * 0.96;
    shadow(c, true, 12, 6, 9); rect(c, -W / 2, -H / 2, W, H); c.fillStyle = WOOD_D; c.fill(); shadow(c, false);
    const n = 22;
    for (let i = 0; i < n; i++) { const y = -H / 2 + (i * H) / n; at(c, rrange(r, -1.5, 1.5), 0, 0, () => { plankBox(c, r, -W / 2, y + 0.5, W, H / n - 1, 1, shade(WOOD, rrange(r, -0.15, 0.1)), false, 1, 1.2); }); }
    for (const s of [-1, 1]) { rod(c, s * (W / 2 + 3), -H / 2, s * (W / 2 + 3), H / 2, WOOD_D, 5); for (let i = 0; i < 5; i++) { const y = -H / 2 + (i * H) / 4; circ(c, s * (W / 2 + 3), y, 6); fs(c, ball(c, 0, 0, 6, WOOD), 1.4); } }
  } },
  { id: 'bridge_stone', name: t('Stone bridge'), cat: 'town', w: 2.4, h: 4, layer: 1, tags: 'bridge stone arch river crossing', draw: (c, r, w, h) => {
    const W = w * 0.66, H = h * 0.96;
    shadow(c, true, 14, 7, 10); rect(c, -W / 2, -H / 2, W, H); c.fillStyle = STONE_D; c.fill(); shadow(c, false);
    clip(c, () => rect(c, -W / 2, -H / 2, W, H), () => { for (let row = 0; row < 18; row++) { let x = -W / 2 - (row % 2) * 12; while (x < W / 2) { const ww = rrange(r, 18, 30); rect(c, x, -H / 2 + (row * H) / 18, ww, H / 18); fs(c, shade('#8e897e', rrange(r, -0.12, 0.12)), 1.2, 'rgba(30,25,20,0.8)'); x += ww; } } });
    for (const s of [-1, 1]) { rect(c, s * (W / 2 + 6) - 6, -H / 2, 12, H); fs(c, lin(c, s * W / 2 - 6, 0, s * W / 2 + 6, 0, [[0, STONE_L], [1, STONE_D]]), 2); for (let i = 0; i < 12; i++) line(c, s * (W / 2 + 6) - 6, -H / 2 + (i * H) / 12, s * (W / 2 + 6) + 6, -H / 2 + (i * H) / 12, 'rgba(0,0,0,0.3)', 1); }
  } },
  { id: 'gallows', name: t('Gallows'), cat: 'town', w: 1.6, h: 2, layer: 1, tags: 'gallows execution hanging noose scaffold', draw: (c, r, w, h) => {
    const W = w * 0.8, H = h * 0.72;
    shadow(c, true, 10, 5, 8); plankBox(c, r, -W / 2, -H / 2 + h * 0.08, W, H, 6, WOOD, true); shadow(c, false);
    rect(c, -W * 0.18, -H * 0.05, W * 0.36, W * 0.36); fs(c, '#1a0e08', 1.6);
    for (let i = 0; i < 3; i++) { rect(c, -W * 0.15, H / 2 + h * 0.08 + i * 9, W * 0.3, 8); fs(c, WOOD_L, 1.2); }
    shadow(c, true, 8, 6, 10); rod(c, W * 0.38, -H / 2 + h * 0.1, W * 0.38, -H * 0.05, WOOD_D, 9); rod(c, W * 0.38, -H * 0.02, -W * 0.02, -H * 0.02, WOOD_D, 7); shadow(c, false);
    line(c, 0, -H * 0.02, 0, H * 0.08, '#c8a868', 2); circ(c, 0, H * 0.12, 7); st(c, INK, 3.6); circ(c, 0, H * 0.12, 7); st(c, '#c8a868', 2);
  } },
  { id: 'windmill', name: t('Windmill'), cat: 'town', w: 4, h: 4, layer: 2, tags: 'windmill mill sails farm grain', draw: (c, r, w) => {
    const R = w * 0.2;
    shadow(c, true, 18, 10, 14, 0.5); circ(c, 0, 0, R); c.fillStyle = '#5a4a3a'; c.fill(); shadow(c, false);
    for (let i = 0; i < 12; i++) { const a0 = (i / 12) * TAU, a1 = ((i + 1) / 12) * TAU; poly(c, [0, 0, Math.cos(a0) * R, Math.sin(a0) * R, Math.cos(a1) * R, Math.sin(a1) * R]); c.fillStyle = shade('#7a6a54', -Math.cos((a0 + a1) / 2 - Math.PI * 1.25) * 0.25); c.fill(); st(c, 'rgba(0,0,0,0.2)', 1); }
    circ(c, 0, 0, R); st(c, INK, 2.4);
    const rot = r() * TAU;
    for (let i = 0; i < 4; i++) at(c, 0, 0, rot + (i * Math.PI) / 2, () => {
      shadow(c, true, 10, 12, 16, 0.4); rod(c, 0, 0, w * 0.46, 0, WOOD_D, 5); shadow(c, false);
      rect(c, w * 0.1, 3, w * 0.34, w * 0.09); fs(c, 'rgba(240,232,214,0.92)', 1.6);
      for (let k = 1; k < 6; k++) line(c, w * 0.1 + k * w * 0.057, 3, w * 0.1 + k * w * 0.057, 3 + w * 0.09, WOOD_D, 1.2);
      line(c, w * 0.1, 3 + w * 0.045, w * 0.44, 3 + w * 0.045, WOOD_D, 1.2);
    });
    circ(c, 0, 0, 9); fs(c, ball(c, 0, 0, 9, WOOD), 1.6);
  } },
  { id: 'flagpole', name: t('Banner pole'), cat: 'town', w: 1.2, h: 0.6, layer: 2, tags: 'flag banner pole standard heraldry', draw: (c, r, w, h) => {
    const col = pick(r, ['#9b2c2c', '#2c4f9b', '#3f7a3a', '#7a3f8a', '#c89a2a']);
    shadow(c, true, 6, 8, 12, 0.4);
    c.beginPath(); c.moveTo(-w * 0.38, -h * 0.25); c.bezierCurveTo(-w * 0.1, -h * 0.4, w * 0.1, -h * 0.1, w * 0.42, -h * 0.25); c.lineTo(w * 0.32, 0); c.lineTo(w * 0.42, h * 0.25); c.bezierCurveTo(w * 0.1, h * 0.1, -w * 0.1, h * 0.4, -w * 0.38, h * 0.25); c.closePath();
    fs(c, lin(c, -w * 0.4, 0, w * 0.4, 0, [[0, shade(col, 0.1)], [0.5, shade(col, -0.15)], [1, shade(col, 0.1)]]), 1.8); shadow(c, false);
    circ(c, -w * 0.05, 0, h * 0.14); fs(c, GOLD, 1.2);
    circ(c, -w * 0.4, 0, 6); fs(c, ball(c, 0, 0, 6, WOOD_D), 1.6); circ(c, -w * 0.4, 0, 2.5); fs(c, GOLD, 0.8);
  } },
  { id: 'barrel_planter', name: t('Barrel planter'), cat: 'town', w: 0.8, h: 0.8, layer: 1, tags: 'barrel planter flowers garden herbs', draw: (c, r, w) => {
    tub(c, 0, 0, w * 0.38, (R) => { circ(c, 0, 0, R); c.fillStyle = '#3a2614'; c.fill(); });
    foliage(c, r, w * 0.26, { base: LEAF, light: LEAF_L, dark: LEAF_D }, { lobes: 6, blossom: pick(r, ['#ff6a8a', '#ffd040', '#ffffff', '#b080f0']), leafy: 30 });
  } },
  { id: 'hitching_post', name: t('Hitching post'), cat: 'town', w: 1.4, h: 0.4, layer: 1, tags: 'hitching post horses rail tavern', draw: (c, r, w) => {
    const W = w * 0.86;
    for (const s of [-1, 1]) { shadow(c, true, 4, 2, 3); circ(c, s * W / 2, 0, 7); fs(c, ball(c, 0, 0, 7, WOOD_D), 1.6); shadow(c, false); }
    shadow(c, true, 4, 3, 4); rod(c, -W / 2, 0, W / 2, 0, WOOD, 6); shadow(c, false);
    for (let i = 0; i < 2; i++) { const x = rrange(r, -W * 0.3, W * 0.3); c.beginPath(); c.moveTo(x, 0); c.quadraticCurveTo(x + 6, 12, x - 2, 20); st(c, INK, 3); st(c, '#8a5a2a', 1.6); }
  } },
];

function woodPlanksLocal(c: C2D, S: number) {
  c.save(); c.clip(); for (let i = 1; i < 4; i++) line(c, -S / 2, -S / 2 + (S * i) / 4, S / 2, -S / 2 + (S * i) / 4, 'rgba(40,20,5,0.45)', 1.2); c.restore();
}
void barrelTop; void boulder; void glow; void grain; void IRON; void jar; void METAL; void ropeCoil; void scroll; void STRAW_D; void PINE_W; void mulberry32; void foliage;
