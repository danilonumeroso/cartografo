import { CELL, Door, DoorKind, Label, MapDoc, Room, Stamp } from './model';
import type { MapRuntime } from './runtime';
import { STAMP_BY_ID, STAMP_PAD, VARIANTS } from './stamps';
import { mulberry32, pick, Rng, uid } from './util';
import { lang } from './i18n';

/** Small builder used by the generators: places objects in grid units and keeps props inside the map. */
export class B {
  doc: MapDoc; r: Rng; rt: MapRuntime;
  constructor(rt: MapRuntime, seed: number) { this.rt = rt; this.doc = rt.doc; this.r = mulberry32(seed); }
  stamp(type: string, cx: number, cy: number, rot = 0, scale = 1): Stamp {
    const def = STAMP_BY_ID.get(type);
    if (def) {
      const r = (Math.hypot(def.w, def.h) / 2) * scale + (STAMP_PAD + 6) / CELL;
      const fit = (v: number, max: number) => (max > 2 * r ? Math.min(max - r, Math.max(r, v)) : max / 2);
      cx = fit(cx, this.doc.cols); cy = fit(cy, this.doc.rows);
    }
    const s: Stamp = { id: uid(), type, x: cx * CELL, y: cy * CELL, rot, scale, variant: Math.floor(this.r() * VARIANTS), flip: this.r() < 0.5 && !!STAMP_BY_ID.get(type) };
    this.doc.stamps.push(s);
    return s;
  }
  room(x: number, y: number, w: number, h: number, floor: string, name?: string): Room {
    const rm: Room = { id: uid(), pts: [x * CELL, y * CELL, (x + w) * CELL, y * CELL, (x + w) * CELL, (y + h) * CELL, x * CELL, (y + h) * CELL], floor, name };
    this.doc.rooms.push(rm);
    return rm;
  }
  door(x: number, y: number, vertical: boolean, kind: DoorKind = 'wood', width = 1): Door {
    const d: Door = { id: uid(), x: x * CELL, y: y * CELL, rot: vertical ? Math.PI / 2 : 0, kind, open: false, width };
    this.doc.doors.push(d);
    return d;
  }
  label(text: string, cx: number, cy: number, size = 46, hidden = true): Label {
    cx = Math.min(this.doc.cols - 0.5, Math.max(0.5, cx)); cy = Math.min(this.doc.rows - 0.5, Math.max(0.5, cy));
    const l: Label = { id: uid(), x: cx * CELL, y: cy * CELL, text, font: 'Cinzel', size, color: '#f3e6c4', stroke: '#1a120c', rot: 0, bold: true, hidden };
    this.doc.labels.push(l);
    return l;
  }
  paint(key: string, cx: number, cy: number, rCells: number, hard = 0.3, strength = 1) {
    this.rt.engine.dab(key, cx * CELL, cy * CELL, rCells * CELL, hard, strength, false);
  }
  stroke(key: string, pts: [number, number][], rCells: number, hard = 0.35) {
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
      const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / (rCells * 0.3)));
      for (let k = 0; k <= n; k++) this.paint(key, x0 + ((x1 - x0) * k) / n, y0 + ((y1 - y0) * k) / n, rCells, hard, 0.6);
    }
  }
}

/** Remove everything a generator produces, including tokens and combat state. */
export function reset(doc: MapDoc) {
  doc.rooms = []; doc.walls = []; doc.doors = []; doc.stamps = []; doc.lights = []; doc.labels = []; doc.markers = [];
  doc.tokens = [];
  doc.combat = { active: false, round: 1, turn: null, members: [] };
}

// ---------------------------------------------------------------- label layout
export interface Box { x0: number; y0: number; x1: number; y1: number }
let measureCtx: CanvasRenderingContext2D | null = null;

