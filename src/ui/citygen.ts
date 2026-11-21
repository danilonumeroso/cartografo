import { h, icon, toast } from '../dom';
import { randomSeed } from '../dungeon';
import type { Editor } from '../editor';
import { t } from '../i18n';
import { newCityDoc } from '../model';
import { renderScene } from '../render';
import { MapRuntime } from '../runtime';
import { makeCanvas, nextFrame } from '../util';
import { CityParams, CityStats, CityWater, DEFAULT_CITY, generateCity } from '../citygen';
import { iconBtn } from './common';

/** City sizes in cells (a cell is about 10 metres). */
export const CITY_SIZES: [() => string, number, number][] = [[() => t('Small'), 44, 32], [() => t('Medium'), 56, 40], [() => t('Large'), 72, 52]];
const WATERS: CityWater[] = ['none', 'river', 'coast'];
const waterName = (w: CityWater) => ({ none: t('Inland'), river: t('River'), coast: t('Coast') })[w];
const waterIcon = (w: CityWater) => ({ none: 'map', river: 'river', coast: 'roomPoly' })[w];
const ROOFS: CityParams['roofs'][] = ['mixed', 'tile', 'slate', 'thatch'];
const roofsName = (r: CityParams['roofs']) => ({ mixed: t('Mixed'), tile: t('Clay tiles'), slate: t('Slate'), thatch: t('Thatch') })[r];
const level = (n: number) => [t('Hamlet'), t('Village'), t('Town'), t('City'), t('Metropolis')][Math.max(0, Math.min(4, Math.round(n)))];
const density = (n: number) => [t('Sparse'), t('Airy'), t('Normal'), t('Dense'), t('Packed')][Math.max(0, Math.min(4, Math.round(n)))];
const VARIANTS = 5;

interface State {
  mode: 'new' | 'apply';
  params: CityParams; seed: string; size: number; cols: number; rows: number;
  variants: string[]; token: number; stats: CityStats | null;
}
interface Rendered { url: string; stats: CityStats }
const cache = new Map<string, Rendered>();
const keyOf = (s: State, seed: string, w: number) => JSON.stringify([s.params, seed, s.cols, s.rows, w]);
let state: State | null = null;
let timer: number | undefined;
const fresh = (s: State) => [s.seed, ...Array.from({ length: VARIANTS - 1 }, () => randomSeed('CITY'))];

/** Open the city generator; in 'apply' mode it replaces the current city map. */
export function showCityGenerator(ed: Editor, mode: 'new' | 'apply', size = 1) {
  const s: State = {
    mode, params: { ...DEFAULT_CITY }, seed: randomSeed('CITY'), size,
    cols: mode === 'apply' ? ed.rt.doc.cols : CITY_SIZES[size][1], rows: mode === 'apply' ? ed.rt.doc.rows : CITY_SIZES[size][2],
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
  const rt = new MapRuntime(newCityDoc('preview', s.cols, s.rows), false);
  const stats = generateCity(rt, s.params, seed);
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
    chip(st.name),
    chip(t(st.buildings === 1 ? '{n} building' : '{n} buildings', { n: st.buildings })),
    chip(t(st.taverns === 1 ? '{n} tavern' : '{n} taverns', { n: st.taverns })));
}

