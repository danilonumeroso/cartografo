import { CELL, Door, DoorKind, Label, MapDoc, Room, Stamp } from './model';
import type { MapRuntime } from './runtime';
import { STAMP_BY_ID, STAMP_PAD, VARIANTS } from './stamps';
import { mulberry32, Rng, uid } from './util';

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
