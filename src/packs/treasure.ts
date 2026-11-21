import { t } from '../i18n';
import {
  at, ball, blob, boulder, C2D, circ, clip, cloth, coin, ell, fs, gem, glow, GOLD, GOLD_D, GOLD_L, INK, jar, lin, line, MARBLE, MARBLE_D,
  METAL, METAL_D, METAL_L, PARCH, pick, poly, radial, rect, rod, rrange, rrect, shade, shadow, sparkle, StampDef, st, STONE, STONE_D, STONE_L,
  sword, TAU, WOOD, WOOD_D, WOOD_L, skull,
} from '../art';
import type { Rng } from '../util';
import { goblet } from './furniture';

const GEMS = ['#d02040', '#2070e0', '#20b060', '#a040e0', '#f0c020', '#30d0e0'];

/** Mound of coins with depth shading. */
function coinMound(c: C2D, r: Rng, R: number, n: number, sy = 1) {
  shadow(c, true, 10, 5, 8, 0.5); c.save(); c.scale(1, sy); blob(c, r, R, 14, 0.12); c.restore(); fs(c, radial(c, 0, 0, R, '#ffe68a', '#a07818', 0.35), 2, '#5a4008'); shadow(c, false);
  const items: [number, number, number][] = [];
  for (let i = 0; i < n; i++) { const a = r() * TAU, d = Math.sqrt(r()) * R * 0.92; items.push([Math.cos(a) * d, Math.sin(a) * d * sy, rrange(r, 3.2, 5.2)]); }
  items.sort((a, b) => Math.hypot(b[0], b[1]) - Math.hypot(a[0], a[1]));
  for (const [x, y, s] of items) { const k = 1 - Math.hypot(x, y / sy) / R; coin(c, x, y, s, shade(GOLD, -0.25 + k * 0.4)); }
  for (let i = 0; i < n / 12; i++) sparkle(c, rrange(r, -R * 0.6, R * 0.6), rrange(r, -R * 0.6, R * 0.6) * sy, rrange(r, 3, 6));
}
export function crown(c: C2D, x: number, y: number, R: number, rot = 0) {
  at(c, x, y, rot, () => {
    shadow(c, true, 4, 2, 3, 0.45); circ(c, 0, 0, R); fs(c, radial(c, 0, 0, R, GOLD_L, GOLD_D, 0.3), 1.6); shadow(c, false);
    circ(c, 0, 0, R * 0.7); fs(c, '#6a1020', 1.2);
    for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU; poly(c, [Math.cos(a - 0.2) * R * 0.85, Math.sin(a - 0.2) * R * 0.85, Math.cos(a) * R * 1.25, Math.sin(a) * R * 1.25, Math.cos(a + 0.2) * R * 0.85, Math.sin(a + 0.2) * R * 0.85]); fs(c, GOLD, 1); circ(c, Math.cos(a) * R * 1.22, Math.sin(a) * R * 1.22, R * 0.09); c.fillStyle = '#f8f0e0'; c.fill(); }
    for (let i = 0; i < 4; i++) { const a = (i / 4) * TAU + Math.PI / 4; gem(c, Math.cos(a) * R * 0.85, Math.sin(a) * R * 0.85, R * 0.14, GEMS[i], 6); }
    gem(c, 0, 0, R * 0.2, '#d02040', 8);
  });
}

