import { assets } from './assets';
import { WALL_TEX } from './engine';
import { CELL, CONDITIONS, Door, Label, Light, Marker, Stamp, Token, TOKEN_CELLS, TOKEN_KIND_COLORS } from './model';
import type { MapRuntime } from './runtime';
import { STAMP_BY_ID, STAMP_PAD, stampImage } from './stamps';
import { getTexture } from './textures';
import { ctx2d, makeCanvas, pattern, rgba } from './util';
import { t } from './i18n';

export interface View { z: number; x: number; y: number }
export interface RenderOpts {
  player: boolean;
  fogAlpha: number;      // 0 = hidden
  markers: boolean;
  grid: boolean;
  tokens: boolean;
  ambientScale: number;  // 1 for players, lower for DM
  time: number;
  background: string | null;
  turn?: string | null;
  hoverToken?: string | null;
}

type C2D = CanvasRenderingContext2D;
const COND_ICON = new Map(CONDITIONS.map((c) => [c.id, c.icon]));
let lightCanvas: HTMLCanvasElement | null = null;

export function visibleRect(view: View, vw: number, vh: number) {
  return { x: -view.x / view.z, y: -view.y / view.z, w: vw / view.z, h: vh / view.z };
}

export function stampSize(s: Stamp): { w: number; h: number; pad: number; img: CanvasImageSource | null } {
  if (s.type.startsWith('asset:')) {
    const id = s.type.slice(6);
    const rec = assets.recs.get(id);
    const img = assets.imgs.get(id) || null;
    if (!rec) return { w: CELL, h: CELL, pad: 0, img: null };
    const w = rec.cells * CELL;
    return { w, h: (w * rec.h) / rec.w, pad: 0, img };
  }
  const def = STAMP_BY_ID.get(s.type);
  if (!def) return { w: CELL, h: CELL, pad: 0, img: null };
  return { w: def.w * CELL, h: def.h * CELL, pad: STAMP_PAD, img: stampImage(s.type, s.variant) };
}
export function stampLayer(s: Stamp) {
  if (s.type.startsWith('asset:')) return 1;
  return STAMP_BY_ID.get(s.type)?.layer ?? 1;
}

/** All active light sources: explicit lights + light-emitting stamps. */
export function allLights(rt: MapRuntime, player: boolean): Light[] {
  const out: Light[] = [...rt.doc.lights];
  for (const s of rt.doc.stamps) {
    if (s.hidden && player) continue;
    const def = STAMP_BY_ID.get(s.type);
    if (def?.light) out.push({ id: s.id, x: s.x, y: s.y, radius: def.light.radius * Math.sqrt(s.scale), color: def.light.color, intensity: def.light.intensity, flicker: true, stampId: s.id });
  }
  return out;
}

