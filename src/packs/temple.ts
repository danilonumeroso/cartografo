import { t } from '../i18n';
import {
  at, ball, blob, bone, boulder, C2D, candle, circ, clip, cloth, coin, DARKWOOD, ell, flame, fs, gem, glow, GOLD, GOLD_D, GOLD_L, grain, INK,
  jar, lin, line, LINEN, MARBLE, MARBLE_D, METAL, METAL_D, openBook, pick, plankBox, poly, radial, rect, rod, rrange, rrect, shade, shadow,
  skull, sparkle, StampDef, st, STONE, STONE_D, STONE_L, sword, TAU, WOOD, WOOD_D, WOOD_L, leafShape, LEAF, LEAF_L, LEAF_D,
} from '../art';
import type { Rng } from '../util';
import { goblet } from './furniture';

function slabStone(c: C2D, r: Rng, x: number, y: number, w: number, h: number, col = STONE, rad = 3) {
  rrect(c, x, y, w, h, rad); fs(c, lin(c, x, y, x + w, y + h, [[0, shade(col, 0.15)], [1, shade(col, -0.18)]]), 2);
  clip(c, () => rrect(c, x, y, w, h, rad), () => {
    for (let i = 0; i < 4; i++) { let px = x + r() * w, py = y + r() * h; c.beginPath(); c.moveTo(px, py); for (let k = 0; k < 4; k++) { px += rrange(r, -8, 8); py += rrange(r, -8, 8); c.lineTo(px, py); } st(c, 'rgba(0,0,0,0.2)', 0.9); }
    for (let i = 0; i < 6; i++) { blob(c, r, rrange(r, 3, 9), 6, 0.3, x + r() * w, y + r() * h); c.fillStyle = `rgba(${r() < 0.5 ? '255,255,255' : '0,0,0'},0.06)`; c.fill(); }
  });
}
/** Humanoid statue seen from above (head, shoulders, optional wings). */
function figure(c: C2D, r: Rng, s: number, col: string, wings: boolean, weapon: boolean) {
  if (wings) for (const sx of [-1, 1]) {
    c.beginPath(); c.moveTo(sx * s * 0.15, -s * 0.05);
    c.bezierCurveTo(sx * s * 0.5, -s * 0.45, sx * s * 0.85, -s * 0.3, sx * s * 0.9, s * 0.05);
    c.bezierCurveTo(sx * s * 0.7, -s * 0.02, sx * s * 0.6, s * 0.12, sx * s * 0.5, s * 0.15);
    c.bezierCurveTo(sx * s * 0.4, s * 0.08, sx * s * 0.25, s * 0.15, sx * s * 0.15, s * 0.1); c.closePath();
    fs(c, lin(c, 0, -s * 0.4, sx * s * 0.8, s * 0.1, [[0, shade(col, 0.2)], [1, shade(col, -0.2)]]), 1.6);
    for (let i = 0; i < 5; i++) { const k = i / 5; c.beginPath(); c.moveTo(sx * s * (0.25 + k * 0.6), -s * (0.25 - k * 0.15)); c.lineTo(sx * s * (0.3 + k * 0.5), s * 0.1); st(c, 'rgba(0,0,0,0.25)', 1); }
  }
  ell(c, 0, s * 0.02, s * 0.3, s * 0.18); fs(c, ball(c, 0, 0, s * 0.3, col, 0.25), 1.6);
  if (weapon) sword(c, 0, s * 0.18, s * 0.7, -Math.PI / 2, shade(col, -0.1), shade(col, 0.2));
  circ(c, 0, -s * 0.04, s * 0.13); fs(c, ball(c, 0, -s * 0.04, s * 0.13, col, 0.35), 1.4);
  void r;
}
function flowers(c: C2D, r: Rng, x: number, y: number, n: number, R: number) {
  for (let i = 0; i < n; i++) { const a = r() * TAU, d = Math.sqrt(r()) * R; const px = x + Math.cos(a) * d, py = y + Math.sin(a) * d; const col = pick(r, ['#e86a8a', '#f4d35e', '#ffffff', '#b07ad8', '#e8823a']); for (let p = 0; p < 5; p++) { const q = (p / 5) * TAU; circ(c, px + Math.cos(q) * 2.4, py + Math.sin(q) * 2.4, 2); c.fillStyle = col; c.fill(); } circ(c, px, py, 1.3); c.fillStyle = '#c9851a'; c.fill(); }
}

