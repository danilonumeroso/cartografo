import { fbmTile } from './noise';
import { clamp, ctx2d, hexToRgb, lerp, makeCanvas, mulberry32, pick, Rng, rrange, smoothstep } from './util';
import { t } from './i18n';
import { drawPhotoGround } from './photos';

/** Texture tile size in world px (4 grid squares). */
export const TS = 400;

export interface TexDef {
  id: string; name: string; layer: 'below' | 'above'; floor?: boolean; liquid?: boolean; swatch: string;
  /** Liquid edge highlight: [r, g, b, maxAlpha]. */
  foam?: [number, number, number, number];
  /** Painted at world-map scale (biomes), not offered on battle maps. */
  world?: boolean;
}
export type TexGroup = 'ground' | 'built' | 'exotic' | 'cover' | 'w_land' | 'w_biome';
const GROUP: Record<string, TexGroup> = {
  rock: 'ground', grass: 'ground', forest: 'ground', dirt: 'ground', mud: 'ground', sand: 'ground', snow: 'ground', gravel: 'ground', cave: 'ground',
  meadow: 'ground', leaves: 'ground', jungle: 'ground', swamp: 'ground', crackedearth: 'ground', ash: 'ground', straw: 'ground',
  obsidian: 'exotic', crystal: 'exotic', ice: 'exotic', bonefloor: 'exotic', flesh: 'exotic', astral: 'exotic', clouds: 'exotic', runes: 'exotic',
};
/** Picker section of a texture: natural ground, built floors, exotic floors, liquids and cover. */
export const texGroup = (id: string): TexGroup => {
  const d = TEX_BY_ID.get(id);
  if (d?.world) return d.layer === 'above' ? 'w_biome' : 'w_land';
  return d?.layer === 'above' ? 'cover' : GROUP[id] ?? 'built';
};


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
  { id: 'parquet', name: t('Herringbone parquet'), layer: 'below', floor: true, swatch: '#a0703e' },
  { id: 'deck', name: t('Ship deck'), layer: 'below', floor: true, swatch: '#8a7660' },
  { id: 'brickfloor', name: t('Brick floor'), layer: 'below', floor: true, swatch: '#9a5440' },
  { id: 'stonetiles', name: t('Large stone tiles'), layer: 'below', floor: true, swatch: '#7e7a72' },
  { id: 'pavers', name: t('Plaza pavers'), layer: 'below', floor: true, swatch: '#b0a690' },
  { id: 'mossycobble', name: t('Mossy cobblestone'), layer: 'below', floor: true, swatch: '#6f7458' },
  { id: 'wornflags', name: t('Worn flagstones'), layer: 'below', floor: true, swatch: '#7d6a58' },
  { id: 'darktiles', name: t('Dark stone tiles'), layer: 'below', floor: true, swatch: '#3e3732' },
  { id: 'wornplanks', name: t('Worn planks'), layer: 'below', floor: true, swatch: '#a8672e' },
  { id: 'grassystones', name: t('Grassy flagstones'), layer: 'below', floor: true, swatch: '#7f7a66' },
  { id: 'crazypaving', name: t('Crazy paving'), layer: 'below', floor: true, swatch: '#948c7e' },
  { id: 'hextiles', name: t('Hexagon tiles'), layer: 'below', floor: true, swatch: '#7a8a8e' },
  { id: 'sandstone', name: t('Sandstone tiles'), layer: 'below', floor: true, swatch: '#cfa874' },
  { id: 'marble', name: t('White marble'), layer: 'below', floor: true, swatch: '#e6e1d8' },
  { id: 'marbledark', name: t('Black marble'), layer: 'below', floor: true, swatch: '#2a2a30' },
  { id: 'mosaic', name: t('Mosaic'), layer: 'below', floor: true, swatch: '#5a7a9a' },
  { id: 'carpet', name: t('Royal carpet'), layer: 'below', floor: true, swatch: '#8a1f2a' },
  { id: 'runes', name: t('Runic stone'), layer: 'below', floor: true, swatch: '#5a5e6a' },
  { id: 'irongrate', name: t('Iron grating'), layer: 'below', floor: true, swatch: '#4a4e54' },
  { id: 'straw', name: t('Straw'), layer: 'below', floor: true, swatch: '#cfae5a' },
  { id: 'meadow', name: t('Flower meadow'), layer: 'below', floor: true, swatch: '#7aa84a' },
  { id: 'leaves', name: t('Autumn leaves'), layer: 'below', floor: true, swatch: '#b0662a' },
  { id: 'jungle', name: t('Jungle floor'), layer: 'below', floor: true, swatch: '#2e5a26' },
  { id: 'swamp', name: t('Marsh'), layer: 'below', floor: true, swatch: '#4a5232' },
  { id: 'crackedearth', name: t('Cracked earth'), layer: 'below', floor: true, swatch: '#c89a64' },
  { id: 'ash', name: t('Ash and cinders'), layer: 'below', floor: true, swatch: '#3e3a38' },
  { id: 'obsidian', name: t('Obsidian'), layer: 'below', floor: true, swatch: '#1a1620' },
  { id: 'crystal', name: t('Crystal floor'), layer: 'below', floor: true, swatch: '#7ab0e0' },
  { id: 'ice', name: t('Ice'), layer: 'below', floor: true, swatch: '#bfe0f0' },
  { id: 'bonefloor', name: t('Bone floor'), layer: 'below', floor: true, swatch: '#cbbf9e' },
  { id: 'flesh', name: t('Living flesh'), layer: 'below', floor: true, swatch: '#a04a52' },
  { id: 'astral', name: t('Astral void'), layer: 'below', floor: true, swatch: '#141838' },
  { id: 'clouds', name: t('Clouds'), layer: 'below', floor: true, swatch: '#dbe8f6' },
  { id: 'moss', name: t('Moss'), layer: 'above', swatch: '#5d8a30' },
  { id: 'snowcover', name: t('Snow cover'), layer: 'above', swatch: '#f4f8fb' },
  { id: 'water', name: t('Water'), layer: 'above', liquid: true, swatch: '#3786a0', foam: [225, 245, 255, 150] },
  { id: 'deep', name: t('Deep water'), layer: 'above', liquid: true, swatch: '#1b4a6a', foam: [225, 245, 255, 150] },
  { id: 'swampwater', name: t('Swamp water'), layer: 'above', liquid: true, swatch: '#3e4a2a', foam: [190, 200, 140, 120] },
  { id: 'lava', name: 'Lava', layer: 'above', liquid: true, swatch: '#e2571c', foam: [255, 190, 80, 230] },
  { id: 'acid', name: t('Acid'), layer: 'above', liquid: true, swatch: '#7ad82a', foam: [220, 255, 150, 210] },
  { id: 'poison', name: t('Poison'), layer: 'above', liquid: true, swatch: '#6a2a8a', foam: [220, 160, 255, 180] },
  { id: 'blood', name: t('Blood'), layer: 'above', liquid: true, swatch: '#6a0a12', foam: [200, 60, 60, 140] },
  { id: 'tar', name: t('Tar'), layer: 'above', liquid: true, swatch: '#141210', foam: [120, 110, 100, 120] },
  { id: 'w_ocean', name: t('Ocean'), layer: 'below', world: true, swatch: '#2f6f8f' },
  { id: 'land', name: t('Land and sea'), layer: 'below', world: true, swatch: '#9db46a' },
  { id: 'w_land', name: t('Grassland'), layer: 'below', world: true, swatch: '#9db46a' },
  { id: 'w_forest', name: t('Woodland'), layer: 'above', world: true, swatch: '#5f8a45' },
  { id: 'w_jungle', name: t('Jungle'), layer: 'above', world: true, swatch: '#3f7a3a' },
  { id: 'w_steppe', name: t('Steppe'), layer: 'above', world: true, swatch: '#c2b773' },
  { id: 'w_desert', name: t('Desert'), layer: 'above', world: true, swatch: '#e2c98a' },
  { id: 'w_badlands', name: t('Badlands'), layer: 'above', world: true, swatch: '#c08a5a' },
  { id: 'w_swamp', name: t('Marshland'), layer: 'above', world: true, swatch: '#7a8a52' },
  { id: 'w_highland', name: t('Highlands'), layer: 'above', world: true, swatch: '#a89a7a' },
  { id: 'w_tundra', name: 'Tundra', layer: 'above', world: true, swatch: '#b8c2a8' },
  { id: 'w_snow', name: t('Snowfields'), layer: 'above', world: true, swatch: '#eef3f6' },
  { id: 'w_volcanic', name: t('Volcanic ash'), layer: 'above', world: true, swatch: '#5a4e4a' },
];
export const TEX_BY_ID = new Map(TEXTURES.map((t) => [t.id, t]));
export const BELOW = TEXTURES.filter((t) => t.layer === 'below' && !t.world).map((t) => t.id);
export const ABOVE = TEXTURES.filter((t) => t.layer === 'above' && !t.world).map((t) => t.id);
/** World-map biome overlays, painted on land in this order. */
export const BIOMES = TEXTURES.filter((t) => t.world && t.layer === 'above').map((t) => t.id);

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
/** Textures needed for the first frame; the rest are generated lazily or when idle. */
const ESSENTIAL = ['rock', 'grass', 'cave', 'flagstone', 'wood', 'water', 'wall_stone', 'wall_cave', 'variation', 'fog'];
const LATER = ['fog_world'];
export const WALL_TEXTURES = ['wall_stone', 'wall_brick', 'wall_wood', 'wall_cave', 'wall_dark', 'wall_marble', 'wall_sandstone', 'wall_palisade', 'wall_hedge', 'wall_ice', 'wall_obsidian', 'wall_bone', 'wall_crystal'];
export function preloadTextures() {
  for (const id of ESSENTIAL) getTexture(id);
  const rest = [...TEXTURES.map((t) => t.id), ...WALL_TEXTURES, ...LATER].filter((id) => !cache.has(id));
  const idle = (cb: () => void) => ('requestIdleCallback' in window ? (window as any).requestIdleCallback(cb, { timeout: 2000 }) : setTimeout(cb, 30));
  const step = () => { const id = rest.shift(); if (!id) return; getTexture(id); idle(step); };
  idle(step);
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
function slabs(x: C2D, r: Rng, rh: number, widths: number[], mortar: string, opts: { bevel?: boolean; tint?: number; lw?: number; stagger?: boolean; align?: boolean } = {}) {
  const rows = Math.round(TS / rh);
  for (let row = 0; row < rows; row++) {
    const y = row * rh;
    let pos = opts.align ? 0 : opts.stagger ? (row % 2) * (widths[0] / 2) : r() * TS;
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

// ------------------------------------------------------------ extra helpers

/** Tileable Voronoi: per-pixel nearest (f1) and second nearest (f2) distance and cell id. */
function voronoi(cells: number, seed: number, jitter = 0.9) {
  const r = mulberry32(seed * 31 + 7), cs = TS / cells;
  const px = new Float32Array(cells * cells), py = new Float32Array(cells * cells);
  for (let j = 0; j < cells; j++) for (let i = 0; i < cells; i++) { px[j * cells + i] = (i + 0.5 + (r() - 0.5) * jitter) * cs; py[j * cells + i] = (j + 0.5 + (r() - 0.5) * jitter) * cs; }
  const f1 = new Float32Array(TS * TS), f2 = new Float32Array(TS * TS), id = new Int32Array(TS * TS), dx = new Float32Array(TS * TS), dy = new Float32Array(TS * TS);
  for (let y = 0; y < TS; y++) {
    const cy = Math.floor(y / cs);
    for (let x = 0; x < TS; x++) {
      const cx = Math.floor(x / cs);
      let d1 = 1e9, d2 = 1e9, best = 0, bx = 0, by = 0;
      for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) {
        const gx = cx + ox, gy = cy + oy, wx = ((gx % cells) + cells) % cells, wy = ((gy % cells) + cells) % cells, k = wy * cells + wx;
        const sx = px[k] + (gx - wx) * cs, sy = py[k] + (gy - wy) * cs;
        const d = Math.hypot(sx - x, sy - y);
        if (d < d1) { d2 = d1; d1 = d; best = k; bx = x - sx; by = y - sy; } else if (d < d2) d2 = d;
      }
      const i = y * TS + x; f1[i] = d1; f2[i] = d2; id[i] = best; dx[i] = bx; dy[i] = by;
    }
  }
  return { f1, f2, id, dx, dy, n: cells * cells };
}

/** Paint every pixel from a callback (r,g,b in 0..255). */
function pixels(c: HTMLCanvasElement, fn: (i: number, x: number, y: number, out: number[]) => void) {
  const x = ctx2d(c), img = x.getImageData(0, 0, TS, TS), d = img.data, o = [0, 0, 0];
  for (let y = 0; y < TS; y++) for (let xx = 0; xx < TS; xx++) {
    const i = y * TS + xx; o[0] = d[i * 4]; o[1] = d[i * 4 + 1]; o[2] = d[i * 4 + 2];
    fn(i, xx, y, o);
    d[i * 4] = clamp(o[0], 0, 255); d[i * 4 + 1] = clamp(o[1], 0, 255); d[i * 4 + 2] = clamp(o[2], 0, 255); d[i * 4 + 3] = 255;
  }
  x.putImageData(img, 0, 0);
}

/** 90° herringbone of 2u×u bricks; seamless when TS/u is a multiple of 4. */
function herringbone(x: C2D, r: Rng, u: number, draw: (X: number, Y: number, w: number, h: number) => void) {
  const N = TS / u;
  for (let m = -N; m <= N; m++) for (let k = -N; k <= N; k++) {
    const bx = k + 2 * m, by = k - 2 * m;
    for (const [ox, oy, w, h] of [[0, 0, 2, 1], [0, 1, 1, 2]] as const) {
      const X = (bx + ox) * u, Y = (by + oy) * u;
      if (X < -2 * u || X > TS || Y < -2 * u || Y > TS) continue;
      draw(X, Y, w * u, h * u);
    }
  }
  void r;
}

/** Ridged-noise marble veins: thin flowing lines where fbm crosses 0.5. */
function marbleVeins(c: HTMLCanvasElement, seed: number, col: [number, number, number], cells: number, width: number, amt: number) {
  const n = fbmTile(TS, cells, 5, seed + 13, 0.55);
  pixels(c, (i, _x, _y, o) => {
    const v = 1 - Math.abs(2 * n[i] - 1), k = (smoothstep(1 - width, 1, v) * 0.85 + smoothstep(1 - width * 4, 1, v) * 0.25) * amt;
    o[0] = lerp(o[0], col[0], k); o[1] = lerp(o[1], col[1], k); o[2] = lerp(o[2], col[2], k);
  });
}
function veins(c: HTMLCanvasElement, seed: number, col: [number, number, number], freq: number, sharp: number, amt: number, warp = 6) {
  const n = fbmTile(TS, 3, 5, seed + 11), n2 = fbmTile(TS, 6, 4, seed + 29);
  pixels(c, (i, x, y, o) => {
    const v = Math.abs(Math.sin(((x + y * 0.6) / TS) * Math.PI * 2 * freq + n[i] * warp + n2[i] * 2));
    const k = Math.pow(1 - v, sharp) * amt;
    o[0] = lerp(o[0], col[0], k); o[1] = lerp(o[1], col[1], k); o[2] = lerp(o[2], col[2], k);
  });
}

function leafAt(x: C2D, X: number, Y: number, L: number, W: number, a: number, col: string, vein = true) {
  x.save(); x.translate(X, Y); x.rotate(a);
  x.beginPath(); x.moveTo(-L / 2, 0); x.quadraticCurveTo(0, -W, L / 2, 0); x.quadraticCurveTo(0, W, -L / 2, 0); x.closePath();
  x.fillStyle = col; x.fill(); x.strokeStyle = 'rgba(0,0,0,0.25)'; x.lineWidth = 0.8; x.stroke();
  if (vein) { x.beginPath(); x.moveTo(-L / 2, 0); x.lineTo(L / 2, 0); x.strokeStyle = 'rgba(0,0,0,0.2)'; x.stroke(); }
  x.restore();
}

function stars(x: C2D, r: Rng, n: number, big = 0) {
  for (let i = 0; i < n; i++) { const px = r() * TS, py = r() * TS, s = rrange(r, 0.5, 1.6); x.fillStyle = `rgba(255,255,255,${rrange(r, 0.4, 1)})`; wrap(x, px, py, 3, (X, Y) => x.fillRect(X, Y, s, s)); }
  for (let i = 0; i < big; i++) {
    const px = r() * TS, py = r() * TS, s = rrange(r, 3, 6);
    wrap(x, px, py, 12, (X, Y) => {
      const g = x.createRadialGradient(X, Y, 0, X, Y, s * 2.4); g.addColorStop(0, 'rgba(255,255,255,0.9)'); g.addColorStop(1, 'rgba(160,190,255,0)');
      x.fillStyle = g; x.beginPath(); x.arc(X, Y, s * 2.4, 0, Math.PI * 2); x.fill();
      x.strokeStyle = 'rgba(255,255,255,0.8)'; x.lineWidth = 0.8; x.beginPath(); x.moveTo(X - s * 2, Y); x.lineTo(X + s * 2, Y); x.moveTo(X, Y - s * 2); x.lineTo(X, Y + s * 2); x.stroke();
    });
  }
}

function runeGlyph(x: C2D, r: Rng, X: number, Y: number, s: number) {
  x.beginPath();
  const n = 2 + Math.floor(r() * 3);
  for (let i = 0; i < n; i++) {
    const k = r();
    if (k < 0.4) { x.moveTo(X + rrange(r, -s, s) * 0.5, Y - s / 2); x.lineTo(X + rrange(r, -s, s) * 0.5, Y + s / 2); }
    else if (k < 0.75) { const yy = Y + rrange(r, -s, s) * 0.4; x.moveTo(X - s / 2, yy); x.lineTo(X + s / 2, yy + rrange(r, -s, s) * 0.3); }
    else { x.moveTo(X - s / 2, Y - s / 2); x.lineTo(X, Y + s / 2); x.lineTo(X + s / 2, Y - s / 2); }
  }
  x.stroke();
}

/** Painterly world-map ground: soft two-tone noise with dabbed brush strokes. */
function worldGround(seed: number, c1: string, c2: string, r: Rng, dabs: string[]): HTMLCanvasElement {
  const c = noiseBase(seed, c1, c2, 0.03, 3, 0.9), x = ctx2d(c);
  blotches(x, r, 110, dabs, [6, 22]);
  x.lineCap = 'round';
  for (let i = 0; i < 320; i++) {
    const px = r() * TS, py = r() * TS, L = rrange(r, 6, 14), a = rrange(r, -0.5, 0.5) - 0.6;
    x.strokeStyle = r() < 0.5 ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.06)'; x.lineWidth = rrange(r, 2, 4);
    wrap(x, px, py, 16, (X, Y) => { x.beginPath(); x.moveTo(X, Y); x.lineTo(X + Math.cos(a) * L, Y + Math.sin(a) * L); x.stroke(); });
  }
  return c;
}

function generate(id: string): HTMLCanvasElement {
  const photo = makeCanvas(TS, TS);
  if (drawPhotoGround(id, ctx2d(photo), TS)) return photo;
  // photo-only floors fall back to a painted look-alike
  if (id === 'mossycobble') return generate('cobble');
  if (id === 'grassystones') return generate('crazypaving');
  if (id === 'wornflags' || id === 'darktiles') return generate('flagstone');
  if (id === 'wornplanks') return generate('wood');
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
    case 'fog_world': {
      // terra incognita: aged parchment with faint ink hatching
      c = noiseBase(seed, '#cdbb92', '#ddcca4', 0.04, 2, 0.7); x = ctx2d(c);
      overlayNoise(x, seed + 1, 0.05, 8);
      for (let i = 0; i < 2500; i++) { x.fillStyle = r() < 0.5 ? 'rgba(110,80,40,0.10)' : 'rgba(255,250,235,0.12)'; x.fillRect(r() * TS, r() * TS, 1.2, 1.2); }
      break;
    }
    case 'w_ocean': {
      c = noiseBase(seed, '#2a6686', '#337392', 0.02, 2, 0.6); x = ctx2d(c);
      x.lineCap = 'round';
      for (let i = 0; i < 46; i++) {
        const px = r() * TS, py = r() * TS, L = rrange(r, 14, 30);
        x.strokeStyle = `rgba(220,240,250,${rrange(r, 0.05, 0.1)})`; x.lineWidth = rrange(r, 1, 1.6);
        wrap(x, px, py, 34, (X, Y) => { x.beginPath(); x.moveTo(X, Y); x.quadraticCurveTo(X + L / 2, Y - 4, X + L, Y); x.stroke(); });
      }
      break;
    }
    case 'land': { const src = getTexture('w_land'); c = makeCanvas(TS, TS); x = ctx2d(c); x.drawImage(src, 0, 0); x.fillStyle = 'rgba(47,111,143,1)'; x.beginPath(); x.moveTo(TS, 0); x.lineTo(TS, TS); x.lineTo(0, TS); x.closePath(); x.fill(); break; }
    case 'w_land': c = worldGround(seed, '#93ad62', '#b4c47c', r, ['rgba(70,100,40,0.10)', 'rgba(230,220,150,0.08)']); break;
    case 'w_forest': c = worldGround(seed, '#4f7d3c', '#6b9450', r, ['rgba(30,60,20,0.14)', 'rgba(150,180,90,0.08)']); break;
    case 'w_jungle': c = worldGround(seed, '#2f6a32', '#4a8a44', r, ['rgba(20,50,20,0.16)', 'rgba(120,180,80,0.08)']); break;
    case 'w_steppe': c = worldGround(seed, '#b4ab68', '#cfc386', r, ['rgba(120,110,50,0.10)', 'rgba(240,230,170,0.08)']); break;
    case 'w_desert': {
      c = worldGround(seed, '#dcc184', '#ecd7a2', r, ['rgba(170,130,70,0.10)', 'rgba(255,250,220,0.10)']); x = ctx2d(c);
      for (let i = 0; i < 26; i++) {
        const y0 = r() * TS, amp = rrange(r, 4, 9), ph = r() * 6.28;
        x.strokeStyle = 'rgba(150,110,60,0.18)'; x.lineWidth = 1.6;
        for (const oy of [-TS, 0, TS]) { x.beginPath(); for (let px = 0; px <= TS; px += 8) { const yy = y0 + oy + Math.sin((px / TS) * Math.PI * 2 * 2 + ph) * amp; px ? x.lineTo(px, yy) : x.moveTo(px, yy); } x.stroke(); }
      }
      break;
    }
    case 'w_badlands': {
      c = worldGround(seed, '#b07a4e', '#cc9a68', r, ['rgba(110,60,30,0.14)', 'rgba(240,200,150,0.08)']); x = ctx2d(c);
      cracks(x, r, 30, 'rgba(90,50,25,0.35)', [10, 26], 1.2);
      break;
    }
    case 'w_swamp': {
      c = worldGround(seed, '#6e7e48', '#8a9660', r, ['rgba(60,80,50,0.18)', 'rgba(150,170,110,0.08)']); x = ctx2d(c);
      blotches(x, r, 40, ['rgba(70,110,110,0.22)'], [4, 12]);
      break;
    }
    case 'w_highland': c = worldGround(seed, '#9a8c6e', '#b7aa88', r, ['rgba(80,70,50,0.14)', 'rgba(230,220,190,0.08)']); break;
    case 'w_tundra': c = worldGround(seed, '#a8b49a', '#c4ccb6', r, ['rgba(110,120,100,0.12)', 'rgba(250,250,245,0.12)']); break;
    case 'w_snow': {
      c = worldGround(seed, '#e2eaf0', '#f8fbfd', r, ['rgba(150,180,210,0.12)', 'rgba(255,255,255,0.2)']);
      break;
    }
    case 'w_volcanic': {
      c = worldGround(seed, '#4a403c', '#665a54', r, ['rgba(20,15,12,0.2)', 'rgba(180,90,40,0.10)']); x = ctx2d(c);
      cracks(x, r, 26, 'rgba(255,110,40,0.35)', [8, 22], 1.2);
      break;
    }
    case 'parquet': {
      c = noiseBase(seed, '#8a5a30', '#a8743e', 0.05, 5, 1); x = ctx2d(c);
      herringbone(x, r, 25, (X, Y, w, h) => {
        const f = rrange(r, -0.13, 0.13), vertical = h > w;
        wrap(x, X + w / 2, Y + h / 2, 60, (cx, cy) => {
          const X0 = cx - w / 2, Y0 = cy - h / 2;
          x.fillStyle = f > 0 ? `rgba(255,225,170,${f})` : `rgba(40,20,5,${-f})`; x.fillRect(X0, Y0, w, h);
          x.strokeStyle = 'rgba(60,30,10,0.2)'; x.lineWidth = 0.8;
          for (let g = 0; g < 3; g++) { x.beginPath(); if (vertical) { const gx = X0 + 4 + g * 8; x.moveTo(gx, Y0); x.quadraticCurveTo(gx + 2, Y0 + h / 2, gx, Y0 + h); } else { const gy = Y0 + 4 + g * 8; x.moveTo(X0, gy); x.quadraticCurveTo(X0 + w / 2, gy + 2, X0 + w, gy); } x.stroke(); }
          x.fillStyle = 'rgba(255,230,190,0.12)'; x.fillRect(X0, Y0, w, 1.5);
          x.strokeStyle = 'rgba(35,18,6,0.85)'; x.lineWidth = 1.6; x.strokeRect(X0, Y0, w, h);
        });
      });
      overlayNoise(x, seed, 0.06);
      break;
    }
    case 'brickfloor': {
      c = noiseBase(seed, '#7a3a2a', '#9a5440', 0.08, 5, 1); x = ctx2d(c);
      x.fillStyle = '#5a4a40'; x.fillRect(0, 0, TS, TS);
      herringbone(x, r, 20, (X, Y, w, h) => {
        const v = rrange(r, 0.82, 1.15), col = `rgb(${(160 * v) | 0},${(82 * v) | 0},${(60 * v) | 0})`;
        wrap(x, X + w / 2, Y + h / 2, 50, (cx, cy) => {
          const X0 = cx - w / 2 + 1.2, Y0 = cy - h / 2 + 1.2, W = w - 2.4, H = h - 2.4;
          x.fillStyle = col; x.fillRect(X0, Y0, W, H);
          x.fillStyle = 'rgba(255,220,190,0.12)'; x.fillRect(X0, Y0, W, 2);
          x.fillStyle = 'rgba(0,0,0,0.18)'; x.fillRect(X0, Y0 + H - 2, W, 2);
        });
      });
      overlayNoise(x, seed, 0.1, 30);
      break;
    }
    case 'deck': {
      c = noiseBase(seed, '#7a6650', '#988268', 0.06, 5, 1); x = ctx2d(c);
      const rh = 25;
      for (let row = 0; row < TS / rh; row++) {
        const y = row * rh, f = rrange(r, -0.1, 0.1), off = (row % 4) * 100;
        x.fillStyle = f > 0 ? `rgba(255,240,210,${f})` : `rgba(20,10,0,${-f})`; x.fillRect(0, y, TS, rh);
        x.strokeStyle = 'rgba(50,35,20,0.25)'; x.lineWidth = 1;
        for (let g = 0; g < 3; g++) { const gy = y + 5 + g * 7; x.beginPath(); for (let px = 0; px <= TS; px += 10) { const yy = gy + Math.sin((px / TS) * Math.PI * 2 * 3 + row + g) * 1.2; px ? x.lineTo(px, yy) : x.moveTo(px, yy); } x.stroke(); }
        x.strokeStyle = 'rgba(30,20,10,0.9)'; x.lineWidth = 2; x.beginPath(); x.moveTo(0, y); x.lineTo(TS, y); x.stroke();
        for (let k = 0; k < 2; k++) { const bx = (off + k * 200) % TS; x.beginPath(); x.moveTo(bx, y); x.lineTo(bx, y + rh); x.stroke(); x.fillStyle = 'rgba(20,20,20,0.8)'; for (const s of [-4, 4]) { x.beginPath(); x.arc(bx + s, y + 6, 1.4, 0, 7); x.arc(bx + s, y + rh - 6, 1.4, 0, 7); x.fill(); } }
      }
      blotches(x, r, 30, ['rgba(0,0,0,0.06)', 'rgba(255,255,255,0.04)'], [10, 30]);
      break;
    }
    case 'stonetiles': {
      c = noiseBase(seed, '#6e6a62', '#8a857c', 0.1, 5, 1); x = ctx2d(c);
      slabs(x, r, 100, [100], 'rgba(25,22,20,0.95)', { tint: 0.1, lw: 3.5, stagger: false });
      cracks(x, r, 22, 'rgba(25,22,20,0.5)', [10, 30], 1.1);
      blotches(x, r, 40, ['rgba(0,0,0,0.07)'], [6, 18]);
      break;
    }
    case 'pavers': {
      c = noiseBase(seed, '#a89e88', '#c2b8a2', 0.08, 5, 1); x = ctx2d(c);
      slabs(x, r, 66.666, [66.666, 100, 133.333], 'rgba(70,62,50,0.9)', { tint: 0.07, lw: 3 });
      cracks(x, r, 12, 'rgba(60,50,40,0.35)', [8, 20], 1);
      blades(x, r, 120, 'rgba(70,100,40,0.5)', 'rgba(110,140,60,0.4)', [3, 6], 1);
      break;
    }
    case 'crazypaving': {
      c = makeCanvas(TS, TS); x = ctx2d(c);
      const v = voronoi(9, seed), cols = Array.from({ length: v.n }, () => rrange(r, 0.82, 1.15));
      const n = fbmTile(TS, 20, 3, seed);
      x.fillStyle = '#000'; x.fillRect(0, 0, TS, TS);
      pixels(c, (i, _x, _y, o) => {
        const e = v.f2[i] - v.f1[i], k = cols[v.id[i]] * (0.92 + n[i] * 0.16);
        const edge = smoothstep(1.5, 3.5, e), bev = smoothstep(3.5, 9, e);
        const base = [148 * k, 140 * k, 126 * k];
        o[0] = lerp(70, base[0] * (0.85 + 0.15 * bev), edge); o[1] = lerp(64, base[1] * (0.85 + 0.15 * bev), edge); o[2] = lerp(56, base[2] * (0.85 + 0.15 * bev), edge);
      });
      blades(x, r, 260, 'rgba(70,100,40,0.5)', 'rgba(110,140,60,0.4)', [3, 6], 1);
      break;
    }
    case 'hextiles': {
      c = noiseBase(seed, '#6a7a7e', '#86969a', 0.06, 5, 1); x = ctx2d(c);
      const s = TS / 12, hgt = TS / 7;
      for (let col = -1; col <= 8; col++) for (let row = -1; row <= 7; row++) {
        const cx = col * 1.5 * s, cy = row * hgt + (col % 2 ? hgt / 2 : 0), v = rrange(r, -0.1, 0.1);
        wrap(x, cx, cy, s * 2, (X, Y) => {
          x.beginPath(); for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; x.lineTo(X + Math.cos(a) * s * 0.97, Y + Math.sin(a) * (hgt / 2) * 0.97 / Math.sin(Math.PI / 3)); } x.closePath();
          x.fillStyle = v > 0 ? `rgba(255,255,255,${v})` : `rgba(0,0,0,${-v})`; x.fill();
          x.strokeStyle = 'rgba(20,24,26,0.85)'; x.lineWidth = 2.6; x.stroke();
          x.strokeStyle = 'rgba(255,255,255,0.12)'; x.lineWidth = 1; x.beginPath(); for (let k = 3; k <= 5; k++) { const a = (k / 6) * Math.PI * 2; x.lineTo(X + Math.cos(a) * s * 0.85, Y + Math.sin(a) * (hgt / 2) * 0.85 / Math.sin(Math.PI / 3)); } x.stroke();
        });
      }
      cracks(x, r, 12, 'rgba(20,24,26,0.4)', [8, 18], 1);
      break;
    }
    case 'sandstone': {
      c = noiseBase(seed, '#c09a64', '#dcbc88', 0.08, 5, 1); x = ctx2d(c);
      slabs(x, r, 50, [50, 100, 100, 150], 'rgba(110,80,40,0.85)', { tint: 0.08, lw: 2.5 });
      for (let i = 0; i < 6; i++) { const px = Math.floor(r() * 8) * 50 + 25, py = Math.floor(r() * 8) * 50 + 25; x.strokeStyle = 'rgba(110,80,40,0.5)'; x.lineWidth = 1.4; wrap(x, px, py, 30, (X, Y) => { x.beginPath(); x.arc(X, Y, 12, 0, 7); x.moveTo(X - 7, Y); x.lineTo(X + 7, Y); x.moveTo(X, Y - 7); x.lineTo(X, Y + 7); x.stroke(); }); }
      pebbles(x, r, 160, '#c8a878', [0.8, 1.8]);
      break;
    }
    case 'marble': {
      c = noiseBase(seed, '#dcd6ca', '#f2eee6', 0.03, 4, 0.8); marbleVeins(c, seed, [130, 122, 112], 2, 0.025, 0.7); marbleVeins(c, seed + 5, [185, 176, 166], 4, 0.025, 0.5); x = ctx2d(c);
      x.strokeStyle = 'rgba(120,110,100,0.35)'; x.lineWidth = 1.2;
      for (let k = 0; k <= 4; k++) { x.beginPath(); x.moveTo(k * 100, 0); x.lineTo(k * 100, TS); x.moveTo(0, k * 100); x.lineTo(TS, k * 100); x.stroke(); }
      break;
    }
    case 'marbledark': {
      c = noiseBase(seed, '#1e1e24', '#34343c', 0.04, 4, 0.8); marbleVeins(c, seed, [200, 168, 96], 2, 0.022, 0.75); marbleVeins(c, seed + 9, [90, 90, 104], 4, 0.025, 0.45); x = ctx2d(c);
      x.strokeStyle = 'rgba(0,0,0,0.7)'; x.lineWidth = 1.6;
      for (let k = 0; k <= 4; k++) { x.beginPath(); x.moveTo(k * 100, 0); x.lineTo(k * 100, TS); x.moveTo(0, k * 100); x.lineTo(TS, k * 100); x.stroke(); }
      break;
    }
    case 'mosaic': {
      c = makeCanvas(TS, TS); x = ctx2d(c);
      x.fillStyle = '#d8d0c0'; x.fillRect(0, 0, TS, TS);
      const g = 10, pal = ['#2a4a7a', '#3a6a9a', '#c8a050', '#e8e0d0', '#8a2a2a', '#2a6a5a'];
      for (let gy = 0; gy < TS / g; gy++) for (let gx = 0; gx < TS / g; gx++) {
        const cx = (gx * g + g / 2) % 200 - 100, cy = (gy * g + g / 2) % 200 - 100, d = Math.hypot(cx, cy), a = Math.atan2(cy, cx);
        let col = pal[0];
        if (d < 18) col = pal[2]; else if (d < 30) col = pal[4]; else if (d < 70 && Math.abs(Math.sin(a * 4)) > 0.75 - (d - 30) / 120) col = pal[3]; else if (d < 76) col = pal[2]; else if (Math.abs(cx) > 92 || Math.abs(cy) > 92) col = pal[5]; else col = r() < 0.5 ? pal[0] : pal[1];
        const v = rrange(r, 0.85, 1.12), [rr, gg, bb] = hexToRgb(col);
        x.fillStyle = `rgb(${clamp(rr * v, 0, 255) | 0},${clamp(gg * v, 0, 255) | 0},${clamp(bb * v, 0, 255) | 0})`;
        const j = () => rrange(r, -1, 1);
        x.beginPath(); x.moveTo(gx * g + 1 + j(), gy * g + 1 + j()); x.lineTo(gx * g + g - 1 + j(), gy * g + 1 + j()); x.lineTo(gx * g + g - 1 + j(), gy * g + g - 1 + j()); x.lineTo(gx * g + 1 + j(), gy * g + g - 1 + j()); x.closePath(); x.fill();
      }
      overlayNoise(x, seed, 0.1);
      break;
    }
    case 'carpet': {
      c = noiseBase(seed, '#7a1622', '#8e2230', 0.04, 5, 0.8); x = ctx2d(c);
      for (let i = 0; i < 9000; i++) { x.fillStyle = r() < 0.5 ? 'rgba(0,0,0,0.12)' : 'rgba(255,200,200,0.06)'; x.fillRect(r() * TS, r() * TS, 1, 1); }
      for (let ty = 0; ty < 2; ty++) for (let tx = 0; tx < 2; tx++) {
        const ox = tx * 200 + 100, oy = ty * 200 + 100;
        x.strokeStyle = '#d4af37'; x.lineWidth = 3; x.beginPath(); x.moveTo(ox, oy - 70); x.lineTo(ox + 70, oy); x.lineTo(ox, oy + 70); x.lineTo(ox - 70, oy); x.closePath(); x.stroke();
        x.lineWidth = 1.2; x.beginPath(); x.moveTo(ox, oy - 58); x.lineTo(ox + 58, oy); x.lineTo(ox, oy + 58); x.lineTo(ox - 58, oy); x.closePath(); x.stroke();
        x.fillStyle = '#1f2a5a'; x.beginPath(); x.moveTo(ox, oy - 30); x.lineTo(ox + 30, oy); x.lineTo(ox, oy + 30); x.lineTo(ox - 30, oy); x.closePath(); x.fill(); x.stroke();
        x.fillStyle = '#d4af37'; x.beginPath(); x.arc(ox, oy, 8, 0, 7); x.fill();
        for (const [dx, dy] of [[-100, -100], [100, -100], [-100, 100], [100, 100]]) { x.beginPath(); x.arc(ox + dx, oy + dy, 14, 0, 7); x.fillStyle = '#1f2a5a'; x.fill(); x.strokeStyle = '#d4af37'; x.lineWidth = 2; x.stroke(); }
        for (let k = 0; k < 4; k++) { const a = (k / 4) * Math.PI * 2 + Math.PI / 4; x.fillStyle = '#e8d8b0'; x.beginPath(); x.ellipse(ox + Math.cos(a) * 44, oy + Math.sin(a) * 44, 7, 3, a, 0, 7); x.fill(); }
      }
      break;
    }
    case 'runes': {
      c = noiseBase(seed, '#4e525c', '#646874', 0.08, 5, 1); x = ctx2d(c);
      slabs(x, r, 100, [100], 'rgba(18,18,24,0.95)', { tint: 0.08, lw: 3, align: true });
      for (let gy = 0; gy < 4; gy++) for (let gx = 0; gx < 4; gx++) {
        if (r() < 0.8) continue;
        const cx = gx * 100 + 50, cy = gy * 100 + 50;
        x.save(); x.shadowColor = 'rgba(110,200,255,0.7)'; x.shadowBlur = 6; x.strokeStyle = 'rgba(150,220,255,0.6)'; x.lineWidth = 1.6; x.lineCap = 'round';
        x.beginPath(); x.arc(cx, cy, 30, 0, 7); x.stroke();
        for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; runeGlyph(x, r, cx + Math.cos(a) * 20, cy + Math.sin(a) * 20, 8); }
        x.restore();
      }
      cracks(x, r, 14, 'rgba(18,18,24,0.5)', [8, 20], 1);
      break;
    }
    case 'irongrate': {
      c = noiseBase(seed, '#3e4248', '#54585e', 0.08, 5, 1); x = ctx2d(c);
      slabs(x, r, 100, [100], 'rgba(15,16,18,0.95)', { tint: 0.06, lw: 3, align: true });
      for (let gy = 0; gy < 4; gy++) for (let gx = 0; gx < 4; gx++) {
        const X = gx * 100, Y = gy * 100;
        if ((gx + gy) % 2 === 0) { x.fillStyle = '#121416'; for (let k = 0; k < 6; k++) x.fillRect(X + 14 + k * 13, Y + 14, 7, 72); x.fillStyle = 'rgba(255,255,255,0.08)'; for (let k = 0; k < 6; k++) x.fillRect(X + 21 + k * 13, Y + 14, 1.5, 72); }
        else { x.strokeStyle = 'rgba(255,255,255,0.08)'; x.lineWidth = 2; for (let k = 0; k < 9; k++) { x.beginPath(); x.moveTo(X + 10 + k * 10, Y + 10); x.lineTo(X + 10, Y + 10 + k * 10); x.stroke(); } }
        x.fillStyle = '#7a7e84'; for (const [dx, dy] of [[8, 8], [92, 8], [8, 92], [92, 92]]) { x.beginPath(); x.arc(X + dx, Y + dy, 3.2, 0, 7); x.fill(); }
      }
      blotches(x, r, 50, ['rgba(140,70,30,0.12)', 'rgba(0,0,0,0.1)'], [6, 22]);
      break;
    }
    case 'straw': {
      c = noiseBase(seed, '#a88a40', '#d0b062', 0.08, 5, 1); x = ctx2d(c);
      x.lineCap = 'round';
      for (let i = 0; i < 3600; i++) {
        const px = r() * TS, py = r() * TS, L = rrange(r, 8, 20), a = r() * Math.PI;
        x.strokeStyle = pick(r, ['rgba(240,215,130,0.8)', 'rgba(170,135,60,0.75)', 'rgba(210,180,90,0.8)', 'rgba(120,95,40,0.6)']); x.lineWidth = rrange(r, 0.8, 1.8);
        wrap(x, px, py, 22, (X, Y) => { x.beginPath(); x.moveTo(X, Y); x.lineTo(X + Math.cos(a) * L, Y + Math.sin(a) * L); x.stroke(); });
      }
      break;
    }
    case 'meadow': {
      c = getTexture('grass'); const base = c; c = makeCanvas(TS, TS); x = ctx2d(c); x.drawImage(base, 0, 0);
      x.globalCompositeOperation = 'multiply'; x.fillStyle = 'rgba(230,255,200,1)'; x.fillRect(0, 0, TS, TS); x.globalCompositeOperation = 'source-over';
      for (let i = 0; i < 520; i++) {
        const px = r() * TS, py = r() * TS, col = pick(r, ['#f4d35e', '#ee6c9c', '#ffffff', '#9b7ddb', '#ff8c42', '#e83a3a', '#7ab0f0']);
        wrap(x, px, py, 5, (X, Y) => { x.fillStyle = col; for (let k = 0; k < 5; k++) { const a = (k / 5) * Math.PI * 2; x.beginPath(); x.arc(X + Math.cos(a) * 1.8, Y + Math.sin(a) * 1.8, 1.5, 0, 7); x.fill(); } x.fillStyle = '#e8b030'; x.beginPath(); x.arc(X, Y, 1, 0, 7); x.fill(); });
      }
      break;
    }
    case 'leaves': {
      c = noiseBase(seed, '#5a3e24', '#7a5634', 0.08, 5, 1); x = ctx2d(c);
      for (let i = 0; i < 1500; i++) { const px = r() * TS, py = r() * TS, L = rrange(r, 9, 15), col = pick(r, ['#c86a2a', '#e8a040', '#a83a1a', '#d8b040', '#8a5a2a', '#b84a22', '#6a4a24']), a = r() * Math.PI * 2; wrap(x, px, py, 10, (X, Y) => leafAt(x, X, Y, L, L * 0.35, a, col)); }
      break;
    }
    case 'jungle': {
      c = noiseBase(seed, '#1e3a1a', '#30502a', 0.08, 5, 1); x = ctx2d(c);
      for (let i = 0; i < 700; i++) { const px = r() * TS, py = r() * TS, L = rrange(r, 16, 34), col = pick(r, ['#2a5a24', '#3a7030', '#4a8a38', '#1e4a1c', '#5a8a34']), a = r() * Math.PI * 2; wrap(x, px, py, 20, (X, Y) => leafAt(x, X, Y, L, L * 0.28, a, col)); }
      blades(x, r, 900, 'rgba(20,40,15,0.5)', 'rgba(110,160,60,0.35)', [4, 9]);
      break;
    }
    case 'swamp': {
      c = noiseBase(seed, '#3a3a22', '#56603a', 0.1, 5, 1.3); x = ctx2d(c);
      blotches(x, r, 26, ['rgba(40,55,35,0.6)', 'rgba(30,40,25,0.5)'], [12, 30]);
      blotches(x, r, 40, ['rgba(120,150,80,0.12)'], [6, 14]);
      blades(x, r, 1600, 'rgba(40,55,20,0.5)', 'rgba(140,150,70,0.4)', [5, 12]);
      pebbles(x, r, 60, '#5a5040', [1, 2.5]);
      break;
    }
    case 'crackedearth': {
      c = makeCanvas(TS, TS); x = ctx2d(c);
      const v = voronoi(7, seed, 1), n = fbmTile(TS, 6, 4, seed), cols = Array.from({ length: v.n }, () => rrange(r, 0.9, 1.08));
      pixels(c, (i, _x, _y, o) => {
        const e = v.f2[i] - v.f1[i], k = cols[v.id[i]] * (0.9 + n[i] * 0.2), edge = smoothstep(1.2, 3.2, e), rim = 1 - smoothstep(3, 10, e) * 0.18;
        o[0] = lerp(70, 205 * k * rim, edge); o[1] = lerp(48, 160 * k * rim, edge); o[2] = lerp(30, 104 * k * rim, edge);
      });
      x = ctx2d(c); pebbles(x, r, 80, '#b89060', [0.8, 1.8]);
      break;
    }
    case 'ash': {
      c = noiseBase(seed, '#2a2624', '#4a4440', 0.12, 5, 1.2); x = ctx2d(c);
      cracks(x, r, 40, 'rgba(10,8,8,0.6)', [10, 34], 1.4);
      blotches(x, r, 80, ['rgba(150,145,140,0.1)', 'rgba(0,0,0,0.15)'], [4, 18]);
      for (let i = 0; i < 70; i++) { const px = r() * TS, py = r() * TS, R = rrange(r, 0.8, 2); wrap(x, px, py, 8, (X, Y) => { const g = x.createRadialGradient(X, Y, 0, X, Y, R * 4); g.addColorStop(0, 'rgba(255,140,40,0.9)'); g.addColorStop(1, 'rgba(255,80,0,0)'); x.fillStyle = g; x.beginPath(); x.arc(X, Y, R * 4, 0, 7); x.fill(); }); }
      pebbles(x, r, 120, '#3a3532', [1, 3]);
      break;
    }
    case 'obsidian': {
      c = makeCanvas(TS, TS); x = ctx2d(c);
      const v = voronoi(6, seed, 1), shadeK = Array.from({ length: v.n }, () => [rrange(r, -1, 1), rrange(r, -1, 1), rrange(r, 0.7, 1.2)]);
      pixels(c, (i, px, py, o) => {
        const [gx, gy, k] = shadeK[v.id[i]], e = v.f2[i] - v.f1[i];
        const sheen = 0.5 + 0.5 * Math.sin((v.dx[i] * gx + v.dy[i] * gy) * 0.07 + gx * 3);
        const base = 18 + sheen * 22 * k, edge = 1 - smoothstep(0.8, 2.6, e);
        o[0] = base + edge * 90; o[1] = base * 0.85 + edge * 60; o[2] = base * 1.25 + edge * 140;
      });
      break;
    }
    case 'crystal': {
      c = makeCanvas(TS, TS); x = ctx2d(c);
      const v = voronoi(6, seed, 1), pal = [[92, 128, 160], [110, 102, 156], [86, 140, 146], [120, 140, 170]], sh = Array.from({ length: v.n }, () => [pick(r, pal), rrange(r, -1, 1), rrange(r, -1, 1)] as const);
      pixels(c, (i, px, py, o) => {
        const [col, gx, gy] = sh[v.id[i]], e = v.f2[i] - v.f1[i];
        const g = 0.82 + 0.18 * Math.sin((v.dx[i] * gx + v.dy[i] * gy) * 0.06 + gy * 3), edge = 1 - smoothstep(0.8, 2.4, e);
        o[0] = col[0] * g + edge * 70; o[1] = col[1] * g + edge * 80; o[2] = col[2] * g + edge * 70;
      });
      x = ctx2d(c);
      for (let i = 0; i < 40; i++) { const px = r() * TS, py = r() * TS; wrap(x, px, py, 6, (X, Y) => { x.fillStyle = 'rgba(255,255,255,0.8)'; x.beginPath(); x.moveTo(X, Y - 4); x.quadraticCurveTo(X, Y, X + 4, Y); x.quadraticCurveTo(X, Y, X, Y + 4); x.quadraticCurveTo(X, Y, X - 4, Y); x.quadraticCurveTo(X, Y, X, Y - 4); x.fill(); }); }
      break;
    }
    case 'ice': {
      c = noiseBase(seed, '#a8d0e4', '#dcf0fa', 0.04, 4, 0.9); x = ctx2d(c);
      const v = voronoi(5, seed, 1);
      pixels(c, (i, _x, _y, o) => { const e = v.f2[i] - v.f1[i], line2 = 1 - smoothstep(0.5, 1.8, e); o[0] += line2 * 50; o[1] += line2 * 40; o[2] += line2 * 30; });
      x = ctx2d(c);
      for (let i = 0; i < 26; i++) { const px = r() * TS, py = r() * TS, R = rrange(r, 1, 3); wrap(x, px, py, 4, (X, Y) => { x.strokeStyle = 'rgba(255,255,255,0.6)'; x.lineWidth = 0.8; x.beginPath(); x.arc(X, Y, R, 0, 7); x.stroke(); }); }
      x.strokeStyle = 'rgba(255,255,255,0.25)'; x.lineWidth = 1.2;
      for (let i = 0; i < 30; i++) { const px = r() * TS, py = r() * TS, L = rrange(r, 20, 60), a = rrange(r, -0.4, 0.4); wrap(x, px, py, 60, (X, Y) => { x.beginPath(); x.moveTo(X, Y); x.lineTo(X + Math.cos(a) * L, Y + Math.sin(a) * L); x.stroke(); }); }
      break;
    }
    case 'bonefloor': {
      c = noiseBase(seed, '#3a3228', '#4e4434', 0.1, 5, 1); x = ctx2d(c);
      x.lineCap = 'round';
      for (let i = 0; i < 700; i++) {
        const px = r() * TS, py = r() * TS, L = rrange(r, 14, 30), a = r() * Math.PI, col = pick(r, ['#e8e0c8', '#d8ceb0', '#c8bc98', '#bfb08a']);
        wrap(x, px, py, 34, (X, Y) => {
          const dx = Math.cos(a) * L / 2, dy = Math.sin(a) * L / 2;
          x.strokeStyle = 'rgba(30,22,14,0.8)'; x.lineWidth = 6; x.beginPath(); x.moveTo(X - dx, Y - dy); x.lineTo(X + dx, Y + dy); x.stroke();
          x.strokeStyle = col; x.lineWidth = 4; x.stroke();
          x.fillStyle = col; for (const s of [-1, 1]) { x.beginPath(); x.arc(X + s * dx + Math.sin(a) * 2, Y + s * dy - Math.cos(a) * 2, 2.6, 0, 7); x.arc(X + s * dx - Math.sin(a) * 2, Y + s * dy + Math.cos(a) * 2, 2.6, 0, 7); x.fill(); }
        });
      }
      for (let i = 0; i < 26; i++) { const px = r() * TS, py = r() * TS; wrap(x, px, py, 12, (X, Y) => { x.fillStyle = '#e2d8be'; x.strokeStyle = 'rgba(30,22,14,0.85)'; x.lineWidth = 1.4; x.beginPath(); x.ellipse(X, Y, 8, 7.5, 0, 0, 7); x.fill(); x.stroke(); x.fillStyle = '#2a2018'; x.beginPath(); x.arc(X - 3, Y - 1, 2.2, 0, 7); x.arc(X + 3, Y - 1, 2.2, 0, 7); x.fill(); }); }
      break;
    }
    case 'flesh': {
      c = noiseBase(seed, '#7a2a34', '#b05a62', 0.08, 4, 1.1); veins(c, seed, [70, 10, 30], 3, 10, 0.55, 10); veins(c, seed + 3, [210, 110, 120], 5, 30, 0.4, 8); x = ctx2d(c);
      for (let i = 0; i < 40; i++) { const px = r() * TS, py = r() * TS, R = rrange(r, 3, 9); wrap(x, px, py, R * 2, (X, Y) => { const g = x.createRadialGradient(X - R * 0.3, Y - R * 0.3, 0, X, Y, R); g.addColorStop(0, 'rgba(255,200,200,0.35)'); g.addColorStop(1, 'rgba(80,10,20,0.35)'); x.fillStyle = g; x.beginPath(); x.arc(X, Y, R, 0, 7); x.fill(); }); }
      break;
    }
    case 'astral': {
      c = noiseBase(seed, '#0a0c24', '#1a1e48', 0.04, 4, 1); x = ctx2d(c);
      const n = fbmTile(TS, 3, 5, seed + 3), n2 = fbmTile(TS, 4, 5, seed + 8);
      pixels(c, (i, _x, _y, o) => { const a = smoothstep(0.55, 0.9, n[i]), b = smoothstep(0.6, 0.95, n2[i]); o[0] += a * 90 + b * 30; o[1] += a * 30 + b * 70; o[2] += a * 120 + b * 110; });
      x = ctx2d(c); stars(x, r, 700, 8);
      break;
    }
    case 'clouds': {
      c = noiseBase(seed, '#b8cce4', '#eef4fb', 0.03, 4, 1.4); x = ctx2d(c);
      for (let i = 0; i < 90; i++) { const px = r() * TS, py = r() * TS, R = rrange(r, 14, 40); wrap(x, px, py, R * 1.6, (X, Y) => { const g = x.createRadialGradient(X - R * 0.3, Y - R * 0.3, R * 0.1, X, Y, R); g.addColorStop(0, 'rgba(255,255,255,0.85)'); g.addColorStop(0.7, 'rgba(240,246,255,0.5)'); g.addColorStop(1, 'rgba(200,215,235,0)'); x.fillStyle = g; x.beginPath(); x.arc(X, Y, R, 0, 7); x.fill(); }); }
      break;
    }
    case 'snowcover': {
      c = noiseBase(seed, '#e4ecf3', '#fbfdff', 0.04, 5, 1); x = ctx2d(c);
      blotches(x, r, 50, ['rgba(150,180,215,0.1)'], [10, 30]);
      for (let i = 0; i < 300; i++) { x.fillStyle = 'rgba(255,255,255,0.95)'; x.fillRect(r() * TS, r() * TS, 1.5, 1.5); }
      break;
    }
    case 'swampwater': {
      c = noiseBase(seed, '#2a3420', '#46502e', 0.05, 5, 1); x = ctx2d(c);
      blotches(x, r, 30, ['rgba(110,140,60,0.25)', 'rgba(20,30,10,0.3)'], [6, 20]);
      for (let i = 0; i < 60; i++) { const px = r() * TS, py = r() * TS, R = rrange(r, 2, 6); wrap(x, px, py, 8, (X, Y) => { x.fillStyle = 'rgba(120,160,60,0.6)'; x.beginPath(); x.arc(X, Y, R, 0.3, Math.PI * 2 - 0.2); x.lineTo(X, Y); x.fill(); }); }
      for (let i = 0; i < 40; i++) { const px = r() * TS, py = r() * TS; x.strokeStyle = 'rgba(200,220,160,0.15)'; x.lineWidth = 1.2; wrap(x, px, py, 20, (X, Y) => { x.beginPath(); x.moveTo(X, Y); x.quadraticCurveTo(X + 6, Y - 2, X + 14, Y); x.stroke(); }); }
      break;
    }
    case 'acid': {
      c = makeCanvas(TS, TS); x = ctx2d(c);
      const n = fbmTile(TS, 5, 5, seed), n2 = fbmTile(TS, 10, 4, seed + 4);
      const img = x.createImageData(TS, TS), d = img.data;
      for (let i = 0; i < TS * TS; i++) { const v = 1 - Math.abs(2 * n[i] - 1), g = smoothstep(0.75, 0.98, v), t2 = n2[i]; d[i * 4] = lerp(60, 200, g) + t2 * 20; d[i * 4 + 1] = lerp(150, 255, g) + t2 * 20; d[i * 4 + 2] = lerp(30, 120, g); d[i * 4 + 3] = 255; }
      x.putImageData(img, 0, 0);
      for (let i = 0; i < 70; i++) { const px = r() * TS, py = r() * TS, R = rrange(r, 1.5, 5); wrap(x, px, py, 8, (X, Y) => { x.strokeStyle = 'rgba(240,255,200,0.7)'; x.lineWidth = 1; x.beginPath(); x.arc(X, Y, R, 0, 7); x.stroke(); }); }
      break;
    }
    case 'poison': {
      c = noiseBase(seed, '#3a1450', '#6a2a8a', 0.06, 5, 1.2); x = ctx2d(c);
      const n = fbmTile(TS, 6, 4, seed + 2);
      pixels(c, (i, _x, _y, o) => { const g = smoothstep(0.7, 0.95, n[i]); o[0] += g * 80; o[1] += g * 40; o[2] += g * 90; });
      x = ctx2d(c);
      for (let i = 0; i < 60; i++) { const px = r() * TS, py = r() * TS, R = rrange(r, 1.5, 5); wrap(x, px, py, 8, (X, Y) => { x.fillStyle = 'rgba(230,180,255,0.35)'; x.beginPath(); x.arc(X, Y, R, 0, 7); x.fill(); }); }
      break;
    }
    case 'blood': {
      c = noiseBase(seed, '#4a040a', '#7a0e16', 0.05, 5, 1); x = ctx2d(c);
      for (let i = 0; i < 40; i++) { const px = r() * TS, py = r() * TS, L = rrange(r, 10, 30), a = rrange(r, -0.3, 0.3); x.strokeStyle = 'rgba(255,120,120,0.12)'; x.lineWidth = 1.4; wrap(x, px, py, 30, (X, Y) => { x.beginPath(); x.moveTo(X, Y); x.quadraticCurveTo(X + L / 2, Y - 3 + a * 10, X + L, Y + a * 10); x.stroke(); }); }
      break;
    }
    case 'tar': {
      c = noiseBase(seed, '#0c0b0a', '#1e1c1a', 0.04, 5, 1.2); x = ctx2d(c);
      for (let i = 0; i < 50; i++) { const px = r() * TS, py = r() * TS, R = rrange(r, 3, 12); wrap(x, px, py, 14, (X, Y) => { x.strokeStyle = 'rgba(180,170,160,0.12)'; x.lineWidth = 1.2; x.beginPath(); x.arc(X, Y, R, Math.PI * 1.1, Math.PI * 1.7); x.stroke(); }); }
      break;
    }
    case 'wall_dark': {
      c = noiseBase(seed, '#36343a', '#48464c', 0.1); x = ctx2d(c);
      slabs(x, r, 20, [30, 40, 50], 'rgba(10,10,12,0.95)', { tint: 0.12, lw: 2 });
      break;
    }
    case 'wall_marble': {
      c = noiseBase(seed, '#d8d2c6', '#f0ece4', 0.04); marbleVeins(c, seed, [140, 130, 120], 3, 0.04, 0.7); x = ctx2d(c);
      slabs(x, r, 25, [50, 100], 'rgba(120,112,100,0.7)', { tint: 0.04, lw: 1.4 });
      break;
    }
    case 'wall_sandstone': {
      c = noiseBase(seed, '#b89058', '#d4b07a', 0.08); x = ctx2d(c);
      slabs(x, r, 25, [50, 50, 80], 'rgba(100,70,35,0.85)', { tint: 0.08, lw: 2 });
      break;
    }
    case 'wall_palisade': {
      c = noiseBase(seed, '#5a3e24', '#7a5634', 0.08); x = ctx2d(c);
      for (let i = 0; i < 20; i++) { const X = i * 20, f = rrange(r, -0.12, 0.12); const g = x.createLinearGradient(X, 0, X + 20, 0); g.addColorStop(0, 'rgba(255,220,170,0.18)'); g.addColorStop(0.5, `rgba(${f > 0 ? '255,220,170' : '0,0,0'},${Math.abs(f)})`); g.addColorStop(1, 'rgba(0,0,0,0.35)'); x.fillStyle = g; x.fillRect(X, 0, 20, TS); x.strokeStyle = 'rgba(25,14,6,0.9)'; x.lineWidth = 2; x.beginPath(); x.moveTo(X, 0); x.lineTo(X, TS); x.stroke(); }
      for (let i = 0; i < 40; i++) { const X = Math.floor(r() * 20) * 20 + 10, Y = r() * TS; x.fillStyle = 'rgba(40,20,5,0.5)'; x.beginPath(); x.ellipse(X, Y, 2, 4, 0, 0, 7); x.fill(); }
      x.fillStyle = 'rgba(30,20,10,0.8)'; for (const y of [100, 300]) x.fillRect(0, y - 3, TS, 6);
      break;
    }
    case 'wall_hedge': {
      c = noiseBase(seed, '#244a1c', '#3a6a28', 0.1); x = ctx2d(c);
      for (let i = 0; i < 2600; i++) { const px = r() * TS, py = r() * TS, L = rrange(r, 5, 9), col = pick(r, ['#2a5420', '#3a6a28', '#4a7a30', '#5a9038', '#1e4018']), a = r() * Math.PI * 2; wrap(x, px, py, 8, (X, Y) => leafAt(x, X, Y, L, L * 0.35, a, col, false)); }
      break;
    }
    case 'wall_ice': {
      c = noiseBase(seed, '#8ab8d8', '#d0ecf8', 0.05, 4); x = ctx2d(c);
      const v = voronoi(7, seed, 1);
      pixels(c, (i, _x, _y, o) => { const e = v.f2[i] - v.f1[i], l2 = 1 - smoothstep(0.5, 2, e); o[0] += l2 * 60; o[1] += l2 * 50; o[2] += l2 * 30; });
      break;
    }
    case 'wall_obsidian': {
      c = makeCanvas(TS, TS); x = ctx2d(c);
      const v = voronoi(10, seed, 1), sk = Array.from({ length: v.n }, () => rrange(r, 0.6, 1.4));
      pixels(c, (i, px, py, o) => { const e = v.f2[i] - v.f1[i], k = sk[v.id[i]], edge = 1 - smoothstep(0.8, 2.2, e), s2 = 0.5 + 0.5 * Math.sin((v.dx[i] + v.dy[i]) * 0.09 * k + k * 4); o[0] = 20 + s2 * 25 * k + edge * 70; o[1] = 16 + s2 * 20 * k + edge * 50; o[2] = 28 + s2 * 35 * k + edge * 110; });
      break;
    }
    case 'wall_bone': {
      c = noiseBase(seed, '#a89a78', '#d0c4a2', 0.1); x = ctx2d(c);
      x.lineCap = 'round';
      for (let i = 0; i < 500; i++) { const px = r() * TS, py = r() * TS, L = rrange(r, 12, 22), a = rrange(r, -0.3, 0.3); wrap(x, px, py, 24, (X, Y) => { x.strokeStyle = 'rgba(40,30,20,0.7)'; x.lineWidth = 5; x.beginPath(); x.moveTo(X - L / 2, Y + a * L); x.lineTo(X + L / 2, Y - a * L); x.stroke(); x.strokeStyle = pick(r, ['#e8e0c8', '#d8ceb0', '#c8bc98']); x.lineWidth = 3.4; x.stroke(); }); }
      for (let i = 0; i < 40; i++) { const px = r() * TS, py = r() * TS; wrap(x, px, py, 10, (X, Y) => { x.fillStyle = '#e2d8be'; x.beginPath(); x.arc(X, Y, 6, 0, 7); x.fill(); x.fillStyle = '#2a2018'; x.beginPath(); x.arc(X - 2.2, Y - 0.5, 1.6, 0, 7); x.arc(X + 2.2, Y - 0.5, 1.6, 0, 7); x.fill(); }); }
      break;
    }
    case 'wall_crystal': {
      c = makeCanvas(TS, TS); x = ctx2d(c);
      const v = voronoi(9, seed, 1), pal = [[100, 160, 230], [140, 110, 220], [90, 200, 210]], sh = Array.from({ length: v.n }, () => [pick(r, pal), rrange(r, 0.7, 1.2)] as const);
      pixels(c, (i, px, py, o) => { const [col, k] = sh[v.id[i]], e = v.f2[i] - v.f1[i], edge = 1 - smoothstep(0.6, 2, e), g = 0.75 + 0.25 * Math.sin((v.dx[i] - v.dy[i]) * 0.08 * k + k * 4); o[0] = col[0] * g + edge * 120; o[1] = col[1] * g + edge * 120; o[2] = col[2] * g + edge * 60; });
      break;
    }
    default:
      c = noiseBase(seed, '#888888', '#999999');
  }
  return c;
}