export function renderScene(ctx: C2D, rt: MapRuntime, view: View, vw: number, vh: number, dpr: number, o: RenderOpts) {
  const doc = rt.doc, W = rt.W, H = rt.H, z = view.z;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  if (o.background) { ctx.fillStyle = o.background; ctx.fillRect(0, 0, vw, vh); }
  else ctx.clearRect(0, 0, vw, vh);
  ctx.setTransform(dpr * z, 0, 0, dpr * z, dpr * view.x, dpr * view.y);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  if (o.background) {
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 40 * dpr; ctx.shadowOffsetY = 8 * dpr;
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
  ctx.drawImage(rt.engine.cache, 0, 0);
  ctx.save();
  ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.clip();
  const vis = visibleRect(view, vw, vh);

  const stamps = doc.stamps;
  drawStamps(ctx, stamps, 0, vis, o);
  drawWalls(ctx, rt);
  for (const d of doc.doors) drawDoor(ctx, d, o.player);
  drawStamps(ctx, stamps, 1, vis, o);
  drawStamps(ctx, stamps, 2, vis, o);
  drawLighting(ctx, rt, view, vw, vh, dpr, o);
  if (o.grid && doc.grid.show && (!o.player || doc.grid.showPlayers)) drawGrid(ctx, rt, vis, z);
  for (const l of doc.labels) if (!(l.hidden && o.player)) drawLabel(ctx, l, !o.player && !!l.hidden);
  if (o.tokens) for (const t of doc.tokens) if (!(o.player && t.kind === 'pc')) drawToken(ctx, t, z, o);
  if (o.fogAlpha > 0 && doc.fogEnabled) {
    ctx.globalAlpha = o.fogAlpha;
    ctx.drawImage(rt.fog.img, 0, 0, W, H);
    ctx.globalAlpha = 1;
  }
  if (o.tokens && o.player) for (const t of doc.tokens) if (t.kind === 'pc') drawToken(ctx, t, z, o);
  if (o.markers) for (const m of doc.markers) if (!(o.player && !m.visible)) drawMarker(ctx, m, z, !o.player && !m.visible);
  ctx.restore();
}

function drawStamps(ctx: C2D, stamps: Stamp[], layer: number, vis: { x: number; y: number; w: number; h: number }, o: RenderOpts) {
  for (const s of stamps) {
    if (stampLayer(s) !== layer) continue;
    if (s.hidden && o.player) continue;
    const { w, h, pad, img } = stampSize(s);
    const rad = (Math.max(w, h) / 2 + pad) * s.scale * 1.5;
    if (s.x + rad < vis.x || s.x - rad > vis.x + vis.w || s.y + rad < vis.y || s.y - rad > vis.y + vis.h) continue;
    if (!img) continue;
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(s.rot);
    ctx.scale(s.scale * (s.flip ? -1 : 1), s.scale);
    if (s.hidden) ctx.globalAlpha = 0.5;
    ctx.drawImage(img, -w / 2 - pad, -h / 2 - pad, w + pad * 2, h + pad * 2);
    ctx.restore();
  }
}

export function drawWalls(ctx: C2D, rt: MapRuntime) {
  if (!rt.doc.walls.length) return;
  ctx.save();
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  for (const w of rt.doc.walls) {
    if (w.pts.length < 4) continue;
    const path = () => { ctx.beginPath(); for (let i = 0; i < w.pts.length; i += 2) ctx.lineTo(w.pts[i], w.pts[i + 1]); };
    path();
    ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = 10; ctx.shadowOffsetY = 4;
    ctx.strokeStyle = '#120d0a'; ctx.lineWidth = 22; ctx.stroke();
    ctx.shadowColor = 'transparent';
    const p = pattern(ctx, getTexture(WALL_TEX[w.style]));
    p.setTransform(new DOMMatrix());
    path(); ctx.strokeStyle = p; ctx.lineWidth = 16; ctx.stroke();
  }
  ctx.restore();
}

export function drawDoor(ctx: C2D, d: Door, player: boolean) {
  if (d.kind === 'secret' && player && !d.open) return;
  const L = d.width * CELL, T = 24;
  ctx.save();
  ctx.translate(d.x, d.y); ctx.rotate(d.rot);
  ctx.lineJoin = 'round';
  // threshold over wall
  ctx.fillStyle = '#4a4239';
  ctx.fillRect(-L / 2 + 6, -T / 2, L - 12, T);
  ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 1.5;
  ctx.strokeRect(-L / 2 + 6, -T / 2, L - 12, T);
  // posts
  ctx.fillStyle = '#2a2420';
  for (const s of [-1, 1]) { ctx.fillRect(s * (L / 2) - 8, -T / 2 - 2, 16, T + 4); }
  const leaf = (x0: number, len: number, dir: number) => {
    ctx.save();
    ctx.translate(x0, 0);
    if (d.open) ctx.rotate(dir * -1.25);
    ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 6; ctx.shadowOffsetY = 3;
    if (d.kind === 'iron') {
      ctx.fillStyle = '#5b6168';
      ctx.fillRect(dir > 0 ? 0 : -len, -4, len, 8);
      ctx.shadowColor = 'transparent';
      ctx.strokeStyle = '#2a2e33'; ctx.lineWidth = 1.5; ctx.strokeRect(dir > 0 ? 0 : -len, -4, len, 8);
      for (let i = 1; i < 6; i++) { const x = (dir > 0 ? 0 : -len) + (len * i) / 6; ctx.fillStyle = '#2a2e33'; ctx.fillRect(x - 1.5, -7, 3, 14); }
    } else {
      ctx.fillStyle = d.kind === 'secret' ? '#6b645a' : '#8a5a33';
      ctx.fillRect(dir > 0 ? 0 : -len, -6, len, 12);
      ctx.shadowColor = 'transparent';
      ctx.strokeStyle = '#1c1510'; ctx.lineWidth = 2; ctx.strokeRect(dir > 0 ? 0 : -len, -6, len, 12);
      ctx.strokeStyle = 'rgba(30,15,5,0.5)'; ctx.lineWidth = 1;
      for (let i = 1; i < 4; i++) { const x = (dir > 0 ? 0 : -len) + (len * i) / 4; ctx.beginPath(); ctx.moveTo(x, -6); ctx.lineTo(x, 6); ctx.stroke(); }
    }
    ctx.restore();
  };
  if (d.kind === 'arch') {
    ctx.fillStyle = '#6b645a';
    ctx.fillRect(-L / 2 + 8, -T / 2 + 3, L - 16, T - 6);
  } else if (d.kind === 'double') {
    leaf(-L / 2 + 8, L / 2 - 8, 1);
    leaf(L / 2 - 8, L / 2 - 8, -1);
  } else {
    leaf(-L / 2 + 8, L - 16, 1);
  }
  if (d.kind === 'secret' && !player) {
    ctx.fillStyle = '#ffe28a'; ctx.font = 'bold 22px Cinzel, serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.strokeStyle = '#000'; ctx.lineWidth = 3; ctx.strokeText('S', 0, 0); ctx.fillText('S', 0, 0);
  }
  ctx.restore();
}

function drawGrid(ctx: C2D, rt: MapRuntime, vis: { x: number; y: number; w: number; h: number }, z: number) {
  const g = rt.doc.grid;
  const x0 = Math.max(0, Math.floor(vis.x / CELL)), x1 = Math.min(rt.doc.cols, Math.ceil((vis.x + vis.w) / CELL));
  const y0 = Math.max(0, Math.floor(vis.y / CELL)), y1 = Math.min(rt.doc.rows, Math.ceil((vis.y + vis.h) / CELL));
  ctx.save();
  ctx.strokeStyle = rgba(g.color, g.opacity);
  ctx.lineWidth = Math.max(1 / z, 1.5);
  ctx.beginPath();
  for (let x = x0; x <= x1; x++) { ctx.moveTo(x * CELL, y0 * CELL); ctx.lineTo(x * CELL, y1 * CELL); }
  for (let y = y0; y <= y1; y++) { ctx.moveTo(x0 * CELL, y * CELL); ctx.lineTo(x1 * CELL, y * CELL); }
  ctx.stroke();
  ctx.restore();
}

function drawLighting(ctx: C2D, rt: MapRuntime, view: View, vw: number, vh: number, dpr: number, o: RenderOpts) {
  const amb = rt.doc.ambient * o.ambientScale;
  const lights = allLights(rt, o.player);
  if (amb <= 0.01 && !lights.length) return;
  const z = view.z;
  const flick = (l: Light) => l.flicker ? 1 + 0.035 * Math.sin(o.time * 0.009 + l.x * 0.13) + 0.02 * Math.sin(o.time * 0.023 + l.y) : 1;
  if (amb > 0.01) {
    const cw = Math.ceil(vw * dpr), ch = Math.ceil(vh * dpr);
    if (!lightCanvas) lightCanvas = makeCanvas(cw, ch);
    if (lightCanvas.width !== cw || lightCanvas.height !== ch) { lightCanvas.width = cw; lightCanvas.height = ch; }
    const lc = ctx2d(lightCanvas);
    lc.setTransform(1, 0, 0, 1, 0, 0);
    lc.clearRect(0, 0, cw, ch);
    lc.setTransform(dpr * z, 0, 0, dpr * z, dpr * view.x, dpr * view.y);
    lc.fillStyle = `rgba(6,8,20,${amb})`;
    lc.fillRect(0, 0, rt.W, rt.H);
    lc.globalCompositeOperation = 'destination-out';
    for (const l of lights) {
      const R = l.radius * CELL * flick(l);
      const g = lc.createRadialGradient(l.x, l.y, 0, l.x, l.y, R);
      g.addColorStop(0, `rgba(0,0,0,${l.intensity})`);
      g.addColorStop(0.55, `rgba(0,0,0,${l.intensity * 0.75})`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      lc.fillStyle = g;
      lc.beginPath(); lc.arc(l.x, l.y, R, 0, Math.PI * 2); lc.fill();
    }
    lc.globalCompositeOperation = 'source-over';
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(lightCanvas, 0, 0);
    ctx.restore();
  }
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  for (const l of lights) {
    const R = l.radius * CELL * 0.8 * flick(l);
    const g = ctx.createRadialGradient(l.x, l.y, 0, l.x, l.y, R);
    g.addColorStop(0, rgba(l.color, 0.32 * l.intensity * (0.4 + amb)));
    g.addColorStop(1, rgba(l.color, 0));
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(l.x, l.y, R, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

export function labelFont(l: Label) {
  return `${l.italic ? 'italic ' : ''}${l.bold ? '700 ' : ''}${l.size}px "${l.font}", serif`;
}
export function drawLabel(ctx: C2D, l: Label, dim = false) {
  ctx.save();
  ctx.translate(l.x, l.y); ctx.rotate(l.rot);
  ctx.font = labelFont(l);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  if (dim) ctx.globalAlpha = 0.85;
  const lines = l.text.split('\n');
  const lh = l.size * 1.15;
  lines.forEach((t, i) => {
    const y = (i - (lines.length - 1) / 2) * lh;
    ctx.lineJoin = 'round';
    ctx.strokeStyle = l.stroke; ctx.lineWidth = Math.max(2, l.size * 0.18);
    ctx.strokeText(t, 0, y);
    ctx.fillStyle = l.color;
    ctx.fillText(t, 0, y);
  });
  ctx.restore();
}

export function markerGeom(m: Marker, z: number) {
  const s = 30 / z;
  return { s, cx: m.x, cy: m.y - s * 0.62, r: s * 0.42 };
}
export function drawMarker(ctx: C2D, m: Marker, z: number, hidden: boolean) {
  const { s, cx, cy, r } = markerGeom(m, z);
  ctx.save();
  if (hidden) ctx.globalAlpha = 0.6;
  ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 6; ctx.shadowOffsetY = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, r, Math.PI * 0.82, Math.PI * 0.18);
  ctx.lineTo(m.x, m.y);
  ctx.closePath();
  ctx.fillStyle = m.color; ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.lineWidth = 2 / z; ctx.strokeStyle = '#fff';
  if (hidden) ctx.setLineDash([4 / z, 3 / z]);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.font = `${r * 1.15}px system-ui, "Apple Color Emoji", "Segoe UI Emoji", sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(m.icon, cx, cy + r * 0.05);
  if (m.title && z > 0.25) {
    ctx.font = `600 ${12 / z}px system-ui, sans-serif`;
    ctx.lineWidth = 3 / z; ctx.strokeStyle = 'rgba(0,0,0,0.75)'; ctx.fillStyle = '#fff';
    ctx.strokeText(m.title, cx, m.y + 9 / z);
    ctx.fillText(m.title, cx, m.y + 9 / z);
  }
  ctx.restore();
  void s;
}

export function tokenRadius(t: Token) { return (TOKEN_CELLS[t.size] * CELL) / 2 * 0.9; }

export function drawToken(ctx: C2D, t: Token, z: number, o: RenderOpts) {
  if (o.player && t.hidden) return;
  const R = tokenRadius(t);
  const dead = t.maxHp > 0 && t.hp <= 0;
  ctx.save();
  ctx.translate(t.x, t.y);
  if (t.hidden) ctx.globalAlpha = 0.55;
  if (o.turn === t.id) {
    const pulse = 1 + 0.06 * Math.sin(o.time * 0.006);
    const g = ctx.createRadialGradient(0, 0, R * 0.9, 0, 0, R * 1.45 * pulse);
    g.addColorStop(0, 'rgba(255,210,80,0.9)'); g.addColorStop(1, 'rgba(255,210,80,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, R * 1.45 * pulse, 0, Math.PI * 2); ctx.fill();
  }
  ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 10; ctx.shadowOffsetY = 4;
  ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2);
  ctx.fillStyle = t.color; ctx.fill();
  ctx.shadowColor = 'transparent';
  const img = t.image ? assets.imgs.get(t.image) : undefined;
  ctx.save();
  ctx.beginPath(); ctx.arc(0, 0, R * 0.88, 0, Math.PI * 2); ctx.clip();
  if (img) {
    const k = Math.max((R * 2) / img.width, (R * 2) / img.height);
    ctx.drawImage(img, (-img.width * k) / 2, (-img.height * k) / 2, img.width * k, img.height * k);
  } else {
    const g = ctx.createRadialGradient(-R * 0.3, -R * 0.4, R * 0.1, 0, 0, R);
    g.addColorStop(0, 'rgba(255,255,255,0.35)'); g.addColorStop(1, 'rgba(0,0,0,0.25)');
    ctx.fillStyle = g; ctx.fillRect(-R, -R, R * 2, R * 2);
    const initials = t.name.split(/\s+/).filter(Boolean).map((w) => w[0]).join('').slice(0, 2).toUpperCase() || '?';
    ctx.fillStyle = '#fff'; ctx.font = `700 ${R * (initials.length > 1 ? 0.72 : 0.95)}px Cinzel, serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = R * 0.08; ctx.strokeText(initials, 0, R * 0.05);
    ctx.fillText(initials, 0, R * 0.05);
  }
  if (dead) { ctx.fillStyle = 'rgba(20,0,0,0.55)'; ctx.fillRect(-R, -R, R * 2, R * 2); }
  ctx.restore();
  ctx.lineWidth = R * 0.13; ctx.strokeStyle = TOKEN_KIND_COLORS[t.kind];
  ctx.beginPath(); ctx.arc(0, 0, R * 0.93, 0, Math.PI * 2); ctx.stroke();
  ctx.lineWidth = Math.max(1.5, R * 0.03); ctx.strokeStyle = 'rgba(0,0,0,0.8)';
  ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.stroke();
  if (dead) {
    ctx.strokeStyle = '#d33'; ctx.lineWidth = R * 0.14; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-R * 0.45, -R * 0.45); ctx.lineTo(R * 0.45, R * 0.45); ctx.moveTo(R * 0.45, -R * 0.45); ctx.lineTo(-R * 0.45, R * 0.45); ctx.stroke();
  }
  // HP bar
  // Health is DM-only: players never see HP bars, only conditions.
  const showHp = t.maxHp > 0 && !o.player;
  if (showHp) {
    const bw = R * 1.5, bh = Math.max(7, R * 0.16), by = R + 4;
    const f = Math.max(0, Math.min(1, t.hp / t.maxHp));
    ctx.fillStyle = 'rgba(0,0,0,0.75)'; ctx.fillRect(-bw / 2 - 2, by - 2, bw + 4, bh + 4);
    ctx.fillStyle = f > 0.5 ? '#3fbf5a' : f > 0.25 ? '#e0b030' : '#e04040';
    ctx.fillRect(-bw / 2, by, bw * f, bh);
  }
  // conditions
  const conds = t.conditions.slice(0, 6);
  conds.forEach((c, i) => {
    const a = -Math.PI / 4 + i * 0.55;
    const cr = Math.max(9, R * 0.24);
    const x = Math.cos(a) * R, y = Math.sin(a) * R - (i > 2 ? 0 : 0);
    ctx.fillStyle = 'rgba(15,15,20,0.85)'; ctx.beginPath(); ctx.arc(x, y, cr, 0, Math.PI * 2); ctx.fill();
    ctx.font = `${cr * 1.2}px system-ui, "Apple Color Emoji", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(COND_ICON.get(c) || '•', x, y + cr * 0.05);
  });
  // name
  if (z * R > 18 || o.hoverToken === t.id) {
    const fs = Math.max(12 / z, R * 0.3);
    ctx.font = `600 ${fs}px system-ui, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    const y = R + (showHp ? Math.max(7, R * 0.16) + 8 : 4);
    ctx.lineWidth = fs * 0.25; ctx.strokeStyle = 'rgba(0,0,0,0.8)'; ctx.strokeText(t.name, 0, y);
    ctx.fillStyle = '#fff'; ctx.fillText(t.name, 0, y);
  }
  ctx.restore();
}

export function drawPing(ctx: C2D, x: number, y: number, age: number, z: number) {
  const k = age / 1600;
  if (k >= 1) return;
  ctx.save();
  for (let i = 0; i < 3; i++) {
    const kk = (k + i * 0.18) % 1;
    ctx.globalAlpha = (1 - kk) * (1 - k * 0.5);
    ctx.strokeStyle = '#ffd34d'; ctx.lineWidth = 4 / z;
    ctx.beginPath(); ctx.arc(x, y, (10 + kk * 70) / z, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.globalAlpha = 1 - k;
  ctx.fillStyle = '#ffd34d';
  ctx.beginPath(); ctx.arc(x, y, 6 / z, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

export function drawMeasure(ctx: C2D, a: [number, number], b: [number, number], z: number, feetPerCell: number) {
  const dx = Math.abs(b[0] - a[0]) / CELL, dy = Math.abs(b[1] - a[1]) / CELL;
  // D&D 5e grid distance: every diagonal counts as 1 square
  const squares = Math.round(Math.max(dx, dy));
  const feet = squares * feetPerCell;
  ctx.save();
  ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.lineWidth = 6 / z; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
  ctx.strokeStyle = '#ffd34d'; ctx.lineWidth = 3 / z; ctx.setLineDash([10 / z, 6 / z]);
  ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
  ctx.setLineDash([]);
  for (const p of [a, b]) { ctx.fillStyle = '#ffd34d'; ctx.beginPath(); ctx.arc(p[0], p[1], 5 / z, 0, Math.PI * 2); ctx.fill(); }
  const txt = t(squares === 1 ? '{ft} ft · {n} square' : '{ft} ft · {n} squares', { ft: feet, n: squares });
  ctx.font = `700 ${15 / z}px system-ui, sans-serif`;
  const tw = ctx.measureText(txt).width;
  const mx = b[0] + 14 / z, my = b[1] - 14 / z;
  ctx.fillStyle = 'rgba(15,15,20,0.88)';
  ctx.beginPath(); ctx.roundRect(mx - 6 / z, my - 13 / z, tw + 12 / z, 26 / z, 6 / z); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.textBaseline = 'middle'; ctx.fillText(txt, mx, my);
  ctx.restore();
}