/** World-space box of a label (same font and line height as drawLabel; rotation ignored). */
export function labelBox(l: Label): Box {
  const lines = l.text.split('\n');
  measureCtx ??= typeof document === 'undefined' ? null : document.createElement('canvas').getContext('2d');
  let w = 0;
  for (const s of lines) {
    if (measureCtx) {
      measureCtx.font = `${l.italic ? 'italic ' : ''}${l.bold ? '700 ' : ''}${l.size}px "${l.font}", serif`;
      w = Math.max(w, measureCtx.measureText(s).width);
    } else w = Math.max(w, s.length * l.size * 0.6);
  }
  const hw = w / 2 + l.size * 0.12, hh = (lines.length * l.size * 1.15) / 2;
  return { x0: l.x - hw, y0: l.y - hh, x1: l.x + hw, y1: l.y + hh };
}
const overlap = (a: Box, b: Box) => Math.max(0, Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0)) * Math.max(0, Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0));

/**
 * Nudge generated labels apart. Labels are laid out in the given order (most important first); each tries
 * its candidate offsets (in cells) and keeps the first free spot, or else the least crowded one. Placed
 * labels and the `blocked` boxes (icons that must stay readable) count as taken. Labels stay inside the map.
 */
export function declutter(doc: MapDoc, items: { l: Label; moves: [number, number][] }[], blocked: Box[] = []) {
  const taken = [...blocked];
  const W = doc.cols * CELL, H = doc.rows * CELL;
  for (const { l, moves } of items) {
    const x = l.x, y = l.y;
    let best: [number, number] = [x, y], bestCost = Infinity;
    for (const [dx, dy] of moves) {
      l.x = x + dx * CELL; l.y = y + dy * CELL;
      const b = labelBox(l);
      if (b.x0 < 0 || b.y0 < 0 || b.x1 > W || b.y1 > H) continue;
      const cost = taken.reduce((s, t) => s + overlap(b, t), 0);
      if (cost < bestCost) { bestCost = cost; best = [l.x, l.y]; }
      if (cost === 0) break;
    }
    [l.x, l.y] = best;
    taken.push(labelBox(l));
  }
}

/** Candidate offsets (cells) around a spot, nearest first; sideways moves count half as far as vertical ones. */
export function nearby(maxDy: number, maxDx: number, step = 0.5): [number, number][] {
  const out: [number, number][] = [];
  for (let dy = 0; dy <= maxDy + 1e-6; dy += step) for (let dx = 0; dx <= maxDx + 1e-6; dx += step * 2)
    for (const sy of dy ? [-1, 1] : [1]) for (const sx of dx ? [-1, 1] : [1]) out.push([sx * dx, sy * dy]);
  return out.sort((a, b) => Math.hypot(a[0] * 0.5, a[1]) - Math.hypot(b[0] * 0.5, b[1]));
}

// ---------------------------------------------------------------- names
const TAVERN_A = ['Golden', 'Rusty', 'Drunken', 'Sleeping', 'Silver', 'Laughing', 'Crooked', 'Blind', 'Wandering', 'Red', 'Black', 'Merry', 'Salty', 'Howling'];
const TAVERN_B = ['Griffin', 'Barrel', 'Goose', 'Dragon', 'Lantern', 'Anchor', 'Stag', 'Mermaid', 'Boar', 'Kettle', 'Crown', 'Owl', 'Wyvern', 'Tankard'];
// Italian names need gender agreement, so they are written out whole
const TAVERN_IT = ['Il Grifone d’Oro', 'La Botte Arrugginita', 'L’Oca Ubriaca', 'Il Drago Dormiente', 'La Lanterna d’Argento', 'Il Cervo Ridente', 'La Sirena Storta',
  'Il Cinghiale Nero', 'La Corona Rossa', 'Il Gufo Cieco', 'La Viverna Allegra', 'Il Boccale Salato', 'Il Lupo che Ulula', 'L’Ancora Errante', 'Il Paiolo Allegro',
  'La Volpe Zoppa', 'Il Corvo d’Argento', 'La Taverna del Pozzo', 'Il Barile Dorato', 'La Rosa Spinosa'];
/** A random inn name in the UI language. */
export const tavernName = (r: Rng) => (lang === 'it' ? pick(r, TAVERN_IT) : `The ${pick(r, TAVERN_A)} ${pick(r, TAVERN_B)}`);
