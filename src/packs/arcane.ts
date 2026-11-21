import { t } from '../i18n';
import {
  at, ball, blob, book, bottle, BRASS, C2D, candle, circ, clip, CLOTH, coals, COPPER, ell, flame, fs, gem, glow, GOLD, GOLD_D, GOLD_L, INK,
  jar, lin, line, magicFlame, METAL, METAL_D, METAL_L, openBook, PARCH, pick, plankBox, poly, potion, radial, rect, rock, rod, rrange,
  rrect, scroll, shade, shadow, skull, sparkle, StampDef, st, starPath, STONE, STONE_D, STONE_L, TAU, tome, WOOD, WOOD_D, WOOD_L,
  DARKWOOD, OAK, bone, leafShape, boulder, cloth,
} from '../art';
import type { Rng } from '../util';

const POTIONS: [string, string][] = [['#d0303a', '255,60,60'], ['#3a7ad8', '80,140,255'], ['#40c060', '90,255,120'], ['#a050e0', '190,110,255'], ['#e0b030', '255,210,80'], ['#30c8c8', '80,240,240']];

/** A single random rune glyph made of strokes. */
export function rune(c: C2D, r: Rng, x: number, y: number, s: number, col: string, lw = 1.6) {
  c.save(); c.translate(x, y); c.strokeStyle = col; c.lineWidth = lw; c.lineCap = 'round'; c.lineJoin = 'round';
  c.beginPath();
  const n = 2 + Math.floor(r() * 3);
  for (let i = 0; i < n; i++) {
    const k = r();
    if (k < 0.4) { c.moveTo(rrange(r, -s, s) * 0.5, -s / 2); c.lineTo(rrange(r, -s, s) * 0.5, s / 2); }
    else if (k < 0.7) { const yy = rrange(r, -s, s) * 0.4; c.moveTo(-s / 2, yy); c.lineTo(s / 2, yy + rrange(r, -s, s) * 0.3); }
    else if (k < 0.85) { c.moveTo(s * 0.35, 0); c.arc(0, 0, s * 0.35, 0, rrange(r, 2, TAU)); }
    else { c.moveTo(-s / 2, -s / 2); c.lineTo(0, s / 2); c.lineTo(s / 2, -s / 2); }
  }
  c.stroke(); c.restore();
}
/** Concentric arcane circle with runes. rgb = "r,g,b". */
export function arcaneCircle(c: C2D, r: Rng, R: number, col: string, rgb: string, sides = 6) {
  glow(c, 0, 0, R * 1.15, rgb, 0.35);
  c.save(); c.shadowColor = `rgba(${rgb},0.9)`; c.shadowBlur = 10;
  c.strokeStyle = col; c.lineWidth = 3; circ(c, 0, 0, R); c.stroke();
  c.lineWidth = 1.5; circ(c, 0, 0, R * 0.9); c.stroke(); circ(c, 0, 0, R * 0.62); c.stroke(); circ(c, 0, 0, R * 0.56); c.stroke();
  const n = Math.max(12, Math.round(R / 5));
  for (let i = 0; i < n; i++) { const a = (i / n) * TAU; c.save(); c.rotate(a + Math.PI / 2); rune(c, r, 0, -R * 0.76, R * 0.12, col, 1.5); c.restore(); }
  c.beginPath(); for (let i = 0; i <= sides; i++) { const a = -Math.PI / 2 + (i * TAU) / sides; i ? c.lineTo(Math.cos(a) * R * 0.56, Math.sin(a) * R * 0.56) : c.moveTo(Math.cos(a) * R * 0.56, Math.sin(a) * R * 0.56); } c.lineWidth = 2; c.stroke();
  c.beginPath(); for (let i = 0; i <= sides; i++) { const a = Math.PI / 2 + (i * TAU) / sides; i ? c.lineTo(Math.cos(a) * R * 0.56, Math.sin(a) * R * 0.56) : c.moveTo(Math.cos(a) * R * 0.56, Math.sin(a) * R * 0.56); } c.stroke();
  for (let i = 0; i < sides; i++) { const a = -Math.PI / 2 + (i * TAU) / sides; circ(c, Math.cos(a) * R * 0.9, Math.sin(a) * R * 0.9, R * 0.06); c.fillStyle = col; c.fill(); }
  circ(c, 0, 0, R * 0.18); c.lineWidth = 2; c.stroke(); rune(c, r, 0, 0, R * 0.2, col, 2);
  c.restore();
}
function retort(c: C2D, x: number, y: number, s: number, rot: number, col: string) {
  at(c, x, y, rot, () => {
    c.beginPath(); c.moveTo(s * 0.3, -s * 0.06); c.quadraticCurveTo(s * 0.9, -s * 0.15, s * 1.3, s * 0.2); st(c, INK, 4.5); st(c, 'rgba(210,235,240,0.9)', 2.6);
    circ(c, 0, 0, s * 0.4); fs(c, radial(c, 0, 0, s * 0.4, '#f4faff', 'rgba(170,200,210,0.9)', 0.3), 1.3);
    circ(c, 0, 0, s * 0.28); c.fillStyle = col; c.fill();
    sparkle(c, -s * 0.15, -s * 0.15, s * 0.15);
  });
}
function mortar(c: C2D, x: number, y: number, R: number) {
  shadow(c, true, 3, 1.5, 2, 0.4); circ(c, x, y, R); fs(c, ball(c, x, y, R, STONE_L, 0.25), 1.2); shadow(c, false);
  circ(c, x, y, R * 0.65); fs(c, radial(c, x, y, R * 0.65, '#6a8a4a', '#3a4a2a'), 0.8);
  rod(c, x - R * 0.2, y - R * 0.2, x + R * 0.9, y - R * 0.9, STONE_L, 3);
}
function specimen(c: C2D, r: Rng, x: number, y: number, R: number) {
  shadow(c, true, 3, 1.5, 2, 0.4); circ(c, x, y, R); fs(c, radial(c, x, y, R, 'rgba(220,240,200,0.95)', 'rgba(120,160,100,0.95)', 0.3), 1.3); shadow(c, false);
  const k = r();
  if (k < 0.33) { circ(c, x, y, R * 0.45); fs(c, '#f4f0e6', 0.8); circ(c, x + R * 0.1, y, R * 0.22); c.fillStyle = pick(r, ['#2a6a3a', '#8a5a1a', '#3a4a9a']); c.fill(); circ(c, x + R * 0.12, y, R * 0.1); c.fillStyle = '#000'; c.fill(); }
  else if (k < 0.66) { for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + rrange(r, -R, R), y + rrange(r, -R, R), x + rrange(r, -R * 0.7, R * 0.7), y + rrange(r, -R * 0.7, R * 0.7)); st(c, '#9a4a6a', 2); } }
  else { blob(c, r, R * 0.45, 6, 0.3, x, y); c.fillStyle = '#7a3a2a'; c.fill(); }
  circ(c, x, y, R * 0.35); st(c, 'rgba(255,255,255,0.0)', 0);
  ell(c, x - R * 0.4, y - R * 0.4, R * 0.25, R * 0.12, -0.8); c.fillStyle = 'rgba(255,255,255,0.7)'; c.fill();
}
function candleCluster(c: C2D, r: Rng, n: number, R: number, col = '#f2ead6') {
  for (let i = 0; i < n; i++) { const a = r() * TAU, d = Math.sqrt(r()) * R; candle(c, Math.cos(a) * d, Math.sin(a) * d, rrange(r, 2.4, 3.6), col); }
}

