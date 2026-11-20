import { CELL, MapDoc, MASK_SCALE, WallStyle } from './model';
import { EDGE_N, getEdgeNoise } from './noise';
import { ABOVE, BELOW, getTexture, getTextureData, TS } from './textures';
import { clamp, clipRect, ctx2d, expandRect, fillPattern, fit, makeCanvas, ptsBBox, Rect, rectsIntersect, smoothstep, unionRect } from './util';

export const MARGIN = 48;
const BLUR = 26;          // canvas shadowBlur (sigma ≈ 13 px)
const WALL_T = 0.13;      // blur threshold where walls end (≈ 16 px thick)
const TILE = 1024;

export const WALL_TEX: Record<WallStyle, string> = { stone: 'wall_stone', brick: 'wall_brick', wood: 'wall_wood', cave: 'wall_cave' };

export class Engine {
  doc: MapDoc;
  masks = new Map<string, HTMLCanvasElement>();
  cache: HTMLCanvasElement;
  dirty: Rect | null = null;
  changed = new Set<string>();
  private cCave = makeCanvas(1, 1);
  private cRoom = makeCanvas(1, 1);
  private cBlurA = makeCanvas(1, 1);
  private cBlurB = makeCanvas(1, 1);
  private cR = makeCanvas(1, 1);
  private cTmp = makeCanvas(1, 1);
  private cEff = makeCanvas(1, 1);
  private cFx = makeCanvas(1, 1);

  constructor(doc: MapDoc) {
    this.doc = doc;
    this.cache = makeCanvas(this.W, this.H);
  }
  get W() { return this.doc.cols * CELL; }
  get H() { return this.doc.rows * CELL; }
  get mw() { return Math.ceil(this.W * MASK_SCALE); }
  get mh() { return Math.ceil(this.H * MASK_SCALE); }

  mask(key: string, create = false): HTMLCanvasElement | undefined {
    let m = this.masks.get(key);
    if (!m && create) { m = makeCanvas(this.mw, this.mh); this.masks.set(key, m); }
    return m;
  }
  setMask(key: string, img: CanvasImageSource) {
    const m = this.mask(key, true)!;
    const c = ctx2d(m);
    c.clearRect(0, 0, m.width, m.height);
    c.drawImage(img, 0, 0, m.width, m.height);
  }

  dab(key: string, x: number, y: number, r: number, hard: number, strength: number, erase: boolean): Rect {
    const m = this.mask(key, true)!;
    const c = ctx2d(m);
    const s = MASK_SCALE, mx = x * s, my = y * s, mr = Math.max(1, r * s);
    const g = c.createRadialGradient(mx, my, 0, mx, my, mr);
    const col = `rgba(255,255,255,${strength})`;
    g.addColorStop(0, col); g.addColorStop(clamp(hard, 0, 0.98), col); g.addColorStop(1, 'rgba(255,255,255,0)');
    c.globalCompositeOperation = erase ? 'destination-out' : 'source-over';
    c.fillStyle = g;
    c.beginPath(); c.arc(mx, my, mr, 0, Math.PI * 2); c.fill();
    c.globalCompositeOperation = 'source-over';
    this.changed.add(key);
    const pad = key === 'cave' ? MARGIN : 4;
    const rect = { x: x - r - pad, y: y - r - pad, w: 2 * r + 2 * pad, h: 2 * r + 2 * pad };
    this.invalidate(rect);
    return rect;
  }

  invalidate(r: Rect) { this.dirty = unionRect(this.dirty, r); }
  invalidateAll() { this.dirty = { x: 0, y: 0, w: this.W, h: this.H }; }
  invalidateRooms(pts: number[]) { this.invalidate(expandRect(ptsBBox(pts), MARGIN + 4)); }

  flush(): Rect | null {
    if (!this.dirty) return null;
    const R = clipRect(this.dirty, this.W, this.H);
    this.dirty = null;
    if (!R) return null;
    for (let y = R.y; y < R.y + R.h; y += TILE)
      for (let x = R.x; x < R.x + R.w; x += TILE)
        this.compose({ x, y, w: Math.min(TILE, R.x + R.w - x), h: Math.min(TILE, R.y + R.h - y) });
    return R;
  }

