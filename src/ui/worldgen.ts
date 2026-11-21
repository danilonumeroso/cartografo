import { h, icon, toast } from '../dom';
import { randomSeed } from '../dungeon';
import type { Editor } from '../editor';
import { t } from '../i18n';
import { newWorldDoc } from '../model';
import { renderScene } from '../render';
import { MapRuntime } from '../runtime';
import { makeCanvas, nextFrame } from '../util';
import { DEFAULT_WORLD, generateWorld, WorldParams, WorldShape, WorldStats } from '../worldgen';
import { iconBtn } from './common';

/** World sizes in cells (a cell is one hex of travel, 6 miles by default). */
export const WORLD_SIZES: [() => string, number, number][] = [[() => t('Small'), 36, 24], [() => t('Medium'), 48, 32], [() => t('Large'), 64, 42]];
const SHAPES: WorldShape[] = ['continent', 'twin', 'archipelago', 'coast'];
const shapeName = (s: WorldShape) => ({ continent: t('Continent'), twin: t('Two lands'), archipelago: t('Archipelago'), coast: t('Coastline') })[s];
const shapeIcon = (s: WorldShape) => ({ continent: 'map', twin: 'copy', archipelago: 'dice', coast: 'roomPoly' })[s];
const shapeDesc = (s: WorldShape) => ({
  continent: t('One large landmass surrounded by sea.'),
  twin: t('Two lands facing each other across a strait.'),
  archipelago: t('Many islands of every size.'),
  coast: t('Mainland on one side, open sea on the other.'),
})[s];
const LAND_BY_SHAPE: Record<WorldShape, number> = { continent: 0.42, twin: 0.4, archipelago: 0.3, coast: 0.5 };
const level = (n: number) => [t('None'), t('Few'), t('Some'), t('Many'), t('Lots')][Math.max(0, Math.min(4, Math.round(n)))];
const VARIANTS = 5;

interface State {
  mode: 'new' | 'apply';
  params: WorldParams; seed: string; size: number; cols: number; rows: number;
  variants: string[]; token: number; stats: WorldStats | null;
}
interface Rendered { url: string; stats: WorldStats }
const cache = new Map<string, Rendered>();
const keyOf = (s: State, seed: string, w: number) => JSON.stringify([s.params, seed, s.cols, s.rows, w]);
let state: State | null = null;
let timer: number | undefined;
const fresh = (s: State) => [s.seed, ...Array.from({ length: VARIANTS - 1 }, () => randomSeed('WORLD'))];

/** Open the world generator; in 'apply' mode it replaces the current world map. */
export function showWorldGenerator(ed: Editor, mode: 'new' | 'apply', size = 1) {
  const s: State = {
    mode, params: { ...DEFAULT_WORLD }, seed: randomSeed('WORLD'), size,
    cols: mode === 'apply' ? ed.rt.doc.cols : WORLD_SIZES[size][1], rows: mode === 'apply' ? ed.rt.doc.rows : WORLD_SIZES[size][2],
    variants: [], token: 0, stats: null,
  };
  s.variants = fresh(s);
  state = s;
  ed.el.gen.hidden = false;
  render(ed);
  schedule(ed, 0);
}
function hide(ed: Editor) { ed.el.gen.hidden = true; if (state) state.token++; state = null; }

async function preview(s: State, seed: string, width: number): Promise<Rendered> {
  const key = keyOf(s, seed, width);
  const hit = cache.get(key);
  if (hit) return hit;
  const rt = new MapRuntime(newWorldDoc('preview', s.cols, s.rows), false);
  const stats = generateWorld(rt, s.params, seed);
  rt.engine.flush();
  const k = width / rt.W;
  const c = makeCanvas(width, Math.round(rt.H * k));
  renderScene(c.getContext('2d')!, rt, { z: k, x: 0, y: 0 }, c.width, c.height, 1,
    { player: false, fogAlpha: 0, markers: false, grid: false, tokens: false, ambientScale: 0, time: 0, background: null });
  const out = { url: c.toDataURL('image/jpeg', 0.85), stats };
  if (cache.size > 40) cache.delete(cache.keys().next().value!);
  cache.set(key, out);
  return out;
}