function render(ed: Editor) {
  const s = state!, p = s.params, el = ed.el.gen;
  const scroll = el.querySelector('.gen-side')?.scrollTop || 0;
  el.innerHTML = '';
  const rerender = (again = true) => { render(ed); if (again) schedule(ed); };
  const set = <K extends keyof CityParams>(k: K, v: CityParams[K], panel = false) => { p[k] = v; if (panel) rerender(); else schedule(ed); };
  const close = () => { hide(ed); if (s.mode === 'new' && !ed.rt) ed.showHome(); };
  const confirm = async () => {
    const params = { ...p }, seed = s.seed;
    hide(ed);
    if (s.mode === 'apply') await ed.applyCity(params, seed);
    else await ed.createMap({ name: s.stats?.name || t('City'), cols: s.cols, rows: s.rows, template: 'city', city: { params, seed } });
  };
  el.append(h('header', { class: 'gen-top' },
    h('button', { class: 'chip-btn', onclick: () => { hide(ed); if (s.mode === 'new') ed.showHome(); } }, icon('arrowLeft', 16), s.mode === 'new' ? t('Your maps') : t('Back to map')),
    h('h1', null, s.mode === 'new' ? t('New city') : t('Regenerate city')),
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
  const toggleRow = (label: string, on: boolean, fn: (v: boolean) => void) =>
    h('label', { class: 'toggle' }, h('input', { type: 'checkbox', checked: on, onchange: (e: Event) => fn((e.target as HTMLInputElement).checked) }), h('span', null, label));
  const seedIn = h('input', { type: 'text', value: s.seed, class: 'gen-seed', 'aria-label': t('Seed'), onchange: () => { s.seed = seedIn.value.trim() || s.seed; s.variants = [s.seed, ...s.variants.slice(1)]; rerender(); } });
  const side = h('aside', { class: 'gen-side', 'aria-label': t('Parameters') },
    sec(t('Water'), h('div', { class: 'gen-styles' }, ...WATERS.map((w) => h('button', {
      class: 'gen-style' + (p.water === w ? ' on' : ''), 'aria-pressed': String(p.water === w),
      onclick: () => { p.water = w; rerender(); },
    }, icon(waterIcon(w), 20), waterName(w))))),
    s.mode === 'new'
      ? sec(t('Map size'), h('div', { class: 'seg' }, ...CITY_SIZES.map(([n, c, r], i) => h('button', {
        class: i === s.size ? 'on' : '', onclick: () => { s.size = i; s.cols = c; s.rows = r; rerender(); },
      }, n()))), h('p', { class: 'hint' }, t('{c}×{r} squares, about {w}×{h} metres. One square is 10 metres.', { c: s.cols, r: s.rows, w: s.cols * 10, h: s.rows * 10 })))
      : sec(t('Map size'), h('p', { class: 'hint' }, t('Same as the current map: {c}×{r} squares', { c: s.cols, r: s.rows }))),
    sec(t('Seed'),
      h('div', { class: 'gen-seed-row' }, seedIn,
        iconBtn('dice', t('Random seed'), () => { s.seed = randomSeed('CITY'); s.variants = fresh(s); rerender(); }),
        iconBtn('copy', t('Copy seed'), () => { navigator.clipboard?.writeText(s.seed).then(() => toast(t('Seed copied')), () => {}); })),
      h('p', { class: 'hint' }, t('Same seed + same options = same city.'))),
    sec(t('Streets and houses'),
      range(t('Settlement'), p.size, 0, 4, 1, level, (v) => set('size', v)),
      range(t('Density'), p.density, 0, 4, 1, density, (v) => set('density', v)),
      h('div', { class: 'seg' }, ...ROOFS.map((rf) => h('button', { class: p.roofs === rf ? 'on' : '', onclick: () => { p.roofs = rf; rerender(); } }, roofsName(rf))))),
    sec(t('Defences'),
      toggleRow(t('City walls with gates'), p.walls, (v) => set('walls', v)),
      toggleRow(t('Castle'), p.castle, (v) => set('castle', v))),
    sec(t('At the table'), h('p', { class: 'hint' }, t('Taverns, districts and streets have names the players can see. Double-click a building to open its interior once you link one.'))),
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
      h('img', { src: mainCached?.url || '', alt: t('City preview') }),
      h('div', { class: 'gen-spinner' }, t('Generating…')),
      h('button', { class: 'chip-btn gen-reroll', onclick: () => { s.seed = randomSeed('CITY'); s.variants = fresh(s); rerender(); } }, icon('rotate', 16), t('Another seed'))),
    h('h2', null, t('Variants with the same options')),
    variants);
  el.append(h('div', { class: 'gen-body' }, side, main));
  (el.querySelector('.gen-side') as HTMLElement).scrollTop = scroll;
  if (mainCached) { s.stats = mainCached.stats; stats(ed); }
}
