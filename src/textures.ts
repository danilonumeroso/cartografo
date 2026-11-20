import { fbmTile } from './noise';
import { clamp, ctx2d, hexToRgb, lerp, makeCanvas, mulberry32, Rng, rrange, smoothstep } from './util';
import { t } from './i18n';

/** Texture tile size in world px (4 grid squares). */
export const TS = 400;

export interface TexDef { id: string; name: string; layer: 'below' | 'above'; floor?: boolean; liquid?: boolean; swatch: string }

export const TEXTURES: TexDef[] = [
  { id: 'rock', name: t('Dark rock'), layer: 'below', floor: true, swatch: '#3a3632' },
  { id: 'grass', name: t('Grass'), layer: 'below', floor: true, swatch: '#6b9a3c' },
  { id: 'forest', name: t('Undergrowth'), layer: 'below', floor: true, swatch: '#4b5a2c' },
  { id: 'dirt', name: t('Dirt'), layer: 'below', floor: true, swatch: '#86643f' },
  { id: 'mud', name: t('Mud'), layer: 'below', floor: true, swatch: '#57412b' },
  { id: 'sand', name: t('Sand'), layer: 'below', floor: true, swatch: '#dcc690' },
  { id: 'snow', name: t('Snow'), layer: 'below', floor: true, swatch: '#eef3f7' },
  { id: 'gravel', name: t('Gravel'), layer: 'below', floor: true, swatch: '#8a8276' },
  { id: 'cave', name: t('Cave floor'), layer: 'below', floor: true, swatch: '#655a50' },
  { id: 'cobble', name: t('Cobblestone'), layer: 'below', floor: true, swatch: '#77736c' },
  { id: 'flagstone', name: t('Flagstone'), layer: 'below', floor: true, swatch: '#8a857c' },
  { id: 'tiles', name: t('Checkered marble'), layer: 'below', floor: true, swatch: '#b9b2a6' },
  { id: 'wood', name: t('Wooden planks'), layer: 'below', floor: true, swatch: '#8f6239' },
  { id: 'moss', name: t('Moss'), layer: 'above', swatch: '#5d8a30' },
  { id: 'water', name: t('Water'), layer: 'above', liquid: true, swatch: '#3786a0' },
  { id: 'deep', name: t('Deep water'), layer: 'above', liquid: true, swatch: '#1b4a6a' },
  { id: 'lava', name: 'Lava', layer: 'above', liquid: true, swatch: '#e2571c' },
];
export const TEX_BY_ID = new Map(TEXTURES.map((t) => [t.id, t]));
export const BELOW = TEXTURES.filter((t) => t.layer === 'below').map((t) => t.id);
export const ABOVE = TEXTURES.filter((t) => t.layer === 'above').map((t) => t.id);

const cache = new Map<string, HTMLCanvasElement>();
const dataCache = new Map<string, Uint8ClampedArray>();

export function getTexture(id: string): HTMLCanvasElement {
  let c = cache.get(id);
  if (!c) { c = generate(id); cache.set(id, c); }
  return c;
}
export function getTextureData(id: string): Uint8ClampedArray {
  let d = dataCache.get(id);
  if (!d) { const c = getTexture(id); d = ctx2d(c).getImageData(0, 0, TS, TS).data; dataCache.set(id, d); }
  return d;
}
export function preloadTextures() {
  for (const t of TEXTURES) getTexture(t.id);
  for (const w of ['wall_stone', 'wall_brick', 'wall_wood', 'wall_cave', 'variation', 'fog']) getTexture(w);
}

// ---------------------------------------------------------------------------

type C2D = CanvasRenderingContext2D;