function schedule(ed: Editor, delay = 300) {
  const s = state;
  if (!s) return;
  const token = ++s.token;
  clearTimeout(timer);
  const box = ed.el.gen.querySelector('.gen-preview') as HTMLElement | null;
  box?.classList.add('busy');
  timer = window.setTimeout(async () => {
    await nextFrame();
    if (s.token !== token) return;
    const main = await preview(s, s.seed, 1400);
    if (s.token !== token) return;
    s.stats = main.stats;
    const img = ed.el.gen.querySelector('.gen-preview img') as HTMLImageElement | null;
    if (img) img.src = main.url;
    box?.classList.remove('busy');
    stats(ed);
    for (let i = 0; i < s.variants.length; i++) {
      await nextFrame();
      if (s.token !== token) return;
      const v = await preview(s, s.variants[i], 360);
      if (s.token !== token) return;
      const thumb = ed.el.gen.querySelector(`.gen-variant[data-i="${i}"] img`) as HTMLImageElement | null;
      if (thumb) { thumb.src = v.url; thumb.parentElement!.classList.remove('loading'); }
    }
  }, delay);
}

function stats(ed: Editor) {
  const st = state?.stats, el = ed.el.gen.querySelector('.gen-stats');
  if (!st || !el) return;
  el.innerHTML = '';
  const chip = (txt: string) => h('span', { class: 'gen-stat' }, txt);
  el.append(
    chip(t('{n}% land', { n: Math.round(st.landPct * 100) })),
    chip(t(st.settlements === 1 ? '{n} settlement' : '{n} settlements', { n: st.settlements })),
    chip(t(st.rivers === 1 ? '{n} river' : '{n} rivers', { n: st.rivers })));
}