  /** Upscale a mask region to full res and roughen its edge with noise. */
  private eff(mask: HTMLCanvasElement, F: Rect, rough: number, soft: number, out: HTMLCanvasElement): Uint8ClampedArray | null {
    const c = fit(out, F.w, F.h, true);
    c.imageSmoothingEnabled = true;
    c.imageSmoothingQuality = 'high';
    const s = MASK_SCALE;
    c.drawImage(mask, F.x * s, F.y * s, F.w * s, F.h * s, 0, 0, F.w, F.h);
    const img = c.getImageData(0, 0, F.w, F.h);
    const d = img.data;
    const N = getEdgeNoise();
    const M = EDGE_N - 1;
    let any = false;
    for (let y = 0; y < F.h; y++) {
      const ny = ((F.y + y) & M) * EDGE_N;
      let i = y * F.w * 4 + 3;
      for (let x = 0; x < F.w; x++, i += 4) {
        const a = d[i];
        if (a === 0) continue;
        any = true;
        d[i - 3] = d[i - 2] = d[i - 1] = 255;
        if (a === 255) continue;
        const n = N[ny + ((F.x + x) & M)];
        const v = (a / 255 - 0.5 + (n - 0.5) * rough) / soft + 0.5;
        d[i] = v <= 0 ? 0 : v >= 1 ? 255 : v * 255;
      }
    }
    if (!any) return null;
    c.putImageData(img, 0, 0);
    return d;
  }

  private rasterRooms(F: Rect): boolean {
    const c = fit(this.cRoom, F.w, F.h, true);
    c.fillStyle = '#fff';
    let any = false;
    for (const r of this.doc.rooms) {
      if (r.zoneOnly || r.pts.length < 6) continue;
      if (!rectsIntersect(ptsBBox(r.pts), F)) continue;
      any = true;
      c.beginPath();
      for (let i = 0; i < r.pts.length; i += 2) c.lineTo(r.pts[i] - F.x, r.pts[i + 1] - F.y);
      c.closePath();
      c.fill();
    }
    return any;
  }

  private blur(src: HTMLCanvasElement, dst: HTMLCanvasElement, F: Rect) {
    const c = fit(dst, F.w, F.h, true);
    const off = F.w + 200;
    c.shadowColor = '#fff';
    c.shadowBlur = BLUR;
    c.shadowOffsetX = off;
    c.drawImage(src, -off, 0);
    c.shadowColor = 'transparent';
  }

  private drawOverlay(rc: CanvasRenderingContext2D, id: string, R: Rect, liquid: boolean) {
    const m = this.masks.get(id);
    if (!m) return;
    const d = this.eff(m, R, 0.5, 0.22, this.cEff);
    if (!d) return;
    const t = fit(this.cTmp, R.w, R.h);
    fillPattern(t, getTexture(id), R.x, R.y, R.w, R.h);
    t.globalCompositeOperation = 'destination-in';
    t.drawImage(this.cEff, 0, 0);
    t.globalCompositeOperation = 'source-over';
    rc.drawImage(this.cTmp, 0, 0);
    if (!liquid) return;
    const fc = fit(this.cFx, R.w, R.h);
    const img = fc.createImageData(R.w, R.h);
    const o = img.data;
    const lava = id === 'lava';
    const col = lava ? [255, 190, 80] : [225, 245, 255];
    for (let i = 3; i < d.length; i += 4) {
      const a = d[i] / 255;
      if (a <= 0 || a >= 1) continue;
      const e = 4 * a * (1 - a);
      o[i - 3] = col[0]; o[i - 2] = col[1]; o[i - 1] = col[2];
      o[i] = Math.pow(e, 1.6) * (lava ? 230 : 150);
    }
    fc.putImageData(img, 0, 0);
    rc.drawImage(this.cFx, 0, 0);
  }

