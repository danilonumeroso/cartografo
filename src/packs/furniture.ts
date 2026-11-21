import { t } from '../i18n';
import {
  at, ball, blob, candle, circ, clip, cloth, CLOTH, coin, DARKWOOD, ell, flame, fs, glow, GOLD, GOLD_D, GOLD_L, grain, INK, jar, lin, line,
  LINEN, METAL, METAL_D, OAK, OAK_L, openBook, pick, plankBox, poly, radial, rect, rrange, rrect, scroll, shade, shadow, StampDef, st, STONE,
  TAU, tome, WOOD, WOOD_D, WOOD_L, PAPER, woodPlanks, LEAF, LEAF_L, LEAF_D, leafShape, C2D, bottle, METAL_L,
} from '../art';
import type { Rng } from '../util';

/** Chair seen from above; the backrest faces -y before rotation. */
export function seat(c: C2D, x: number, y: number, s: number, rot: number, col = WOOD_L, pad?: string) {
  at(c, x, y, rot, () => {
    shadow(c, true, 5, 2, 3); rrect(c, -s / 2, -s / 2, s, s, 4); fs(c, lin(c, -s / 2, -s / 2, s / 2, s / 2, [[0, shade(col, 0.1)], [1, shade(col, -0.15)]]), 2);
    shadow(c, false);
    if (pad) { rrect(c, -s / 2 + 4, -s / 2 + s * 0.3, s - 8, s * 0.6, 4); fs(c, ball(c, 0, s * 0.1, s * 0.4, pad, 0.2), 1.2); }
    rrect(c, -s / 2 - 1, -s / 2 - 2, s + 2, s * 0.26, 3); fs(c, shade(col, -0.35), 2);
  });
}
/** Plate with optional food. */
export function plate(c: C2D, r: Rng, x: number, y: number, R: number, food = true) {
  shadow(c, true, 2, 1, 1.5, 0.35); circ(c, x, y, R); fs(c, radial(c, x, y, R, '#ffffff', '#cfc8b8', 0.2), 1); shadow(c, false);
  circ(c, x, y, R * 0.68); st(c, 'rgba(120,110,90,0.4)', 0.8);
  if (!food) return;
  const k = r();
  if (k < 0.33) { blob(c, r, R * 0.5, 7, 0.2, x, y); fs(c, ball(c, x, y, R * 0.5, '#a0522d', 0.3), 1); line(c, x + R * 0.2, y - R * 0.1, x + R * 0.7, y - R * 0.5, '#efe6d0', 2); }
  else if (k < 0.66) { for (let i = 0; i < 3; i++) { circ(c, x + rrange(r, -R * 0.35, R * 0.35), y + rrange(r, -R * 0.35, R * 0.35), R * 0.22); fs(c, ball(c, 0, 0, R, pick(r, ['#c0392b', '#e6b422', '#6aa84f'])), 0.8); } }
  else { ell(c, x, y, R * 0.55, R * 0.35, r() * 3); fs(c, ball(c, x, y, R * 0.5, '#d9a64a', 0.3), 1); }
}
export function goblet(c: C2D, x: number, y: number, R: number, wine = '#6e1020') {
  shadow(c, true, 2, 1, 1.5, 0.4); circ(c, x, y, R); fs(c, radial(c, x, y, R, GOLD_L, GOLD_D), 1); shadow(c, false);
  circ(c, x, y, R * 0.7); c.fillStyle = wine; c.fill();
  circ(c, x - R * 0.25, y - R * 0.25, R * 0.18); c.fillStyle = 'rgba(255,255,255,0.5)'; c.fill();
}
export function mug(c: C2D, x: number, y: number, R: number, rot: number) {
  at(c, x, y, rot, () => {
    rrect(c, R * 0.7, -R * 0.35, R * 0.7, R * 0.7, R * 0.3); st(c, INK, 3); st(c, '#7a5a3a', 1.5);
    shadow(c, true, 2, 1, 1.5, 0.4); circ(c, 0, 0, R); fs(c, radial(c, 0, 0, R, '#b9875a', '#6e4a2a'), 1.1); shadow(c, false);
    circ(c, 0, 0, R * 0.72); c.fillStyle = radial(c, 0, 0, R * 0.7, '#fff6dc', '#e8d6a8', 0.2); c.fill();
  });
}
function cushion(c: C2D, x: number, y: number, s: number, rot: number, col: string) {
  at(c, x, y, rot, () => {
    shadow(c, true, 5, 2, 3, 0.45);
    c.beginPath(); c.moveTo(-s / 2, -s / 2); c.quadraticCurveTo(0, -s * 0.38, s / 2, -s / 2); c.quadraticCurveTo(s * 0.38, 0, s / 2, s / 2);
    c.quadraticCurveTo(0, s * 0.38, -s / 2, s / 2); c.quadraticCurveTo(-s * 0.38, 0, -s / 2, -s / 2); c.closePath();
    fs(c, ball(c, 0, 0, s * 0.55, col, 0.3), 1.6); shadow(c, false);
    circ(c, 0, 0, s * 0.06); c.fillStyle = shade(col, -0.4); c.fill();
    for (const [px, py] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { line(c, px * s * 0.5, py * s * 0.5, px * s * 0.62, py * s * 0.62, GOLD, 1.6); }
  });
}
export function bedFrame(c: C2D, r: Rng, W: number, H: number, wood: string, blanket: string, pillows: number) {
  shadow(c, true); rrect(c, -W / 2, -H / 2, W, H, 5); fs(c, lin(c, -W / 2, 0, W / 2, 0, [[0, shade(wood, 0.1)], [1, shade(wood, -0.15)]])); shadow(c, false);
  rrect(c, -W / 2 + 6, -H / 2 + 6, W - 12, H - 12, 4); fs(c, LINEN, 1.5);
  const pw = (W - 18) / pillows;
  for (let i = 0; i < pillows; i++) { rrect(c, -W / 2 + 9 + i * pw + 2, -H / 2 + 11, pw - 4, H * 0.15, 7); fs(c, radial(c, -W / 2 + 9 + i * pw + pw / 2, -H / 2 + 11 + H * 0.07, pw * 0.5, '#ffffff', '#ddd6c6'), 1.4); }
  cloth(c, r, -W / 2 + 5, -H / 2 + H * 0.32, W - 10, H * 0.64, blanket, 4);
  rrect(c, -W / 2 + 5, -H / 2 + H * 0.32, W - 10, H * 0.07, 3); fs(c, '#f4efe2', 1.2);
}

export const FURNITURE: StampDef[] = [
  { id: 'armchair', name: t('Armchair'), cat: 'furniture', w: 1, h: 1, layer: 1, tags: 'chair seat sofa', draw: (c, r, w) => {
    const S = w * 0.78, col = pick(r, ['#8a1f2a', '#2c4f7a', '#3f6a3a', '#6a3f7a', '#8a5a2a']);
    shadow(c, true, 8, 3, 5); rrect(c, -S / 2, -S / 2, S, S, 10); fs(c, ball(c, 0, 0, S * 0.6, shade(col, -0.15), 0.2)); shadow(c, false);
    rrect(c, -S / 2 + 2, -S / 2 + 1, S - 4, S * 0.28, [10, 10, 4, 4]); fs(c, ball(c, 0, -S * 0.36, S * 0.5, shade(col, -0.25), 0.2), 1.5);
    for (const sx of [-1, 1]) { rrect(c, sx > 0 ? S / 2 - S * 0.2 : -S / 2 + 1, -S * 0.22, S * 0.19, S * 0.68, 7); fs(c, ball(c, sx * S * 0.4, 0.1, S * 0.3, shade(col, -0.1), 0.25), 1.5); }
    rrect(c, -S * 0.3, -S * 0.2, S * 0.6, S * 0.62, 6); fs(c, ball(c, 0, 0.1, S * 0.45, col, 0.3), 1.5);
    for (const [px, py] of [[-0.12, 0], [0.12, 0], [0, 0.2], [-0.12, 0.3], [0.12, 0.3]]) { circ(c, px * S, py * S, 1.6); c.fillStyle = shade(col, -0.45); c.fill(); }
    for (const sx of [-1, 1]) { circ(c, sx * S * 0.31, S * 0.4, 2.2); fs(c, GOLD, 0.8); }
  } },
  { id: 'sofa', name: t('Sofa'), cat: 'furniture', w: 2, h: 1, layer: 1, tags: 'couch settee', draw: (c, r, w, h) => {
    const W = w * 0.9, H = h * 0.74, col = pick(r, ['#7a1f2a', '#2c4f7a', '#3a5a32', '#6a3f7a']);
    shadow(c, true, 9, 4, 6); rrect(c, -W / 2, -H / 2, W, H, 12); fs(c, shade(col, -0.2)); shadow(c, false);
    rrect(c, -W / 2 + 2, -H / 2 + 1, W - 4, H * 0.3, [12, 12, 4, 4]); fs(c, lin(c, 0, -H / 2, 0, -H * 0.2, [[0, shade(col, -0.1)], [1, shade(col, -0.35)]]), 1.5);
    for (const sx of [-1, 1]) { rrect(c, sx > 0 ? W / 2 - 16 : -W / 2 + 1, -H * 0.22, 15, H * 0.7, 7); fs(c, ball(c, sx * W * 0.45, 0, 14, shade(col, -0.1), 0.25), 1.5); }
    for (let i = 0; i < 3; i++) {
      const cw = (W - 34) / 3, x0 = -W / 2 + 17 + i * cw;
      rrect(c, x0 + 1, -H * 0.18, cw - 2, H * 0.62, 6); fs(c, ball(c, x0 + cw / 2, H * 0.1, cw * 0.6, col, 0.3), 1.4);
      circ(c, x0 + cw / 2, H * 0.12, 1.6); c.fillStyle = shade(col, -0.45); c.fill();
    }
    cushion(c, -W * 0.3, -H * 0.05, 18, rrange(r, -0.4, 0.4), pick(r, ['#d9b45a', '#e8e2d2', '#5a7a9a']));
  } },
  { id: 'desk', name: t('Writing desk'), cat: 'furniture', w: 1.6, h: 0.9, layer: 1, light: { radius: 2, color: '#ffd38a', intensity: 0.55 }, tags: 'table study office', draw: (c, r, w, h) => {
    const W = w * 0.92, H = h * 0.8;
    shadow(c, true); plankBox(c, r, -W / 2, -H / 2, W, H, 3, OAK); shadow(c, false);
    rrect(c, -W / 2 + 4, -H / 2 + 4, W - 8, H - 8, 3); st(c, 'rgba(255,225,180,0.25)', 1.5);
    at(c, -W * 0.08, H * 0.05, rrange(r, -0.15, 0.15), () => { shadow(c, true, 2, 1, 1.5, 0.35); rect(c, -W * 0.17, -H * 0.3, W * 0.34, H * 0.56); fs(c, PAPER, 1); shadow(c, false);
      for (let i = 0; i < 6; i++) line(c, -W * 0.13, -H * 0.2 + i * H * 0.08, W * 0.1 - (i === 5 ? W * 0.12 : 0), -H * 0.2 + i * H * 0.08, 'rgba(40,30,20,0.5)', 0.9); });
    circ(c, W * 0.22, -H * 0.18, 5); fs(c, radial(c, W * 0.22, -H * 0.18, 5, '#4a4a5a', '#121218'), 1);
    line(c, W * 0.22, -H * 0.18, W * 0.34, -H * 0.38, '#f4f0e6', 2.5); line(c, W * 0.25, -H * 0.24, W * 0.33, -H * 0.36, '#d6d0c4', 1);
    tome(c, W * 0.32, H * 0.18, 18, 13, rrange(r, -0.3, 0.3), pick(r, CLOTH));
    candle(c, -W * 0.38, -H * 0.22, 3.2);
    scroll(c, -W * 0.36, H * 0.22, 24, rrange(r, -0.5, 0.5));
  } },
  { id: 'dresser', name: t('Dresser'), cat: 'furniture', w: 1.3, h: 0.6, layer: 1, tags: 'drawers cabinet', draw: (c, r, w, h) => {
    const W = w * 0.92, H = h * 0.8;
    shadow(c, true); plankBox(c, r, -W / 2, -H / 2, W, H, 2, WOOD); shadow(c, false);
    rrect(c, -W / 2, H / 2 - 7, W, 7, 2); fs(c, shade(WOOD, -0.3), 1.5);
    for (let i = 0; i < 3; i++) { circ(c, -W / 3 + i * W / 3, H / 2 - 3.5, 1.8); c.fillStyle = GOLD; c.fill(); }
    ell(c, -W * 0.2, -2, W * 0.2, H * 0.3); fs(c, 'rgba(250,246,236,0.9)', 0.8);
    clip(c, () => ell(c, -W * 0.2, -2, W * 0.2, H * 0.3), () => { for (let i = 0; i < 10; i++) { circ(c, -W * 0.2 + Math.cos(i) * W * 0.17, -2 + Math.sin(i) * H * 0.26, 2); st(c, 'rgba(180,170,150,0.6)', 0.6); } });
    jar(c, -W * 0.2, -3, 6, '#3a6a9a', false);
    for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU + r(); circ(c, -W * 0.2 + Math.cos(a) * 5, -3 + Math.sin(a) * 5, 2.6); c.fillStyle = pick(r, ['#e86a8a', '#f4d35e', '#ffffff', '#b07ad8']); c.fill(); }
    rrect(c, W * 0.12, -H * 0.25, W * 0.22, H * 0.4, 2); fs(c, lin(c, 0, -H * 0.25, 0, H * 0.15, [[0, '#7a3a5a'], [1, '#4a1f3a']]), 1.2);
    line(c, W * 0.12, -H * 0.12, W * 0.34, -H * 0.12, GOLD, 1.2);
  } },
  { id: 'nightstand', name: t('Nightstand'), cat: 'furniture', w: 0.55, h: 0.55, layer: 1, light: { radius: 2, color: '#ffd38a', intensity: 0.55 }, tags: 'bedside table candle', draw: (c, r, w) => {
    const S = w * 0.8;
    shadow(c, true, 5, 2, 3); plankBox(c, r, -S / 2, -S / 2, S, S, 2, WOOD); shadow(c, false);
    circ(c, -S * 0.1, -S * 0.05, S * 0.2); fs(c, radial(c, 0, 0, S * 0.2, METAL_L, METAL_D), 1); candle(c, -S * 0.1, -S * 0.05, 3.2);
    tome(c, S * 0.2, S * 0.22, 12, 9, 0.3, pick(r, CLOTH));
  } },
  { id: 'bunk_bed', name: t('Bunk bed'), cat: 'furniture', w: 1, h: 2, layer: 1, tags: 'bed barracks', draw: (c, r, w, h) => {
    const W = w * 0.86, H = h * 0.92;
    bedFrame(c, r, W, H, WOOD_D, pick(r, ['#6a5a3a', '#4a5a6a', '#5a3a2a']), 1);
    for (const [px, py] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { rect(c, px * W / 2 - (px > 0 ? 8 : 0), py * H / 2 - (py > 0 ? 8 : 0), 8, 8); fs(c, shade(WOOD_D, -0.2), 1.4); }
    for (let i = 0; i < 4; i++) { const y = -H * 0.1 + i * H * 0.12; line(c, W / 2 - 2, y, W / 2 + 7, y, WOOD_L, 3); }
    line(c, W / 2 + 7, -H * 0.15, W / 2 + 7, H * 0.32, WOOD_D, 3);
  } },
  { id: 'bed_canopy', name: t('Canopy bed'), cat: 'furniture', w: 2, h: 2.4, layer: 1, tags: 'four poster royal noble bed', draw: (c, r, w, h) => {
    const W = w * 0.86, H = h * 0.9, col = pick(r, ['#7a1424', '#1f3a6a', '#3a5a2a', '#5a2a6a']);
    bedFrame(c, r, W, H, DARKWOOD, col, 2);
    rrect(c, -W / 2 + 5, -H / 2 + H * 0.32, W - 10, H * 0.64, 4); clip(c, () => rrect(c, -W / 2 + 5, -H / 2 + H * 0.32, W - 10, H * 0.64, 4), () => {
      for (let i = 0; i < 6; i++) { const y = -H / 2 + H * 0.4 + i * H * 0.1; line(c, -W / 2, y, W / 2, y, 'rgba(255,215,120,0.25)', 1); }
      rect(c, -W / 2 + 5, H / 2 - 18, W - 10, 5); c.fillStyle = GOLD; c.fill();
    });
    for (const [px, py] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      const x = px * (W / 2 - 4), y = py * (H / 2 - 4);
      shadow(c, true, 5, 2, 3); circ(c, x, y, 8); fs(c, ball(c, x, y, 8, DARKWOOD, 0.35), 2); shadow(c, false);
      circ(c, x, y, 3); fs(c, GOLD, 0.8);
      // gathered curtain
      at(c, x - px * 16, y, 0, () => { ell(c, 0, 0, 10, 7); fs(c, ball(c, 0, 0, 10, col, 0.35), 1.4); line(c, -6, -2, 6, 2, 'rgba(0,0,0,0.2)', 1.4); line(c, -6, 2, 6, -1, 'rgba(255,255,255,0.18)', 1.2); });
    }
    rrect(c, -W / 2, -H / 2 - 4, W, 10, 4); fs(c, lin(c, 0, -H / 2 - 4, 0, -H / 2 + 6, [[0, shade(col, 0.15)], [1, shade(col, -0.3)]]), 1.6);
    for (let x = -W / 2 + 8; x < W / 2 - 4; x += 8) { c.beginPath(); c.arc(x + 4, -H / 2 + 6, 4, 0, Math.PI); st(c, GOLD, 1.2); }
  } },
  { id: 'bed_straw', name: t('Straw bed'), cat: 'furniture', w: 1, h: 2, layer: 0, tags: 'pallet mattress peasant prison', draw: (c, r, w, h) => {
    const W = w * 0.78, H = h * 0.85;
    shadow(c, true, 4, 2, 3, 0.4);
    rrect(c, -W / 2, -H / 2, W, H, 12); fs(c, lin(c, 0, -H / 2, 0, H / 2, [[0, '#d8bd6a'], [1, '#b0923c']]), 1.6); shadow(c, false);
    clip(c, () => rrect(c, -W / 2, -H / 2, W, H, 12), () => {
      for (let i = 0; i < 160; i++) { const x = rrange(r, -W / 2, W / 2), y = rrange(r, -H / 2, H / 2), a = rrange(r, -0.6, 0.6) + Math.PI / 2, L = rrange(r, 5, 12); line(c, x, y, x + Math.cos(a) * L, y + Math.sin(a) * L, pick(r, ['#8a6a24', '#f0d890', '#a8893c']), 1); }
    });
    at(c, 0, H * 0.15, rrange(r, -0.15, 0.15), () => cloth(c, r, -W * 0.44, -H * 0.22, W * 0.88, H * 0.5, pick(r, ['#6a5a42', '#5a4a3a', '#4a5a6a']), 5));
    for (let i = 0; i < 18; i++) { const x = rrange(r, -W / 2 - 8, W / 2 + 8), y = rrange(r, -H / 2 - 8, H / 2 + 8), a = r() * TAU; line(c, x, y, x + Math.cos(a) * 7, y + Math.sin(a) * 7, '#c8a850', 1); }
  } },
  { id: 'cradle', name: t('Cradle'), cat: 'furniture', w: 0.7, h: 1, layer: 1, tags: 'baby crib', draw: (c, r, w, h) => {
    const W = w * 0.76, H = h * 0.8;
    shadow(c, true, 6, 2, 4); ell(c, 0, 0, W / 2, H / 2); fs(c, WOOD_L); shadow(c, false);
    ell(c, 0, 0, W / 2 - 5, H / 2 - 5); fs(c, LINEN, 1.2);
    ell(c, 0, -H * 0.25, W * 0.25, H * 0.12); fs(c, '#ffffff', 1);
    clip(c, () => ell(c, 0, 0, W / 2 - 5, H / 2 - 5), () => cloth(c, r, -W / 2, -H * 0.1, W, H * 0.7, pick(r, ['#9ab8d8', '#e8b0c0', '#f0e0a0']), 2, 1));
    for (let i = 0; i < 14; i++) { const a = (i / 14) * TAU; circ(c, Math.cos(a) * (W / 2 - 2.5), Math.sin(a) * (H / 2 - 2.5), 1.4); c.fillStyle = WOOD_D; c.fill(); }
  } },
  { id: 'bathtub', name: t('Bathtub'), cat: 'furniture', w: 1.1, h: 1.7, layer: 1, tags: 'bath tub water wash', draw: (c, r, w, h) => {
    const W = w * 0.8, H = h * 0.86, copper = r() < 0.5;
    shadow(c, true, 8, 3, 5); rrect(c, -W / 2, -H / 2, W, H, W * 0.45); fs(c, copper ? radial(c, 0, 0, H * 0.6, '#e0a070', '#8a4a22') : lin(c, -W / 2, 0, W / 2, 0, [[0, WOOD_L], [1, WOOD_D]]), 2.4); shadow(c, false);
    if (!copper) { rrect(c, -W / 2, -H / 2, W, H, W * 0.45); woodPlanks(c, -W / 2, -H / 2, W, H, 6, true); for (const y of [-H * 0.3, H * 0.3]) { line(c, -W / 2, y, W / 2, y, METAL_D, 3); } }
    rrect(c, -W / 2 + 6, -H / 2 + 6, W - 12, H - 12, W * 0.38); fs(c, radial(c, 0, 0, H * 0.5, '#bfe6ee', '#5a9aaa', 0.1), 1.4);
    clip(c, () => rrect(c, -W / 2 + 6, -H / 2 + 6, W - 12, H - 12, W * 0.38), () => {
      for (let i = 0; i < 26; i++) { const x = rrange(r, -W * 0.35, W * 0.35), y = rrange(r, -H * 0.4, H * 0.4), R = rrange(r, 2, 6); circ(c, x, y, R); c.fillStyle = 'rgba(255,255,255,0.75)'; c.fill(); st(c, 'rgba(150,190,200,0.6)', 0.6); }
    });
    rrect(c, -W * 0.06, -H / 2 + 2, W * 0.12, 9, 2); fs(c, METAL, 1);
  } },
  { id: 'washstand', name: t('Washstand'), cat: 'furniture', w: 0.7, h: 0.55, layer: 1, tags: 'basin pitcher wash', draw: (c, r, w, h) => {
    const W = w * 0.86, H = h * 0.8;
    shadow(c, true, 5, 2, 3); plankBox(c, r, -W / 2, -H / 2, W, H, 2, WOOD); shadow(c, false);
    circ(c, -W * 0.12, 0, H * 0.36); fs(c, radial(c, -W * 0.12, 0, H * 0.36, '#ffffff', '#c8d0d6', 0.2), 1.3);
    circ(c, -W * 0.12, 0, H * 0.27); fs(c, radial(c, -W * 0.12, 0, H * 0.27, '#cfeaf0', '#7ab0c0', 0), 0.8);
    jar(c, W * 0.3, -H * 0.1, 7, '#e8e4da', true);
    rect(c, W * 0.16, H * 0.12, W * 0.26, H * 0.24); fs(c, '#e8e2d2', 0.8);
  } },
  { id: 'piano', name: t('Harpsichord'), cat: 'furniture', w: 1.6, h: 1.6, layer: 1, tags: 'piano music instrument', draw: (c, r, w, h) => {
    const W = w * 0.62, H = h * 0.88, x0 = -W / 2, y0 = -H / 2;
    const body = () => { c.beginPath(); c.moveTo(x0, y0); c.lineTo(x0 + W, y0); c.lineTo(x0 + W, y0 + H * 0.35); c.bezierCurveTo(x0 + W, y0 + H * 0.7, x0 + W * 0.45, y0 + H * 0.65, x0 + W * 0.35, y0 + H); c.lineTo(x0, y0 + H); c.closePath(); };
    shadow(c, true, 10, 4, 7); body(); fs(c, lin(c, x0, y0, x0 + W, y0 + H, [[0, '#4a2a1a'], [1, '#2a160c']]), 2.4); shadow(c, false);
    c.save(); body(); c.clip(); c.translate(0, 0);
    c.beginPath(); c.moveTo(x0 + 6, y0 + 16); c.lineTo(x0 + W - 6, y0 + 16); c.lineTo(x0 + W - 6, y0 + H * 0.35); c.bezierCurveTo(x0 + W - 6, y0 + H * 0.66, x0 + W * 0.44, y0 + H * 0.6, x0 + W * 0.32, y0 + H - 6); c.lineTo(x0 + 6, y0 + H - 6); c.closePath();
    fs(c, lin(c, 0, y0, 0, y0 + H, [[0, '#d9b47a'], [1, '#a8783e']]), 1.2);
    for (let i = 0; i < 12; i++) { const x = x0 + 10 + i * (W - 20) / 12; line(c, x, y0 + 18, x - i * 0.6, y0 + H * (0.95 - i * 0.045), 'rgba(60,40,20,0.6)', 0.8); }
    ell(c, x0 + W * 0.35, y0 + H * 0.45, W * 0.12, W * 0.12); fs(c, '#2a160c', 1);
    for (let i = 0; i < 10; i++) { const a = (i / 10) * TAU; circ(c, x0 + W * 0.35 + Math.cos(a) * W * 0.08, y0 + H * 0.45 + Math.sin(a) * W * 0.08, 1.5); c.fillStyle = GOLD; c.fill(); }
    c.restore();
    rect(c, x0 + 2, y0 + 2, W - 4, 12); fs(c, '#f4efe2', 1);
    for (let i = 0; i < 20; i++) { const x = x0 + 3 + i * (W - 6) / 20; line(c, x, y0 + 2, x, y0 + 14, 'rgba(0,0,0,0.4)', 0.6); if (i % 7 !== 2 && i % 7 !== 6) { c.fillStyle = '#1a1210'; c.fillRect(x + (W - 6) / 40, y0 + 2, (W - 6) / 34, 7); } }
    rrect(c, -W * 0.3, y0 - 24, W * 0.6, 14, 3); fs(c, '#7a1424', 1.6);
  } },
  { id: 'harp', name: t('Harp'), cat: 'furniture', w: 0.7, h: 1, layer: 1, tags: 'music instrument', draw: (c, r, w, h) => {
    const H = h * 0.8;
    shadow(c, true, 5, 2, 4);
    c.beginPath(); c.moveTo(-w * 0.22, H / 2); c.lineTo(-w * 0.22, -H * 0.3); c.quadraticCurveTo(-w * 0.1, -H / 2, w * 0.25, -H * 0.42); c.quadraticCurveTo(w * 0.1, 0, w * 0.18, H * 0.3);
    c.lineTo(-w * 0.22, H / 2); st(c, INK, 8); shadow(c, false); st(c, GOLD, 5);
    for (let i = 0; i < 9; i++) { const k = i / 8, x = -w * 0.2 + k * w * 0.37; line(c, x, -H * 0.36 + k * 0.05 * H, x, H * 0.42 - k * H * 0.15, 'rgba(250,240,220,0.9)', 0.8); }
    circ(c, w * 0.25, -H * 0.42, 4); fs(c, GOLD_L, 1);
  } },
  { id: 'lute', name: t('Lute'), cat: 'furniture', w: 0.5, h: 0.9, layer: 1, tags: 'music instrument bard', draw: (c, r, w, h) => {
    at(c, 0, 0, rrange(r, -0.3, 0.3), () => {
      shadow(c, true, 4, 2, 3); ell(c, 0, h * 0.14, w * 0.34, h * 0.24); fs(c, lin(c, -w * 0.3, 0, w * 0.3, 0, [[0, '#d99a52'], [0.5, '#f0bc72'], [1, '#a8682a']]), 2); shadow(c, false);
      circ(c, 0, h * 0.05, w * 0.09); fs(c, '#2a160c', 1);
      rrect(c, -w * 0.06, -h * 0.4, w * 0.12, h * 0.36, 2); fs(c, DARKWOOD, 1.4);
      rrect(c, -w * 0.09, -h * 0.47, w * 0.18, h * 0.1, 2); fs(c, DARKWOOD, 1.4);
      for (let i = -1; i <= 1; i++) line(c, i * 2, -h * 0.44, i * 2.5, h * 0.3, 'rgba(250,240,220,0.8)', 0.6);
      rect(c, -w * 0.12, h * 0.26, w * 0.24, 3); fs(c, DARKWOOD, 0.8);
    });
  } },
  { id: 'clock', name: t('Grandfather clock'), cat: 'furniture', w: 0.6, h: 0.5, layer: 1, tags: 'clock time', draw: (c, r, w, h) => {
    const W = w * 0.8, H = h * 0.76;
    shadow(c, true, 6, 3, 4); rrect(c, -W / 2, -H / 2, W, H, [8, 8, 2, 2]); fs(c, lin(c, 0, -H / 2, 0, H / 2, [[0, '#6a3a1e'], [1, '#3a1e0e']])); shadow(c, false);
    circ(c, 0, -H * 0.02, W * 0.33); fs(c, radial(c, 0, 0, W * 0.33, '#fff8e8', '#d8ccb0', 0.2), 1.4);
    circ(c, 0, -H * 0.02, W * 0.33); st(c, GOLD, 1.5);
    for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; line(c, Math.cos(a) * W * 0.27, -H * 0.02 + Math.sin(a) * W * 0.27, Math.cos(a) * W * 0.3, -H * 0.02 + Math.sin(a) * W * 0.3, INK, 1); }
    line(c, 0, -H * 0.02, W * 0.15, -H * 0.12, INK, 1.4); line(c, 0, -H * 0.02, -W * 0.05, -H * 0.24, INK, 1);
  } },
  { id: 'screen', name: t('Folding screen'), cat: 'furniture', w: 1.6, h: 0.4, layer: 1, tags: 'privacy divider', draw: (c, r, w, h) => {
    const n = 4, W = w * 0.92, pw = W / n, col = pick(r, ['#c8a86a', '#8a2a2a', '#2a4a6a']);
    for (let i = 0; i < n; i++) {
      const x0 = -W / 2 + i * pw, y0 = i % 2 ? -h * 0.18 : h * 0.12, y1 = i % 2 ? h * 0.12 : -h * 0.18;
      shadow(c, true, 5, 2, 4); poly(c, [x0, y0 - 5, x0 + pw, y1 - 5, x0 + pw, y1 + 5, x0, y0 + 5]); fs(c, lin(c, x0, 0, x0 + pw, 0, [[0, shade(col, i % 2 ? -0.2 : 0.15)], [1, shade(col, i % 2 ? 0.1 : -0.15)]]), 1.8); shadow(c, false);
      circ(c, x0 + pw / 2, (y0 + y1) / 2, 2.5); c.fillStyle = 'rgba(255,240,200,0.6)'; c.fill();
      line(c, x0, y0, x0 + pw, y1, 'rgba(255,240,200,0.45)', 1.2);
      circ(c, x0, y0, 3); fs(c, DARKWOOD, 1);
    }
    circ(c, W / 2, -h * 0.18, 3); fs(c, DARKWOOD, 1);
  } },
  { id: 'feast_table', name: t('Feast table'), cat: 'furniture', w: 3, h: 1.2, layer: 1, light: { radius: 3.5, color: '#ffd38a', intensity: 0.6 }, tags: 'banquet dinner long table food', draw: (c, r, w, h) => {
    const W = w * 0.94, H = h * 0.66;
    for (let i = 0; i < 5; i++) for (const s of [-1, 1]) seat(c, -W * 0.38 + i * W * 0.19, s * (H / 2 + 11), 22, s > 0 ? Math.PI : 0, WOOD_D);
    shadow(c, true); plankBox(c, r, -W / 2, -H / 2, W, H, 3, WOOD); shadow(c, false);
    cloth(c, r, -W / 2 + 4, -H * 0.24, W - 8, H * 0.48, pick(r, ['#e8e2d2', '#7a1424', '#1f3a6a']), 2, 1);
    for (let i = 0; i < 5; i++) for (const s of [-1, 1]) { const x = -W * 0.38 + i * W * 0.19; plate(c, r, x, s * H * 0.3, 8); goblet(c, x + 11, s * H * 0.3, 3.5); }
    ell(c, 0, 0, 22, 15); fs(c, radial(c, 0, 0, 22, METAL_L, METAL_D), 1.4);
    ell(c, 0, 0, 15, 10); fs(c, ball(c, 0, 0, 15, '#a8582a', 0.35), 1.2);
    for (const s of [-1, 1]) { line(c, s * 12, -4, s * 20, -10, '#efe6d0', 3); circ(c, s * 20, -10, 2.4); c.fillStyle = '#efe6d0'; c.fill(); }
    for (const x of [-W * 0.25, W * 0.25]) { circ(c, x, 0, 7); fs(c, radial(c, x, 0, 7, GOLD_L, GOLD_D), 1); for (let k = 0; k < 3; k++) candle(c, x + Math.cos(k * 2.1) * 4, Math.sin(k * 2.1) * 4, 2); }
    for (let i = 0; i < 6; i++) { const x = rrange(r, -W * 0.4, W * 0.4); if (Math.abs(x) < 30) continue; circ(c, x, rrange(r, -6, 6), 4); fs(c, ball(c, 0, 0, 5, pick(r, ['#c0392b', '#e6b422', '#7a3a8a', '#6aa84f'])), 0.8); }
  } },
  { id: 'dining_set', name: t('Dining set'), cat: 'furniture', w: 2, h: 2, layer: 1, tags: 'table chairs dinner', draw: (c, r, w) => {
    const R = w * 0.27;
    for (let i = 0; i < 4; i++) { const a = (i / 4) * TAU + Math.PI / 4; seat(c, Math.cos(a) * R * 1.45, Math.sin(a) * R * 1.45, 26, a + Math.PI / 2, WOOD_L); }
    shadow(c, true); circ(c, 0, 0, R); fs(c, lin(c, -R, -R, R, R, [[0, OAK_L], [1, OAK]])); shadow(c, false);
    clip(c, () => circ(c, 0, 0, R), () => { c.beginPath(); c.rect(-R, -R, R * 2, R * 2); grain(c, r, -R, -R, R * 2, R * 2, 8); });
    circ(c, 0, 0, R - 4); st(c, 'rgba(255,225,180,0.3)', 1.5);
    for (let i = 0; i < 4; i++) { const a = (i / 4) * TAU + Math.PI / 4; plate(c, r, Math.cos(a) * R * 0.62, Math.sin(a) * R * 0.62, 8, r() < 0.7); }
    jar(c, 0, 0, 7, '#c8b898', false);
    for (let k = 0; k < 4; k++) { const a = r() * TAU; circ(c, Math.cos(a) * 3, Math.sin(a) * 3, 2.5); c.fillStyle = pick(r, ['#e6b422', '#c0392b', '#f0e0f0']); c.fill(); }
  } },
  { id: 'rug_round', name: t('Round rug'), cat: 'furniture', w: 2, h: 2, layer: 0, tags: 'carpet mat', draw: (c, r, w) => {
    const R = w * 0.44, col = pick(r, ['#8a1f2a', '#1f3f7a', '#3f5a2a', '#6a4a1a']), acc = pick(r, ['#d9b45a', '#e8e2d2', '#4aa0a0']);
    circ(c, 0, 0, R); fs(c, radial(c, 0, 0, R, shade(col, 0.15), shade(col, -0.2), 0), 2);
    for (let i = 0; i < 64; i++) { const a = (i / 64) * TAU; line(c, Math.cos(a) * R, Math.sin(a) * R, Math.cos(a) * (R + 6), Math.sin(a) * (R + 6), '#d8c49a', 1.4); }
    circ(c, 0, 0, R * 0.88); st(c, acc, 4);
    circ(c, 0, 0, R * 0.8); st(c, shade(acc, -0.3), 1.2);
    starPathRing(c, R * 0.55, 8, acc);
    circ(c, 0, 0, R * 0.2); fs(c, acc, 1.2); circ(c, 0, 0, R * 0.1); c.fillStyle = col; c.fill();
    for (let i = 0; i < 16; i++) { const a = (i / 16) * TAU; circ(c, Math.cos(a) * R * 0.72, Math.sin(a) * R * 0.72, 2.4); c.fillStyle = acc; c.fill(); }
  } },
  { id: 'rug_fur', name: t('Bearskin rug'), cat: 'furniture', w: 2, h: 2.2, layer: 0, tags: 'bear fur pelt hide', draw: (c, r, w, h) => {
    const col = pick(r, ['#5a3a22', '#3a2a1e', '#e8e0d0']);
    const S = w * 0.4;
    const body = () => {
      c.beginPath(); c.moveTo(0, -h * 0.42);
      c.bezierCurveTo(S * 0.35, -h * 0.42, S * 0.4, -h * 0.28, S * 0.3, -h * 0.22);
      c.lineTo(S * 1.05, -h * 0.3); c.lineTo(S * 1.1, -h * 0.18); c.lineTo(S * 0.55, -h * 0.08);
      c.bezierCurveTo(S * 0.65, h * 0.1, S * 0.6, h * 0.2, S * 0.5, h * 0.25);
      c.lineTo(S * 1.0, h * 0.38); c.lineTo(S * 0.85, h * 0.46); c.lineTo(S * 0.25, h * 0.38);
      c.lineTo(0, h * 0.46);
      c.lineTo(-S * 0.25, h * 0.38); c.lineTo(-S * 0.85, h * 0.46); c.lineTo(-S * 1.0, h * 0.38);
      c.lineTo(-S * 0.5, h * 0.25); c.bezierCurveTo(-S * 0.6, h * 0.2, -S * 0.65, h * 0.1, -S * 0.55, -h * 0.08);
      c.lineTo(-S * 1.1, -h * 0.18); c.lineTo(-S * 1.05, -h * 0.3); c.lineTo(-S * 0.3, -h * 0.22);
      c.bezierCurveTo(-S * 0.4, -h * 0.28, -S * 0.35, -h * 0.42, 0, -h * 0.42); c.closePath();
    };
    shadow(c, true, 4, 2, 3, 0.35); body(); fs(c, radial(c, 0, 0, h * 0.5, shade(col, 0.2), shade(col, -0.2), 0), 2); shadow(c, false);
    clip(c, body, () => { for (let i = 0; i < 500; i++) { const x = rrange(r, -S * 1.1, S * 1.1), y = rrange(r, -h * 0.45, h * 0.45), a = Math.atan2(y, x) + rrange(r, -0.4, 0.4); line(c, x, y, x + Math.cos(a) * 5, y + Math.sin(a) * 5, r() < 0.5 ? shade(col, -0.3) : shade(col, 0.25), 1); } });
    ell(c, 0, -h * 0.4, S * 0.3, S * 0.34); fs(c, ball(c, 0, -h * 0.4, S * 0.34, col, 0.25), 1.8);
    for (const s of [-1, 1]) { circ(c, s * S * 0.26, -h * 0.5, S * 0.09); fs(c, shade(col, -0.2), 1.2); circ(c, s * S * 0.11, -h * 0.4, 2); c.fillStyle = '#111'; c.fill(); }
    ell(c, 0, -h * 0.33, S * 0.11, S * 0.08); fs(c, '#1a1210', 1);
  } },
  { id: 'rug_runner', name: t('Rug runner'), cat: 'furniture', w: 1, h: 3, layer: 0, tags: 'carpet hall long', draw: (c, r, w, h) => {
    const W = w * 0.8, H = h * 0.92, col = pick(r, ['#8a1f2a', '#1f3f7a', '#5a2a6a']);
    rect(c, -W / 2, -H / 2, W, H); fs(c, col, 2);
    rect(c, -W / 2 + 6, -H / 2 + 6, W - 12, H - 12); st(c, GOLD, 3);
    for (let i = 0; i < 5; i++) { const y = -H * 0.4 + i * H * 0.2; poly(c, [0, y - 14, 12, y, 0, y + 14, -12, y]); fs(c, shade(col, 0.25), 1.2); circ(c, 0, y, 3); c.fillStyle = GOLD; c.fill(); }
    for (let x = -W / 2 + 3; x < W / 2; x += 5) for (const s of [-1, 1]) line(c, x, s * H / 2, x, s * (H / 2 + 6), '#d8c49a', 1.4);
  } },
  { id: 'cushions', name: t('Floor cushions'), cat: 'furniture', w: 1.2, h: 1.2, layer: 1, tags: 'pillows lounge', draw: (c, r, w) => {
    for (let i = 0; i < 4; i++) { const a = (i / 4) * TAU + rrange(r, -0.3, 0.3), d = w * 0.2; cushion(c, Math.cos(a) * d, Math.sin(a) * d, w * 0.34, r() * 3, pick(r, ['#9b2c2c', '#c88a2a', '#2c6a7a', '#6a2c7a', '#3a7a3a'])); }
  } },
  { id: 'potted_plant', name: t('Potted plant'), cat: 'furniture', w: 0.7, h: 0.7, layer: 1, tags: 'pot fern plant', draw: (c, r, w) => {
    const R = w * 0.3;
    shadow(c, true, 6, 3, 4); circ(c, 0, 0, R); fs(c, ball(c, 0, 0, R, '#b0603a', 0.3)); shadow(c, false);
    circ(c, 0, 0, R * 0.8); c.fillStyle = '#3a2614'; c.fill();
    for (let i = 0; i < 11; i++) {
      const a = (i / 11) * TAU + rrange(r, -0.2, 0.2), L = rrange(r, R * 1.1, R * 1.6);
      at(c, Math.cos(a) * L * 0.5, Math.sin(a) * L * 0.5, a, () => { leafShape(c, 0, 0, L, L * 0.28, 0); fs(c, i % 2 ? LEAF : LEAF_L, 1.1); line(c, -L / 2, 0, L / 2, 0, LEAF_D, 0.8); });
    }
  } },
  { id: 'chandelier', name: t('Chandelier'), cat: 'furniture', w: 1.6, h: 1.6, layer: 2, light: { radius: 6, color: '#ffd896', intensity: 0.8 }, tags: 'light candles ceiling', draw: (c, r, w) => {
    const R = w * 0.32;
    glow(c, 0, 0, R * 1.6, '255,210,130', 0.28);
    shadow(c, true, 12, 10, 14, 0.35);
    circ(c, 0, 0, R); st(c, INK, 6); shadow(c, false); circ(c, 0, 0, R); st(c, GOLD, 3.5);
    for (let i = 0; i < 4; i++) { const a = (i / 4) * TAU; line(c, 0, 0, Math.cos(a) * R, Math.sin(a) * R, INK, 4); line(c, 0, 0, Math.cos(a) * R, Math.sin(a) * R, GOLD, 2); }
    circ(c, 0, 0, 7); fs(c, radial(c, 0, 0, 7, GOLD_L, GOLD_D), 1.2);
    for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU; const x = Math.cos(a) * R, y = Math.sin(a) * R; circ(c, x, y, 5); fs(c, GOLD, 1); candle(c, x, y, 2.6); }
  } },
  { id: 'cabinet', name: t('Dish cabinet'), cat: 'furniture', w: 1.5, h: 0.5, layer: 1, tags: 'cupboard shelf plates', draw: (c, r, w, h) => {
    const W = w * 0.94, H = h * 0.8;
    shadow(c, true, 6, 2, 4); plankBox(c, r, -W / 2, -H / 2, W, H, 1, WOOD_D); shadow(c, false);
    rect(c, -W / 2 + 4, -H / 2 + 4, W - 8, H - 8); c.fillStyle = 'rgba(20,10,5,0.4)'; c.fill();
    let x = -W / 2 + 10;
    while (x < W / 2 - 8) { if (r() < 0.6) { circ(c, x, 0, 6.5); fs(c, radial(c, x, 0, 6.5, '#ffffff', pick(r, ['#9ab0d0', '#d8d0c0', '#c0d8c0'])), 1); x += 14; } else { jar(c, x, 0, 5.5, pick(r, ['#b06a3e', '#6a8a9a', '#8a6a4a']), r() < 0.5); x += 13; } }
  } },
  { id: 'trunk_open', name: t('Open trunk'), cat: 'furniture', w: 1, h: 0.8, layer: 1, tags: 'chest clothes luggage', draw: (c, r, w, h) => {
    const W = w * 0.8, H = h * 0.5;
    shadow(c, true, 5, 2, 4); rrect(c, -W / 2, -H / 2 - H * 0.55, W, H * 0.55, 3); fs(c, shade(WOOD, -0.2), 1.8);
    rrect(c, -W / 2 + 4, -H / 2 - H * 0.5, W - 8, H * 0.42, 2); fs(c, '#6a1f2a', 1); shadow(c, false);
    shadow(c, true, 6, 3, 4); rrect(c, -W / 2, -H / 2 + 2, W, H, 3); fs(c, WOOD); shadow(c, false);
    rect(c, -W / 2 + 5, -H / 2 + 7, W - 10, H - 10); c.fillStyle = '#2a1a10'; c.fill();
    clip(c, () => rect(c, -W / 2 + 5, -H / 2 + 7, W - 10, H - 10), () => {
      for (let i = 0; i < 5; i++) cloth(c, r, rrange(r, -W / 2, W * 0.1), rrange(r, -H / 2, 0), W * 0.5, H * 0.6, pick(r, CLOTH), 4, 1);
    });
    for (const k of [-0.32, 0.32]) { c.fillStyle = METAL_D; c.fillRect(k * W - 3, -H / 2 + 2, 6, H); }
  } },
  { id: 'vanity', name: t('Vanity table'), cat: 'furniture', w: 1.2, h: 0.7, layer: 1, tags: 'mirror makeup dressing', draw: (c, r, w, h) => {
    const W = w * 0.88, H = h * 0.62;
    seat(c, 0, H / 2 + 8, 20, Math.PI, WOOD_L, '#c890a8');
    shadow(c, true, 6, 2, 4); rrect(c, -W / 2, -H / 2, W, H, [4, 4, 12, 12]); fs(c, lin(c, 0, -H / 2, 0, H / 2, [[0, '#f0e6d6'], [1, '#c8b8a0']])); shadow(c, false);
    ell(c, 0, -H / 2 + 2, W * 0.24, 6); fs(c, lin(c, -W * 0.2, 0, W * 0.2, 0, [[0, '#d8f0ff'], [0.5, '#ffffff'], [1, '#8ab0c8']]), 1.4);
    c.beginPath(); c.ellipse(0, -H / 2 + 2, W * 0.24, 6, 0, 0, TAU); st(c, GOLD, 1.8);
    for (let i = 0; i < 4; i++) bottle(c, -W * 0.36 + i * 7, -H * 0.05 + (i % 2) * 6, 3.5, pick(r, ['#e890b0', '#90c0e8', '#e8d890', '#b090e8']));
    rrect(c, W * 0.15, -H * 0.1, W * 0.22, H * 0.4, 2); fs(c, '#5a2a4a', 1); coin(c, W * 0.26, H * 0.1, 3);
  } },
];

function starPathRing(c: C2D, R: number, n: number, col: string) {
  c.beginPath();
  for (let i = 0; i < n * 2; i++) { const a = (i / (n * 2)) * TAU, d = i % 2 ? R * 0.55 : R; i ? c.lineTo(Math.cos(a) * d, Math.sin(a) * d) : c.moveTo(Math.cos(a) * d, Math.sin(a) * d); }
  c.closePath(); st(c, col, 2.2);
}