function render(ed: Editor) {
  const s = state!, p = s.params, el = ed.el.gen;
  const scroll = el.querySelector('.gen-side')?.scrollTop || 0;
  el.innerHTML = '';
  const rerender = (again = true) => { render(ed); if (again) schedule(ed); };
  const set = <K extends keyof WorldParams>(k: K, v: WorldParams[K], panel = false) => { p[k] = v; if (panel) rerender(); else schedule(ed); };
  const close = () => { hide(ed); if (s.mode === 'new' && !ed.rt) ed.showHome(); };
  const confirm = async () => {
    const params = { ...p }, seed = s.seed;
    hide(ed);
    if (s.mode === 'apply') await ed.applyWorld(params, seed);
    else await ed.createMap({ name: s.stats?.realm || t('World'), cols: s.cols, rows: s.rows, template: 'world', world: { params, seed } });
  };
  el.append(h('header', { class: 'gen-top' },
    h('button', { class: 'chip-btn', onclick: () => { hide(ed); if (s.mode === 'new') ed.showHome(); } }, icon('arrowLeft', 16), s.mode === 'new' ? t('Your maps') : t('Back to map')),
    h('h1', null, s.mode === 'new' ? t('New world') : t('Regenerate world')),
    s.mode === 'apply' ? h('span', { class: 'gen-warn' }, t('Replaces the content of “{name}”', { name: ed.rt.doc.name })) : '',
    h('div', { class: 'spacer' }),
    h('button', { class: 'chip-btn', onclick: close }, t('Cancel')),
    h('button', { class: 'btn-primary', onclick: confirm }, s.mode === 'new' ? t('Create map') : t('Apply to “{name}”', { name: ed.rt.doc.name }), icon('arrowRight', 18))));

  const sec = (title: string, ...kids: (HTMLElement | null)[]) => h('section', { class: 'gen-sec' }, h('h2', null, title), ...kids.filter(Boolean) as HTMLElement[]);
  const range = (label: string, value: number, min: number, max: number, step: number, fmt: (v: number) => string, onSet: (v: number) => void) => {
    const out = h('span', null, fmt(value));
    const inp = h('input', { type: 'range', min, max, step, value, 'aria-label': label, oninput: () => { const v = +inp.value; out.textContent = fmt(v); onSet(v); } });
    return h('label', { class: 'gen-range' }, h('span', { class: 'gen-range-label' }, label, out), inp);
  };
  const seedIn = h('input', { type: 'text', value: s.seed, class: 'gen-seed', 'aria-label': t('Seed'), onchange: () => { s.seed = seedIn.value.trim() || s.seed; s.variants = [s.seed, ...s.variants.slice(1)]; rerender(); } });
  const side = h('aside', { class: 'gen-side', 'aria-label': t('Parameters') },
    sec(t('Shape'), h('div', { class: 'gen-styles gen-styles-4' }, ...SHAPES.map((sh) => h('button', {
      class: 'gen-style' + (p.shape === sh ? ' on' : ''), 'aria-pressed': String(p.shape === sh),
      onclick: () => { p.shape = sh; p.land = LAND_BY_SHAPE[sh]; rerender(); },
    }, icon(shapeIcon(sh), 20), shapeName(sh)))), h('p', { class: 'hint' }, shapeDesc(p.shape))),
    s.mode === 'new'
      ? sec(t('Size'), h('div', { class: 'seg' }, ...WORLD_SIZES.map(([n, c, r], i) => h('button', {
        class: i === s.size ? 'on' : '', onclick: () => { s.size = i; s.cols = c; s.rows = r; rerender(); },
      }, n()))), h('p', { class: 'hint' }, t('{c}×{r} hexes, about {w}×{h} miles. One hex is 6 miles: a quarter of a day on foot.', { c: s.cols, r: s.rows, w: s.cols * 6, h: Math.round(s.rows * 6 * 0.866) })))
      : sec(t('Size'), h('p', { class: 'hint' }, t('Same as the current map: {c}×{r} hexes', { c: s.cols, r: s.rows }))),
    sec(t('Seed'),
      h('div', { class: 'gen-seed-row' }, seedIn,
        iconBtn('dice', t('Random seed'), () => { s.seed = randomSeed('WORLD'); s.variants = fresh(s); rerender(); }),
        iconBtn('copy', t('Copy seed'), () => { navigator.clipboard?.writeText(s.seed).then(() => toast(t('Seed copied')), () => {}); })),
      h('p', { class: 'hint' }, t('Same seed + same options = same world.'))),
    sec(t('Lands and climate'),
      range(t('Land'), Math.round(p.land * 100), 20, 70, 2, (v) => v + '%', (v) => set('land', v / 100)),
      range(t('Climate'), Math.round(p.climate * 100), 0, 100, 5, (v) => (v < 34 ? t('Cold north') : v < 67 ? t('Temperate') : t('Warm')), (v) => set('climate', v / 100))),
    sec(t('People and paths'),
      range(t('Settlements'), p.settlements, 0, 4, 1, level, (v) => set('settlements', v)),
      range(t('Rivers'), p.rivers, 0, 4, 1, level, (v) => set('rivers', v)),
      h('label', { class: 'toggle' }, h('input', { type: 'checkbox', checked: p.roads, onchange: (e: Event) => set('roads', (e.target as HTMLInputElement).checked) }), h('span', null, t('Roads between settlements')))),
    sec(t('At the table'), h('p', { class: 'hint' }, t('The map starts covered by fog: reveal it as the party explores. Names and labels can be edited afterwards.'))),
  );
  const variants = h('div', { class: 'gen-variants' }, ...s.variants.map((seed, i) => {
    const cached = cache.get(keyOf(s, seed, 360));
    return h('button', { class: 'gen-variant' + (seed === s.seed ? ' on' : '') + (cached ? '' : ' loading'), 'data-i': String(i), 'aria-pressed': String(seed === s.seed), onclick: () => { s.seed = seed; rerender(); } },
      h('img', { src: cached?.url || '', alt: '' }), h('span', null, seed));
  }));
  const mainCached = cache.get(keyOf(s, s.seed, 1400));
  const main = h('main', { class: 'gen-main' },
    h('div', { class: 'gen-main-head' }, h('h2', null, t('Preview')), h('div', { class: 'gen-stats' })),
    h('div', { class: 'gen-preview' + (mainCached ? '' : ' busy') },
      h('img', { src: mainCached?.url || '', alt: t('World preview') }),
      h('div', { class: 'gen-spinner' }, t('Generating…')),
      h('button', { class: 'chip-btn gen-reroll', onclick: () => { s.seed = randomSeed('WORLD'); s.variants = fresh(s); rerender(); } }, icon('rotate', 16), t('Another seed'))),
    h('h2', null, t('Variants with the same options')),
    variants);
  el.append(h('div', { class: 'gen-body' }, side, main));
  (el.querySelector('.gen-side') as HTMLElement).scrollTop = scroll;
  if (mainCached) { s.stats = mainCached.stats; stats(ed); }
}
