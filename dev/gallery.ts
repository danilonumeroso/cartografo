// Developer gallery: renders every built-in stamp, texture and wall style.
// Open http://localhost:5173/dev/gallery.html (?cat=<id>, ?ids=<a,b>, ?tex, ?variants, ?z=<zoom>).
import { CATEGORIES, categoryName, STAMPS, stampImage, STAMP_PAD, WORLD_CATEGORIES } from '../src/stamps';
import { getTexture, TEXTURES } from '../src/textures';
import { WALL_TEX } from '../src/engine';
import { CELL } from '../src/model';

const q = new URLSearchParams(location.search);
const out = document.getElementById('out')!;
const Z = +(q.get('z') || 0.5);
const BG: Record<string, string> = {
  furniture: 'wood', kitchen: 'flagstone', workshop: 'dirt', arcane: 'tiles', temple: 'flagstone', dungeon: 'flagstone', caves: 'cave',
  w_terrain: 'w_land', w_places: 'w_land', w_sea: 'w_ocean',
  nature: 'grass', town: 'cobble', camp: 'grass', nautical: 'water', treasure: 'cave', christmas: 'snow', fantasy: 'forest', decor: 'flagstone',
};
const bgOf = (cat: string) => q.get('bg') || BG[cat] || 'flagstone';

function section(title: string) {
  const h = document.createElement('h2'); h.textContent = title; out.append(h);
  const g = document.createElement('div'); g.className = 'grid'; out.append(g); return g;
}
function fig(g: HTMLElement, cv: HTMLCanvasElement, label: string) {
  const f = document.createElement('figure'); const c = document.createElement('figcaption'); c.textContent = label;
  f.append(cv, c); g.append(f);
}

const tex = q.has('tex');
if (!tex) {
  const cats = q.get('cat') ? q.get('cat')!.split(',') : [...CATEGORIES, ...WORLD_CATEGORIES];
  const nv = q.has('variants') ? 4 : 1;
  for (const cat of cats) {
    const ids = q.get('ids')?.split(',');
    const list = STAMPS.filter((s) => s.cat === cat && (!ids || ids.includes(s.id)));
    if (!list.length) continue;
    const g = section(`${categoryName(cat)} (${list.length})`);
    for (const s of list) {
      for (let v = 0; v < nv; v++) {
        const w = (s.w + 0.6) * CELL * Z, h = (s.h + 0.6) * CELL * Z;
        const cv = document.createElement('canvas'); cv.width = Math.max(90, w); cv.height = Math.max(90, h);
        const c = cv.getContext('2d')!;
        c.fillStyle = c.createPattern(getTexture(bgOf(cat)), 'repeat')!;
        c.save(); c.scale(Z, Z); c.fillRect(0, 0, cv.width / Z, cv.height / Z); c.restore();
        const img = stampImage(s.id, v)!;
        const iw = (s.w * CELL + STAMP_PAD * 2) * Z, ih = (s.h * CELL + STAMP_PAD * 2) * Z;
        c.drawImage(img, (cv.width - iw) / 2, (cv.height - ih) / 2, iw, ih);
        fig(g, cv, nv > 1 ? `${s.name} #${v}` : `${s.name} · ${s.w}×${s.h}${s.layer === 2 ? ' ▲' : s.layer === 0 ? ' ▼' : ''}${s.light ? ' ✦' : ''}`);
      }
    }
  }
} else {
  const g = section(`Textures (${TEXTURES.length})`);
  for (const t of TEXTURES) {
    const cv = document.createElement('canvas'); cv.width = 400 * Z * 1.5; cv.height = 400 * Z * 1.5;
    const c = cv.getContext('2d')!; c.scale(Z * 0.75, Z * 0.75);
    c.fillStyle = c.createPattern(getTexture(t.id), 'repeat')!; c.fillRect(0, 0, 800, 800);
    fig(g, cv, `${t.name} (${t.id})${t.liquid ? ' · liquid' : ''}`);
  }
  const g2 = section('Walls');
  for (const [k, id] of Object.entries(WALL_TEX)) {
    const cv = document.createElement('canvas'); cv.width = 300; cv.height = 120;
    const c = cv.getContext('2d')!; c.fillStyle = c.createPattern(getTexture(id), 'repeat')!; c.fillRect(0, 0, 300, 120);
    fig(g2, cv, k);
  }
}
document.body.dataset.ready = '1';
