import { MASK_SCALE } from './model';
import { getTexture } from './textures';
import { clamp, clipRect, ctx2d, fillPattern, makeCanvas, Rect, unionRect } from './util';

export class Fog {
  mask: HTMLCanvasElement;
  img: HTMLCanvasElement;
  W: number; H: number;
  /** Mask-space dirty region not yet broadcast. */
  pending: Rect | null = null;
  changed = false;
  /** Incremented on every edit, so callers can detect new changes. */
  version = 0;

  constructor(W: number, H: number) {
    this.W = W; this.H = H;
    this.mask = makeCanvas(Math.ceil(W * MASK_SCALE), Math.ceil(H * MASK_SCALE));
    this.img = makeCanvas(this.mask.width, this.mask.height);
  }
  get mw() { return this.mask.width; }
  get mh() { return this.mask.height; }

  private touch(r: Rect) {
    const c = clipRect(r, this.mw, this.mh);
    if (!c) return;
    this.refresh(c);
    this.pending = unionRect(this.pending, c);
    this.changed = true;
    this.version++;
  }

  refresh(r: Rect = { x: 0, y: 0, w: this.mw, h: this.mh }) {
    const c = ctx2d(this.img);
    c.save();
    c.beginPath(); c.rect(r.x, r.y, r.w, r.h); c.clip();
    c.clearRect(r.x, r.y, r.w, r.h);
    fillPattern(c, getTexture('fog'), 0, 0, this.mw, this.mh, 0.5);
    c.globalCompositeOperation = 'destination-in';
    c.drawImage(this.mask, 0, 0);
    c.restore();
  }

  dab(x: number, y: number, r: number, reveal: boolean, hard = 0.55) {
    const c = ctx2d(this.mask);
    const s = MASK_SCALE, mx = x * s, my = y * s, mr = Math.max(1, r * s);
    const g = c.createRadialGradient(mx, my, 0, mx, my, mr);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(clamp(hard, 0, 0.98), 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    c.globalCompositeOperation = reveal ? 'destination-out' : 'source-over';
    c.fillStyle = g;
    c.beginPath(); c.arc(mx, my, mr, 0, Math.PI * 2); c.fill();
    c.globalCompositeOperation = 'source-over';
    this.touch({ x: mx - mr - 2, y: my - mr - 2, w: mr * 2 + 4, h: mr * 2 + 4 });
  }

  polygon(pts: number[], reveal: boolean, pad = 24) {
    const c = ctx2d(this.mask);
    const s = MASK_SCALE;
    c.save();
    c.scale(s, s);
    c.beginPath();
    for (let i = 0; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]);
    c.closePath();
    c.globalCompositeOperation = reveal ? 'destination-out' : 'source-over';
    c.fillStyle = '#fff'; c.strokeStyle = '#fff'; c.lineWidth = pad * 2; c.lineJoin = 'round';
    c.fill(); c.stroke();
    c.restore();
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (let i = 0; i < pts.length; i += 2) { x0 = Math.min(x0, pts[i]); x1 = Math.max(x1, pts[i]); y0 = Math.min(y0, pts[i + 1]); y1 = Math.max(y1, pts[i + 1]); }
    this.touch({ x: (x0 - pad) * s - 2, y: (y0 - pad) * s - 2, w: (x1 - x0 + pad * 2) * s + 4, h: (y1 - y0 + pad * 2) * s + 4 });
  }

  fillAll() {
    const c = ctx2d(this.mask);
    c.fillStyle = '#fff'; c.fillRect(0, 0, this.mw, this.mh);
    this.touch({ x: 0, y: 0, w: this.mw, h: this.mh });
  }
  clearAll() {
    ctx2d(this.mask).clearRect(0, 0, this.mw, this.mh);
    this.touch({ x: 0, y: 0, w: this.mw, h: this.mh });
  }
  load(img: CanvasImageSource) {
    const c = ctx2d(this.mask);
    c.clearRect(0, 0, this.mw, this.mh);
    c.drawImage(img, 0, 0, this.mw, this.mh);
    this.refresh();
  }
  takePatch(): { x: number; y: number; data: ImageData } | null {
    if (!this.pending) return null;
    const r = clipRect(this.pending, this.mw, this.mh);
    this.pending = null;
    if (!r) return null;
    return { x: r.x, y: r.y, data: ctx2d(this.mask).getImageData(r.x, r.y, r.w, r.h) };
  }
  applyPatch(x: number, y: number, data: ImageData) {
    ctx2d(this.mask).putImageData(data, x, y);
    this.refresh({ x, y, w: data.width, h: data.height });
  }
  /** Fog coverage (0..1) at a world point. */
  at(x: number, y: number): number {
    const s = MASK_SCALE;
    const px = Math.floor(x * s), py = Math.floor(y * s);
    if (px < 0 || py < 0 || px >= this.mw || py >= this.mh) return 0;
    return ctx2d(this.mask).getImageData(px, py, 1, 1).data[3] / 255;
  }
}
