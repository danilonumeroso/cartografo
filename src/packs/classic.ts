import { t } from '../i18n';
import { rrange, shade } from '../util';
import {
  at, ball, barrelTop, blob, book, bottle, boulder, C2D, candle, coals, canopy, circ, clip, cloth, CLOTH, DARKWOOD, ell, flame, fs, gem, glow, GOLD, GOLD_D, GOLD_L, grain, INK,
  LEAF, LEAF_D, fir, foliage, lin, line, METAL, METAL_D, METAL_L, pick, plankBox, poly, radial, rect, rock, rockShape, rod, rrect, shadow, StampDef, st, STONE, STONE_D,
  STONE_L, TAU, tub, woodPlanks, WOOD, WOOD_D, WOOD_L,
} from '../art';
import { bedFrame, mug, plate, seat } from './furniture';

const pick2 = pick;

/** The original prop set (ids are persisted in saved maps: never rename). */
export const CLASSIC: StampDef[] = [
  // ------------------------------------------------ Arredi
  { id: 'table', name: t('Table'), cat: 'furniture', w: 2, h: 1, layer: 1, draw: (c, r, w, h) => {
    const W = w * 0.9, H = h * 0.8;
    shadow(c, true); plankBox(c, r, -W / 2, -H / 2, W, H, 4, WOOD, false, 6); shadow(c, false);
    rrect(c, -W / 2 + 4, -H / 2 + 4, W - 8, H - 8, 4); st(c, 'rgba(255,220,170,0.22)', 2);
    if (r() < 0.7) plate(c, r, -W * 0.25, 0, 10);
    if (r() < 0.6) mug(c, W * 0.18, -4, 6, r() * TAU);
    if (r() < 0.4) candle(c, W * 0.38, H * 0.2, 3);
  } },
  { id: 'table_round', name: t('Round table'), cat: 'furniture', w: 1.5, h: 1.5, layer: 1, draw: (c, r, w) => {
    const R = w * 0.42;
    shadow(c, true); circ(c, 0, 0, R); fs(c, lin(c, -R, -R, R, R, [[0, WOOD_L], [1, WOOD_D]])); shadow(c, false);
    clip(c, () => circ(c, 0, 0, R), () => { rect(c, -R, -R, R * 2, R * 2); grain(c, r, -R, -R, R * 2, R * 2, 9, true); for (let i = 1; i < 5; i++) line(c, -R + (i * R * 2) / 5, -R, -R + (i * R * 2) / 5, R, 'rgba(40,20,5,0.4)', 1.2); });
    circ(c, 0, 0, R - 5); st(c, 'rgba(255,220,170,0.25)', 2);
    for (let i = 0; i < 3; i++) if (r() < 0.6) { const a = r() * TAU; plate(c, r, Math.cos(a) * R * 0.5, Math.sin(a) * R * 0.5, 8, r() < 0.5); }
  } },
  { id: 'chair', name: t('Chair'), cat: 'furniture', w: 0.6, h: 0.6, layer: 1, draw: (c, r, w) => seat(c, 0, 0, w * 0.72, 0, WOOD_L, r() < 0.3 ? pick(r, CLOTH) : undefined) },
  { id: 'stool', name: t('Stool'), cat: 'furniture', w: 0.45, h: 0.45, layer: 1, draw: (c, r, w) => {
    shadow(c, true, 4, 2, 3); circ(c, 0, 0, w * 0.34); fs(c, ball(c, 0, 0, w * 0.34, WOOD_L, 0.2), 2); shadow(c, false);
    clip(c, () => circ(c, 0, 0, w * 0.34), () => { rect(c, -w, -w, w * 2, w * 2); grain(c, r, -w * 0.34, -w * 0.34, w * 0.68, w * 0.68, 4); });
    circ(c, 0, 0, w * 0.24); st(c, 'rgba(60,30,10,0.35)', 1.2);
  } },
  { id: 'bench', name: t('Bench'), cat: 'furniture', w: 2, h: 0.5, layer: 1, draw: (c, r, w, h) => {
    const W = w * 0.92, H = h * 0.6;
    for (const s of [-1, 1]) { shadow(c, true, 4, 2, 3); rect(c, s * W * 0.38 - 5, -H / 2 - 3, 10, H + 6); fs(c, WOOD_D, 1.4); shadow(c, false); }
    shadow(c, true, 5, 2, 4); plankBox(c, r, -W / 2, -H / 2, W, H, 2, WOOD_L, false, 3); shadow(c, false);
  } },
  { id: 'bed', name: t('Bed'), cat: 'furniture', w: 1, h: 2, layer: 1, draw: (c, r, w, h) => bedFrame(c, r, w * 0.86, h * 0.92, WOOD_D, pick(r, CLOTH), 1) },
  { id: 'bed_double', name: t('Double bed'), cat: 'furniture', w: 2, h: 2, layer: 1, draw: (c, r, w, h) => bedFrame(c, r, w * 0.88, h * 0.92, WOOD_D, pick(r, CLOTH), 2) },
  { id: 'bookshelf', name: t('Bookshelf'), cat: 'furniture', w: 2, h: 0.5, layer: 1, draw: (c, r, w, h) => {
    const W = w * 0.95, H = h * 0.8;
    shadow(c, true, 6, 2, 4); rrect(c, -W / 2, -H / 2, W, H, 2); fs(c, DARKWOOD); shadow(c, false);
    let x = -W / 2 + 5;
    while (x < W / 2 - 8) {
      const bw = rrange(r, 5, 10), bh = H - rrange(r, 9, 14), col = pick(r, [...CLOTH, '#3a2a1a', '#1a2a3a', '#5a4a2a']);
      if (r() < 0.08) { x += bw; continue; }
      rect(c, x, -H / 2 + 5, bw - 1, bh); c.fillStyle = lin(c, x, 0, x + bw, 0, [[0, shade(col, 0.2)], [1, shade(col, -0.25)]]); c.fill();
      c.fillStyle = 'rgba(255,215,120,0.6)'; c.fillRect(x + 1, -H / 2 + 7, bw - 3, 1.2); c.fillRect(x + 1, -H / 2 + bh - 1, bw - 3, 1.2);
      x += bw;
    }
    rrect(c, -W / 2, -H / 2, W, H, 2); st(c, INK, 2.2);
    rrect(c, -W / 2, H / 2 - 5, W, 5, 1); fs(c, shade(DARKWOOD, 0.15), 1.2);
  } },
  { id: 'wardrobe', name: t('Wardrobe'), cat: 'furniture', w: 1.5, h: 0.7, layer: 1, draw: (c, r, w, h) => {
    const W = w * 0.92, H = h * 0.8;
    shadow(c, true); plankBox(c, r, -W / 2, -H / 2, W, H, 1, WOOD, true, 3); shadow(c, false);
    rrect(c, -W / 2 + 5, -H / 2 + 5, W - 10, H - 10, 2); st(c, 'rgba(40,20,5,0.5)', 1.6);
    rrect(c, -W / 2 - 2, -H / 2 - 3, W + 4, 6, 2); fs(c, shade(WOOD, -0.25), 1.4);
    line(c, 0, -H / 2 + 5, 0, H / 2 - 5, 'rgba(40,20,5,0.6)', 2);
    for (const s of [-1, 1]) { circ(c, s * 5, 0, 2.2); fs(c, GOLD, 0.8); }
  } },
  { id: 'chest', name: t('Chest'), cat: 'furniture', w: 0.8, h: 0.55, layer: 1, draw: (c, r, w, h) => {
    const W = w * 0.9, H = h * 0.8;
    shadow(c, true, 6, 3, 4); rrect(c, -W / 2, -H / 2, W, H, [10, 10, 3, 3]); fs(c, lin(c, 0, -H / 2, 0, H / 2, [[0, WOOD_L], [0.5, WOOD], [1, WOOD_D]])); shadow(c, false);
    clip(c, () => rrect(c, -W / 2, -H / 2, W, H, [10, 10, 3, 3]), () => { rect(c, -W / 2, -H / 2, W, H); grain(c, r, -W / 2, -H / 2, W, H, 5); });
    for (const k of [-0.32, 0.32]) { rect(c, k * W - 3.5, -H / 2, 7, H); fs(c, lin(c, k * W - 3.5, 0, k * W + 3.5, 0, [[0, METAL_L], [1, METAL_D]]), 1); for (const y of [-H * 0.3, H * 0.3]) { circ(c, k * W, y, 1.3); c.fillStyle = INK; c.fill(); } }
    line(c, -W / 2, -H * 0.05, W / 2, -H * 0.05, 'rgba(30,15,5,0.6)', 2);
    rrect(c, -6, -H * 0.1, 12, 13, 2); fs(c, lin(c, 0, -H * 0.1, 0, H * 0.25, [[0, GOLD_L], [1, GOLD_D]]), 1.3); circ(c, 0, H * 0.06, 1.6); c.fillStyle = INK; c.fill();
  } },
  { id: 'crate', name: t('Crate'), cat: 'kitchen', w: 0.8, h: 0.8, layer: 1, draw: (c, r, w) => {
    const S = w * 0.86;
    shadow(c, true, 6, 3, 5); plankBox(c, r, -S / 2, -S / 2, S, S, 4, WOOD_L, false, 1); shadow(c, false);
    c.strokeStyle = shade(WOOD_D, 0.05); c.lineWidth = 6; c.strokeRect(-S / 2 + 3.5, -S / 2 + 3.5, S - 7, S - 7);
    line(c, -S / 2 + 5, -S / 2 + 5, S / 2 - 5, S / 2 - 5, WOOD_D, 6); line(c, -S / 2 + 5, -S / 2 + 5, S / 2 - 5, S / 2 - 5, shade(WOOD, 0.1), 3);
    for (const [x, y] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { circ(c, x * (S / 2 - 3.5), y * (S / 2 - 3.5), 1.5); c.fillStyle = '#2a2a2a'; c.fill(); }
    rect(c, -S / 2, -S / 2, S, S); st(c, INK, 2);
  } },
  { id: 'barrel', name: t('Barrel'), cat: 'kitchen', w: 0.7, h: 0.7, layer: 1, draw: (c, r, w) => barrelTop(c, 0, 0, w * 0.4) },
  { id: 'barrels', name: t('Barrels'), cat: 'kitchen', w: 1.5, h: 1.5, layer: 1, draw: (c, r, w) => {
    const R = w * 0.21;
    barrelTop(c, -R * 1.05, R * 0.7, R); barrelTop(c, R * 1.05, R * 0.7, R); barrelTop(c, 0, -R * 1.1, R);
  } },
  { id: 'sacks', name: t('Sacks'), cat: 'kitchen', w: 1, h: 1, layer: 1, draw: (c, r, w) => {
    for (let i = 0; i < 3; i++) {
      const x = rrange(r, -w * 0.18, w * 0.18), y = rrange(r, -w * 0.18, w * 0.18), R = w * rrange(r, 0.2, 0.26);
      shadow(c, true, 6, 3, 4);
      c.beginPath(); c.ellipse(x, y, R, R * 0.8, r() * 3, 0, 7); fs(c, radial(c, x, y, R, '#d8c49a', '#a08654'), 2);
      shadow(c, false); circ(c, x, y - R * 0.5, 3); c.fillStyle = '#6e5634'; c.fill();
    }
  } },
  { id: 'counter', name: t('Counter'), cat: 'kitchen', w: 3, h: 0.8, layer: 1, draw: (c, r, w, h) => {
    const W = w * 0.96, H = h * 0.75;
    shadow(c, true); rrect(c, -W / 2, -H / 2, W, H, 4); fs(c, DARKWOOD); shadow(c, false);
    plankBox(c, r, -W / 2 + 4, -H / 2 + 4, W - 8, H - 8, 3, WOOD, false, 3, 1.2);
    for (let i = 0; i < 5; i++) {
      const x = -W * 0.4 + i * W * 0.2 + rrange(r, -10, 10), k = r();
      if (k < 0.4) mug(c, x, rrange(r, -5, 5), 6, r() * TAU);
      else if (k < 0.7) bottle(c, x, rrange(r, -5, 5), 5, pick(r, ['#2f6b3a', '#6b2f2f', '#4a3a1a']));
      else plate(c, r, x, 0, 8, r() < 0.5);
    }
  } },
  { id: 'fireplace', name: t('Fireplace'), cat: 'kitchen', w: 2, h: 0.9, layer: 1, light: { radius: 5, color: '#ffb15a', intensity: 0.9 }, draw: (c, r, w, h) => {
    const W = w * 0.92, H = h * 0.82;
    shadow(c, true); rect(c, -W / 2, -H / 2, W, H); fs(c, STONE_D); shadow(c, false);
    clip(c, () => rect(c, -W / 2, -H / 2, W, H), () => { for (let row = 0; row < 4; row++) { let x = -W / 2 - (row % 2) * 12; while (x < W / 2) { const bw = rrange(r, 18, 30); rect(c, x, -H / 2 + (row * H) / 4, bw, H / 4); fs(c, shade(STONE, rrange(r, -0.15, 0.1)), 1.2, 'rgba(20,16,12,0.85)'); x += bw; } } });
    rect(c, -W / 2 - 3, -H / 2 - 3, W + 6, 8); fs(c, lin(c, 0, -H / 2 - 3, 0, -H / 2 + 5, [[0, STONE_L], [1, STONE]]), 1.6);
    rrect(c, -W * 0.3, -H * 0.15, W * 0.6, H * 0.6, [10, 10, 2, 2]); fs(c, '#140c08', 2);
    clip(c, () => rrect(c, -W * 0.3, -H * 0.15, W * 0.6, H * 0.6, [10, 10, 2, 2]), () => { coals(c, r, 0, H * 0.25, W * 0.22, 14); for (const [x0, y0, x1, y1] of [[-0.15, 0.2, 0.15, 0.08], [-0.12, 0.05, 0.14, 0.2]]) rod(c, x0 * W, y0 * H, x1 * W, y1 * H, '#4a2e1a', 6); });
    flame(c, -6, H * 0.1, 10); flame(c, 8, H * 0.12, 8);
    for (const s of [-1, 1]) { rod(c, s * W * 0.34, H * 0.48, s * W * 0.34, H * 0.62, METAL_D, 2.4); }
  } },
  { id: 'cauldron', name: t('Cauldron'), cat: 'arcane', w: 0.9, h: 0.9, layer: 1, draw: (c, r, w) => {
    const R = w * 0.36;
    for (let i = 0; i < 3; i++) { const a = (i / 3) * TAU + 0.5; rod(c, Math.cos(a) * R * 0.8, Math.sin(a) * R * 0.8, Math.cos(a) * R * 1.2, Math.sin(a) * R * 1.2, '#1e1e22', 4); }
    shadow(c, true, 7, 3, 5); circ(c, 0, 0, R); fs(c, ball(c, 0, 0, R, '#2e2e34', 0.3), 2.6); shadow(c, false);
    circ(c, 0, 0, R * 0.92); st(c, '#4a4a52', 2);
    circ(c, 0, 0, R * 0.78); fs(c, radial(c, 0, 0, R * 0.78, '#b8f080', '#3e7a2a', 0.1), 1.2);
    clip(c, () => circ(c, 0, 0, R * 0.78), () => { for (let i = 0; i < 9; i++) { const x = rrange(r, -R * 0.6, R * 0.6), y = rrange(r, -R * 0.6, R * 0.6), b = rrange(r, 2, 5); circ(c, x, y, b); c.fillStyle = 'rgba(220,255,190,0.35)'; c.fill(); st(c, 'rgba(240,255,220,0.8)', 0.8); } });
    for (const s of [-1, 1]) { ell(c, s * R * 1.02, 0, 3, 6); st(c, INK, 3); ell(c, s * R * 1.02, 0, 3, 6); st(c, '#4a4a52', 1.6); }
  } },
  { id: 'candles', name: t('Candelabra'), cat: 'furniture', w: 0.5, h: 0.5, layer: 1, light: { radius: 2.5, color: '#ffd38a', intensity: 0.7 }, draw: (c, r, w) => {
    const R = w * 0.3;
    glow(c, 0, 0, R * 2.2, '255,210,130', 0.3);
    shadow(c, true, 4, 2, 3); circ(c, 0, 0, R); fs(c, radial(c, 0, 0, R, GOLD_L, GOLD_D, 0.4), 1.8); shadow(c, false);
    for (let i = 0; i < 3; i++) { const a = (i / 3) * TAU - Math.PI / 2; rod(c, 0, 0, Math.cos(a) * R * 0.62, Math.sin(a) * R * 0.62, GOLD, 2); }
    for (let i = 0; i < 3; i++) { const a = (i / 3) * TAU - Math.PI / 2; candle(c, Math.cos(a) * R * 0.62, Math.sin(a) * R * 0.62, 3.2); }
    circ(c, 0, 0, 3); fs(c, GOLD_L, 0.8);
    void r;
  } },
  { id: 'throne', name: t('Throne'), cat: 'furniture', w: 1.3, h: 1.3, layer: 1, draw: (c, r, w) => {
    const S = w * 0.78;
    shadow(c, true, 10, 4, 7); rrect(c, -S / 2, -S / 2, S, S, 8); fs(c, lin(c, -S / 2, -S / 2, S / 2, S / 2, [[0, GOLD_L], [0.5, GOLD], [1, GOLD_D]]), 2.4); shadow(c, false);
    rrect(c, -S / 2 + 4, -S / 2 - 4, S - 8, S * 0.26, [10, 10, 3, 3]); fs(c, lin(c, 0, -S / 2, 0, -S * 0.25, [[0, GOLD_L], [1, GOLD_D]]), 2);
    for (let i = 0; i < 5; i++) { const x = -S * 0.32 + i * S * 0.16; poly(c, [x - 5, -S / 2 - 2, x, -S / 2 - 14, x + 5, -S / 2 - 2]); fs(c, GOLD, 1.2); }
    gem(c, 0, -S * 0.4, 6, '#c0203a', 6);
    for (const s of [-1, 1]) { rrect(c, s > 0 ? S / 2 - 14 : -S / 2 + 2, -S * 0.22, 12, S * 0.68, 5); fs(c, lin(c, 0, 0, s * 12, 0, [[0, GOLD], [1, GOLD_D]]), 1.6); circ(c, s * (S / 2 - 8), S * 0.4, 5); fs(c, ball(c, 0, 0, 5, GOLD_L), 1.2); }
    rrect(c, -S / 2 + 16, -S * 0.2, S - 32, S * 0.66, 6); fs(c, ball(c, 0, S * 0.1, S * 0.4, '#8a1f2a', 0.3), 1.6);
    for (const [x, y] of [[-0.12, 0], [0.12, 0], [0, 0.2], [-0.12, 0.34], [0.12, 0.34]]) { circ(c, x * S, y * S, 1.6); c.fillStyle = '#4a0a14'; c.fill(); }
  } },
  { id: 'rug', name: t('Rug'), cat: 'furniture', w: 3, h: 2, layer: 0, draw: (c, r, w, h) => {
    const W = w * 0.92, H = h * 0.86, col = pick(r, ['#8a1f2a', '#1f3f7a', '#5a2a6a', '#6a4a1a']), acc = pick(r, [GOLD, '#e8d8b0', '#4aa0a0']);
    rrect(c, -W / 2, -H / 2, W, H, 4); fs(c, radial(c, 0, 0, W * 0.55, shade(col, 0.12), shade(col, -0.2), 0), 2);
    for (let k = 0; k < 3; k++) { rrect(c, -W / 2 + 8 + k * 7, -H / 2 + 8 + k * 7, W - 16 - k * 14, H - 16 - k * 14, 3); st(c, k === 1 ? shade(acc, -0.3) : acc, k === 1 ? 1.2 : 3); }
    clip(c, () => rect(c, -W / 2 + 8, -H / 2 + 8, W - 16, 14), () => { for (let x = -W / 2; x < W / 2; x += 14) { poly(c, [x, -H / 2 + 15, x + 7, -H / 2 + 9, x + 14, -H / 2 + 15, x + 7, -H / 2 + 21]); c.fillStyle = shade(acc, -0.1); c.fill(); } });
    clip(c, () => rect(c, -W / 2 + 8, H / 2 - 22, W - 16, 14), () => { for (let x = -W / 2; x < W / 2; x += 14) { poly(c, [x, H / 2 - 15, x + 7, H / 2 - 21, x + 14, H / 2 - 15, x + 7, H / 2 - 9]); c.fillStyle = shade(acc, -0.1); c.fill(); } });
    poly(c, [0, -H * 0.26, W * 0.22, 0, 0, H * 0.26, -W * 0.22, 0]); fs(c, shade(col, 0.2), 1.2); st(c, acc, 2.4);
    poly(c, [0, -H * 0.14, W * 0.11, 0, 0, H * 0.14, -W * 0.11, 0]); fs(c, acc, 1);
    circ(c, 0, 0, 5); c.fillStyle = col; c.fill();
    for (let x = -W / 2 + 4; x < W / 2; x += 6) for (const s of [-1, 1]) line(c, x, s * H / 2, x, s * (H / 2 + 6), '#d8c49a', 1.5);
  } },
  // ------------------------------------------------ Dungeon
  { id: 'pillar', name: t('Pillar'), cat: 'dungeon', w: 1, h: 1, layer: 1, draw: (c, r, w) => {
    const R = w * 0.38;
    shadow(c, true, 12, 6, 8, 0.6); rect(c, -R * 1.05, -R * 1.05, R * 2.1, R * 2.1); fs(c, lin(c, -R, -R, R, R, [[0, STONE], [1, STONE_D]])); shadow(c, false);
    rect(c, -R * 0.92, -R * 0.92, R * 1.84, R * 1.84); st(c, 'rgba(255,255,255,0.12)', 1.4);
    circ(c, 0, 0, R); fs(c, radial(c, 0, 0, R, STONE_L, STONE_D, 0.35));
    for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; line(c, Math.cos(a) * R * 0.55, Math.sin(a) * R * 0.55, Math.cos(a) * R * 0.95, Math.sin(a) * R * 0.95, 'rgba(0,0,0,0.22)', 1.5); }
    circ(c, 0, 0, R * 0.55); st(c, 'rgba(0,0,0,0.25)', 1.4);
    void r;
  } },
  { id: 'pillar_round', name: t('Round pillar'), cat: 'dungeon', w: 0.8, h: 0.8, layer: 1, draw: (c, r, w) => {
    const R = w * 0.4;
    shadow(c, true, 10, 5, 7, 0.6); circ(c, 0, 0, R); fs(c, radial(c, 0, 0, R, STONE_L, STONE_D, 0.35));
    shadow(c, false); circ(c, 0, 0, R * 0.7); c.strokeStyle = 'rgba(0,0,0,0.25)'; c.lineWidth = 1.5; c.stroke();
  } },
  { id: 'statue', name: t('Statue'), cat: 'temple', w: 1, h: 1, layer: 1, draw: (c, r, w) => {
    const S = w * 0.84;
    shadow(c, true, 10, 5, 7); rect(c, -S / 2, -S / 2, S, S); fs(c, STONE_D); shadow(c, false);
    rect(c, -S / 2 + 6, -S / 2 + 6, S - 12, S - 12); fs(c, lin(c, -S / 2, -S / 2, S / 2, S / 2, [[0, STONE_L], [1, STONE]]), 1.4);
    shadow(c, true, 6, 3, 4);
    ell(c, 0, 4, S * 0.32, S * 0.18); fs(c, radial(c, 0, 4, S * 0.32, '#d8d4ca', STONE_D), 2);
    for (const s of [-1, 1]) { ell(c, s * S * 0.3, 6, S * 0.08, S * 0.1); fs(c, radial(c, s * S * 0.3, 6, S * 0.1, '#d8d4ca', STONE), 1.4); }
    circ(c, 0, -2, S * 0.13); fs(c, radial(c, 0, -2, S * 0.13, '#eeeae0', STONE), 2);
    shadow(c, false);
    for (let i = 0; i < 3; i++) { blob(c, r, rrange(r, 2, 4), 6, 0.3, rrange(r, -S * 0.35, S * 0.35), rrange(r, -S * 0.35, S * 0.35)); c.fillStyle = 'rgba(80,110,50,0.45)'; c.fill(); }
  } },
  { id: 'altar', name: t('Altar'), cat: 'temple', w: 2, h: 1, layer: 1, light: { radius: 3, color: '#ffd38a', intensity: 0.6 }, draw: (c, r, w, h) => {
    const W = w * 0.9, H = h * 0.8;
    shadow(c, true); rect(c, -W / 2, -H / 2, W, H); fs(c, lin(c, -W / 2, -H / 2, W / 2, H / 2, [[0, STONE_L], [1, STONE_D]])); shadow(c, false);
    for (let i = 1; i < 4; i++) line(c, -W / 2 + (i * W) / 4, -H / 2, -W / 2 + (i * W) / 4, H / 2, 'rgba(0,0,0,0.18)', 1.2);
    cloth(c, r, -W * 0.3, -H / 2 - 3, W * 0.6, H + 6, '#7a1f2a', 2);
    rect(c, -W * 0.3, -H / 2 - 3, W * 0.6, 4); c.fillStyle = GOLD; c.fill(); rect(c, -W * 0.3, H / 2 - 1, W * 0.6, 4); c.fill();
    for (const sx of [-0.4, 0.4]) { circ(c, sx * W, 0, 7); fs(c, ball(c, sx * W, 0, 7, GOLD), 1); candle(c, sx * W, 0, 3.4); }
    rrect(c, -10, -10, 20, 20, 3); fs(c, lin(c, -10, -10, 10, 10, [[0, GOLD_L], [1, GOLD_D]]), 1.5);
    rod(c, 0, -7, 0, 7, '#fff6d0', 1.8); rod(c, -5, -3, 5, -3, '#fff6d0', 1.8);
  } },
  { id: 'sarcophagus', name: t('Sarcophagus'), cat: 'temple', w: 1, h: 2, layer: 1, draw: (c, r, w, h) => {
    const W = w * 0.78, H = h * 0.9;
    shadow(c, true);
    c.beginPath(); c.moveTo(-W / 2, -H / 2 + 12); c.lineTo(-W / 2 + 12, -H / 2); c.lineTo(W / 2 - 12, -H / 2); c.lineTo(W / 2, -H / 2 + 12);
    c.lineTo(W / 2 - 6, H / 2); c.lineTo(-W / 2 + 6, H / 2); c.closePath(); fs(c, STONE);
    shadow(c, false);
    c.beginPath(); c.ellipse(0, -H * 0.3, W * 0.16, W * 0.18, 0, 0, 7); c.strokeStyle = 'rgba(0,0,0,0.4)'; c.lineWidth = 2; c.stroke();
    c.beginPath(); c.moveTo(-W * 0.25, -H * 0.15); c.lineTo(-W * 0.18, H * 0.38); c.lineTo(W * 0.18, H * 0.38); c.lineTo(W * 0.25, -H * 0.15); c.closePath(); c.stroke();
    line(c, 0, -H * 0.1, 0, H * 0.2, 'rgba(0,0,0,0.4)', 2); line(c, -W * 0.12, 0, W * 0.12, 0, 'rgba(0,0,0,0.4)', 2);
  } },
  { id: 'brazier', name: t('Brazier'), cat: 'dungeon', w: 0.8, h: 0.8, layer: 1, light: { radius: 5, color: '#ffa94d', intensity: 0.9 }, draw: (c, r, w) => {
    const R = w * 0.34;
    shadow(c, true, 8, 3, 5); circ(c, 0, 0, R); fs(c, METAL_D, 2.5);
    shadow(c, false); circ(c, 0, 0, R * 0.75); c.fillStyle = '#2a1a10'; c.fill();
    for (let i = 0; i < 6; i++) { circ(c, rrange(r, -R * 0.4, R * 0.4), rrange(r, -R * 0.4, R * 0.4), 3); c.fillStyle = '#ff6a1a'; c.fill(); }
    flame(c, 0, 0, R * 0.55);
  } },
  { id: 'torch', name: t('Torch'), cat: 'dungeon', w: 0.4, h: 0.4, layer: 1, light: { radius: 4, color: '#ffae5a', intensity: 0.85 }, draw: (c, r, w) => {
    line(c, 0, w * 0.3, 0, -w * 0.05, WOOD_D, 6); line(c, 0, w * 0.3, 0, -w * 0.05, WOOD, 3);
    flame(c, 0, -w * 0.12, 7);
  } },
  { id: 'stairs', name: t('Stairs'), cat: 'dungeon', w: 1, h: 2, layer: 1, draw: (c, r, w, h) => {
    const W = w * 0.96, H = h * 0.96, n = 9;
    rect(c, -W / 2 - 4, -H / 2, W + 8, H); fs(c, STONE_D, 2.4);
    for (let i = 0; i < n; i++) {
      const y = -H / 2 + (H * i) / n, k = i / n;
      rect(c, -W / 2, y, W, H / n); c.fillStyle = lin(c, 0, y, 0, y + H / n, [[0, shade(STONE, 0.1 - k * 0.7)], [1, shade(STONE, -0.1 - k * 0.7)]]); c.fill();
      line(c, -W / 2, y, W / 2, y, 'rgba(0,0,0,0.65)', 2);
      line(c, -W / 2, y + 2, W / 2, y + 2, `rgba(255,255,255,${0.22 * (1 - k)})`, 1.5);
      if (r() < 0.3) line(c, rrange(r, -W * 0.4, W * 0.2), y + 4, rrange(r, -W * 0.1, W * 0.4), y + rrange(r, 6, 14), 'rgba(0,0,0,0.25)', 0.8);
    }
    for (const s of [-1, 1]) { rect(c, s * (W / 2 + 2) - 3, -H / 2, 6, H); fs(c, lin(c, 0, -H / 2, 0, H / 2, [[0, STONE_L], [1, '#2a2620']]), 1.2); }
    rect(c, -W / 2 - 4, -H / 2, W + 8, H); st(c, INK, 2.5);
  } },
  { id: 'trapdoor', name: t('Trapdoor'), cat: 'dungeon', w: 1, h: 1, layer: 0, draw: (c, r, w) => {
    const S = w * 0.8;
    rect(c, -S / 2 - 4, -S / 2 - 4, S + 8, S + 8); c.fillStyle = 'rgba(0,0,0,0.4)'; c.fill();
    plankBox(c, r, -S / 2, -S / 2, S, S, 4, WOOD_D, true, 1);
    for (const y of [-S * 0.3, S * 0.3]) { rect(c, -S / 2, y - 3.5, S, 7); fs(c, lin(c, 0, y - 3.5, 0, y + 3.5, [[0, METAL_L], [1, METAL_D]]), 1); for (const x of [-S * 0.4, 0, S * 0.4]) { circ(c, x, y, 1.4); c.fillStyle = INK; c.fill(); } }
    circ(c, S * 0.25, 0, 6); st(c, INK, 4); circ(c, S * 0.25, 0, 6); st(c, METAL, 2.4);
  } },
  { id: 'cage', name: t('Cage'), cat: 'dungeon', w: 1, h: 1, layer: 1, draw: (c, r, w) => {
    const S = w * 0.86;
    rect(c, -S / 2, -S / 2, S, S); c.fillStyle = 'rgba(0,0,0,0.22)'; c.fill();
    if (r() < 0.5) { for (let i = 0; i < 30; i++) { const x = rrange(r, -S * 0.4, S * 0.4), y = rrange(r, -S * 0.4, S * 0.4), a = r() * TAU; line(c, x, y, x + Math.cos(a) * 7, y + Math.sin(a) * 7, '#b8964c', 1); } }
    for (let i = 1; i < 6; i++) { const x = -S / 2 + (S * i) / 6; shadow(c, true, 3, 2, 3, 0.45); line(c, x, -S / 2, x, S / 2, INK, 4.6); shadow(c, false); line(c, x, -S / 2, x, S / 2, METAL, 2.6); line(c, x - 0.6, -S / 2, x - 0.6, S / 2, 'rgba(255,255,255,0.3)', 0.8); }
    for (const y of [-S / 2, 0, S / 2]) { line(c, -S / 2, y, S / 2, y, INK, 5.6); line(c, -S / 2, y, S / 2, y, METAL_D, 3.6); }
    for (const x of [-S / 2, S / 2]) { line(c, x, -S / 2, x, S / 2, INK, 7); line(c, x, -S / 2, x, S / 2, METAL_D, 5); }
    for (const [x, y] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { circ(c, x * S / 2, y * S / 2, 4); fs(c, ball(c, 0, 0, 4, METAL), 1.2); }
    rect(c, S / 2 - 6, -6, 9, 12); fs(c, '#6a5a2a', 1.2);
  } },
  { id: 'well', name: t('Well'), cat: 'town', w: 1.3, h: 1.3, layer: 1, draw: (c, r, w) => {
    const R = w * 0.4;
    shadow(c, true); circ(c, 0, 0, R); fs(c, STONE); shadow(c, false);
    for (let k = 0; k < 2; k++) for (let i = 0; i < 12; i++) { const a0 = (i / 12) * TAU + k * 0.26, a1 = ((i + 1) / 12) * TAU + k * 0.26; c.beginPath(); c.arc(0, 0, R * (1 - k * 0.17), a0 + 0.02, a1 - 0.02); c.arc(0, 0, R * (0.83 - k * 0.17), a1 - 0.02, a0 + 0.02, true); c.closePath(); c.fillStyle = shade(STONE, -Math.cos((a0 + a1) / 2 - Math.PI * 1.25) * 0.2 + rrange(r, -0.06, 0.06)); c.fill(); st(c, 'rgba(20,16,12,0.7)', 1); }
    circ(c, 0, 0, R * 0.64); fs(c, radial(c, R * 0.1, R * 0.1, R * 0.64, '#0a1a24', '#020608', -0.2), 2);
    ell(c, -R * 0.1, -R * 0.12, R * 0.3, R * 0.12, -0.4); c.fillStyle = 'rgba(120,170,200,0.25)'; c.fill();
    rod(c, -R * 1.15, 0, R * 1.15, 0, WOOD, 5);
    for (const s of [-1, 1]) { rect(c, s * R * 1.1 - 6, -6, 12, 12); fs(c, WOOD_D, 1.4); }
    line(c, R * 0.1, 0, R * 0.1, R * 0.35, '#c8a868', 1.4); tub(c, R * 0.1, R * 0.42, 7, '#3a6a7a', WOOD_L);
  } },
  { id: 'fountain', name: t('Fountain'), cat: 'town', w: 2, h: 2, layer: 1, draw: (c, r, w) => {
    const R = w * 0.44;
    shadow(c, true); circ(c, 0, 0, R); fs(c, lin(c, -R, -R, R, R, [[0, STONE_L], [1, STONE_D]])); shadow(c, false);
    for (let i = 0; i < 16; i++) { const a = (i / 16) * TAU; line(c, Math.cos(a) * R * 0.84, Math.sin(a) * R * 0.84, Math.cos(a) * R, Math.sin(a) * R, 'rgba(0,0,0,0.3)', 1.2); }
    circ(c, 0, 0, R * 0.82); fs(c, radial(c, 0, 0, R * 0.82, '#8ad4e6', '#2a7a96', 0), 2);
    clip(c, () => circ(c, 0, 0, R * 0.82), () => { for (let k = 1; k < 5; k++) { circ(c, rrange(r, -2, 2), rrange(r, -2, 2), R * 0.16 * k + 6); st(c, 'rgba(230,252,255,0.35)', 1.5); } for (let i = 0; i < 4; i++) { const a = r() * TAU, d = rrange(r, R * 0.35, R * 0.7); circ(c, Math.cos(a) * d, Math.sin(a) * d, 2.2); c.fillStyle = GOLD; c.fill(); } });
    circ(c, 0, 0, R * 0.24); fs(c, radial(c, 0, 0, R * 0.24, STONE_L, STONE_D), 2);
    for (let i = 0; i < 4; i++) { const a = (i / 4) * TAU + Math.PI / 4; c.beginPath(); c.moveTo(Math.cos(a) * R * 0.12, Math.sin(a) * R * 0.12); c.quadraticCurveTo(Math.cos(a) * R * 0.3, Math.sin(a) * R * 0.3 - 8, Math.cos(a) * R * 0.46, Math.sin(a) * R * 0.46); st(c, 'rgba(240,252,255,0.75)', 2.2); }
    circ(c, 0, 0, R * 0.1); fs(c, ball(c, 0, 0, R * 0.1, '#bfe8f4'), 1.2);
  } },
  { id: 'pentagram', name: t('Ritual circle'), cat: 'arcane', w: 2, h: 2, layer: 0, draw: (c, r, w) => {
    const R = w * 0.44;
    c.strokeStyle = 'rgba(160,20,30,0.85)'; c.lineWidth = 3;
    circ(c, 0, 0, R); c.stroke(); circ(c, 0, 0, R * 0.9); c.stroke();
    c.beginPath();
    for (let i = 0; i <= 5; i++) { const a = -Math.PI / 2 + (i * 2 * Math.PI * 2) / 5; const x = Math.cos(a) * R * 0.9, y = Math.sin(a) * R * 0.9; i ? c.lineTo(x, y) : c.moveTo(x, y); }
    c.stroke();
    for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5; circ(c, Math.cos(a) * R, Math.sin(a) * R, 5); c.fillStyle = '#f2ead6'; c.fill(); }
  } },
  { id: 'bones', name: t('Bones'), cat: 'decor', w: 1, h: 1, layer: 0, draw: (c, r, w) => {
    const bone = (x: number, y: number, L: number, a: number) => {
      c.save(); c.translate(x, y); c.rotate(a);
      line(c, -L / 2, 0, L / 2, 0, '#3a2f22', 6); line(c, -L / 2, 0, L / 2, 0, '#e8e0c8', 4);
      for (const s of [-1, 1]) { circ(c, s * L / 2, -2.5, 3); c.fillStyle = '#e8e0c8'; c.fill(); circ(c, s * L / 2, 2.5, 3); c.fill(); }
      c.restore();
    };
    for (let i = 0; i < 5; i++) bone(rrange(r, -w * 0.3, w * 0.3), rrange(r, -w * 0.3, w * 0.3), rrange(r, 14, 26), r() * 6.28);
    if (r() < 0.8) { const x = rrange(r, -w * 0.15, w * 0.15), y = rrange(r, -w * 0.15, w * 0.15); circ(c, x, y, 9); fs(c, '#e8e0c8', 1.8); circ(c, x - 3, y - 1, 2.2); c.fillStyle = INK; c.fill(); circ(c, x + 3, y - 1, 2.2); c.fill(); }
  } },
  { id: 'cobweb', name: t('Cobweb'), cat: 'decor', w: 1, h: 1, layer: 0, draw: (c, r, w) => {
    const o = -w / 2, L = w;
    c.strokeStyle = 'rgba(240,240,240,0.55)'; c.lineWidth = 1.2;
    const rays = 6;
    for (let i = 0; i <= rays; i++) { const a = (i / rays) * Math.PI / 2; line(c, o, o, o + Math.cos(a) * L, o + Math.sin(a) * L, 'rgba(240,240,240,0.55)', 1.2); }
    for (let k = 1; k <= 5; k++) {
      c.beginPath();
      for (let i = 0; i <= rays; i++) { const a = (i / rays) * Math.PI / 2, d = (L * k) / 5.5; const x = o + Math.cos(a) * d, y = o + Math.sin(a) * d; i ? c.quadraticCurveTo(o + Math.cos(a - 0.13) * d * 0.9, o + Math.sin(a - 0.13) * d * 0.9, x, y) : c.moveTo(x, y); }
      c.stroke();
    }
  } },
  { id: 'rubble', name: t('Rubble'), cat: 'decor', w: 1.5, h: 1.5, layer: 0, draw: (c, r, w) => {
    for (let i = 0; i < 14; i++) rock(c, r, rrange(r, -w * 0.35, w * 0.35), rrange(r, -w * 0.35, w * 0.35), rrange(r, 4, 12), STONE);
  } },
  { id: 'blood', name: t('Blood'), cat: 'decor', w: 1, h: 1, layer: 0, draw: (c, r, w) => {
    c.fillStyle = 'rgba(110,10,15,0.8)';
    c.beginPath(); c.ellipse(0, 0, w * 0.22, w * 0.18, r() * 3, 0, 7); c.fill();
    for (let i = 0; i < 12; i++) { const a = r() * 6.28, d = rrange(r, w * 0.15, w * 0.42); circ(c, Math.cos(a) * d, Math.sin(a) * d, rrange(r, 1.5, 5)); c.fill(); }
  } },
  { id: 'trap', name: t('Trap'), cat: 'dungeon', w: 1, h: 1, layer: 0, draw: (c, r, w) => {
    const S = w * 0.7;
    c.beginPath(); c.rect(-S / 2, -S / 2, S, S); c.fillStyle = 'rgba(0,0,0,0.25)'; c.fill();
    c.strokeStyle = 'rgba(0,0,0,0.55)'; c.lineWidth = 2; c.stroke();
    c.beginPath(); c.rect(-S / 2 + 5, -S / 2 + 5, S - 10, S - 10); c.strokeStyle = 'rgba(255,255,255,0.12)'; c.stroke();
  } },
  // ------------------------------------------------ Caverne
  { id: 'stalagmite', name: 'Stalagmite', cat: 'caves', w: 0.9, h: 0.9, layer: 1, draw: (c, r, w) => {
    const R = w * 0.4;
    shadow(c, true, 10, 5, 7, 0.6);
    rockShape(c, r, R, 11); fs(c, radial(c, 0, 0, R, '#a99c8c', '#4e443b', 0.2), 2);
    shadow(c, false);
    for (const k of [0.7, 0.45, 0.22]) { rockShape(c, r, R * k, 9); c.fillStyle = `rgba(255,245,230,${0.12 + (0.7 - k) * 0.25})`; c.fill(); }
  } },
  { id: 'boulder', name: t('Boulder'), cat: 'caves', w: 1.2, h: 1.2, layer: 1, draw: (c, r, w) => rock(c, r, 0, 0, w * 0.4, '#8b8176') },
  { id: 'rocks', name: t('Rocks'), cat: 'caves', w: 1, h: 1, layer: 1, draw: (c, r, w) => {
    for (let i = 0; i < 4; i++) rock(c, r, rrange(r, -w * 0.25, w * 0.25), rrange(r, -w * 0.25, w * 0.25), rrange(r, 7, 16), '#8b8176');
  } },
  { id: 'crystals', name: t('Crystals'), cat: 'caves', w: 1, h: 1, layer: 1, light: { radius: 3, color: '#b28cff', intensity: 0.7 }, draw: (c, r, w) => {
    const g = c.createRadialGradient(0, 0, 0, 0, 0, w * 0.5); g.addColorStop(0, 'rgba(190,150,255,0.45)'); g.addColorStop(1, 'rgba(190,150,255,0)');
    c.fillStyle = g; circ(c, 0, 0, w * 0.5); c.fill();
    for (let i = 0; i < 6; i++) {
      const a = r() * 6.28, L = rrange(r, 14, 30), Wd = rrange(r, 5, 9);
      c.save(); c.rotate(a); c.translate(rrange(r, 0, 8), 0);
      shadow(c, true, 4, 2, 3);
      c.beginPath(); c.moveTo(0, -Wd); c.lineTo(L * 0.75, -Wd); c.lineTo(L, 0); c.lineTo(L * 0.75, Wd); c.lineTo(0, Wd); c.closePath();
      fs(c, i % 2 ? '#9a6cf0' : '#c3a6ff', 1.6);
      shadow(c, false); line(c, 0, 0, L, 0, 'rgba(255,255,255,0.6)', 1.5);
      c.restore();
    }
  } },
  { id: 'mushrooms', name: t('Mushrooms'), cat: 'caves', w: 1, h: 1, layer: 1, draw: (c, r, w) => {
    const items: [number, number, number][] = Array.from({ length: 7 }, () => [rrange(r, -w * 0.3, w * 0.3), rrange(r, -w * 0.3, w * 0.3), rrange(r, 5, 12)]);
    items.sort((a, b) => a[2] - b[2]);
    const col = pick(r, ['#c8503a', '#b88a5a', '#d8c8a8', '#9a4a6a']);
    for (const [x, y, R] of items) {
      shadow(c, true, 4, 2, 3); circ(c, x, y, R); fs(c, radial(c, x, y, R, shade(col, 0.4), shade(col, -0.3), 0.4), 1.6); shadow(c, false);
      c.beginPath(); c.arc(x, y, R * 0.7, Math.PI * 1.1, Math.PI * 1.6); st(c, 'rgba(255,255,255,0.35)', 1.4);
      for (let k = 0; k < 3; k++) { circ(c, x + rrange(r, -R * 0.5, R * 0.5), y + rrange(r, -R * 0.5, R * 0.5), R * 0.12); c.fillStyle = '#fff2e0'; c.fill(); }
    }
  } },
  { id: 'glowshrooms', name: t('Glowing mushrooms'), cat: 'caves', w: 1, h: 1, layer: 1, light: { radius: 2.5, color: '#6affd8', intensity: 0.65 }, draw: (c, r, w) => {
    glow(c, 0, 0, w * 0.5, '100,255,220', 0.35);
    const items: [number, number, number][] = Array.from({ length: 8 }, () => [rrange(r, -w * 0.3, w * 0.3), rrange(r, -w * 0.3, w * 0.3), rrange(r, 4, 10)]);
    items.sort((a, b) => a[2] - b[2]);
    for (const [x, y, R] of items) { glow(c, x, y, R * 2, '120,255,220', 0.3); circ(c, x, y, R); fs(c, radial(c, x, y, R, '#e6fff8', '#2fb59a', 0.35), 1.4, '#0e4a40'); for (let k = 0; k < 6; k++) { const a = (k / 6) * TAU; line(c, x + Math.cos(a) * R * 0.3, y + Math.sin(a) * R * 0.3, x + Math.cos(a) * R * 0.85, y + Math.sin(a) * R * 0.85, 'rgba(20,110,90,0.4)', 0.8); } }
  } },
  // ------------------------------------------------ Esterni
  { id: 'tree', name: t('Tree'), cat: 'nature', w: 2, h: 2, layer: 2, draw: (c, r, w) => foliage(c, r, w * 0.42, { base: LEAF, light: '#7cb34a', dark: LEAF_D, hi: '#a8d070' }) },
  { id: 'tree_big', name: t('Large tree'), cat: 'nature', w: 3, h: 3, layer: 2, draw: (c, r, w) => foliage(c, r, w * 0.43, { base: '#4a8030', light: '#76a845', dark: '#2a4f1d', hi: '#9ac860' }, { lobes: 10 }) },
  { id: 'tree_autumn', name: t('Autumn tree'), cat: 'nature', w: 2, h: 2, layer: 2, draw: (c, r, w) => foliage(c, r, w * 0.42, { base: '#c26a2a', light: '#e8a040', dark: '#7a3a1a', hi: '#f8c860' }) },
  { id: 'pine', name: t('Pine'), cat: 'nature', w: 1.6, h: 1.6, layer: 2, draw: (c, r, w) => fir(c, r, w * 0.44, 0, ['#1e3e26', '#24492c', '#2e5a36', '#3a6a40']) },
  { id: 'bush', name: t('Bush'), cat: 'nature', w: 1, h: 1, layer: 1, draw: (c, r, w) => foliage(c, r, w * 0.38, { base: '#5a8f36', light: '#86b955', dark: '#33601f' }, { lobes: 6 }) },
  { id: 'stump', name: t('Stump'), cat: 'nature', w: 0.8, h: 0.8, layer: 1, draw: (c, r, w) => {
    const R = w * 0.34;
    shadow(c, true, 6, 3, 4); rockShape(c, r, R, 10); fs(c, WOOD_D, 2.2);
    shadow(c, false); circ(c, 0, 0, R * 0.78); c.fillStyle = '#c99a62'; c.fill();
    for (let k = 1; k < 4; k++) { circ(c, 0, 0, R * 0.2 * k); c.strokeStyle = 'rgba(90,50,20,0.55)'; c.lineWidth = 1.2; c.stroke(); }
  } },
  { id: 'log', name: t('Log'), cat: 'nature', w: 2, h: 0.6, layer: 1, draw: (c, r, w, h) => {
    const W = w * 0.86, H = h * 0.62;
    shadow(c, true, 7, 3, 5); rrect(c, -W / 2, -H / 2, W, H, H / 2); fs(c, WOOD_D);
    shadow(c, false);
    for (let i = 0; i < 4; i++) line(c, -W * 0.4, rrange(r, -H * 0.3, H * 0.3), W * 0.35, rrange(r, -H * 0.3, H * 0.3), 'rgba(20,10,0,0.4)', 1.5);
    c.beginPath(); c.ellipse(W / 2 - H * 0.3, 0, H * 0.3, H / 2, 0, 0, 7); fs(c, '#c99a62', 2);
    c.beginPath(); c.ellipse(W / 2 - H * 0.3, 0, H * 0.15, H * 0.25, 0, 0, 7); c.strokeStyle = 'rgba(90,50,20,0.55)'; c.lineWidth = 1.2; c.stroke();
  } },
  { id: 'campfire', name: t('Campfire'), cat: 'camp', w: 1, h: 1, layer: 1, light: { radius: 6, color: '#ffa04a', intensity: 1 }, draw: (c, r, w) => {
    const R = w * 0.36;
    for (let i = 0; i < 10; i++) { const a = (i / 10) * TAU + rrange(r, -0.1, 0.1); boulder(c, r, Math.cos(a) * R, Math.sin(a) * R, rrange(r, 6, 8.5), '#8a8378'); }
    coals(c, r, 0, 0, R * 0.72, 14);
    for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI + rrange(r, -0.2, 0.2); rod(c, Math.cos(a) * R * 0.55, Math.sin(a) * R * 0.55, -Math.cos(a) * R * 0.55, -Math.sin(a) * R * 0.55, '#4a2e1a', 5); }
    flame(c, -3, 2, R * 0.42); flame(c, 4, -3, R * 0.32);
  } },
  { id: 'tent', name: t('Tent'), cat: 'camp', w: 2, h: 2, layer: 1, draw: (c, r, w) => {
    const S = w * 0.8, col = r() < 0.5 ? '#c9b48a' : '#8a6a4a';
    shadow(c, true, 12, 6, 8); rect(c, -S / 2, -S / 2, S, S); c.fillStyle = col; c.fill(); shadow(c, false);
    rect(c, -S / 2, -S / 2, S / 2, S); fs(c, lin(c, -S / 2, 0, 0, 0, [[0, shade(col, 0.02)], [1, shade(col, 0.22)]]), 2);
    rect(c, 0, -S / 2, S / 2, S); fs(c, lin(c, 0, 0, S / 2, 0, [[0, shade(col, -0.12)], [1, shade(col, -0.3)]]), 2);
    for (let i = 1; i < 4; i++) { const y = -S / 2 + (i * S) / 4; line(c, -S / 2, y, S / 2, y, 'rgba(60,40,20,0.25)', 1.4); }
    line(c, 0, -S / 2 - 6, 0, S / 2 + 6, INK, 3.4); line(c, 0, -S / 2 - 6, 0, S / 2 + 6, WOOD_L, 1.6);
    poly(c, [-S * 0.14, S / 2, 0, S * 0.26, S * 0.14, S / 2]); c.fillStyle = 'rgba(0,0,0,0.5)'; c.fill();
    for (const s of [-1, 1]) for (const t2 of [-1, 1]) { line(c, s * S / 2, t2 * S * 0.4, s * (S / 2 + 14), t2 * S * 0.48, '#c8b080', 1); circ(c, s * (S / 2 + 14), t2 * S * 0.48, 2); c.fillStyle = WOOD_D; c.fill(); }
  } },
  { id: 'cart', name: t('Cart'), cat: 'town', w: 1.5, h: 2.5, layer: 1, draw: (c, r, w, h) => {
    const W = w * 0.62, H = h * 0.6;
    rod(c, -W * 0.25, -H / 2, -W * 0.15, -h * 0.47, WOOD_D, 5); rod(c, W * 0.25, -H / 2, W * 0.15, -h * 0.47, WOOD_D, 5); rod(c, -W * 0.2, -h * 0.4, W * 0.2, -h * 0.4, WOOD_D, 4);
    for (const s of [-1, 1]) { shadow(c, true, 4, 2, 3); rrect(c, s * (W / 2 + 3) - 5, -14, 10, 28, 4); fs(c, WOOD_D, 1.6); shadow(c, false); for (let k = 0; k < 4; k++) line(c, s * (W / 2 + 3) - 5, -10 + k * 7, s * (W / 2 + 3) + 5, -10 + k * 7, 'rgba(0,0,0,0.35)', 1); }
    shadow(c, true); plankBox(c, r, -W / 2, -H / 2, W, H, 4, WOOD, true, 3); shadow(c, false);
    rect(c, -W / 2 + 5, -H / 2 + 5, W - 10, H - 10); st(c, 'rgba(40,20,5,0.5)', 2);
    if (r() < 0.6) { for (let i = 0; i < 3; i++) { const x = rrange(r, -W * 0.25, W * 0.25), y = rrange(r, -H * 0.3, H * 0.3); shadow(c, true, 4, 2, 3); ell(c, x, y, 14, 11, r() * 3); fs(c, ball(c, x, y, 14, '#c8b088', 0.3), 1.4); shadow(c, false); } }
  } },
  { id: 'fence', name: t('Fence'), cat: 'town', w: 2, h: 0.3, layer: 1, draw: (c, r, w) => {
    const W = w * 0.98;
    shadow(c, true, 4, 2, 3);
    for (const y of [-3, 4]) { rod(c, -W / 2, y + rrange(r, -0.5, 0.5), W / 2, y + rrange(r, -0.5, 0.5), WOOD_L, 3.6); }
    shadow(c, false);
    for (let i = 0; i <= 4; i++) { const x = -W / 2 + (W * i) / 4; rect(c, x - 4.5, -7.5, 9, 15); fs(c, lin(c, x - 4.5, 0, x + 4.5, 0, [[0, WOOD_L], [1, WOOD_D]]), 1.5); circ(c, x, 0, 1.4); c.fillStyle = '#2a2a2a'; c.fill(); }
  } },
  { id: 'signpost', name: t('Signpost'), cat: 'town', w: 0.8, h: 0.5, layer: 1, draw: (c, r, w, h) => {
    for (const [a, s] of [[-0.25, 1], [0.35, -1]] as const) at(c, 0, 0, a, () => { shadow(c, true, 4, 2, 3); poly(c, [-w * 0.05 * s, -h * 0.13, w * 0.32 * s, -h * 0.13, w * 0.4 * s, 0, w * 0.32 * s, h * 0.13, -w * 0.05 * s, h * 0.13]); fs(c, lin(c, 0, -h * 0.13, 0, h * 0.13, [[0, WOOD_L], [1, WOOD]]), 1.6); shadow(c, false); for (let k = 0; k < 2; k++) line(c, w * 0.05 * s, -h * 0.04 + k * h * 0.08, w * 0.26 * s, -h * 0.04 + k * h * 0.08, 'rgba(40,20,5,0.55)', 1); });
    circ(c, 0, 0, 5); fs(c, ball(c, 0, 0, 5, WOOD_D), 1.5);
  } },
  { id: 'gravestone', name: t('Gravestone'), cat: 'temple', w: 0.7, h: 0.5, layer: 1, draw: (c, r, w, h) => {
    shadow(c, true, 5, 3, 4); rrect(c, -w * 0.3, -h * 0.3, w * 0.6, h * 0.6, [12, 12, 2, 2]); fs(c, lin(c, 0, -h * 0.3, 0, h * 0.3, [[0, STONE_L], [1, STONE_D]])); shadow(c, false);
    line(c, -w * 0.15, -h * 0.02, w * 0.15, -h * 0.02, 'rgba(0,0,0,0.4)', 2); line(c, -w * 0.1, h * 0.12, w * 0.1, h * 0.12, 'rgba(0,0,0,0.3)', 1.4);
    for (let i = 0; i < 2; i++) { blob(c, r, rrange(r, 2, 4), 6, 0.3, rrange(r, -w * 0.2, w * 0.2), rrange(r, -h * 0.2, h * 0.2)); c.fillStyle = 'rgba(80,110,50,0.5)'; c.fill(); }
  } },
  { id: 'menhir', name: 'Menhir', cat: 'fantasy', w: 1, h: 1, layer: 1, draw: (c, r, w) => {
    c.save(); c.scale(1, 0.7); rock(c, r, 0, 0, w * 0.36, '#9a9488'); c.restore();
    c.strokeStyle = 'rgba(80,140,255,0.5)'; c.lineWidth = 1.5;
    for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(rrange(r, -8, 8), rrange(r, -6, 6), rrange(r, 3, 6), 0, 4); c.stroke(); }
  } },
  { id: 'lamppost', name: t('Lamppost'), cat: 'town', w: 0.5, h: 0.5, layer: 1, light: { radius: 4, color: '#ffd38a', intensity: 0.8 }, draw: (c, r, w) => {
    const S = w * 0.44;
    glow(c, 0, 0, S * 1.6, '255,215,140', 0.35);
    shadow(c, true, 4, 2, 3); poly(c, [-S / 2, -S * 0.35, -S * 0.35, -S / 2, S * 0.35, -S / 2, S / 2, -S * 0.35, S / 2, S * 0.35, S * 0.35, S / 2, -S * 0.35, S / 2, -S / 2, S * 0.35]); fs(c, '#2a2c30', 2); shadow(c, false);
    poly(c, [-S * 0.3, -S * 0.2, -S * 0.2, -S * 0.3, S * 0.2, -S * 0.3, S * 0.3, -S * 0.2, S * 0.3, S * 0.2, S * 0.2, S * 0.3, -S * 0.2, S * 0.3, -S * 0.3, S * 0.2]); c.fillStyle = radial(c, 0, 0, S * 0.35, '#fff6c8', '#f0b040', 0); c.fill();
    line(c, -S / 2, 0, S / 2, 0, '#2a2c30', 1.2); line(c, 0, -S / 2, 0, S / 2, '#2a2c30', 1.2);
    circ(c, 0, 0, 3); fs(c, '#2a2c30', 1);
    void r;
  } },
  { id: 'boat', name: t('Boat'), cat: 'nautical', w: 1.2, h: 2.6, layer: 1, draw: (c, r, w, h) => {
    const W = w * 0.7, H = h * 0.9;
    shadow(c, true, 10, 5, 7);
    c.beginPath(); c.moveTo(0, -H / 2); c.bezierCurveTo(W * 0.6, -H * 0.3, W / 2, H * 0.35, W * 0.35, H / 2); c.lineTo(-W * 0.35, H / 2); c.bezierCurveTo(-W / 2, H * 0.35, -W * 0.6, -H * 0.3, 0, -H / 2); c.closePath();
    fs(c, WOOD_D, 2.5);
    shadow(c, false);
    c.beginPath(); c.moveTo(0, -H / 2 + 10); c.bezierCurveTo(W * 0.45, -H * 0.28, W * 0.38, H * 0.33, W * 0.26, H / 2 - 6); c.lineTo(-W * 0.26, H / 2 - 6); c.bezierCurveTo(-W * 0.38, H * 0.33, -W * 0.45, -H * 0.28, 0, -H / 2 + 10); c.closePath();
    c.fillStyle = WOOD; c.fill();
    for (const y of [-H * 0.1, H * 0.2]) line(c, -W * 0.38, y, W * 0.38, y, WOOD_D, 6);
  } },
  { id: 'tallgrass', name: t('Tall grass'), cat: 'nature', w: 1, h: 1, layer: 0, draw: (c, r, w) => {
    for (let i = 0; i < 9; i++) {
      const x = rrange(r, -w * 0.35, w * 0.35), y = rrange(r, -w * 0.35, w * 0.35);
      for (let k = 0; k < 7; k++) {
        const a = -Math.PI / 2 + rrange(r, -0.9, 0.9), L = rrange(r, 8, 16);
        line(c, x, y, x + Math.cos(a) * L, y + Math.sin(a) * L, k % 2 ? '#3d6a22' : '#8cbf55', 2);
      }
    }
  } },
  { id: 'flowers', name: t('Flowers'), cat: 'nature', w: 1, h: 1, layer: 0, draw: (c, r, w) => {
    const cols = ['#f4d35e', '#ee6c9c', '#ffffff', '#9b7ddb', '#ff8c42'];
    for (let i = 0; i < 16; i++) {
      const x = rrange(r, -w * 0.4, w * 0.4), y = rrange(r, -w * 0.4, w * 0.4), col = cols[Math.floor(r() * cols.length)];
      for (let p = 0; p < 5; p++) { const a = (p / 5) * 6.28; circ(c, x + Math.cos(a) * 2.6, y + Math.sin(a) * 2.6, 2.2); c.fillStyle = col; c.fill(); }
      circ(c, x, y, 1.6); c.fillStyle = '#c9851a'; c.fill();
    }
  } },
  { id: 'puddle', name: t('Puddle'), cat: 'decor', w: 1.2, h: 1, layer: 0, draw: (c, r, w, h) => {
    rockShape(c, r, w * 0.38, 12); c.save(); c.scale(1, h / w);
    c.fillStyle = 'rgba(40,90,120,0.55)'; c.fill(); c.strokeStyle = 'rgba(20,30,30,0.4)'; c.lineWidth = 2; c.stroke(); c.restore();
    line(c, -w * 0.15, -h * 0.1, w * 0.05, -h * 0.15, 'rgba(255,255,255,0.4)', 2);
  } },
];