function noiseBase(seed: number, c1: string, c2: string, fineAmt = 0.08, largeCells = 5, contrast = 1): HTMLCanvasElement {
  const c = makeCanvas(TS, TS);
  const x = ctx2d(c);
  const n1 = fbmTile(TS, largeCells, 5, seed);
  const n2 = fbmTile(TS, 50, 2, seed + 3);
  const a = hexToRgb(c1), b = hexToRgb(c2);
  const img = x.createImageData(TS, TS);
  const d = img.data;
  for (let i = 0; i < TS * TS; i++) {
    const t = smoothstep(0.5 - 0.35 / contrast, 0.5 + 0.35 / contrast, n1[i]);
    const f = 1 + (n2[i] - 0.5) * 2 * fineAmt;
    d[i * 4] = clamp(lerp(a[0], b[0], t) * f, 0, 255);
    d[i * 4 + 1] = clamp(lerp(a[1], b[1], t) * f, 0, 255);
    d[i * 4 + 2] = clamp(lerp(a[2], b[2], t) * f, 0, 255);
    d[i * 4 + 3] = 255;
  }
  x.putImageData(img, 0, 0);
  return c;
}

/** Draw fn at (px,py) and at wrapped copies so the tile stays seamless. */
function wrap(x: C2D, px: number, py: number, m: number, fn: (x: number, y: number) => void) {
  for (const ox of [-TS, 0, TS]) for (const oy of [-TS, 0, TS]) {
    const X = px + ox, Y = py + oy;
    if (X > -m && X < TS + m && Y > -m && Y < TS + m) fn(X, Y);
  }
}

function blades(x: C2D, r: Rng, n: number, dark: string, light: string, len: [number, number], lw = 1.2) {
  x.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const px = r() * TS, py = r() * TS;
    const L = rrange(r, len[0], len[1]);
    const ang = -Math.PI / 2 + rrange(r, -0.7, 0.7);
    const bend = rrange(r, -0.3, 0.3);
    x.strokeStyle = r() < 0.55 ? dark : light;
    x.lineWidth = lw * rrange(r, 0.7, 1.2);
    wrap(x, px, py, 12, (X, Y) => {
      x.beginPath();
      x.moveTo(X, Y);
      x.quadraticCurveTo(X + Math.cos(ang + bend) * L * 0.5, Y + Math.sin(ang + bend) * L * 0.5, X + Math.cos(ang) * L, Y + Math.sin(ang) * L);
      x.stroke();
    });
  }
}

function blotches(x: C2D, r: Rng, n: number, colors: string[], rad: [number, number]) {
  for (let i = 0; i < n; i++) {
    const px = r() * TS, py = r() * TS, R = rrange(r, rad[0], rad[1]);
    x.fillStyle = colors[i % colors.length];
    const sx = rrange(r, 0.6, 1.4), rot = r() * Math.PI;
    wrap(x, px, py, R * 1.5, (X, Y) => {
      x.beginPath(); x.ellipse(X, Y, R * sx, R / sx, rot, 0, Math.PI * 2); x.fill();
    });
  }
}

function pebbles(x: C2D, r: Rng, n: number, base: string, rad: [number, number]) {
  const [br, bg, bb] = hexToRgb(base);
  for (let i = 0; i < n; i++) {
    const px = r() * TS, py = r() * TS, R = rrange(r, rad[0], rad[1]);
    const f = rrange(r, 0.8, 1.2);
    const col = `rgb(${clamp(br * f, 0, 255) | 0},${clamp(bg * f, 0, 255) | 0},${clamp(bb * f, 0, 255) | 0})`;
    const rot = r() * Math.PI, sq = rrange(r, 0.6, 1);
    wrap(x, px, py, R * 2, (X, Y) => {
      x.fillStyle = 'rgba(0,0,0,0.3)';
      x.beginPath(); x.ellipse(X + R * 0.25, Y + R * 0.3, R, R * sq, rot, 0, Math.PI * 2); x.fill();
      x.fillStyle = col;
      x.beginPath(); x.ellipse(X, Y, R, R * sq, rot, 0, Math.PI * 2); x.fill();
      x.fillStyle = 'rgba(255,255,255,0.18)';
      x.beginPath(); x.ellipse(X - R * 0.3, Y - R * 0.3, R * 0.45, R * 0.3 * sq, rot, 0, Math.PI * 2); x.fill();
    });
  }
}

