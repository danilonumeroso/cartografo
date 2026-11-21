import { t } from '../i18n';
import {
  at, ball, blob, bone, C2D, candle, circ, coin, ell, fs, INK, jar, leafShape, lin, line, METAL, METAL_L, PAPER, PARCH, pick, poly, radial,
  rect, rock, rod, rrange, rrect, scroll, shade, shadow, skull, StampDef, st, STONE, STRAW, sword, TAU, WOOD, WOOD_D, WOOD_L, plankBox,
} from '../art';
import type { Rng } from '../util';
import { seat } from './furniture';

function splat(c: C2D, r: Rng, x: number, y: number, R: number, col: string, n = 10) {
  blob(c, r, R, 9, 0.3, x, y); c.fillStyle = col; c.fill();
  for (let i = 0; i < n; i++) { const a = r() * TAU, d = rrange(r, R * 0.9, R * 2.2); circ(c, x + Math.cos(a) * d, y + Math.sin(a) * d, rrange(r, R * 0.06, R * 0.2)); c.fill(); }
}
function footprint(c: C2D, x: number, y: number, s: number, rot: number, col: string) {
  at(c, x, y, rot, () => {
    ell(c, 0, -s * 0.15, s * 0.28, s * 0.42); c.fillStyle = col; c.fill();
    ell(c, 0, s * 0.42, s * 0.22, s * 0.2); c.fill();
  });
}
function shard(c: C2D, r: Rng, x: number, y: number, s: number, col: string) {
  at(c, x, y, r() * TAU, () => { poly(c, [-s, -s * 0.3, s * 0.6, -s * 0.6, s, s * 0.4, -s * 0.2, s * 0.6]); fs(c, lin(c, -s, -s, s, s, [[0, shade(col, 0.2)], [1, shade(col, -0.2)]]), 1); });
}

