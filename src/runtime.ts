import { Engine } from './engine';
import { Fog } from './fog';
import { CELL, MapDoc, migrateDoc } from './model';
import type { StoredMap } from './storage';
import { canvasToBlob, ctx2d } from './util';

export class MapRuntime {
  doc: MapDoc;
  engine: Engine;
  fog: Fog;
  private savedMasks: Record<string, Blob> = {};
  private savedFog?: Blob;

  constructor(doc: MapDoc, fogFull = true) {
    this.doc = doc;
    this.engine = new Engine(doc);
    this.fog = new Fog(this.W, this.H);
    if (fogFull) { this.fog.fillAll(); this.fog.pending = null; this.fog.changed = true; }
    this.engine.invalidateAll();
  }
  get W() { return this.doc.cols * CELL; }
  get H() { return this.doc.rows * CELL; }

  static async load(rec: StoredMap): Promise<MapRuntime> {
    const doc = migrateDoc(rec.doc);
    const rt = new MapRuntime(doc, !rec.fog);
    for (const [k, b] of Object.entries(rec.masks || {})) {
      try { const bmp = await createImageBitmap(b); rt.engine.setMask(k, bmp); bmp.close(); } catch { /* skip */ }
    }
    if (rec.fog) {
      try { const bmp = await createImageBitmap(rec.fog); rt.fog.load(bmp); bmp.close(); } catch { rt.fog.fillAll(); }
    }
    rt.savedMasks = { ...(rec.masks || {}) };
    rt.savedFog = rec.fog;
    rt.engine.changed.clear();
    rt.fog.changed = false;
    rt.fog.pending = null;
    rt.engine.invalidateAll();
    return rt;
  }

  async toStored(thumb?: Blob): Promise<StoredMap> {
    const masks: Record<string, Blob> = {};
    for (const [k, c] of this.engine.masks) {
      masks[k] = this.engine.changed.has(k) || !this.savedMasks[k] ? await canvasToBlob(c) : this.savedMasks[k];
    }
    this.engine.changed.clear();
    this.savedMasks = masks;
    if (this.fog.changed || !this.savedFog) { this.savedFog = await canvasToBlob(this.fog.mask); this.fog.changed = false; }
    this.doc.updatedAt = Date.now();
    return { id: this.doc.id, name: this.doc.name, updatedAt: this.doc.updatedAt, doc: JSON.parse(JSON.stringify(this.doc)), masks, fog: this.savedFog, thumb };
  }

  /** Change map size (cells); content keeps its position relative to the top-left corner shifted by (dx,dy) cells. */
  resize(cols: number, rows: number, dx = 0, dy = 0) {
    const old = this.engine, oldFog = this.fog;
    const ox = dx * CELL, oy = dy * CELL;
    this.doc.cols = cols; this.doc.rows = rows;
    const shift = (o: { x: number; y: number }) => { o.x += ox; o.y += oy; };
    for (const r of this.doc.rooms) r.pts = r.pts.map((v, i) => v + (i % 2 ? oy : ox));
    for (const w of this.doc.walls) w.pts = w.pts.map((v, i) => v + (i % 2 ? oy : ox));
    [...this.doc.doors, ...this.doc.stamps, ...this.doc.lights, ...this.doc.labels, ...this.doc.markers, ...this.doc.tokens].forEach(shift);
    this.engine = new Engine(this.doc);
    for (const [k, m] of old.masks) {
      const n = this.engine.mask(k, true)!;
      ctx2d(n).drawImage(m, ox * 0.5, oy * 0.5);
      this.engine.changed.add(k);
    }
    this.fog = new Fog(this.W, this.H);
    this.fog.fillAll();
    ctx2d(this.fog.mask).clearRect(ox * 0.5, oy * 0.5, oldFog.mw, oldFog.mh);
    ctx2d(this.fog.mask).drawImage(oldFog.mask, ox * 0.5, oy * 0.5);
    this.fog.refresh();
    this.fog.changed = true;
    this.engine.invalidateAll();
  }
}