function cracks(x: C2D, r: Rng, n: number, color: string, len: [number, number], lw = 1) {
  x.strokeStyle = color; x.lineCap = 'round'; x.lineJoin = 'round';
  for (let i = 0; i < n; i++) {
    const px = r() * TS, py = r() * TS;
    let a = r() * Math.PI * 2;
    const steps = 3 + Math.floor(r() * 4);
    const pts: number[] = [0, 0];
    let cx = 0, cy = 0;
    const L = rrange(r, len[0], len[1]) / steps;
    for (let s = 0; s < steps; s++) { a += rrange(r, -0.8, 0.8); cx += Math.cos(a) * L; cy += Math.sin(a) * L; pts.push(cx, cy); }
    x.lineWidth = lw;
    wrap(x, px, py, len[1] + 4, (X, Y) => {
      x.beginPath(); x.moveTo(X, Y);
      for (let k = 2; k < pts.length; k += 2) x.lineTo(X + pts[k], Y + pts[k + 1]);
      x.stroke();
    });
  }
}

function hatch(x: C2D, r: Rng, n: number, color: string) {
  x.strokeStyle = color; x.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const px = r() * TS, py = r() * TS;
    const a = r() * Math.PI;
    const k = 3 + Math.floor(r() * 3);
    const L = rrange(r, 9, 18), gap = rrange(r, 3.5, 5);
    x.lineWidth = rrange(r, 1, 1.8);
    wrap(x, px, py, 30, (X, Y) => {
      for (let j = 0; j < k; j++) {
        const ox = Math.cos(a + Math.PI / 2) * gap * j, oy = Math.sin(a + Math.PI / 2) * gap * j;
        const l = L * rrange(r, 0.7, 1);
        x.beginPath();
        x.moveTo(X + ox - Math.cos(a) * l / 2, Y + oy - Math.sin(a) * l / 2);
        x.lineTo(X + ox + Math.cos(a) * l / 2, Y + oy + Math.sin(a) * l / 2);
        x.stroke();
      }
    });
  }
}

function overlayNoise(x: C2D, seed: number, alpha: number, cells = 20) {
  const n = fbmTile(TS, cells, 3, seed);
  const img = x.getImageData(0, 0, TS, TS);
  const d = img.data;
  for (let i = 0; i < TS * TS; i++) {
    const f = 1 + (n[i] - 0.5) * 2 * alpha;
    d[i * 4] = clamp(d[i * 4] * f, 0, 255);
    d[i * 4 + 1] = clamp(d[i * 4 + 1] * f, 0, 255);
    d[i * 4 + 2] = clamp(d[i * 4 + 2] * f, 0, 255);
  }
  x.putImageData(img, 0, 0);
}

/** Slab-style tiles: rows of height rh, random widths from `widths`, drawn seamlessly. */
function slabs(x: C2D, r: Rng, rh: number, widths: number[], mortar: string, opts: { bevel?: boolean; tint?: number; lw?: number; stagger?: boolean } = {}) {
  const rows = Math.round(TS / rh);
  for (let row = 0; row < rows; row++) {
    const y = row * rh;
    let pos = opts.stagger ? (row % 2) * (widths[0] / 2) : r() * TS;
    let covered = 0;
    while (covered < TS) {
      let w = widths[Math.floor(r() * widths.length)];
      if (covered + w > TS) w = TS - covered;
      const xx = pos % TS;
      const f = 1 + rrange(r, -1, 1) * (opts.tint ?? 0.08);
      wrap(x, xx, y, TS, (X, Y) => {
        if (f !== 1) {
          x.fillStyle = f > 1 ? `rgba(255,255,255,${(f - 1) * 1.2})` : `rgba(0,0,0,${(1 - f) * 1.2})`;
          x.fillRect(X, Y, w, rh);
        }
        if (opts.bevel !== false) {
          x.fillStyle = 'rgba(255,255,255,0.10)';
          x.fillRect(X, Y, w, 2.5);
          x.fillRect(X, Y, 2.5, rh);
          x.fillStyle = 'rgba(0,0,0,0.18)';
          x.fillRect(X, Y + rh - 3, w, 3);
          x.fillRect(X + w - 3, Y, 3, rh);
        }
        x.strokeStyle = mortar;
        x.lineWidth = opts.lw ?? 2.5;
        x.strokeRect(X, Y, w, rh);
      });
      pos += w; covered += w;
    }
  }
}