export const DECOR: StampDef[] = [
  { id: 'scorch', name: t('Scorch mark'), cat: 'decor', w: 1.5, h: 1.5, layer: 0, tags: 'burn scorch fire blast explosion soot', draw: (c, r, w) => {
    const R = w * 0.4;
    const g = c.createRadialGradient(0, 0, 0, 0, 0, R); g.addColorStop(0, 'rgba(10,8,6,0.85)'); g.addColorStop(0.55, 'rgba(25,18,12,0.6)'); g.addColorStop(1, 'rgba(30,20,10,0)');
    blob(c, r, R, 14, 0.3); c.fillStyle = g; c.fill();
    for (let i = 0; i < 18; i++) { const a = r() * TAU; line(c, Math.cos(a) * R * 0.3, Math.sin(a) * R * 0.3, Math.cos(a) * R * rrange(r, 0.8, 1.2), Math.sin(a) * R * rrange(r, 0.8, 1.2), 'rgba(15,10,5,0.35)', rrange(r, 1, 3)); }
    for (let i = 0; i < 6; i++) { const a = r() * TAU, d = rrange(r, 0, R * 0.5); circ(c, Math.cos(a) * d, Math.sin(a) * d, rrange(r, 1, 2.2)); c.fillStyle = 'rgba(255,120,40,0.7)'; c.fill(); }
  } },
  { id: 'floor_crack', name: t('Floor crack'), cat: 'decor', w: 2, h: 1, layer: 0, tags: 'crack fissure broken floor damage', draw: (c, r, w, h) => {
    const branch = (x: number, y: number, a: number, L: number, wd: number, d: number) => {
      c.beginPath(); c.moveTo(x, y); for (let k = 0; k < 4; k++) { a += rrange(r, -0.5, 0.5); x += Math.cos(a) * L / 4; y += Math.sin(a) * L / 4; c.lineTo(x, y); }
      st(c, 'rgba(255,255,255,0.12)', wd + 2); st(c, 'rgba(10,8,6,0.85)', wd);
      if (d > 0) for (let i = 0; i < 2; i++) if (r() < 0.7) branch(x, y, a + rrange(r, -0.8, 0.8), L * 0.6, wd * 0.6, d - 1);
    };
    branch(-w * 0.45, rrange(r, -h * 0.1, h * 0.1), rrange(r, -0.2, 0.2), w * 0.5, 3, 2);
    branch(0, 0, rrange(r, -0.3, 0.3), w * 0.45, 2.4, 2);
  } },
  { id: 'blood_trail', name: t('Blood trail'), cat: 'decor', w: 1, h: 3, layer: 0, tags: 'blood trail drag wounded drops', draw: (c, r, w, h) => {
    c.fillStyle = 'rgba(110,10,15,0.75)';
    let x = 0;
    for (let i = 0; i < 16; i++) { const y = -h * 0.45 + (i * h * 0.9) / 15; x += rrange(r, -4, 4); ell(c, x, y, rrange(r, 3, 9), rrange(r, 5, 12), rrange(r, -0.3, 0.3)); c.fill(); if (r() < 0.5) { circ(c, x + rrange(r, -14, 14), y + rrange(r, -8, 8), rrange(r, 1, 3)); c.fill(); } }
    c.beginPath(); c.moveTo(-6, -h * 0.4); c.quadraticCurveTo(10, 0, -4, h * 0.42); st(c, 'rgba(110,10,15,0.4)', 6);
  } },
  { id: 'footprints', name: t('Footprints'), cat: 'decor', w: 1, h: 3, layer: 0, tags: 'footprints tracks trail steps mud', draw: (c, r, w, h) => {
    const col = pick(r, ['rgba(60,40,20,0.55)', 'rgba(110,10,15,0.6)', 'rgba(40,30,20,0.4)']);
    for (let i = 0; i < 7; i++) { const y = h * 0.42 - (i * h * 0.84) / 6, s = i % 2 ? 1 : -1; footprint(c, s * w * 0.12 + rrange(r, -2, 2), y, 16, rrange(r, -0.15, 0.15), col); }
  } },
  { id: 'paw_prints', name: t('Paw prints'), cat: 'decor', w: 1, h: 3, layer: 0, tags: 'paw prints tracks animal wolf beast', draw: (c, r, w, h) => {
    c.fillStyle = 'rgba(50,35,20,0.55)';
    for (let i = 0; i < 9; i++) { const y = h * 0.44 - (i * h * 0.88) / 8, x = (i % 2 ? 1 : -1) * w * 0.12 + rrange(r, -3, 3); ell(c, x, y + 3, 5, 4.5); c.fill(); for (let k = 0; k < 4; k++) { circ(c, x - 5.4 + k * 3.6, y - 3 - (k === 1 || k === 2 ? 2 : 0), 1.9); c.fill(); } }
  } },
  { id: 'papers', name: t('Scattered papers'), cat: 'decor', w: 1.2, h: 1.2, layer: 0, tags: 'papers documents letters notes scattered', draw: (c, r, w) => {
    for (let i = 0; i < 7; i++) at(c, rrange(r, -w * 0.3, w * 0.3), rrange(r, -w * 0.3, w * 0.3), r() * TAU, () => {
      shadow(c, true, 2, 1, 1.5, 0.3); rect(c, -11, -14, 22, 28); fs(c, pick(r, [PAPER, PARCH, '#f4f0e6']), 0.8); shadow(c, false);
      for (let k = 0; k < 6; k++) line(c, -7, -9 + k * 4, 7 - (k === 5 ? 6 : 0), -9 + k * 4, 'rgba(50,40,30,0.45)', 0.7);
    });
    if (r() < 0.6) scroll(c, rrange(r, -w * 0.2, w * 0.2), rrange(r, -w * 0.2, w * 0.2), 30, r() * TAU);
  } },
  { id: 'pottery_shards', name: t('Broken pottery'), cat: 'decor', w: 1, h: 1, layer: 0, tags: 'broken pottery shards vase pot debris', draw: (c, r, w) => {
    const col = pick(r, ['#b06a3e', '#8a6a4a', '#c8b898', '#5a6a7a']);
    for (let i = 0; i < 9; i++) shard(c, r, rrange(r, -w * 0.32, w * 0.32), rrange(r, -w * 0.32, w * 0.32), rrange(r, 4, 9), col);
    at(c, rrange(r, -6, 6), rrange(r, -6, 6), r() * TAU, () => { c.beginPath(); c.arc(0, 0, 14, 0.4, 3.6); c.lineTo(0, 0); c.closePath(); fs(c, ball(c, 0, 0, 14, col), 1.4); });
  } },
  { id: 'broken_glass', name: t('Broken glass'), cat: 'decor', w: 0.9, h: 0.9, layer: 0, tags: 'glass shards broken bottle window', draw: (c, r, w) => {
    for (let i = 0; i < 14; i++) at(c, rrange(r, -w * 0.32, w * 0.32), rrange(r, -w * 0.32, w * 0.32), r() * TAU, () => { const s = rrange(r, 3, 8); poly(c, [-s, -s * 0.2, s * 0.4, -s * 0.7, s, s * 0.5]); fs(c, 'rgba(200,230,230,0.55)', 0.8, 'rgba(60,90,90,0.7)'); line(c, -s * 0.5, -s * 0.2, s * 0.3, -s * 0.4, 'rgba(255,255,255,0.8)', 0.8); });
  } },
  { id: 'scattered_straw', name: t('Scattered straw'), cat: 'decor', w: 1.5, h: 1.5, layer: 0, tags: 'straw hay scattered stable barn floor', draw: (c, r, w) => {
    for (let i = 0; i < 180; i++) { const a = r() * TAU, d = Math.sqrt(r()) * w * 0.42, x = Math.cos(a) * d, y = Math.sin(a) * d, b = r() * Math.PI; line(c, x, y, x + Math.cos(b) * rrange(r, 6, 14), y + Math.sin(b) * rrange(r, 6, 14), pick(r, [STRAW, '#a8893c', '#f0d890']), 1.2); }
  } },
  { id: 'ash_pile', name: t('Ash pile'), cat: 'decor', w: 1, h: 1, layer: 0, tags: 'ash cold campfire remains burnt', draw: (c, r, w) => {
    blob(c, r, w * 0.34, 11, 0.25); fs(c, radial(c, 0, 0, w * 0.34, '#6a6662', '#2a2826', 0), 0);
    for (let i = 0; i < 5; i++) at(c, rrange(r, -w * 0.15, w * 0.15), rrange(r, -w * 0.15, w * 0.15), r() * TAU, () => { rrect(c, -14, -3.5, 28, 7, 3); fs(c, lin(c, -14, 0, 14, 0, [[0, '#1a1410'], [0.6, '#3a2a20'], [1, '#121010']]), 1); });
    for (let i = 0; i < 8; i++) rock(c, r, Math.cos(i) * w * 0.36, Math.sin(i) * w * 0.36, 5, '#7a7268');
  } },
  { id: 'broken_furniture', name: t('Broken furniture'), cat: 'decor', w: 1.6, h: 1.4, layer: 1, tags: 'broken furniture smashed debris planks chair table wreckage', draw: (c, r, w, h) => {
    for (const [dx, rot] of [[-w * 0.18, rrange(r, -0.5, -0.1)], [w * 0.12, rrange(r, 0.2, 0.7)]] as const) at(c, dx, -h * 0.08, rot, () => {
      shadow(c, true, 6, 3, 5); plankBox(c, r, -w * 0.15, -h * 0.18, w * 0.3, h * 0.36, 3, WOOD, false, 2); shadow(c, false);
      const ex = dx < 0 ? w * 0.15 : -w * 0.15;
      for (let i = 0; i < 5; i++) poly(c, [ex, -h * 0.18 + i * h * 0.072, ex + (dx < 0 ? 1 : -1) * rrange(r, 4, 10), -h * 0.15 + i * h * 0.072, ex, -h * 0.11 + i * h * 0.072]), fs(c, WOOD_L, 0.8);
    });
    seat(c, w * 0.25, h * 0.2, 24, rrange(r, 1.5, 2.5), WOOD_L);
    for (let i = 0; i < 6; i++) at(c, rrange(r, -w * 0.35, w * 0.35), rrange(r, -h * 0.35, h * 0.35), r() * TAU, () => { shadow(c, true, 3, 2, 3); poly(c, [-12, -3, 12, -2, 14, 0, 12, 3, -12, 3]); fs(c, shade(WOOD, rrange(r, -0.2, 0.15)), 1.2); shadow(c, false); });
  } },
  { id: 'candle_stubs', name: t('Candle stubs'), cat: 'decor', w: 0.8, h: 0.8, layer: 0, light: { radius: 1.5, color: '#ffd38a', intensity: 0.45 }, tags: 'candles wax stubs ritual shrine floor', draw: (c, r, w) => {
    for (let i = 0; i < 6; i++) { const x = rrange(r, -w * 0.3, w * 0.3), y = rrange(r, -w * 0.3, w * 0.3); blob(c, r, rrange(r, 5, 9), 7, 0.3, x + 2, y + 2); c.fillStyle = 'rgba(240,232,214,0.85)'; c.fill(); candle(c, x, y, rrange(r, 2.6, 3.6), '#f2ead6', r() < 0.6); }
  } },
  { id: 'arrows_stuck', name: t('Spent arrows'), cat: 'decor', w: 1.2, h: 1.2, layer: 1, tags: 'arrows stuck battle aftermath ammo', draw: (c, r, w) => {
    for (let i = 0; i < 8; i++) { const x = rrange(r, -w * 0.35, w * 0.35), y = rrange(r, -w * 0.35, w * 0.35), a = rrange(r, -2.4, -0.8); circ(c, x, y, 2); c.fillStyle = 'rgba(20,15,10,0.7)'; c.fill(); line(c, x, y, x + Math.cos(a) * 20, y + Math.sin(a) * 20, '#7a5a34', 1.8); poly(c, [x + Math.cos(a) * 20, y + Math.sin(a) * 20, x + Math.cos(a - 0.3) * 26, y + Math.sin(a - 0.3) * 26, x + Math.cos(a + 0.3) * 26, y + Math.sin(a + 0.3) * 26]); c.fillStyle = pick(r, ['#f0f0f0', '#c03030', '#2a2a2a']); c.fill(); }
  } },
  { id: 'battle_debris', name: t('Battlefield debris'), cat: 'decor', w: 2, h: 2, layer: 0, tags: 'battle aftermath broken weapons shields helmets blood', draw: (c, r, w) => {
    for (let i = 0; i < 4; i++) splat(c, r, rrange(r, -w * 0.3, w * 0.3), rrange(r, -w * 0.3, w * 0.3), rrange(r, 6, 12), 'rgba(110,10,15,0.65)', 6);
    for (let i = 0; i < 3; i++) sword(c, rrange(r, -w * 0.3, w * 0.3), rrange(r, -w * 0.3, w * 0.3), rrange(r, 36, 56), r() * TAU, '#7a6a4a', '#8a8e94');
    for (let i = 0; i < 2; i++) { const x = rrange(r, -w * 0.3, w * 0.3), y = rrange(r, -w * 0.3, w * 0.3); shadow(c, true, 3, 2, 3); circ(c, x, y, 13); fs(c, ball(c, x, y, 13, pick(r, ['#8a1f2a', '#1f3f7a', '#5a4a2a']), 0.2), 1.6); shadow(c, false); circ(c, x, y, 4); fs(c, METAL, 1); line(c, x - 8, y - 5, x + 6, y + 9, 'rgba(0,0,0,0.5)', 1.6); }
    const hx = rrange(r, -w * 0.2, w * 0.2), hy = rrange(r, -w * 0.2, w * 0.2); shadow(c, true, 3, 2, 3); circ(c, hx, hy, 9); fs(c, ball(c, hx, hy, 9, '#8a9098', 0.4), 1.4); shadow(c, false); line(c, hx - 6, hy, hx + 6, hy, '#2a2c30', 1.6);
    for (let i = 0; i < 6; i++) bone(c, rrange(r, -w * 0.35, w * 0.35), rrange(r, -w * 0.35, w * 0.35), rrange(r, 12, 20), r() * TAU);
  } },
  { id: 'trash_pile', name: t('Refuse heap'), cat: 'decor', w: 1.4, h: 1.2, layer: 1, tags: 'trash garbage refuse midden alley junk', draw: (c, r, w, h) => {
    for (let i = 0; i < 18; i++) { const x = rrange(r, -w * 0.35, w * 0.35), y = rrange(r, -h * 0.32, h * 0.32), k = r();
      if (k < 0.3) shard(c, r, x, y, rrange(r, 4, 8), pick(r, ['#b06a3e', '#8a6a4a']));
      else if (k < 0.5) { leafShape(c, x, y, rrange(r, 8, 14), 4, r() * TAU); fs(c, pick(r, ['#6a7a3a', '#8a6a2a', '#5a4a2a']), 0.8); }
      else if (k < 0.7) at(c, x, y, r() * TAU, () => { rect(c, -10, -2.5, 20, 5); fs(c, WOOD_D, 1); });
      else if (k < 0.85) { blob(c, r, rrange(r, 5, 10), 7, 0.3, x, y); fs(c, pick(r, ['#5a4a3a', '#6a5a42', '#3a3a3a']), 1); }
      else bone(c, x, y, 14, r() * TAU); }
    jar(c, rrange(r, -w * 0.2, w * 0.2), rrange(r, -h * 0.2, h * 0.2), 8, '#6a5a42');
  } },
  { id: 'rats', name: t('Rat nest'), cat: 'decor', w: 1, h: 1, layer: 1, tags: 'rats vermin sewer nest pests', draw: (c, r, w) => {
    for (let i = 0; i < 60; i++) { const a = r() * TAU, d = Math.sqrt(r()) * w * 0.3, x = Math.cos(a) * d, y = Math.sin(a) * d, b = r() * TAU; line(c, x, y, x + Math.cos(b) * 8, y + Math.sin(b) * 8, pick(r, ['#8a7040', '#5a4a30', '#a8986a']), 1.2); }
    for (let i = 0; i < 4; i++) at(c, rrange(r, -w * 0.22, w * 0.22), rrange(r, -w * 0.22, w * 0.22), r() * TAU, () => {
      c.beginPath(); c.moveTo(-9, 0); c.quadraticCurveTo(-18, 4, -22, -2); st(c, '#c89a8a', 1.4);
      shadow(c, true, 2, 1, 2, 0.4); ell(c, 0, 0, 10, 5.5); fs(c, ball(c, 0, 0, 10, pick(r, ['#6a5a52', '#4a4440', '#7a6a5a']), 0.3), 1); shadow(c, false);
      ell(c, 9, 0, 4, 3.2); fs(c, '#6a5a52', 0.8); circ(c, 12.5, 0, 1); c.fillStyle = '#e8a0a0'; c.fill();
      for (const s of [-1, 1]) { circ(c, 7, s * 3, 1.8); c.fillStyle = '#c89a8a'; c.fill(); circ(c, 10, s * 1.4, 0.7); c.fillStyle = '#111'; c.fill(); }
    });
  } },
  { id: 'spilled_coins', name: t('Spilled purse'), cat: 'decor', w: 0.8, h: 0.8, layer: 0, tags: 'purse coins spilled pouch loot', draw: (c, r, w) => {
    at(c, -w * 0.12, -w * 0.08, r() * TAU, () => { shadow(c, true, 3, 2, 3); blob(c, r, 10, 8, 0.15); fs(c, ball(c, 0, 0, 10, '#8a5a2a', 0.3), 1.4); shadow(c, false); line(c, -4, -6, 6, -9, '#c8a050', 1.4); });
    for (let i = 0; i < 9; i++) coin(c, rrange(r, -w * 0.05, w * 0.3), rrange(r, -w * 0.05, w * 0.3), 3.5, pick(r, ['#d4af37', '#c8ccd0', '#c87a4a']));
  } },
  { id: 'puddle_muddy', name: t('Muddy puddle'), cat: 'decor', w: 1.4, h: 1, layer: 0, tags: 'puddle mud water rain', draw: (c, r, w, h) => {
    c.save(); c.scale(1, h / w); blob(c, r, w * 0.4, 12, 0.22); c.restore(); fs(c, 'rgba(80,60,35,0.55)', 0);
    c.save(); c.scale(1, h / w); blob(c, r, w * 0.3, 11, 0.2); c.restore(); fs(c, radial(c, 0, 0, w * 0.3, 'rgba(120,140,140,0.6)', 'rgba(60,70,60,0.6)', 0.2), 1, 'rgba(40,30,20,0.5)');
    line(c, -w * 0.12, -h * 0.1, w * 0.05, -h * 0.14, 'rgba(255,255,255,0.35)', 2);
  } },
  { id: 'slime_trail', name: t('Slime trail'), cat: 'decor', w: 1, h: 3, layer: 0, tags: 'slime trail ooze snail track', draw: (c, r, w, h) => {
    c.beginPath(); c.moveTo(0, -h * 0.45); for (let i = 1; i <= 10; i++) c.lineTo(Math.sin(i * 0.9 + r()) * w * 0.15, -h * 0.45 + (i * h * 0.9) / 10);
    st(c, 'rgba(120,200,60,0.35)', 22); st(c, 'rgba(180,255,120,0.4)', 10); st(c, 'rgba(240,255,220,0.5)', 2);
    for (let i = 0; i < 10; i++) { circ(c, rrange(r, -w * 0.25, w * 0.25), rrange(r, -h * 0.45, h * 0.45), rrange(r, 2, 4)); c.fillStyle = 'rgba(160,230,90,0.5)'; c.fill(); }
  } },
  { id: 'skulls', name: t('Skulls'), cat: 'decor', w: 1, h: 1, layer: 0, tags: 'skulls remains dead bones', draw: (c, r, w) => { for (let i = 0; i < 3; i++) skull(c, rrange(r, -w * 0.25, w * 0.25), rrange(r, -w * 0.25, w * 0.25), rrange(r, 16, 22), rrange(r, -0.8, 0.8), pick(r, ['#e8e0c8', '#d8ceb0'])); } },
  { id: 'vines', name: t('Creeping vines'), cat: 'decor', w: 2, h: 2, layer: 0, tags: 'vines ivy creepers overgrown ruins', draw: (c, r, w) => {
    for (let k = 0; k < 4; k++) {
      let x = rrange(r, -w * 0.4, w * 0.4), y = rrange(r, -w * 0.4, w * 0.4), a = r() * TAU;
      c.beginPath(); c.moveTo(x, y); const pts: [number, number][] = [];
      for (let i = 0; i < 14; i++) { a += rrange(r, -0.6, 0.6); x += Math.cos(a) * 10; y += Math.sin(a) * 10; c.lineTo(x, y); pts.push([x, y]); }
      st(c, '#3a4a1e', 2.4);
      for (const [px, py] of pts) for (const s of [-1, 1]) { const b = a + s * 1.2 + r(); leafShape(c, px + Math.cos(b) * 5, py + Math.sin(b) * 5, rrange(r, 8, 12), 3.5, b); fs(c, pick(r, ['#3a6a2a', '#4a7a30', '#2a5420']), 0.6); }
    }
  } },
  { id: 'cracked_tiles', name: t('Loose flagstones'), cat: 'decor', w: 1.5, h: 1.5, layer: 0, tags: 'broken tiles loose stones floor damage rubble', draw: (c, r, w) => {
    for (let i = 0; i < 5; i++) at(c, rrange(r, -w * 0.25, w * 0.25), rrange(r, -w * 0.25, w * 0.25), rrange(r, -0.5, 0.5), () => { const s = rrange(r, 18, 30); rect(c, -s / 2 - 1.5, -s / 2 - 1.5, s + 3, s + 3); c.fillStyle = 'rgba(0,0,0,0.45)'; c.fill(); shadow(c, true, 3, 2, 3, 0.4); rect(c, -s / 2, -s / 2, s, s); fs(c, lin(c, -s / 2, -s / 2, s / 2, s / 2, [[0, '#a39d92'], [1, '#6a655c']]), 1.2); shadow(c, false); line(c, -s * 0.3, -s * 0.2, s * 0.2, s * 0.3, 'rgba(0,0,0,0.35)', 1); });
    for (let i = 0; i < 10; i++) rock(c, r, rrange(r, -w * 0.4, w * 0.4), rrange(r, -w * 0.4, w * 0.4), rrange(r, 2, 4), STONE);
  } },
];
void plankBox; void METAL_L; void WOOD_L; void INK; void rod;