export const ARCANE: StampDef[] = [
  { id: 'alchemy_table', name: t('Alchemy table'), cat: 'arcane', w: 2, h: 1, layer: 1, light: { radius: 3, color: '#8aff9a', intensity: 0.55 }, tags: 'alchemist potions lab flasks', draw: (c, r, w, h) => {
    const W = w * 0.92, H = h * 0.8;
    shadow(c, true); plankBox(c, r, -W / 2, -H / 2, W, H, 2, DARKWOOD); shadow(c, false);
    for (let i = 0; i < 6; i++) { blob(c, r, rrange(r, 3, 8), 6, 0.3, rrange(r, -W * 0.4, W * 0.4), rrange(r, -H * 0.35, H * 0.35)); c.fillStyle = pick(r, ['rgba(120,255,140,0.25)', 'rgba(180,90,255,0.25)', 'rgba(0,0,0,0.25)']); c.fill(); }
    retort(c, -W * 0.32, -H * 0.1, 18, 0.2, 'rgba(90,220,110,0.85)');
    glow(c, -W * 0.32, -H * 0.1, 18, '90,255,120', 0.4);
    for (let i = 0; i < 4; i++) { const [col, rgb] = pick(r, POTIONS); potion(c, -W * 0.02 + i * 11, -H * 0.24 + (i % 2) * 8, 5, col, rgb); }
    mortar(c, W * 0.12, H * 0.2, 9);
    openBook(c, W * 0.33, H * 0.02, 34, rrange(r, -0.2, 0.2), '#3a1a4a');
    candle(c, W * 0.42, -H * 0.3, 3);
    for (let i = 0; i < 5; i++) leafShape(c, -W * 0.1 + rrange(r, -8, 8), H * 0.25 + rrange(r, -4, 4), 8, 3, r() * TAU), fs(c, pick(r, ['#5a8a3a', '#8a6a3a', '#6a3a6a']), 0.6);
  } },
  { id: 'potion_shelf', name: t('Potion shelf'), cat: 'arcane', w: 1.6, h: 0.5, layer: 1, light: { radius: 2.5, color: '#b08aff', intensity: 0.45 }, tags: 'potions bottles apothecary', draw: (c, r, w, h) => {
    const W = w * 0.94, H = h * 0.8;
    shadow(c, true, 6, 2, 4); plankBox(c, r, -W / 2, -H / 2, W, H, 1, DARKWOOD); shadow(c, false);
    rect(c, -W / 2 + 4, -H / 2 + 4, W - 8, H - 8); c.fillStyle = 'rgba(15,8,5,0.6)'; c.fill();
    let x = -W / 2 + 9;
    while (x < W / 2 - 9) { const [col, rgb] = pick(r, POTIONS); const R = rrange(r, 4, 6.5); potion(c, x, rrange(r, -3, 3), R, col, rgb); x += R * 2 + 3; }
  } },
  { id: 'potions', name: t('Potions'), cat: 'arcane', w: 0.7, h: 0.7, layer: 1, light: { radius: 1.8, color: '#ff7ab0', intensity: 0.4 }, tags: 'potion vial elixir healing', draw: (c, r, w) => {
    for (let i = 0; i < 5; i++) { const [col, rgb] = pick(r, POTIONS); potion(c, rrange(r, -w * 0.2, w * 0.2), rrange(r, -w * 0.2, w * 0.2), rrange(r, 7, 10), col, rgb); }
  } },
  { id: 'crystal_ball', name: t('Crystal ball'), cat: 'arcane', w: 0.8, h: 0.8, layer: 1, light: { radius: 2.5, color: '#9ad0ff', intensity: 0.6 }, tags: 'scrying orb seer fortune', draw: (c, r, w) => {
    const R = w * 0.26;
    shadow(c, true, 6, 3, 4); for (let i = 0; i < 3; i++) { const a = (i / 3) * TAU + 0.5; rod(c, 0, 0, Math.cos(a) * R * 1.4, Math.sin(a) * R * 1.4, BRASS, 4); } shadow(c, false);
    for (let i = 0; i < 3; i++) { const a = (i / 3) * TAU + 0.5; circ(c, Math.cos(a) * R * 1.4, Math.sin(a) * R * 1.4, 4); fs(c, ball(c, 0, 0, 4, GOLD), 1); }
    glow(c, 0, 0, R * 2.2, '140,200,255', 0.45);
    circ(c, 0, 0, R); fs(c, radial(c, 0, 0, R, '#e8f6ff', '#3a5a9a', 0.35), 1.6);
    clip(c, () => circ(c, 0, 0, R), () => { for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(rrange(r, -3, 3), rrange(r, -3, 3), R * rrange(r, 0.3, 0.7), r() * 6, r() * 6 + 3); st(c, 'rgba(220,240,255,0.65)', 2); } });
    sparkle(c, -R * 0.4, -R * 0.4, R * 0.35);
  } },
  { id: 'spellbook_lectern', name: t('Spellbook lectern'), cat: 'arcane', w: 0.9, h: 0.8, layer: 1, light: { radius: 2, color: '#ffcf7a', intensity: 0.5 }, tags: 'book lectern tome wizard', draw: (c, r, w, h) => {
    shadow(c, true, 6, 3, 5); poly(c, [-w * 0.38, -h * 0.28, w * 0.38, -h * 0.28, w * 0.3, h * 0.32, -w * 0.3, h * 0.32]); fs(c, lin(c, 0, -h * 0.3, 0, h * 0.3, [[0, WOOD_L], [1, WOOD_D]])); shadow(c, false);
    openBook(c, 0, 0, w * 0.62, 0, '#4a1a3a');
    glow(c, 0, 0, w * 0.4, '255,210,120', 0.25);
    for (let i = 0; i < 3; i++) rune(c, r, -w * 0.18 + i * 7, -h * 0.05, 6, 'rgba(255,200,90,0.9)', 1.2);
    for (let i = 0; i < 3; i++) rune(c, r, w * 0.06 + i * 7, -h * 0.05, 6, 'rgba(255,200,90,0.9)', 1.2);
  } },
  { id: 'scroll_pile', name: t('Scroll pile'), cat: 'arcane', w: 0.9, h: 0.9, layer: 1, tags: 'scrolls parchment papers library', draw: (c, r, w) => {
    for (let i = 0; i < 9; i++) scroll(c, rrange(r, -w * 0.22, w * 0.22), rrange(r, -w * 0.22, w * 0.22), rrange(r, 26, 40), r() * TAU, i === 8);
  } },
  { id: 'magic_circle', name: t('Magic circle'), cat: 'arcane', w: 3, h: 3, layer: 0, light: { radius: 4, color: '#7ab8ff', intensity: 0.6 }, tags: 'arcane runes ritual glyph teleportation', draw: (c, r, w) => arcaneCircle(c, r, w * 0.44, '#9ad4ff', '110,180,255', 6) },
  { id: 'summoning_circle', name: t('Summoning circle'), cat: 'arcane', w: 3, h: 3, layer: 0, light: { radius: 4, color: '#ff5a3a', intensity: 0.65 }, tags: 'demon ritual infernal runes blood', draw: (c, r, w) => {
    arcaneCircle(c, r, w * 0.44, '#ff6a4a', '255,80,40', 5);
    for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + (i * TAU) / 5; candle(c, Math.cos(a) * w * 0.47, Math.sin(a) * w * 0.47, 4, '#2a2020'); }
  } },
  { id: 'portal', name: t('Portal'), cat: 'arcane', w: 2, h: 2, layer: 1, light: { radius: 5, color: '#b07aff', intensity: 0.85 }, tags: 'gate rift teleport vortex planar', draw: (c, r, w) => {
    const R = w * 0.4;
    glow(c, 0, 0, R * 1.5, '170,110,255', 0.5);
    for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; at(c, Math.cos(a) * R, Math.sin(a) * R, a, () => { shadow(c, true, 5, 2, 3); rrect(c, -9, -12, 18, 24, 3); fs(c, ball(c, 0, 0, 14, STONE, 0.25), 1.8); shadow(c, false); rune(c, r, 0, 0, 9, '#d8b8ff', 1.4); }); }
    circ(c, 0, 0, R * 0.86); fs(c, radial(c, 0, 0, R * 0.86, '#f6eeff', '#2a0a4a', 0), 2);
    clip(c, () => circ(c, 0, 0, R * 0.86), () => {
      for (let k = 0; k < 40; k++) { const a0 = k * 0.55, d = R * (0.08 + k * 0.02); c.beginPath(); c.arc(0, 0, d, a0, a0 + 2.2); st(c, k % 3 ? 'rgba(200,150,255,0.55)' : 'rgba(255,255,255,0.6)', 2.2); }
      for (let i = 0; i < 14; i++) sparkle(c, rrange(r, -R * 0.6, R * 0.6), rrange(r, -R * 0.6, R * 0.6), rrange(r, 2, 4));
    });
  } },
  { id: 'orrery', name: t('Orrery'), cat: 'arcane', w: 1.3, h: 1.3, layer: 1, tags: 'astronomy planets brass model', draw: (c, r, w) => {
    const R = w * 0.4;
    shadow(c, true, 6, 3, 5); circ(c, 0, 0, R * 0.3); fs(c, ball(c, 0, 0, R * 0.3, DARKWOOD, 0.3), 1.8); shadow(c, false);
    for (let k = 1; k <= 4; k++) { const rr = R * (0.3 + k * 0.17); ell(c, 0, 0, rr, rr * 0.92, k * 0.4); st(c, INK, 3.2); ell(c, 0, 0, rr, rr * 0.92, k * 0.4); st(c, BRASS, 1.8);
      const a = r() * TAU; const px = Math.cos(a) * rr, py = Math.sin(a) * rr * 0.92; rod(c, 0, 0, px, py, BRASS, 1); circ(c, px, py, rrange(r, 4, 7)); fs(c, ball(c, px, py, 6, pick(r, ['#c86a3a', '#4a8ad8', '#d8c070', '#8ab8a0', '#a07ad8'])), 1.1); }
    glow(c, 0, 0, R * 0.35, '255,210,100', 0.6); circ(c, 0, 0, R * 0.16); fs(c, ball(c, 0, 0, R * 0.16, '#ffd84a', 0.4), 1.2);
  } },
  { id: 'telescope', name: t('Telescope'), cat: 'arcane', w: 1.4, h: 0.8, layer: 1, tags: 'astronomy observatory stars', draw: (c, r, w, h) => {
    for (let i = 0; i < 3; i++) { const a = (i / 3) * TAU + 0.3; rod(c, 0, 0, Math.cos(a) * h * 0.36, Math.sin(a) * h * 0.36, WOOD_D, 3); }
    at(c, 0, 0, rrange(r, -0.35, -0.1), () => {
      shadow(c, true, 6, 4, 6); poly(c, [-w * 0.42, -6, w * 0.3, -10, w * 0.3, 10, -w * 0.42, 6]); fs(c, lin(c, 0, -10, 0, 10, [[0, GOLD_L], [0.5, BRASS], [1, GOLD_D]]), 1.8); shadow(c, false);
      for (const x of [-w * 0.3, -w * 0.05, w * 0.2]) line(c, x, -9, x, 9, 'rgba(60,40,10,0.6)', 2);
      ell(c, w * 0.3, 0, 3, 10); fs(c, radial(c, w * 0.3, 0, 10, '#d8f0ff', '#4a7aa8'), 1.2);
    });
  } },
  { id: 'arcane_pylon', name: t('Arcane pylon'), cat: 'arcane', w: 1, h: 1, layer: 1, light: { radius: 4, color: '#6ad8ff', intensity: 0.8 }, tags: 'crystal pedestal power focus', draw: (c, r, w) => {
    const R = w * 0.38;
    shadow(c, true, 8, 4, 6); poly(c, Array.from({ length: 16 }, (_, i) => (i % 2 ? Math.sin : Math.cos)((Math.floor(i / 2) / 8) * TAU + Math.PI / 8) * R)); fs(c, lin(c, -R, -R, R, R, [[0, STONE_L], [1, STONE_D]])); shadow(c, false);
    for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU; rune(c, r, Math.cos(a) * R * 0.75, Math.sin(a) * R * 0.75, 6, 'rgba(120,220,255,0.9)', 1.2); }
    glow(c, 0, 0, R * 1.1, '100,210,255', 0.6);
    gem(c, 0, 0, R * 0.42, '#5ad0ff', 6, r());
  } },
  { id: 'runestone', name: t('Runestone'), cat: 'arcane', w: 1, h: 0.8, layer: 1, light: { radius: 2.5, color: '#7affc8', intensity: 0.55 }, tags: 'standing stone runes druid', draw: (c, r, w, h) => {
    c.save(); c.scale(1, 0.72); boulder(c, r, 0, 0, w * 0.36, '#8a8a84', 0.5); c.restore();
    glow(c, 0, 0, w * 0.35, '100,255,190', 0.35);
    for (let i = 0; i < 4; i++) rune(c, r, -w * 0.15 + i * w * 0.1, rrange(r, -4, 4), 8, 'rgba(140,255,200,0.95)', 1.8);
    void h;
  } },
  { id: 'magic_mirror', name: t('Magic mirror'), cat: 'arcane', w: 1, h: 0.5, layer: 1, light: { radius: 2, color: '#c0a0ff', intensity: 0.5 }, tags: 'mirror scrying looking glass', draw: (c, r, w, h) => {
    shadow(c, true, 6, 3, 4); ell(c, 0, 0, w * 0.38, h * 0.26); fs(c, lin(c, -w * 0.4, 0, w * 0.4, 0, [[0, GOLD_D], [0.5, GOLD_L], [1, GOLD_D]]), 2); shadow(c, false);
    ell(c, 0, 0, w * 0.32, h * 0.17); fs(c, lin(c, -w * 0.3, -h * 0.2, w * 0.3, h * 0.2, [[0, '#e8e0ff'], [0.5, '#7a5aa8'], [1, '#2a1a4a']]), 1.2);
    glow(c, 0, 0, w * 0.3, '200,160,255', 0.35);
    for (let i = 0; i < 6; i++) sparkle(c, rrange(r, -w * 0.25, w * 0.25), rrange(r, -h * 0.1, h * 0.1), 2);
    for (const s of [-1, 1]) { circ(c, s * w * 0.4, 0, 4); fs(c, '#a02a4a', 1); }
  } },
  { id: 'witch_cauldron', name: t('Bubbling cauldron'), cat: 'arcane', w: 1.2, h: 1.2, layer: 1, light: { radius: 3.5, color: '#b06aff', intensity: 0.75 }, tags: 'witch hag brew potion fire', draw: (c, r, w) => {
    const R = w * 0.32;
    for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU; rock(c, r, Math.cos(a) * R * 1.35, Math.sin(a) * R * 1.35, 7, '#7a756c'); }
    coals(c, r, 0, 0, R * 1.2, 16);
    for (let i = 0; i < 3; i++) { const a = (i / 3) * TAU + 0.6; flame(c, Math.cos(a) * R * 1.05, Math.sin(a) * R * 1.05, 7); }
    shadow(c, true, 8, 3, 5); circ(c, 0, 0, R); fs(c, ball(c, 0, 0, R, '#2e2e34', 0.25), 2.6); shadow(c, false);
    circ(c, 0, 0, R * 0.8); fs(c, radial(c, 0, 0, R * 0.8, '#e0b0ff', '#5a1a8a', 0.1), 1.2);
    clip(c, () => circ(c, 0, 0, R * 0.8), () => { for (let i = 0; i < 12; i++) { const x = rrange(r, -R * 0.7, R * 0.7), y = rrange(r, -R * 0.7, R * 0.7), b = rrange(r, 2, 6); circ(c, x, y, b); c.fillStyle = 'rgba(240,210,255,0.4)'; c.fill(); st(c, 'rgba(255,255,255,0.7)', 0.8); } });
    glow(c, 0, 0, R * 1.3, '180,100,255', 0.35);
    line(c, -R * 0.2, R * 0.2, R * 0.9, -R * 0.9, INK, 5); line(c, -R * 0.2, R * 0.2, R * 0.9, -R * 0.9, WOOD_L, 3);
  } },
  { id: 'necro_table', name: t('Necromancer table'), cat: 'arcane', w: 2, h: 1, layer: 1, light: { radius: 2.5, color: '#7aff9a', intensity: 0.45 }, tags: 'necromancy skull bones dark ritual', draw: (c, r, w, h) => {
    const W = w * 0.92, H = h * 0.8;
    shadow(c, true); plankBox(c, r, -W / 2, -H / 2, W, H, 2, '#3a2a22'); shadow(c, false);
    cloth(c, r, -W * 0.1, -H / 2 + 2, W * 0.3, H - 4, '#2a1a2a');
    skull(c, -W * 0.3, -H * 0.05, 22, rrange(r, -0.3, 0.3));
    glow(c, -W * 0.3, -H * 0.08, 14, '100,255,150', 0.4);
    for (let i = 0; i < 3; i++) bone(c, W * 0.25 + rrange(r, -10, 10), rrange(r, -H * 0.25, H * 0.25), rrange(r, 18, 26), r() * TAU);
    openBook(c, W * 0.06, 0, 30, rrange(r, -0.2, 0.2), '#1a1a1a');
    for (const [x, y] of [[-W * 0.43, -H * 0.32], [W * 0.43, H * 0.3], [-W * 0.12, H * 0.32]]) candle(c, x, y, 3, '#2a2a2a');
    for (let i = 0; i < 4; i++) { blob(c, r, rrange(r, 2, 5), 6, 0.3, rrange(r, -W * 0.4, W * 0.4), rrange(r, -H * 0.3, H * 0.3)); c.fillStyle = 'rgba(110,10,15,0.6)'; c.fill(); }
  } },
  { id: 'star_chart', name: t('Star chart table'), cat: 'arcane', w: 1.5, h: 1, layer: 1, tags: 'map astrology constellations navigator', draw: (c, r, w, h) => {
    const W = w * 0.9, H = h * 0.8;
    shadow(c, true); plankBox(c, r, -W / 2, -H / 2, W, H, 2, OAK); shadow(c, false);
    at(c, 0, 0, rrange(r, -0.05, 0.05), () => {
      rect(c, -W * 0.38, -H * 0.36, W * 0.76, H * 0.72); fs(c, lin(c, 0, -H * 0.36, 0, H * 0.36, [[0, '#1e2a4a'], [1, '#0e1428']]), 1.4);
      circ(c, 0, 0, H * 0.3); st(c, 'rgba(220,200,140,0.6)', 1);
      for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; line(c, Math.cos(a) * H * 0.26, Math.sin(a) * H * 0.26, Math.cos(a) * H * 0.3, Math.sin(a) * H * 0.3, 'rgba(220,200,140,0.6)', 1); }
      const stars: [number, number][] = Array.from({ length: 14 }, () => [rrange(r, -W * 0.34, W * 0.34), rrange(r, -H * 0.32, H * 0.32)]);
      c.beginPath(); for (let i = 0; i < 6; i++) i ? c.lineTo(...stars[i]) : c.moveTo(...stars[i]); st(c, 'rgba(200,220,255,0.5)', 0.8);
      for (const [x, y] of stars) sparkle(c, x, y, rrange(r, 1.5, 3.5), 'rgba(255,240,200,0.95)');
    });
    for (const [x, y] of [[-W * 0.38, -H * 0.36], [W * 0.38, H * 0.36]]) { circ(c, x, y, 4); fs(c, ball(c, x, y, 4, STONE), 1); }
    at(c, W * 0.3, -H * 0.2, 0.5, () => { line(c, 0, 0, 14, -6, BRASS, 1.6); line(c, 0, 0, 12, 8, BRASS, 1.6); circ(c, 0, 0, 2.5); fs(c, BRASS, 0.8); });
  } },
  { id: 'book_piles', name: t('Book piles'), cat: 'arcane', w: 1, h: 1, layer: 1, tags: 'books library stacks tomes', draw: (c, r, w) => {
    for (let p = 0; p < 3; p++) {
      const x = rrange(r, -w * 0.22, w * 0.22), y = rrange(r, -w * 0.22, w * 0.22), n = 2 + Math.floor(r() * 3);
      for (let i = 0; i < n; i++) tome(c, x + rrange(r, -2, 2), y - i * 2, rrange(r, 24, 32), rrange(r, 18, 22), rrange(r, -0.4, 0.4), pick(r, [...CLOTH, '#3a2a1a', '#1a2a3a']));
    }
  } },
  { id: 'hourglass', name: t('Hourglass'), cat: 'arcane', w: 0.45, h: 0.45, layer: 1, tags: 'time sand', draw: (c, r, w) => {
    const R = w * 0.32;
    shadow(c, true, 4, 2, 3); circ(c, 0, 0, R); fs(c, ball(c, 0, 0, R, DARKWOOD, 0.3), 1.6); shadow(c, false);
    circ(c, 0, 0, R * 0.72); fs(c, radial(c, 0, 0, R * 0.72, 'rgba(240,250,255,0.9)', 'rgba(150,180,190,0.9)'), 1);
    circ(c, 0, 0, R * 0.42); c.fillStyle = '#e0c070'; c.fill(); circ(c, 0, 0, R * 0.12); c.fillStyle = '#a08030'; c.fill();
    for (let i = 0; i < 3; i++) { const a = (i / 3) * TAU; circ(c, Math.cos(a) * R * 0.86, Math.sin(a) * R * 0.86, 2); fs(c, GOLD, 0.6); }
    void r;
  } },
  { id: 'herb_rack', name: t('Herb drying rack'), cat: 'arcane', w: 1.4, h: 0.6, layer: 2, tags: 'herbs plants herbalist druid hanging', draw: (c, r, w, h) => {
    rod(c, -w * 0.46, 0, w * 0.46, 0, WOOD_D, 4);
    for (let i = 0; i < 7; i++) {
      const x = -w * 0.38 + i * w * 0.127, col = pick(r, ['#5a8a3a', '#7a9a4a', '#8a6a3a', '#6a5a8a', '#4a7a5a']);
      shadow(c, true, 4, 5, 8, 0.35);
      for (let k = 0; k < 6; k++) { leafShape(c, x + rrange(r, -5, 5), rrange(r, 4, h * 0.38), rrange(r, 8, 14), rrange(r, 2.5, 4), Math.PI / 2 + rrange(r, -0.5, 0.5)); fs(c, shade(col, rrange(r, -0.2, 0.2)), 0.6); }
      shadow(c, false);
      line(c, x - 3, 0, x + 3, 3, '#c8a860', 2);
    }
  } },
  { id: 'teleport_pad', name: t('Teleportation pad'), cat: 'arcane', w: 1.6, h: 1.6, layer: 0, light: { radius: 3.5, color: '#5affe0', intensity: 0.6 }, tags: 'teleport circle platform', draw: (c, r, w) => {
    const R = w * 0.42;
    shadow(c, true, 4, 2, 3, 0.35); circ(c, 0, 0, R); fs(c, lin(c, -R, -R, R, R, [[0, STONE_L], [1, STONE_D]]), 2); shadow(c, false);
    for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU; line(c, Math.cos(a) * R * 0.6, Math.sin(a) * R * 0.6, Math.cos(a) * R, Math.sin(a) * R, 'rgba(0,0,0,0.35)', 1.4); }
    c.save(); c.scale(0.7, 0.7); arcaneCircle(c, r, R, '#7affe8', '80,255,220', 8); c.restore();
  } },
  { id: 'floating_candles', name: t('Floating candles'), cat: 'arcane', w: 1.2, h: 1.2, layer: 2, light: { radius: 3.5, color: '#ffd38a', intensity: 0.6 }, tags: 'candles magic levitating light', draw: (c, r, w) => {
    for (let i = 0; i < 7; i++) {
      const x = rrange(r, -w * 0.38, w * 0.38), y = rrange(r, -w * 0.38, w * 0.38);
      shadow(c, true, 5, 10, 16, 0.3); circ(c, x, y, 5.5); c.fillStyle = '#f2ead6'; c.fill(); shadow(c, false);
      glow(c, x, y, 22, '255,200,110', 0.35); candle(c, x, y, 5.5);
    }
  } },
  { id: 'specimen_jars', name: t('Specimen jars'), cat: 'arcane', w: 0.9, h: 0.9, layer: 1, tags: 'jars eyes pickled organs laboratory', draw: (c, r, w) => {
    for (let i = 0; i < 5; i++) { const a = (i / 5) * TAU + r(), d = i ? w * 0.22 : 0; specimen(c, r, Math.cos(a) * d, Math.sin(a) * d, rrange(r, 8, 11)); }
  } },
  { id: 'wizard_staff', name: t('Wizard staff'), cat: 'arcane', w: 0.5, h: 1.8, layer: 1, light: { radius: 1.8, color: '#8ad8ff', intensity: 0.5 }, tags: 'staff wand mage weapon', draw: (c, r, w, h) => {
    at(c, 0, 0, rrange(r, -0.2, 0.2), () => {
      shadow(c, true, 3, 2, 3); rod(c, 0, -h * 0.34, 0, h * 0.44, WOOD, 5); shadow(c, false);
      for (let i = 0; i < 3; i++) { const y = -h * 0.1 + i * h * 0.2; line(c, -3, y, 3, y + 4, 'rgba(40,20,5,0.5)', 1); }
      c.beginPath(); c.moveTo(0, -h * 0.34); c.bezierCurveTo(-14, -h * 0.38, -12, -h * 0.47, 0, -h * 0.47); c.bezierCurveTo(12, -h * 0.47, 14, -h * 0.38, 0, -h * 0.34); st(c, INK, 5); st(c, WOOD_D, 3);
      glow(c, 0, -h * 0.41, 18, '120,210,255', 0.6); gem(c, 0, -h * 0.41, 6, '#5ab8ff', 5);
    });
  } },
  { id: 'arcane_bookcase', name: t('Arcane bookcase'), cat: 'arcane', w: 2, h: 0.6, layer: 1, light: { radius: 2, color: '#b08aff', intensity: 0.35 }, tags: 'library books shelf glowing tomes', draw: (c, r, w, h) => {
    const W = w * 0.95, H = h * 0.78;
    shadow(c, true, 6, 2, 4); rrect(c, -W / 2, -H / 2, W, H, 2); fs(c, '#2a1a12'); shadow(c, false);
    let x = -W / 2 + 5;
    while (x < W / 2 - 8) {
      const bw = rrange(r, 5, 10), glowy = r() < 0.12;
      book(c, x, -H / 2 + 5, bw - 1, H - 10, glowy ? '#9a6aff' : pick(r, [...CLOTH, '#3a2a1a', '#1a2a3a', '#4a3a2a']));
      if (glowy) glow(c, x + bw / 2, 0, 12, '170,120,255', 0.5);
      x += bw;
    }
    for (let i = 0; i < 6; i++) { const xx = -W / 2 + 8 + i * W / 6; c.fillStyle = GOLD; c.fillRect(xx, -H / 2 + 8, 3, 1.5); }
    rrect(c, -W / 2, -H / 2, W, H, 2); st(c, INK, 2.2);
    rrect(c, -W / 2, -H / 2, W, 5, 2); fs(c, DARKWOOD, 1.2);
  } },
];