function generate(id: string): HTMLCanvasElement {
  const seed = [...id].reduce((a, c) => a * 31 + c.charCodeAt(0), 7) & 0xffff;
  const r = mulberry32(seed);
  let c: HTMLCanvasElement;
  let x: C2D;
  switch (id) {
    case 'rock': {
      c = noiseBase(seed, '#262421', '#332f2b', 0.08, 5, 0.7); x = ctx2d(c);
      blotches(x, r, 40, ['rgba(0,0,0,0.08)', 'rgba(255,255,255,0.025)'], [10, 30]);
      hatch(x, r, 170, 'rgba(10,8,6,0.45)');
      cracks(x, r, 25, 'rgba(0,0,0,0.35)', [15, 40], 1.2);
      break;
    }
    case 'grass': {
      c = noiseBase(seed, '#5a8a33', '#73a040', 0.07, 5, 0.55); x = ctx2d(c);
      blotches(x, r, 30, ['rgba(40,70,15,0.10)', 'rgba(180,200,90,0.07)'], [15, 40]);
      blades(x, r, 4200, 'rgba(35,65,18,0.35)', 'rgba(175,215,105,0.30)', [4, 10]);
      for (let i = 0; i < 40; i++) {
        const px = r() * TS, py = r() * TS;
        x.fillStyle = ['#f4e9a8', '#ffffff', '#e8b0d0', '#f5d36b'][i % 4];
        wrap(x, px, py, 3, (X, Y) => { x.beginPath(); x.arc(X, Y, 1.4, 0, 7); x.fill(); });
      }
      break;
    }
    case 'forest': {
      c = noiseBase(seed, '#3a4f24', '#5c5a30', 0.08, 5, 1.2); x = ctx2d(c);
      for (let i = 0; i < 1300; i++) {
        const px = r() * TS, py = r() * TS, R = rrange(r, 2, 4.5), rot = r() * 3.14;
        x.fillStyle = ['rgba(120,90,40,0.45)', 'rgba(70,95,35,0.5)', 'rgba(150,120,50,0.35)', 'rgba(40,55,20,0.5)'][i % 4];
        wrap(x, px, py, 6, (X, Y) => { x.beginPath(); x.ellipse(X, Y, R, R * 0.45, rot, 0, 7); x.fill(); });
      }
      cracks(x, r, 30, 'rgba(60,40,20,0.55)', [8, 20], 1.4);
      blades(x, r, 900, 'rgba(30,45,15,0.4)', 'rgba(120,150,60,0.3)', [3, 7]);
      break;
    }
    case 'dirt': {
      c = noiseBase(seed, '#6e5134', '#94704a', 0.1, 5, 1.1); x = ctx2d(c);
      blotches(x, r, 120, ['rgba(40,25,10,0.08)', 'rgba(255,230,190,0.05)'], [6, 22]);
      pebbles(x, r, 260, '#8a7a66', [1, 3]);
      cracks(x, r, 20, 'rgba(50,30,15,0.3)', [8, 20], 1);
      break;
    }
    case 'mud': {
      c = noiseBase(seed, '#45321f', '#614832', 0.1, 5, 1.3); x = ctx2d(c);
      blotches(x, r, 50, ['rgba(20,12,5,0.25)'], [8, 26]);
      blotches(x, r, 90, ['rgba(255,240,220,0.07)'], [3, 10]);
      pebbles(x, r, 80, '#6e5a46', [1, 2.5]);
      break;
    }
    case 'sand': {
      c = noiseBase(seed, '#d2b87e', '#e8d7a5', 0.06, 5, 1); x = ctx2d(c);
      for (let i = 0; i < 26; i++) {
        const y0 = r() * TS, amp = rrange(r, 3, 7), ph = r() * 6.28;
        x.strokeStyle = 'rgba(140,110,60,0.13)'; x.lineWidth = 2;
        for (const oy of [-TS, 0, TS]) {
          x.beginPath();
          for (let px = 0; px <= TS; px += 8) {
            const yy = y0 + oy + Math.sin((px / TS) * Math.PI * 2 * 3 + ph) * amp;
            px === 0 ? x.moveTo(px, yy) : x.lineTo(px, yy);
          }
          x.stroke();
        }
      }
      for (let i = 0; i < 6000; i++) {
        x.fillStyle = r() < 0.5 ? 'rgba(120,90,50,0.2)' : 'rgba(255,250,230,0.25)';
        x.fillRect(r() * TS, r() * TS, 1, 1);
      }
      break;
    }
    case 'snow': {
      c = noiseBase(seed, '#dfe7ef', '#f8fbfd', 0.04, 5, 1); x = ctx2d(c);
      blotches(x, r, 60, ['rgba(140,170,210,0.08)'], [10, 34]);
      for (let i = 0; i < 400; i++) { x.fillStyle = 'rgba(255,255,255,0.9)'; x.fillRect(r() * TS, r() * TS, 1.5, 1.5); }
      break;
    }
    case 'gravel': {
      c = noiseBase(seed, '#6c655c', '#857d71', 0.1); x = ctx2d(c);
      pebbles(x, r, 1700, '#8d867b', [1.8, 4.5]);
      break;
    }
    case 'cave': {
      c = noiseBase(seed, '#5e544a', '#7d7064', 0.12, 5, 1.1); x = ctx2d(c);
      blotches(x, r, 70, ['rgba(0,0,0,0.10)', 'rgba(255,240,220,0.05)'], [8, 30]);
      cracks(x, r, 45, 'rgba(25,18,12,0.5)', [12, 36], 1.3);
      pebbles(x, r, 160, '#7a6e62', [1.5, 4]);
      break;
    }
    case 'cobble': {
      c = makeCanvas(TS, TS); x = ctx2d(c);
      x.fillStyle = '#4a463f'; x.fillRect(0, 0, TS, TS);
      const g = 25;
      for (let gy = 0; gy < TS / g; gy++) for (let gx = 0; gx < TS / g; gx++) {
        const px = gx * g + g / 2 + rrange(r, -3, 3) + (gy % 2) * g / 2, py = gy * g + g / 2 + rrange(r, -3, 3);
        const R = rrange(r, 9, 11.5), sq = rrange(r, 0.8, 1), rot = r() * 3;
        const v = rrange(r, 0.85, 1.15);
        const col = `rgb(${(138 * v) | 0},${(132 * v) | 0},${(120 * v) | 0})`;
        wrap(x, px, py, 14, (X, Y) => {
          x.fillStyle = col;
          x.beginPath(); x.ellipse(X, Y, R, R * sq, rot, 0, 7); x.fill();
          x.fillStyle = 'rgba(255,255,255,0.16)';
          x.beginPath(); x.ellipse(X - R * 0.25, Y - R * 0.3, R * 0.55, R * 0.4, rot, 0, 7); x.fill();
          x.strokeStyle = 'rgba(0,0,0,0.35)'; x.lineWidth = 1.5;
          x.beginPath(); x.ellipse(X, Y, R, R * sq, rot, 0, 7); x.stroke();
        });
      }
      overlayNoise(x, seed, 0.12);
      break;
    }
    case 'flagstone': {
      c = noiseBase(seed, '#7d786f', '#9a958b', 0.1, 5, 1); x = ctx2d(c);
      slabs(x, r, 50, [50, 75, 100, 100], 'rgba(30,27,24,0.9)', { tint: 0.09, lw: 3 });
      cracks(x, r, 18, 'rgba(30,27,24,0.45)', [8, 22], 1);
      break;
    }
    case 'tiles': {
      c = noiseBase(seed, '#c9c2b6', '#ddd7cc', 0.05, 5, 1); x = ctx2d(c);
      for (let gy = 0; gy < 8; gy++) for (let gx = 0; gx < 8; gx++) {
        if ((gx + gy) % 2) { x.fillStyle = 'rgba(40,36,48,0.72)'; x.fillRect(gx * 50, gy * 50, 50, 50); }
      }
      x.strokeStyle = 'rgba(255,255,255,0.12)'; x.lineWidth = 1.2;
      for (let i = 0; i < 30; i++) {
        let px = r() * TS, py = r() * TS, a = r() * 6.28;
        x.beginPath(); x.moveTo(px, py);
        for (let s = 0; s < 6; s++) { a += rrange(r, -0.6, 0.6); px += Math.cos(a) * 9; py += Math.sin(a) * 9; x.lineTo(px, py); }
        x.stroke();
      }
      x.strokeStyle = 'rgba(20,18,16,0.7)'; x.lineWidth = 2;
      for (let k = 0; k <= 8; k++) { x.beginPath(); x.moveTo(k * 50, 0); x.lineTo(k * 50, TS); x.moveTo(0, k * 50); x.lineTo(TS, k * 50); x.stroke(); }
      break;
    }
    case 'wood': {
      c = noiseBase(seed, '#7a5230', '#9a6c40', 0.05, 5, 1); x = ctx2d(c);
      const rh = 25;
      for (let row = 0; row < TS / rh; row++) {
        const y = row * rh;
        let pos = r() * TS, covered = 0;
        while (covered < TS) {
          let w = rrange(r, 110, 260); if (covered + w > TS) w = TS - covered;
          const f = rrange(r, -0.12, 0.12);
          const xx = pos % TS;
          const grains = Array.from({ length: 4 }, () => [rrange(r, 4, rh - 4), rrange(r, 0.5, 2), r() * 6.28]);
          wrap(x, xx, y, TS, (X, Y) => {
            x.fillStyle = f > 0 ? `rgba(255,220,170,${f})` : `rgba(30,15,5,${-f})`;
            x.fillRect(X, Y, w, rh);
            x.strokeStyle = 'rgba(50,28,10,0.22)'; x.lineWidth = 1;
            for (const [gy, amp, ph] of grains) {
              x.beginPath();
              for (let px = 0; px <= w; px += 10) {
                const yy = Y + gy + Math.sin(px / 30 + ph) * amp;
                px === 0 ? x.moveTo(X + px, yy) : x.lineTo(X + px, yy);
              }
              x.stroke();
            }
            x.fillStyle = 'rgba(255,230,190,0.10)'; x.fillRect(X, Y, w, 2);
            x.strokeStyle = 'rgba(35,20,8,0.85)'; x.lineWidth = 2;
            x.strokeRect(X, Y, w, rh);
            x.fillStyle = 'rgba(30,20,10,0.7)';
            x.beginPath(); x.arc(X + 6, Y + 6, 1.4, 0, 7); x.arc(X + 6, Y + rh - 6, 1.4, 0, 7); x.fill();
          });
          pos += w; covered += w;
        }
      }
      break;
    }
    case 'moss': {
      c = noiseBase(seed, '#3f6a22', '#6f9e37', 0.1, 5, 1.2); x = ctx2d(c);
      for (let i = 0; i < 2200; i++) {
        const px = r() * TS, py = r() * TS, R = rrange(r, 1, 3);
        x.fillStyle = r() < 0.5 ? 'rgba(30,60,15,0.4)' : 'rgba(160,200,80,0.35)';
        wrap(x, px, py, 4, (X, Y) => { x.beginPath(); x.arc(X, Y, R, 0, 7); x.fill(); });
      }
      break;
    }
    case 'water':
    case 'deep': {
      const deep = id === 'deep';
      c = noiseBase(seed, deep ? '#123a57' : '#2a6a82', deep ? '#1d5577' : '#3f93a6', 0.04, 5, 1); x = ctx2d(c);
      x.lineCap = 'round';
      for (let i = 0; i < (deep ? 40 : 90); i++) {
        const px = r() * TS, py = r() * TS, L = rrange(r, 10, 26), a = rrange(r, -0.3, 0.3);
        x.strokeStyle = `rgba(210,245,255,${deep ? 0.08 : rrange(r, 0.1, 0.22)})`;
        x.lineWidth = rrange(r, 1, 2);
        wrap(x, px, py, 30, (X, Y) => {
          x.beginPath(); x.moveTo(X, Y);
          x.bezierCurveTo(X + L * 0.3, Y - 3 + a * 10, X + L * 0.7, Y + 3 + a * 10, X + L, Y + a * 10);
          x.stroke();
        });
      }
      break;
    }
    case 'lava': {
      c = makeCanvas(TS, TS); x = ctx2d(c);
      const n = fbmTile(TS, 5, 5, seed), n2 = fbmTile(TS, 10, 4, seed + 9);
      const img = x.createImageData(TS, TS), d = img.data;
      const crust = hexToRgb('#2c1a12'), crust2 = hexToRgb('#4a2a1a'), hot = hexToRgb('#ff6a1a'), white = hexToRgb('#ffd65a');
      for (let i = 0; i < TS * TS; i++) {
        const v = 1 - Math.abs(2 * n[i] - 1), v2 = 1 - Math.abs(2 * n2[i] - 1);
        const g = Math.max(smoothstep(0.8, 0.97, v), smoothstep(0.88, 0.99, v2) * 0.8);
        const t = n2[i];
        let R = lerp(crust[0], crust2[0], t), G = lerp(crust[1], crust2[1], t), B = lerp(crust[2], crust2[2], t);
        R = lerp(R, hot[0], g); G = lerp(G, hot[1], g); B = lerp(B, hot[2], g);
        const g2 = smoothstep(0.93, 1, v);
        R = lerp(R, white[0], g2); G = lerp(G, white[1], g2); B = lerp(B, white[2], g2);
        d[i * 4] = R; d[i * 4 + 1] = G; d[i * 4 + 2] = B; d[i * 4 + 3] = 255;
      }
      x.putImageData(img, 0, 0);
      break;
    }
    case 'wall_stone': {
      c = noiseBase(seed, '#6f6a62', '#8d877d', 0.1); x = ctx2d(c);
      slabs(x, r, 20, [25, 35, 45], 'rgba(25,22,20,0.9)', { tint: 0.12, lw: 2 });
      break;
    }
    case 'wall_brick': {
      c = noiseBase(seed, '#7c3f2c', '#94543a', 0.1); x = ctx2d(c);
      slabs(x, r, 16, [40], 'rgba(40,30,25,0.9)', { tint: 0.1, lw: 2, stagger: true });
      break;
    }
    case 'wall_wood': {
      c = noiseBase(seed, '#4e321c', '#6a4527', 0.06); x = ctx2d(c);
      slabs(x, r, 25, [80, 120], 'rgba(25,14,6,0.9)', { tint: 0.1, lw: 2, bevel: false });
      break;
    }
    case 'wall_cave': {
      c = noiseBase(seed, '#4a423b', '#857a6e', 0.15, 10, 1.6); x = ctx2d(c);
      cracks(x, r, 80, 'rgba(20,15,10,0.55)', [10, 30], 1.5);
      blotches(x, r, 60, ['rgba(255,250,240,0.08)'], [4, 12]);
      break;
    }
    case 'variation': {
      c = makeCanvas(TS, TS); x = ctx2d(c);
      const n = fbmTile(TS, 2, 4, seed);
      const img = x.createImageData(TS, TS), d = img.data;
      for (let i = 0; i < TS * TS; i++) { const v = 128 + (n[i] - 0.5) * 120; d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = v; d[i * 4 + 3] = 255; }
      x.putImageData(img, 0, 0);
      break;
    }
    case 'fog': {
      c = noiseBase(seed, '#0e1016', '#2b303c', 0.05, 5, 1.2);
      break;
    }
    default:
      c = noiseBase(seed, '#888888', '#999999');
  }
  return c;
}