export const TEMPLE: StampDef[] = [
  { id: 'pew', name: t('Pew'), cat: 'temple', w: 2.5, h: 0.6, layer: 1, tags: 'church bench chapel', draw: (c, r, w, h) => {
    const W = w * 0.94, H = h * 0.7;
    shadow(c, true, 6, 2, 4); plankBox(c, r, -W / 2, -H / 2 + 4, W, H - 4, 2, WOOD, false, 2); shadow(c, false);
    rrect(c, -W / 2, -H / 2, W, 7, 2); fs(c, lin(c, 0, -H / 2, 0, -H / 2 + 7, [[0, WOOD_L], [1, WOOD_D]]), 1.6);
    for (const s of [-1, 1]) { rrect(c, s * W / 2 - (s > 0 ? 8 : 0), -H / 2 - 2, 8, H + 2, 3); fs(c, DARKWOOD, 1.6); }
    if (r() < 0.5) { const x = rrange(r, -W * 0.3, W * 0.3); rect(c, x, -2, 16, 12); fs(c, '#3a1a1a', 1); }
  } },
  { id: 'holy_font', name: t('Holy water font'), cat: 'temple', w: 1, h: 1, layer: 1, tags: 'basin baptism water blessing', draw: (c, r, w) => {
    const R = w * 0.38;
    shadow(c, true, 8, 3, 5); poly(c, Array.from({ length: 16 }, (_, i) => (i % 2 ? Math.sin : Math.cos)((Math.floor(i / 2) / 8) * TAU + Math.PI / 8) * R)); fs(c, lin(c, -R, -R, R, R, [[0, MARBLE], [1, MARBLE_D]])); shadow(c, false);
    circ(c, 0, 0, R * 0.74); fs(c, radial(c, 0, 0, R * 0.74, '#d8f4ff', '#4a9ac0', 0), 1.6);
    glow(c, 0, 0, R * 0.7, '200,240,255', 0.4);
    for (let k = 1; k < 3; k++) { circ(c, R * 0.1, R * 0.05, R * 0.2 * k); st(c, 'rgba(255,255,255,0.4)', 1); }
    for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU + Math.PI / 8; circ(c, Math.cos(a) * R * 0.88, Math.sin(a) * R * 0.88, 2); c.fillStyle = GOLD; c.fill(); }
    void r;
  } },
  { id: 'altar_grand', name: t('Grand altar'), cat: 'temple', w: 2.5, h: 1.2, layer: 1, light: { radius: 4, color: '#ffd896', intensity: 0.7 }, tags: 'altar church temple holy chalice', draw: (c, r, w, h) => {
    const W = w * 0.9, H = h * 0.7, col = pick(r, ['#7a1424', '#e8e2d2', '#1f3a6a', '#4a2a6a']);
    shadow(c, true, 12, 5, 8); slabStone(c, r, -W / 2 - 6, -H / 2 - 6, W + 12, H + 12, MARBLE_D, 4); shadow(c, false);
    slabStone(c, r, -W / 2, -H / 2, W, H, MARBLE, 3);
    cloth(c, r, -W * 0.36, -H / 2 - 4, W * 0.72, H + 8, col, 2);
    rect(c, -W * 0.36, -H / 2 - 4, W * 0.72, 5); c.fillStyle = GOLD; c.fill();
    rect(c, -W * 0.36, H / 2 - 1, W * 0.72, 5); c.fillStyle = GOLD; c.fill();
    goblet(c, -W * 0.08, 0, 7);
    openBook(c, W * 0.12, 0, 30, 0, '#7a1424');
    circ(c, -W * 0.25, 0, 9); fs(c, radial(c, -W * 0.25, 0, 9, GOLD_L, GOLD_D), 1.2);
    starPathSun(c, -W * 0.25, 0, 7);
    for (const s of [-1, 1]) { circ(c, s * W * 0.43, 0, 8); fs(c, ball(c, s * W * 0.43, 0, 8, GOLD), 1.2); for (let k = 0; k < 3; k++) candle(c, s * W * 0.43 + Math.cos(k * 2.1) * 4.5, Math.sin(k * 2.1) * 4.5, 2.4); }
  } },
  { id: 'statue_angel', name: t('Angel statue'), cat: 'temple', w: 1.4, h: 1.4, layer: 1, tags: 'statue angel wings celestial', draw: (c, r, w) => {
    const S = w * 0.6;
    shadow(c, true, 10, 5, 7); rect(c, -S * 0.5, -S * 0.5, S, S); fs(c, STONE_D); shadow(c, false);
    rect(c, -S * 0.44, -S * 0.44, S * 0.88, S * 0.88); fs(c, STONE, 1.4);
    shadow(c, true, 8, 4, 6, 0.45); figure(c, r, w * 0.75, MARBLE, true, false); shadow(c, false);
  } },
  { id: 'statue_knight', name: t('Knight statue'), cat: 'temple', w: 1, h: 1, layer: 1, tags: 'statue warrior hero memorial', draw: (c, r, w) => {
    const S = w * 0.84;
    shadow(c, true, 10, 5, 7); rect(c, -S / 2, -S / 2, S, S); fs(c, STONE_D); shadow(c, false);
    rect(c, -S / 2 + 5, -S / 2 + 5, S - 10, S - 10); fs(c, STONE, 1.4);
    shadow(c, true, 6, 3, 5, 0.45); figure(c, r, w * 0.8, '#a8a49a', false, true); shadow(c, false);
    for (const s of [-1, 1]) { ell(c, s * w * 0.2, 0, 5, 7); fs(c, ball(c, s * w * 0.2, 0, 7, '#9a968c'), 1.2); }
  } },
  { id: 'statue_dragon', name: t('Dragon statue'), cat: 'temple', w: 2, h: 2, layer: 1, tags: 'statue dragon monument', draw: (c, r, w) => {
    const S = w * 0.86, col = '#8a8a7e';
    shadow(c, true, 12, 6, 8); rrect(c, -S / 2, -S / 2, S, S, 6); fs(c, STONE_D); shadow(c, false);
    slabStone(c, r, -S / 2 + 6, -S / 2 + 6, S - 12, S - 12, STONE);
    shadow(c, true, 8, 4, 6, 0.5);
    for (const sx of [-1, 1]) { c.beginPath(); c.moveTo(sx * 8, -S * 0.05); c.bezierCurveTo(sx * S * 0.3, -S * 0.42, sx * S * 0.45, -S * 0.32, sx * S * 0.46, -S * 0.1); for (let i = 0; i < 3; i++) c.quadraticCurveTo(sx * S * (0.38 - i * 0.1), -S * (0.05 - i * 0.03), sx * S * (0.36 - i * 0.1), S * (0.05 + i * 0.02)); c.lineTo(sx * 8, S * 0.08); c.closePath(); fs(c, lin(c, 0, -S * 0.3, sx * S * 0.4, 0, [[0, shade(col, 0.15)], [1, shade(col, -0.2)]]), 1.8); }
    c.beginPath(); c.moveTo(0, S * 0.1); c.bezierCurveTo(S * 0.1, S * 0.3, -S * 0.2, S * 0.35, -S * 0.1, S * 0.44); st(c, INK, 9); st(c, col, 6.5);
    ell(c, 0, 0, S * 0.12, S * 0.22); fs(c, ball(c, 0, 0, S * 0.2, col, 0.25), 1.8);
    c.beginPath(); c.moveTo(-S * 0.06, -S * 0.15); c.lineTo(-S * 0.05, -S * 0.36); c.lineTo(0, -S * 0.42); c.lineTo(S * 0.05, -S * 0.36); c.lineTo(S * 0.06, -S * 0.15); c.closePath(); fs(c, ball(c, 0, -S * 0.3, S * 0.1, col, 0.3), 1.6);
    for (const sx of [-1, 1]) { line(c, sx * S * 0.04, -S * 0.32, sx * S * 0.1, -S * 0.24, INK, 2.4); circ(c, sx * S * 0.025, -S * 0.36, 1.6); c.fillStyle = '#c03030'; c.fill(); }
    shadow(c, false);
  } },
  { id: 'pulpit', name: t('Pulpit'), cat: 'temple', w: 1, h: 1, layer: 1, tags: 'lectern church preacher', draw: (c, r, w) => {
    const R = w * 0.36;
    shadow(c, true, 8, 4, 6); c.beginPath(); c.arc(0, 0, R, Math.PI * 0.85, Math.PI * 2.15); c.closePath(); fs(c, lin(c, 0, -R, 0, R, [[0, WOOD_L], [1, WOOD_D]])); shadow(c, false);
    c.beginPath(); c.arc(0, 0, R * 0.8, Math.PI * 0.9, Math.PI * 2.1); c.closePath(); fs(c, shade(WOOD, -0.35), 1.2);
    for (let i = 0; i < 9; i++) { const a = Math.PI * 0.9 + (i / 8) * Math.PI * 1.2; line(c, Math.cos(a) * R * 0.82, Math.sin(a) * R * 0.82, Math.cos(a) * R, Math.sin(a) * R, 'rgba(40,20,5,0.5)', 1); }
    at(c, 0, -R * 0.42, 0, () => { rect(c, -R * 0.55, -R * 0.2, R * 1.1, R * 0.4); fs(c, DARKWOOD, 1.4); openBook(c, 0, 0, R * 0.9, 0, '#7a1424'); });
    rect(c, -R * 0.4, R * 0.55, R * 0.8, R * 0.4); fs(c, '#7a1424', 1.2);
    void r;
  } },
  { id: 'prayer_candles', name: t('Prayer candles'), cat: 'temple', w: 1.2, h: 0.6, layer: 1, light: { radius: 3, color: '#ffd38a', intensity: 0.75 }, tags: 'votive candles shrine offering', draw: (c, r, w, h) => {
    const W = w * 0.9, H = h * 0.74;
    shadow(c, true, 6, 2, 4); rrect(c, -W / 2, -H / 2, W, H, 3); fs(c, lin(c, 0, -H / 2, 0, H / 2, [[0, '#5a5a62'], [1, '#2a2a30']])); shadow(c, false);
    for (let row = 0; row < 3; row++) for (let i = 0; i < 9; i++) { const x = -W / 2 + 7 + i * (W - 14) / 8, y = -H / 2 + 7 + row * (H - 14) / 2; if (r() < 0.82) candle(c, x, y, 2.8, pick(r, ['#f2ead6', '#e8d8b8', '#c83a3a'])); else { circ(c, x, y, 2.8); fs(c, '#d8d0c0', 0.8); } }
  } },
  { id: 'incense', name: t('Incense burner'), cat: 'temple', w: 0.6, h: 0.6, layer: 1, light: { radius: 1.5, color: '#ffb070', intensity: 0.35 }, tags: 'censer smoke incense', draw: (c, r, w) => {
    const R = w * 0.28;
    shadow(c, true, 5, 2, 3); circ(c, 0, 0, R); fs(c, ball(c, 0, 0, R, BRASS(), 0.35), 1.6); shadow(c, false);
    for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU; circ(c, Math.cos(a) * R * 0.6, Math.sin(a) * R * 0.6, 2); c.fillStyle = '#3a2a10'; c.fill(); }
    circ(c, 0, 0, R * 0.25); fs(c, '#ff7a2a', 0.8);
    for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(0, 0); c.bezierCurveTo(rrange(r, -20, 20), rrange(r, -10, -25), rrange(r, -15, 25), rrange(r, -20, -35), rrange(r, -10, 30), rrange(r, -30, -45)); st(c, 'rgba(230,230,240,0.35)', rrange(r, 2, 4)); }
  } },
  { id: 'coffin', name: t('Coffin'), cat: 'temple', w: 0.9, h: 2, layer: 1, tags: 'casket funeral vampire undead', draw: (c, r, w, h) => {
    const W = w * 0.8, H = h * 0.9;
    const shape = () => poly(c, [-W * 0.3, -H / 2, W * 0.3, -H / 2, W / 2, -H * 0.25, W * 0.32, H / 2, -W * 0.32, H / 2, -W / 2, -H * 0.25]);
    shadow(c, true, 8, 3, 6); shape(); fs(c, lin(c, -W / 2, 0, W / 2, 0, [[0, '#5a3a22'], [0.5, '#7a5232'], [1, '#3a2414']])); shadow(c, false);
    clip(c, shape, () => { rect(c, -W / 2, -H / 2, W, H); grain(c, r, -W / 2, -H / 2, W, H, 8, true); });
    shape(); st(c, INK, 2.2);
    c.save(); c.scale(0.86, 0.9); shape(); c.restore(); st(c, 'rgba(255,220,170,0.25)', 1.4);
    rod(c, 0, -H * 0.3, 0, H * 0.05, '#c8b070', 3); rod(c, -W * 0.15, -H * 0.2, W * 0.15, -H * 0.2, '#c8b070', 3);
    for (const [x, y] of [[-0.44, -0.25], [0.44, -0.25], [-0.3, 0.4], [0.3, 0.4]]) { circ(c, x * W, y * H, 2.2); fs(c, METAL, 0.8); }
  } },
  { id: 'coffin_open', name: t('Open coffin'), cat: 'temple', w: 1.4, h: 2, layer: 1, tags: 'casket skeleton undead vampire crypt', draw: (c, r, w, h) => {
    const W = w * 0.52, H = h * 0.9, ox = -w * 0.12;
    const shape = (dx: number) => poly(c, [dx - W * 0.3, -H / 2, dx + W * 0.3, -H / 2, dx + W / 2, -H * 0.25, dx + W * 0.32, H / 2, dx - W * 0.32, H / 2, dx - W / 2, -H * 0.25]);
    at(c, w * 0.26, 4, 0.12, () => { shadow(c, true, 5, 2, 4); shape(0); fs(c, '#4a2e1a'); shadow(c, false); rod(c, 0, -H * 0.3, 0, H * 0.05, '#c8b070', 3); rod(c, -W * 0.15, -H * 0.2, W * 0.15, -H * 0.2, '#c8b070', 3); });
    shadow(c, true, 8, 3, 6); shape(ox); fs(c, '#5a3a22'); shadow(c, false);
    c.save(); c.translate(ox, 0); c.scale(0.82, 0.92); shape(0); c.restore(); fs(c, '#6a1420', 1.2);
    skull(c, ox, -H * 0.3, 17);
    line(c, ox, -H * 0.2, ox, H * 0.15, '#d8d0b8', 4);
    for (let i = 0; i < 5; i++) { const y = -H * 0.17 + i * 7; c.beginPath(); c.moveTo(ox - 10, y + 3); c.quadraticCurveTo(ox, y - 2, ox + 10, y + 3); st(c, '#d8d0b8', 2); }
    for (const s of [-1, 1]) { line(c, ox + s * 9, -H * 0.2, ox + s * 14, H * 0.05, '#d8d0b8', 2.6); line(c, ox + s * 5, H * 0.16, ox + s * 7, H * 0.42, '#d8d0b8', 3); }
    ell(c, ox, H * 0.15, 9, 5); fs(c, '#d8d0b8', 1);
  } },
  { id: 'urns', name: t('Funerary urns'), cat: 'temple', w: 0.9, h: 0.9, layer: 1, tags: 'urn ashes vase crypt', draw: (c, r, w) => {
    for (let i = 0; i < 3; i++) { const a = (i / 3) * TAU + r(), d = w * 0.18; jar(c, Math.cos(a) * d, Math.sin(a) * d, rrange(r, 12, 16), pick(r, ['#5a6a7a', '#7a5a3a', '#3a3a3a', '#8a7a5a']), false); }
    void GOLD;
  } },
  { id: 'mausoleum', name: t('Mausoleum'), cat: 'temple', w: 3, h: 3, layer: 1, tags: 'tomb crypt building graveyard roof', draw: (c, r, w) => {
    const S = w * 0.82;
    shadow(c, true, 18, 9, 12, 0.55); rect(c, -S / 2, -S / 2, S, S); fs(c, STONE_D); shadow(c, false);
    for (const k of [0, 1]) {
      const pts = k ? [-S / 2, -S / 2, S / 2, -S / 2, 0, 0] : [-S / 2, S / 2, S / 2, S / 2, 0, 0];
      poly(c, pts); fs(c, shade(STONE, k ? 0.15 : -0.2), 1.6);
      poly(c, k ? [-S / 2, -S / 2, -S / 2, S / 2, 0, 0] : [S / 2, -S / 2, S / 2, S / 2, 0, 0]); fs(c, shade(STONE, k ? 0.05 : -0.1), 1.6);
    }
    clip(c, () => rect(c, -S / 2, -S / 2, S, S), () => { for (let i = 1; i < 8; i++) { const d = (S / 2) * (i / 8); rect(c, -d, -d, d * 2, d * 2); st(c, 'rgba(0,0,0,0.18)', 1); } });
    line(c, -S / 2, -S / 2, S / 2, S / 2, INK, 1.6); line(c, S / 2, -S / 2, -S / 2, S / 2, INK, 1.6);
    rect(c, -S / 2, -S / 2, S, S); st(c, INK, 2.6);
    circ(c, 0, 0, 10); fs(c, ball(c, 0, 0, 10, STONE_L), 1.6);
    rect(c, -S * 0.15, S / 2, S * 0.3, 14); fs(c, STONE, 1.8); rect(c, -S * 0.1, S / 2, S * 0.2, 6); fs(c, '#1a1410', 1);
    for (const s of [-1, 1]) { circ(c, s * S * 0.22, S / 2 + 8, 7); fs(c, ball(c, 0, 0, 8, STONE_L), 1.6); }
    for (let i = 0; i < 5; i++) { blob(c, r, rrange(r, 6, 14), 7, 0.3, rrange(r, -S / 2, S / 2), rrange(r, -S / 2, S / 2)); c.fillStyle = 'rgba(80,110,50,0.35)'; c.fill(); }
  } },
  { id: 'grave_mound', name: t('Grave'), cat: 'temple', w: 1, h: 2, layer: 0, tags: 'grave burial dirt fresh flowers', draw: (c, r, w, h) => {
    const W = w * 0.62, H = h * 0.72;
    shadow(c, true, 6, 2, 4, 0.4);
    rrect(c, -W / 2, -H / 2 + h * 0.08, W, H, W * 0.45); fs(c, radial(c, 0, h * 0.08, H * 0.6, '#8a6a4a', '#4a3420', 0.2), 1.8); shadow(c, false);
    clip(c, () => rrect(c, -W / 2, -H / 2 + h * 0.08, W, H, W * 0.45), () => { for (let i = 0; i < 40; i++) { circ(c, rrange(r, -W / 2, W / 2), rrange(r, -H / 2, H / 2) + h * 0.08, rrange(r, 1, 2.5)); c.fillStyle = pick(r, ['#5a4028', '#a08060', '#3a2818']); c.fill(); } });
    flowers(c, r, rrange(r, -W * 0.2, W * 0.2), rrange(r, -h * 0.05, h * 0.2), 4, 6);
    at(c, 0, -h * 0.38, 0, () => { shadow(c, true, 5, 3, 4); rrect(c, -w * 0.3, -h * 0.07, w * 0.6, h * 0.14, [14, 14, 2, 2]); fs(c, lin(c, 0, -h * 0.07, 0, h * 0.07, [[0, STONE_L], [1, STONE_D]])); shadow(c, false); line(c, -w * 0.14, 0, w * 0.14, 0, 'rgba(0,0,0,0.45)', 1.6); line(c, -w * 0.1, 5, w * 0.1, 5, 'rgba(0,0,0,0.35)', 1.2); });
  } },
  { id: 'grave_open', name: t('Open grave'), cat: 'temple', w: 1.6, h: 2, layer: 0, tags: 'grave dug pit shovel exhumed', draw: (c, r, w, h) => {
    const W = w * 0.38, H = h * 0.62;
    for (let i = 0; i < 18; i++) { blob(c, r, rrange(r, 8, 16), 7, 0.3, w * 0.32 + rrange(r, -10, 10), rrange(r, -H * 0.4, H * 0.4)); fs(c, ball(c, 0, 0, 20, '#7a5a3a', 0.2), 1.2); }
    rect(c, -W / 2 - w * 0.1, -H / 2, W, H); fs(c, lin(c, 0, -H / 2, 0, H / 2, [[0, '#140c06'], [0.3, '#2a1c10'], [1, '#3e2a18']]), 2.2);
    for (let i = 0; i < 3; i++) line(c, -W / 2 - w * 0.1 + 3, -H / 2 + 6 + i * 10, W / 2 - w * 0.1 - 3, -H / 2 + 6 + i * 10, 'rgba(90,60,30,0.3)', 1.2);
    at(c, w * 0.36, H * 0.4, -0.8, () => { rod(c, -28, 0, 14, 0, WOOD, 3); poly(c, [14, -7, 28, -6, 30, 0, 28, 6, 14, 7]); fs(c, lin(c, 14, -7, 14, 7, [[0, METAL_L()], [1, METAL_D]]), 1.2); });
    at(c, -w * 0.1, -h * 0.42, 0, () => { shadow(c, true, 5, 3, 4); rrect(c, -w * 0.18, -h * 0.05, w * 0.36, h * 0.1, [12, 12, 2, 2]); fs(c, lin(c, 0, -h * 0.05, 0, h * 0.05, [[0, STONE_L], [1, STONE_D]])); shadow(c, false); });
  } },
  { id: 'celtic_cross', name: t('Cross gravestone'), cat: 'temple', w: 0.9, h: 0.7, layer: 1, tags: 'grave headstone cross cemetery', draw: (c, r, w, h) => {
    const s = w * 0.45;
    shadow(c, true, 6, 3, 5); poly(c, [-s * 0.14, -s * 0.6, s * 0.14, -s * 0.6, s * 0.14, -s * 0.14, s * 0.6, -s * 0.14, s * 0.6, s * 0.14, s * 0.14, s * 0.14, s * 0.14, s * 0.5, -s * 0.14, s * 0.5, -s * 0.14, s * 0.14, -s * 0.6, s * 0.14, -s * 0.6, -s * 0.14, -s * 0.14, -s * 0.14]);
    fs(c, lin(c, -s, -s, s, s, [[0, STONE_L], [1, STONE_D]])); shadow(c, false);
    circ(c, 0, 0, s * 0.32); st(c, INK, 6); circ(c, 0, 0, s * 0.32); st(c, STONE, 4);
    for (let i = 0; i < 3; i++) { blob(c, r, rrange(r, 2, 4), 6, 0.3, rrange(r, -s * 0.4, s * 0.4), rrange(r, -s * 0.3, s * 0.3)); c.fillStyle = 'rgba(90,120,50,0.6)'; c.fill(); }
    void h;
  } },
  { id: 'tomb_slab', name: t('Tomb slab'), cat: 'temple', w: 1, h: 2, layer: 0, tags: 'floor grave engraved crypt tombstone', draw: (c, r, w, h) => {
    const W = w * 0.8, H = h * 0.86;
    slabStone(c, r, -W / 2, -H / 2, W, H, '#8e897e', 2);
    rect(c, -W / 2 + 6, -H / 2 + 6, W - 12, H - 12); st(c, 'rgba(0,0,0,0.35)', 1.4);
    figure(c, r, W * 0.9, '#a49f94', false, true);
    for (let i = 0; i < 3; i++) line(c, -W * 0.25, H * 0.32 + i * 6, W * 0.25, H * 0.32 + i * 6, 'rgba(0,0,0,0.35)', 1.2);
  } },
  { id: 'stained_glass', name: t('Stained glass light'), cat: 'temple', w: 2, h: 3, layer: 0, light: { radius: 2.5, color: '#ffe0b0', intensity: 0.3 }, tags: 'window light colored sunbeam chapel', draw: (c, r, w, h) => {
    const cols = ['255,70,70', '70,120,255', '255,210,60', '80,220,120', '200,90,255'];
    c.save(); c.globalCompositeOperation = 'lighter';
    const W = w * 0.62, H = h * 0.86;
    const arch = () => { c.beginPath(); c.moveTo(-W / 2, H / 2); c.lineTo(-W / 2, -H * 0.15); c.quadraticCurveTo(-W / 2, -H / 2, 0, -H / 2); c.quadraticCurveTo(W / 2, -H / 2, W / 2, -H * 0.15); c.lineTo(W / 2, H / 2); c.closePath(); };
    clip(c, arch, () => {
      const n = 5;
      for (let i = 0; i < n; i++) for (let j = 0; j < 7; j++) {
        const x = -W / 2 + (i * W) / n, y = -H / 2 + (j * H) / 7;
        rect(c, x + rrange(r, -3, 3), y + rrange(r, -3, 3), W / n + 6, H / 7 + 6); c.fillStyle = `rgba(${pick(r, cols)},${rrange(r, 0.12, 0.22)})`; c.fill();
      }
    });
    c.restore();
    arch(); st(c, 'rgba(255,240,210,0.25)', 3);
    c.save(); clip(c, arch, () => { for (let i = 1; i < 5; i++) line(c, -W / 2 + (i * W) / 5, -H / 2, -W / 2 + (i * W) / 5, H / 2, 'rgba(0,0,0,0.15)', 2); circ(c, 0, -H * 0.2, W * 0.24); st(c, 'rgba(0,0,0,0.15)', 2); }); c.restore();
  } },
  { id: 'gong', name: 'Gong', cat: 'temple', w: 1.2, h: 0.6, layer: 1, tags: 'gong bell monastery', draw: (c, r, w, h) => {
    for (const s of [-1, 1]) rod(c, s * w * 0.42, -h * 0.1, s * w * 0.42, h * 0.1, WOOD_D, 7);
    rod(c, -w * 0.46, 0, w * 0.46, 0, '#8a1f2a', 5);
    shadow(c, true, 5, 3, 5); ell(c, 0, h * 0.08, w * 0.3, h * 0.12); fs(c, lin(c, -w * 0.3, 0, w * 0.3, 0, [[0, GOLD_D], [0.4, GOLD_L], [1, GOLD_D]]), 1.8); shadow(c, false);
    ell(c, 0, h * 0.08, w * 0.08, h * 0.04); st(c, 'rgba(100,70,10,0.6)', 1.2);
    void r;
  } },
  { id: 'temple_bell', name: t('Bell'), cat: 'temple', w: 1.1, h: 1.1, layer: 2, tags: 'bell tower church', draw: (c, r, w) => {
    const R = w * 0.36;
    rod(c, -w * 0.48, 0, w * 0.48, 0, DARKWOOD, 8);
    shadow(c, true, 10, 8, 12, 0.45); circ(c, 0, 0, R); fs(c, radial(c, 0, 0, R, '#e8c878', '#7a5a1a', 0.4), 2); shadow(c, false);
    for (let k = 1; k < 4; k++) { circ(c, 0, 0, R * (1 - k * 0.2)); st(c, 'rgba(90,60,10,0.45)', 1.4); }
    circ(c, 0, 0, R * 0.18); fs(c, ball(c, 0, 0, R * 0.18, '#a07a2a'), 1.2);
    void r;
  } },
  { id: 'ossuary', name: t('Skull pile'), cat: 'temple', w: 1.5, h: 1.2, layer: 1, tags: 'ossuary bones skulls catacomb', draw: (c, r, w, h) => {
    for (let i = 0; i < 14; i++) bone(c, rrange(r, -w * 0.35, w * 0.35), rrange(r, -h * 0.3, h * 0.3), rrange(r, 16, 28), r() * TAU, pick(r, ['#e8e0c8', '#d8ceb0', '#c8bc98']));
    for (let i = 0; i < 11; i++) { const k = 1 - i / 14; skull(c, rrange(r, -w * 0.3, w * 0.3) * k, rrange(r, -h * 0.26, h * 0.26) * k, rrange(r, 15, 19), rrange(r, -0.6, 0.6), pick(r, ['#e8e0c8', '#d8ceb0', '#c8bc98'])); }
  } },
  { id: 'obelisk', name: t('Obelisk'), cat: 'temple', w: 1, h: 1, layer: 1, tags: 'monument pillar memorial', draw: (c, r, w) => {
    const S = w * 0.4;
    shadow(c, true, 14, 10, 14, 0.5); rect(c, -S, -S, S * 2, S * 2); fs(c, STONE_D); shadow(c, false);
    poly(c, [-S * 0.8, -S * 0.8, S * 0.8, -S * 0.8, 0, 0]); fs(c, shade(STONE, 0.2), 1.2);
    poly(c, [-S * 0.8, -S * 0.8, -S * 0.8, S * 0.8, 0, 0]); fs(c, shade(STONE, 0.05), 1.2);
    poly(c, [S * 0.8, -S * 0.8, S * 0.8, S * 0.8, 0, 0]); fs(c, shade(STONE, -0.15), 1.2);
    poly(c, [-S * 0.8, S * 0.8, S * 0.8, S * 0.8, 0, 0]); fs(c, shade(STONE, -0.25), 1.2);
    poly(c, [-S * 0.15, -S * 0.15, S * 0.15, -S * 0.15, S * 0.15, S * 0.15, -S * 0.15, S * 0.15]); fs(c, GOLD, 1);
    void r;
  } },
  { id: 'shrine', name: t('Wayside shrine'), cat: 'temple', w: 1.2, h: 1, layer: 1, light: { radius: 2.5, color: '#ffd38a', intensity: 0.6 }, tags: 'shrine offering idol roadside', draw: (c, r, w, h) => {
    const W = w * 0.7, H = h * 0.6;
    shadow(c, true, 8, 4, 6); poly(c, [-W / 2 - 6, -H / 2, W / 2 + 6, -H / 2, W / 2 + 6, H * 0.05, -W / 2 - 6, H * 0.05]); fs(c, '#6a3a22'); shadow(c, false);
    for (let i = 0; i < 6; i++) line(c, -W / 2 - 6, -H / 2 + i * (H * 0.55) / 6, W / 2 + 6, -H / 2 + i * (H * 0.55) / 6, 'rgba(0,0,0,0.3)', 1.2);
    rect(c, -W / 2, H * 0.05, W, H * 0.45); fs(c, STONE, 1.6);
    figure(c, r, W * 0.42, MARBLE, false, false);
    for (let i = 0; i < 3; i++) candle(c, -W * 0.3 + i * W * 0.3, H * 0.35, 2.6);
    flowers(c, r, 0, H * 0.55, 5, 10);
    coin(c, W * 0.25, H * 0.22, 3); coin(c, -W * 0.2, H * 0.2, 3);
  } },
  { id: 'iron_fence', name: t('Iron fence'), cat: 'temple', w: 2, h: 0.3, layer: 1, tags: 'fence railing cemetery gate', draw: (c, r, w) => {
    const W = w * 0.98;
    shadow(c, true, 3, 2, 3); rod(c, -W / 2, 0, W / 2, 0, '#2a2c30', 3); shadow(c, false);
    for (let i = 0; i <= 12; i++) { const x = -W / 2 + (W * i) / 12; circ(c, x, 0, i % 4 === 0 ? 5 : 3); fs(c, i % 4 === 0 ? '#3a3c42' : '#2a2c30', 1.2); if (i % 4 !== 0) { poly(c, [x, -7, x + 2.5, -3, x - 2.5, -3]); fs(c, '#4a4c52', 0.8); } }
    void r;
  } },
  { id: 'prayer_mat', name: t('Prayer mat'), cat: 'temple', w: 1, h: 1.6, layer: 0, tags: 'rug mat meditation monk', draw: (c, r, w, h) => {
    const W = w * 0.7, H = h * 0.84, col = pick(r, ['#7a1424', '#1f4a3a', '#2a3a6a']);
    rect(c, -W / 2, -H / 2, W, H); fs(c, col, 1.6);
    rect(c, -W / 2 + 5, -H / 2 + 5, W - 10, H - 10); st(c, GOLD, 2);
    c.beginPath(); c.moveTo(-W / 2 + 12, -H * 0.15); c.lineTo(-W / 2 + 12, -H / 2 + 20); c.quadraticCurveTo(0, -H / 2 + 2, W / 2 - 12, -H / 2 + 20); c.lineTo(W / 2 - 12, -H * 0.15); st(c, GOLD, 1.6);
    for (let i = 0; i < 3; i++) { poly(c, [0, H * 0.05 + i * 18 - 7, 7, H * 0.05 + i * 18, 0, H * 0.05 + i * 18 + 7, -7, H * 0.05 + i * 18]); fs(c, shade(col, 0.3), 1); }
    for (let x = -W / 2 + 3; x < W / 2; x += 5) for (const s of [-1, 1]) line(c, x, s * H / 2, x, s * (H / 2 + 5), '#d8c49a', 1.2);
  } },
];

function starPathSun(c: C2D, x: number, y: number, R: number) {
  c.beginPath(); for (let i = 0; i < 16; i++) { const a = (i / 16) * TAU, d = i % 2 ? R * 0.5 : R; i ? c.lineTo(x + Math.cos(a) * d, y + Math.sin(a) * d) : c.moveTo(x + Math.cos(a) * d, y + Math.sin(a) * d); } c.closePath(); fs(c, GOLD_L, 0.8);
}
const BRASS = () => '#c9a24a';
const METAL_L = () => '#c3c8cd';