  private compose(R: Rect) {
    const doc = this.doc;
    const F = clipRect(expandRect(R, MARGIN), this.W, this.H)!;
    const ox = R.x - F.x, oy = R.y - F.y;

    const caveMask = this.masks.get('cave');
    const caveD = caveMask ? this.eff(caveMask, F, 0.55, 0.07, this.cCave) : null;
    const roomAny = this.rasterRooms(F);
    let ca: Uint8ClampedArray | null = null, cb: Uint8ClampedArray | null = null;
    let ra: Uint8ClampedArray | null = null, rb: Uint8ClampedArray | null = null;
    if (caveD) {
      this.blur(this.cCave, this.cBlurA, F);
      cb = ctx2d(this.cBlurA, true).getImageData(ox, oy, R.w, R.h).data;
      ca = ctx2d(this.cCave, true).getImageData(ox, oy, R.w, R.h).data;
    }
    if (roomAny) {
      this.blur(this.cRoom, this.cBlurB, F);
      rb = ctx2d(this.cBlurB, true).getImageData(ox, oy, R.w, R.h).data;
      ra = ctx2d(this.cRoom, true).getImageData(ox, oy, R.w, R.h).data;
    }

    const rc = fit(this.cR, R.w, R.h);
    fillPattern(rc, getTexture(doc.bg), R.x, R.y, R.w, R.h);
    for (const id of BELOW) this.drawOverlay(rc, id, R, false);

    if (caveD) {
      const t = fit(this.cTmp, R.w, R.h);
      fillPattern(t, getTexture(doc.caveFloor), R.x, R.y, R.w, R.h);
      t.globalCompositeOperation = 'destination-in';
      t.drawImage(this.cCave, -ox, -oy);
      t.globalCompositeOperation = 'source-over';
      rc.drawImage(this.cTmp, 0, 0);
    }
    if (roomAny) {
      for (const r of doc.rooms) {
        if (r.zoneOnly || r.pts.length < 6 || !rectsIntersect(ptsBBox(r.pts), R)) continue;
        rc.save();
        rc.beginPath();
        for (let i = 0; i < r.pts.length; i += 2) rc.lineTo(r.pts[i] - R.x, r.pts[i + 1] - R.y);
        rc.closePath();
        rc.clip();
        fillPattern(rc, getTexture(r.floor), R.x, R.y, R.w, R.h);
        rc.restore();
      }
    }
    for (const id of ABOVE) this.drawOverlay(rc, id, R, true);

    if (caveD || roomAny) this.walls(rc, R, ca, cb, ra, rb);

    rc.globalCompositeOperation = 'soft-light';
    rc.globalAlpha = 0.5;
    fillPattern(rc, getTexture('variation'), R.x, R.y, R.w, R.h, 3.7);
    rc.globalAlpha = 1;
    rc.globalCompositeOperation = 'source-over';

    ctx2d(this.cache).drawImage(this.cR, R.x, R.y);
  }

  private walls(rc: CanvasRenderingContext2D, R: Rect, ca: Uint8ClampedArray | null, cb: Uint8ClampedArray | null, ra: Uint8ClampedArray | null, rb: Uint8ClampedArray | null) {
    const fc = fit(this.cFx, R.w, R.h);
    const img = fc.createImageData(R.w, R.h);
    const o = img.data;
    const wd = getTextureData(WALL_TEX[this.doc.wallStyle]);
    const cwd = getTextureData('wall_cave');
    const T = WALL_T;
    for (let y = 0; y < R.h; y++) {
      const ty = ((R.y + y) % TS) * TS;
      for (let x = 0; x < R.w; x++) {
        const i = (y * R.w + x) * 4 + 3;
        const bc = cb ? cb[i] / 255 : 0, br = rb ? rb[i] / 255 : 0;
        const b = Math.min(1, bc + br);
        if (b < 0.01) continue;
        const m = Math.max(ca ? ca[i] / 255 : 0, ra ? ra[i] / 255 : 0);
        const out = 1 - m;
        let r = 0, g = 0, bl = 0, a = 0;
        if (out > 0) {
          // drop shadow outside the wall
          a = smoothstep(T - 0.09, T, b) * 0.55 * out;
          // wall body
          const wb = smoothstep(T - 0.012, T + 0.012, b) * out;
          if (wb > 0) {
            const tex = bc >= br ? cwd : wd;
            const ti = (ty + ((R.x + x) % TS)) * 4;
            const k = clamp((b - T) / (0.5 - T), 0, 1);
            const f = 0.62 + 0.5 * k;
            const wr = tex[ti] * f, wg = tex[ti + 1] * f, wbl = tex[ti + 2] * f;
            const na = wb + a * (1 - wb);
            r = (wr * wb + r * a * (1 - wb)) / na; g = (wg * wb + g * a * (1 - wb)) / na; bl = (wbl * wb + bl * a * (1 - wb)) / na; a = na;
          }
          // ink outlines
          const lo = 1 - clamp(Math.abs(b - T) / 0.02, 0, 1);
          const li = 1 - clamp(Math.abs(b - 0.475) / 0.035, 0, 1);
          const la = Math.max(lo, li) * 0.95 * out;
          if (la > 0) {
            const na = la + a * (1 - la);
            r = (18 * la + r * a * (1 - la)) / na; g = (13 * la + g * a * (1 - la)) / na; bl = (10 * la + bl * a * (1 - la)) / na; a = na;
          }
        }
        if (m > 0) {
          // ambient occlusion inside rooms/caves
          const s = clamp((0.97 - b) * 2.1, 0, 1);
          const ao = s * s * 0.6 * m;
          if (ao > 0) { const na = ao + a * (1 - ao); r = (r * a * (1 - ao)) / na; g = (g * a * (1 - ao)) / na; bl = (bl * a * (1 - ao)) / na; a = na; }
        }
        if (a <= 0) continue;
        o[i - 3] = r; o[i - 2] = g; o[i - 1] = bl; o[i] = a * 255;
      }
    }
    fc.putImageData(img, 0, 0);
    rc.drawImage(this.cFx, 0, 0);
  }
}
