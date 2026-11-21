// Photographic CC0 textures (Poly Haven, see CREDITS.md) that replace or extend the painted ones.
// They are loaded once at startup; if a file is missing the painted texture is used instead.

const BASE = import.meta.env.BASE_URL + 'textures/';

/** Ground textures: file and how many copies fit across one texture tile (4 squares, about 6 m). */
export const PHOTO_GROUND: Record<string, { file: string; repeat: number; filter?: string }> = {
  cobble: { file: 'cobble.jpg', repeat: 2, filter: 'saturate(1.1) contrast(1.08)' },
  mossycobble: { file: 'mossycobble.jpg', repeat: 2, filter: 'saturate(1.15) contrast(1.05)' },
  wornflags: { file: 'wornflags.jpg', repeat: 3, filter: 'contrast(1.08)' },
  darktiles: { file: 'darktiles.jpg', repeat: 2, filter: 'contrast(1.05) brightness(1.05)' },
  wornplanks: { file: 'wornplanks.jpg', repeat: 2, filter: 'saturate(0.9) contrast(1.05)' },
  grassystones: { file: 'grassystones.jpg', repeat: 2, filter: 'saturate(1.05) brightness(1.05) contrast(1.1)' },
};
/** Roof grain for city buildings, used as a grey detail layer over each roof's own colour. */
export const PHOTO_ROOF: Record<string, string> = { tile: 'roof_tile.jpg', slate: 'roof_slate.jpg', thatch: 'roof_thatch.jpg', wood: 'roof_wood.jpg', copper: 'roof_slate.jpg' };

const images = new Map<string, HTMLImageElement>();
const roofGrain = new Map<string, HTMLCanvasElement>();

function load(file: string): Promise<HTMLImageElement | null> {
  return new Promise((res) => {
    const im = new Image();
    im.onload = () => res(im);
    im.onerror = () => res(null);
    im.src = BASE + file;
  });
}

/** Grey, contrast-normalised copy of a roof photo: mid-grey means "no change" under the overlay blend. */
function grain(im: HTMLImageElement): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = im.naturalWidth; c.height = im.naturalHeight;
  const x = c.getContext('2d')!;
  x.filter = 'grayscale(1)';
  x.drawImage(im, 0, 0);
  const d = x.getImageData(0, 0, c.width, c.height), p = d.data;
  let sum = 0;
  for (let i = 0; i < p.length; i += 4) sum += p[i];
  const mean = sum / (p.length / 4);
  for (let i = 0; i < p.length; i += 4) { const v = Math.max(0, Math.min(255, 128 + (p[i] - mean) * 1.3)); p[i] = p[i + 1] = p[i + 2] = v; }
  x.putImageData(d, 0, 0);
  return c;
}

let ready: Promise<void> | null = null;
/** Load every photo texture; resolves even when some (or all) are missing. */
export function loadPhotos(): Promise<void> {
  ready ??= Promise.all([
    ...Object.entries(PHOTO_GROUND).map(async ([id, d]) => { const im = await load(d.file); if (im) images.set(id, im); }),
    ...Object.entries(PHOTO_ROOF).map(async ([id, f]) => { const im = await load(f); if (im) roofGrain.set(id, grain(im)); }),
  ]).then(() => undefined);
  return ready;
}

/** Draw a photo ground texture into a size×size tile, or return false when it is not available. */
export function drawPhotoGround(id: string, ctx: CanvasRenderingContext2D, size: number): boolean {
  const im = images.get(id), d = PHOTO_GROUND[id];
  if (!im || !d) return false;
  const s = size / d.repeat;
  if (d.filter) ctx.filter = d.filter;
  for (let y = 0; y < d.repeat; y++) for (let x = 0; x < d.repeat; x++) ctx.drawImage(im, x * s, y * s, s, s);
  ctx.filter = 'none';
  return true;
}

export const roofGrainFor = (roof: string) => roofGrain.get(roof) ?? null;