export const TREASURE: StampDef[] = [
  { id: 'gold_pile', name: t('Gold pile'), cat: 'treasure', w: 1.2, h: 1.2, layer: 1, tags: 'gold coins treasure loot money', draw: (c, r, w) => coinMound(c, r, w * 0.38, 70) },
  { id: 'dragon_hoard', name: t('Dragon hoard'), cat: 'treasure', w: 4, h: 3, layer: 1, light: { radius: 4, color: '#ffd96a', intensity: 0.4 }, tags: 'hoard dragon treasure gold gems lair', draw: (c, r, w, h) => {
    coinMound(c, r, w * 0.42, 420, h / w);
    for (let i = 0; i < 18; i++) gem(c, rrange(r, -w * 0.34, w * 0.34), rrange(r, -h * 0.32, h * 0.32), rrange(r, 5, 9), pick(r, GEMS), pick(r, [5, 6, 8]), r());
    for (let i = 0; i < 3; i++) goblet(c, rrange(r, -w * 0.3, w * 0.3), rrange(r, -h * 0.25, h * 0.25), 9);
    crown(c, rrange(r, -w * 0.15, w * 0.15), rrange(r, -h * 0.15, h * 0.15), 16, r());
    sword(c, rrange(r, -w * 0.1, w * 0.1), rrange(r, -h * 0.1, h * 0.1), w * 0.34, r() * TAU, GOLD, '#e8f0f8');
    skull(c, rrange(r, -w * 0.3, w * 0.3), rrange(r, -h * 0.28, h * 0.28), 18, r() * 3);
  } },
  { id: 'coin_scatter', name: t('Scattered coins'), cat: 'treasure', w: 1.2, h: 1.2, layer: 0, tags: 'coins scattered gold silver copper loot', draw: (c, r, w) => {
    for (let i = 0; i < 22; i++) coin(c, rrange(r, -w * 0.4, w * 0.4), rrange(r, -w * 0.4, w * 0.4), rrange(r, 3.5, 5), pick(r, [GOLD, GOLD, '#c8ccd0', '#c87a4a']));
  } },
  { id: 'gem_pile', name: t('Gem pile'), cat: 'treasure', w: 0.8, h: 0.8, layer: 1, light: { radius: 1.5, color: '#ff8ac0', intensity: 0.35 }, tags: 'gems jewels rubies sapphires emeralds', draw: (c, r, w) => {
    for (let i = 0; i < 16; i++) { const a = r() * TAU, d = Math.sqrt(r()) * w * 0.3; gem(c, Math.cos(a) * d, Math.sin(a) * d, rrange(r, 5, 8), pick(r, GEMS), pick(r, [5, 6, 8]), r()); }
  } },
  { id: 'crown', name: t('Crown'), cat: 'treasure', w: 0.7, h: 0.7, layer: 1, tags: 'crown king royal regalia', draw: (c, r, w) => crown(c, 0, 0, w * 0.26, r()) },
  { id: 'scepter', name: t('Scepter'), cat: 'treasure', w: 0.5, h: 1.2, layer: 1, tags: 'scepter royal staff regalia', draw: (c, r, w, h) => {
    at(c, 0, 0, rrange(r, -0.4, 0.4), () => {
      shadow(c, true, 3, 2, 3); rod(c, 0, -h * 0.3, 0, h * 0.4, GOLD, 5); shadow(c, false);
      for (const y of [-h * 0.1, h * 0.15]) { ell(c, 0, y, 5, 3); fs(c, GOLD_L, 1); }
      circ(c, 0, -h * 0.36, 9); fs(c, radial(c, 0, -h * 0.36, 9, GOLD_L, GOLD_D), 1.4);
      gem(c, 0, -h * 0.36, 6, pick(r, GEMS), 6);
      circ(c, 0, h * 0.42, 4); fs(c, GOLD, 1);
    });
  } },
  { id: 'chalice', name: t('Golden chalice'), cat: 'treasure', w: 0.5, h: 0.5, layer: 1, tags: 'chalice goblet cup grail', draw: (c, r, w) => { goblet(c, 0, 0, w * 0.26, pick(r, ['#6e1020', '#3a1a0a'])); for (let i = 0; i < 4; i++) { const a = (i / 4) * TAU; gem(c, Math.cos(a) * w * 0.26, Math.sin(a) * w * 0.26, 2.4, pick(r, GEMS), 4); } } },
  { id: 'chest_gold', name: t('Treasure chest'), cat: 'treasure', w: 1.1, h: 0.9, layer: 1, light: { radius: 2, color: '#ffd96a', intensity: 0.35 }, tags: 'treasure chest gold open loot', draw: (c, r, w, h) => {
    const W = w * 0.78, H = h * 0.5;
    shadow(c, true, 6, 3, 4); rrect(c, -W / 2, -H / 2 - H * 0.6, W, H * 0.62, [10, 10, 2, 2]); fs(c, lin(c, 0, -H, 0, -H / 2, [[0, '#a8743f'], [1, '#6a4422']])); shadow(c, false);
    rect(c, -W / 2 + 4, -H / 2 - H * 0.2, W - 8, H * 0.18); fs(c, '#6a1020', 1);
    for (const k of [-0.32, 0.32]) { c.fillStyle = GOLD_D; c.fillRect(k * W - 3, -H / 2 - H * 0.6, 6, H * 0.62); }
    shadow(c, true, 6, 3, 4); rrect(c, -W / 2, -H / 2 + 4, W, H, 3); fs(c, WOOD); shadow(c, false);
    clip(c, () => rect(c, -W / 2 + 4, -H / 2 + 4, W - 8, H * 0.6), () => { c.translate(0, -H * 0.1); coinMound(c, r, W * 0.46, 70, 0.45); for (let i = 0; i < 4; i++) gem(c, rrange(r, -W * 0.3, W * 0.3), rrange(r, -H * 0.3, H * 0.1), 4, pick(r, GEMS), 6); });
    for (const k of [-0.32, 0.32]) { c.fillStyle = GOLD_D; c.fillRect(k * W - 3, -H / 2 + 4, 6, H); }
    rrect(c, -6, H * 0.1, 12, 12, 2); fs(c, GOLD, 1.2); circ(c, 0, H * 0.1 + 6, 1.8); c.fillStyle = INK; c.fill();
    glow(c, 0, -H * 0.25, W * 0.5, '255,220,110', 0.25);
  } },
  { id: 'jewelry_box', name: t('Jewelry box'), cat: 'treasure', w: 0.7, h: 0.6, layer: 1, tags: 'jewelry box rings necklace casket', draw: (c, r, w, h) => {
    const W = w * 0.7, H = h * 0.6;
    shadow(c, true, 4, 2, 3); rrect(c, -W / 2, -H / 2, W, H, 4); fs(c, lin(c, 0, -H / 2, 0, H / 2, [[0, '#5a2a4a'], [1, '#2a1020']]), 1.6); shadow(c, false);
    rrect(c, -W / 2 + 4, -H / 2 + 4, W - 8, H - 8, 2); fs(c, '#8a1a3a', 1);
    for (let i = 0; i < 3; i++) { circ(c, -W * 0.25 + i * W * 0.25, -H * 0.05, 5); st(c, INK, 3); circ(c, -W * 0.25 + i * W * 0.25, -H * 0.05, 5); st(c, GOLD, 1.6); gem(c, -W * 0.25 + i * W * 0.25, -H * 0.05 - 5, 2.4, pick(r, GEMS), 4); }
    c.beginPath(); c.moveTo(-W * 0.35, H * 0.15); c.quadraticCurveTo(0, H * 0.35, W * 0.35, H * 0.15); st(c, '#f8f0e8', 2.4);
    rect(c, -W / 2, -H / 2, W, H); st(c, GOLD, 1.2);
  } },
  { id: 'gold_bars', name: t('Gold bars'), cat: 'treasure', w: 1, h: 0.7, layer: 1, tags: 'gold bars ingots bullion vault', draw: (c, r, w, h) => {
    const bar = (x: number, y: number, rot: number) => at(c, x, y, rot, () => { shadow(c, true, 4, 2, 3); poly(c, [-14, -7, 14, -7, 17, 7, -17, 7]); fs(c, lin(c, 0, -7, 0, 7, [[0, GOLD_L], [1, GOLD_D]]), 1.4, '#5a4008'); shadow(c, false); poly(c, [-12, -5, 12, -5, 14, 3, -14, 3]); c.fillStyle = 'rgba(255,250,200,0.35)'; c.fill(); sparkle(c, -6, -3, 3); });
    for (let i = 0; i < 3; i++) bar(-w * 0.2 + i * w * 0.2, h * 0.12, 0);
    for (let i = 0; i < 2; i++) bar(-w * 0.1 + i * w * 0.2, -h * 0.12, 0);
    void r;
  } },
  { id: 'sword_in_stone', name: t('Sword in the stone'), cat: 'treasure', w: 1.4, h: 1.4, layer: 1, light: { radius: 3, color: '#a8d8ff', intensity: 0.6 }, tags: 'legendary sword stone excalibur relic', draw: (c, r, w) => {
    boulder(c, r, 0, 0, w * 0.34, '#9a958c', 0.4);
    glow(c, 0, 0, w * 0.4, '170,215,255', 0.45);
    rect(c, -6, -3, 12, 6); c.fillStyle = '#1a1612'; c.fill();
    sword(c, 0, -w * 0.02, w * 0.6, -Math.PI / 2 - 0.08 + 0.16 * r(), GOLD, '#e8f4ff');
    for (let i = 0; i < 5; i++) sparkle(c, rrange(r, -w * 0.25, w * 0.25), rrange(r, -w * 0.3, w * 0.1), rrange(r, 2, 4));
  } },
  { id: 'golden_idol', name: t('Golden idol'), cat: 'treasure', w: 1, h: 1, layer: 1, light: { radius: 2, color: '#ffd96a', intensity: 0.4 }, tags: 'idol statue gold relic temple artifact', draw: (c, r, w) => {
    const S = w * 0.7;
    shadow(c, true, 8, 4, 6); rect(c, -S / 2, -S / 2, S, S); fs(c, lin(c, -S / 2, -S / 2, S / 2, S / 2, [[0, STONE_L], [1, STONE_D]])); shadow(c, false);
    for (let i = 0; i < 4; i++) { const k = (i + 1) * 4; rect(c, -S / 2 + k, -S / 2 + k, S - 2 * k, S - 2 * k); st(c, 'rgba(0,0,0,0.2)', 1); }
    shadow(c, true, 6, 3, 4); ell(c, 0, 3, S * 0.24, S * 0.18); fs(c, radial(c, 0, 3, S * 0.24, GOLD_L, GOLD_D, 0.4), 1.6);
    circ(c, 0, -S * 0.08, S * 0.15); fs(c, radial(c, 0, -S * 0.08, S * 0.15, '#fff0a0', GOLD_D, 0.4), 1.6); shadow(c, false);
    for (const s of [-1, 1]) { circ(c, s * S * 0.06, -S * 0.1, 2.2); c.fillStyle = '#d02040'; c.fill(); }
    glow(c, 0, -S * 0.05, S * 0.4, '255,220,100', 0.3);
    void r;
  } },
  { id: 'money_bags', name: t('Money bags'), cat: 'treasure', w: 0.9, h: 0.9, layer: 1, tags: 'money bags purse coins gold', draw: (c, r, w) => {
    for (let i = 0; i < 3; i++) {
      const x = (i - 1) * w * 0.22 + rrange(r, -3, 3), y = (i % 2 ? -1 : 1) * w * 0.08, R = w * rrange(r, 0.16, 0.2);
      shadow(c, true, 5, 2, 4); blob(c, r, R, 9, 0.1, x, y); fs(c, ball(c, x, y, R, '#a8864a', 0.3), 1.8); shadow(c, false);
      circ(c, x, y - R * 0.1, R * 0.35); fs(c, '#8a6a32', 1.2); line(c, x - R * 0.3, y - R * 0.1, x + R * 0.3, y - R * 0.1, '#c8a050', 1.6);
      for (let k = 0; k < 4; k++) { const a = r() * TAU; line(c, x - R * 0.2, y - R * 0.1, x + Math.cos(a) * R * 0.6, y + Math.sin(a) * R * 0.6, 'rgba(70,50,20,0.4)', 1); }
    }
    for (let i = 0; i < 5; i++) coin(c, rrange(r, -w * 0.35, w * 0.35), rrange(r, w * 0.1, w * 0.35), 4);
  } },
  { id: 'necklace', name: t('Pearl necklace'), cat: 'treasure', w: 0.7, h: 0.7, layer: 0, tags: 'pearls necklace jewelry', draw: (c, r, w) => {
    const R = w * 0.28;
    for (let i = 0; i < 26; i++) { const a = (i / 26) * TAU, d = R * (1 + 0.15 * Math.sin(a * 2 + r())); const x = Math.cos(a) * d, y = Math.sin(a) * d * 0.8; shadow(c, true, 2, 1, 1.5, 0.4); circ(c, x, y, 3); fs(c, radial(c, x, y, 3, '#ffffff', '#c8c0d0', 0.4), 0.6); shadow(c, false); }
    gem(c, 0, R * 0.95, 6, pick(r, GEMS), 6);
  } },
  { id: 'treasure_map', name: t('Treasure map'), cat: 'treasure', w: 1, h: 0.8, layer: 0, tags: 'map treasure pirate parchment x marks', draw: (c, r, w, h) => {
    at(c, 0, 0, rrange(r, -0.2, 0.2), () => {
      const W = w * 0.8, H = h * 0.76;
      shadow(c, true, 4, 2, 3, 0.4); poly(c, [-W / 2, -H / 2, W / 2 - 6, -H / 2 + 3, W / 2, H / 2, -W / 2 + 4, H / 2 - 3]); fs(c, lin(c, -W / 2, -H / 2, W / 2, H / 2, [[0, '#f0dca0'], [1, '#c8a868']]), 1.4); shadow(c, false);
      blob(c, r, W * 0.28, 9, 0.3, -W * 0.05, 0); fs(c, '#d8c088', 1, '#8a6a3a');
      c.beginPath(); c.moveTo(-W * 0.3, H * 0.25); for (let i = 0; i < 6; i++) c.lineTo(-W * 0.3 + i * W * 0.1, H * 0.25 - i * H * 0.07 + (i % 2) * 6); c.setLineDash([3, 3]); st(c, '#8a2a1a', 1.4); c.setLineDash([]);
      line(c, W * 0.15, -H * 0.1, W * 0.25, 0, '#b02020', 2.6); line(c, W * 0.25, -H * 0.1, W * 0.15, 0, '#b02020', 2.6);
      circ(c, W * 0.35, H * 0.3, 7); st(c, '#6a4a2a', 1); line(c, W * 0.35, H * 0.3 - 9, W * 0.35, H * 0.3 + 9, '#6a4a2a', 1); line(c, W * 0.35 - 9, H * 0.3, W * 0.35 + 9, H * 0.3, '#6a4a2a', 1);
    });
  } },
  { id: 'ornate_urn', name: t('Ornate urn'), cat: 'treasure', w: 0.8, h: 0.8, layer: 1, tags: 'urn vase amphora antique', draw: (c, r, w) => {
    const R = w * 0.32, col = pick(r, ['#2a5a8a', '#8a2a2a', '#2a6a5a', '#d0c8b0']);
    jar(c, 0, 0, R, col, false);
    for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; circ(c, Math.cos(a) * R * 0.72, Math.sin(a) * R * 0.72, 2); c.fillStyle = GOLD; c.fill(); }
    circ(c, 0, 0, R * 0.45); st(c, GOLD, 1.6);
    for (const s of [-1, 1]) { ell(c, s * R * 1.05, 0, 5, 7); st(c, INK, 3.4); ell(c, s * R * 1.05, 0, 5, 7); st(c, GOLD, 1.8); }
  } },
  { id: 'display_case', name: t('Display pedestal'), cat: 'treasure', w: 1, h: 1, layer: 1, light: { radius: 2, color: '#c0e0ff', intensity: 0.4 }, tags: 'pedestal display museum relic glass case artifact', draw: (c, r, w) => {
    const S = w * 0.6;
    shadow(c, true, 8, 4, 6); rect(c, -S / 2, -S / 2, S, S); fs(c, lin(c, -S / 2, -S / 2, S / 2, S / 2, [[0, MARBLE], [1, MARBLE_D]])); shadow(c, false);
    rect(c, -S / 2 + 6, -S / 2 + 6, S - 12, S - 12); fs(c, '#6a1020', 1.2);
    const k = r();
    if (k < 0.33) gem(c, 0, 0, S * 0.18, pick(r, GEMS), 8, r()); else if (k < 0.66) crown(c, 0, 0, S * 0.18); else goblet(c, 0, 0, S * 0.14);
    rect(c, -S / 2 + 2, -S / 2 + 2, S - 4, S - 4); c.fillStyle = 'rgba(200,230,255,0.15)'; c.fill(); st(c, 'rgba(230,245,255,0.8)', 1.6);
    line(c, -S * 0.4, -S * 0.15, -S * 0.15, -S * 0.4, 'rgba(255,255,255,0.7)', 2);
    glow(c, 0, 0, S * 0.5, '190,220,255', 0.25);
  } },
  { id: 'reliquary', name: t('Reliquary'), cat: 'treasure', w: 0.9, h: 0.6, layer: 1, light: { radius: 1.8, color: '#ffe0a0', intensity: 0.4 }, tags: 'reliquary relic holy box saint', draw: (c, r, w, h) => {
    const W = w * 0.7, H = h * 0.6;
    shadow(c, true, 5, 2, 4); rrect(c, -W / 2, -H / 2, W, H, 3); fs(c, lin(c, 0, -H / 2, 0, H / 2, [[0, GOLD_L], [1, GOLD_D]]), 1.6); shadow(c, false);
    poly(c, [-W / 2 + 4, -H / 2 + 4, W / 2 - 4, -H / 2 + 4, W * 0.3, 0, -W * 0.3, 0]); fs(c, shade(GOLD, 0.2), 1);
    line(c, -W * 0.3, 0, W * 0.3, 0, GOLD_D, 2);
    for (let i = 0; i < 5; i++) gem(c, -W * 0.36 + i * W * 0.18, H * 0.22, 3, GEMS[i], 4);
    rod(c, 0, -H * 0.4, 0, -H * 0.05, '#fff6d0', 2); rod(c, -W * 0.06, -H * 0.28, W * 0.06, -H * 0.28, '#fff6d0', 2);
    glow(c, 0, -H * 0.2, W * 0.4, '255,230,150', 0.3);
    void r;
  } },
];
void boulder; void cloth; void METAL; void METAL_D; void METAL_L; void PARCH; void STONE; void WOOD_D; void WOOD_L;
