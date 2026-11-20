import { h, icon, toast } from '../dom';
import {
  DungeonParams, DungeonStats, DungeonStyle, generateDungeon, levelName, PRESET_ORDER, PresetId, presetDesc, presetName, PRESETS,
  randomSeed, ROOM_SHAPES, ROOM_THEMES, RoomShape, RoomTheme, seedPrefix, shapeName, styleName, themeName,
} from '../dungeon';
import type { Editor } from '../editor';
import { t } from '../i18n';
import { newDoc } from '../model';
import { renderScene } from '../render';
import { MapRuntime } from '../runtime';
import { makeCanvas, nextFrame } from '../util';
import { iconBtn } from './common';

const SIZES: [() => string, number, number][] = [[() => t('Small'), 20, 15], [() => t('Medium'), 30, 22], [() => t('Large'), 40, 30]];
const STYLES: DungeonStyle[] = ['rooms', 'mixed', 'ruins'];
const VARIANTS = 5;

interface GenState {
  mode: 'new' | 'apply';
  preset: PresetId;
  params: DungeonParams;
  seed: string;
  size: number;
  cols: number;
  rows: number;
  variants: string[];
  advanced: boolean;
  token: number;
  stats: DungeonStats | null;
}

interface Rendered { url: string; stats: DungeonStats }
const cache = new Map<string, Rendered>();
const cacheKey = (s: GenState, seed: string, w: number) => JSON.stringify([s.params, seed, s.cols, s.rows, w]);

let state: GenState | null = null;
let timer: number | undefined;

const clone = (p: DungeonParams): DungeonParams => JSON.parse(JSON.stringify(p));
const freshVariants = (s: GenState) => [s.seed, ...Array.from({ length: VARIANTS - 1 }, () => randomSeed(seedPrefix(s.preset)))];

/** Open the dungeon generator. In 'apply' mode it replaces the content of the current map. */
export function showGenerator(ed: Editor, mode: 'new' | 'apply', size = 1) {
  const preset: PresetId = 'crypt';
  const s: GenState = {
    mode, preset, params: clone(PRESETS[preset]), seed: randomSeed(seedPrefix(preset)), size,
    cols: mode === 'apply' ? ed.rt.doc.cols : SIZES[size][1], rows: mode === 'apply' ? ed.rt.doc.rows : SIZES[size][2],
    variants: [], advanced: false, token: 0, stats: null,
  };
  s.variants = freshVariants(s);
  state = s;
  ed.el.gen.hidden = false;
  render(ed);
  schedule(ed, 0);
}

export function hideGenerator(ed: Editor) {
  ed.el.gen.hidden = true;
  if (state) state.token++;
  state = null;
}

/** Generate a map off-screen and return a scaled preview. */
async function preview(s: GenState, seed: string, width: number): Promise<Rendered> {
  const key = cacheKey(s, seed, width);
  const hit = cache.get(key);
  if (hit) return hit;
  const rt = new MapRuntime(newDoc('preview', s.cols, s.rows));
  const stats = generateDungeon(rt, s.params, seed);
  rt.engine.flush();
  const k = width / rt.W;
  const c = makeCanvas(width, Math.round(rt.H * k));
  renderScene(c.getContext('2d')!, rt, { z: k, x: 0, y: 0 }, c.width, c.height, 1,
    { player: false, fogAlpha: 0, markers: false, grid: true, tokens: false, ambientScale: 0.3, time: 0, background: null });
  const out = { url: c.toDataURL('image/jpeg', 0.85), stats };
  if (cache.size > 60) cache.delete(cache.keys().next().value!);
  cache.set(key, out);
  return out;
}

/** Re-render the preview and the variant strip, cancelling any run in progress. */
function schedule(ed: Editor, delay = 250) {
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
    updateStats(ed);
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

function updateStats(ed: Editor) {
  const st = state?.stats, el = ed.el.gen.querySelector('.gen-stats');
  if (!st || !el) return;
  el.innerHTML = '';
  const chip = (txt: string) => h('span', { class: 'gen-stat' }, txt);
  el.append(chip(t(st.rooms === 1 ? '{n} room' : '{n} rooms', { n: st.rooms })));
  if (st.caves) el.append(chip(t(st.caves === 1 ? '{n} cave' : '{n} caves', { n: st.caves })));
  el.append(
    chip(t(st.loops === 1 ? '{n} loop' : '{n} loops', { n: st.loops })),
    chip(t(st.doors === 1 ? '{n} door · {s} secret' : '{n} doors · {s} secret', { n: st.doors, s: st.secretDoors })),
    chip(t(st.traps === 1 ? '{n} trap' : '{n} traps', { n: st.traps })));
}

function render(ed: Editor) {
  const s = state!;
  const el = ed.el.gen;
  const scroll = el.querySelector('.gen-side')?.scrollTop || 0;
  el.innerHTML = '';
  const rerender = (preview = true) => { render(ed); if (preview) schedule(ed); };
  const setParam = <K extends keyof DungeonParams>(k: K, v: DungeonParams[K], refreshPanel = false) => {
    s.params[k] = v;
    if (refreshPanel) rerender(); else schedule(ed);
  };
  const close = () => { hideGenerator(ed); if (s.mode === 'new' && !ed.rt) ed.showHome(); };
  const confirmGen = async () => {
    const params = clone(s.params), seed = s.seed;
    hideGenerator(ed);
    if (s.mode === 'apply') await ed.applyDungeon(params, seed);
    else await ed.createMap({ name: presetName(s.preset), cols: s.cols, rows: s.rows, template: 'dungeon', gen: { params, seed } });
  };

  // ---------------------------------------------------------------- top bar
  el.append(h('header', { class: 'gen-top' },
    h('button', { class: 'chip-btn', onclick: () => { hideGenerator(ed); if (s.mode === 'new') ed.showHome(); } }, icon('arrowLeft', 16), s.mode === 'new' ? t('Your maps') : t('Back to map')),
    h('h1', null, s.mode === 'new' ? t('New dungeon') : t('Regenerate dungeon')),
    s.mode === 'apply' ? h('span', { class: 'gen-warn' }, t('Replaces the content of “{name}”', { name: ed.rt.doc.name })) : '',
    h('div', { class: 'spacer' }),
    h('button', { class: 'chip-btn', onclick: close }, t('Cancel')),
    h('button', { class: 'btn-primary', onclick: confirmGen }, s.mode === 'new' ? t('Create map') : t('Apply to “{name}”', { name: ed.rt.doc.name }), icon('arrowRight', 18))));

  // ---------------------------------------------------------------- parameters
  const p = s.params;
  const sec = (title: string, ...kids: (HTMLElement | string | null)[]) => h('section', { class: 'gen-sec' }, h('h2', null, title), ...kids.filter(Boolean) as HTMLElement[]);
  const range = (label: string, value: number, min: number, max: number, step: number, fmt: (v: number) => string, onSet: (v: number) => void, disabled = false) => {
    const out = h('span', null, fmt(value));
    const inp = h('input', { type: 'range', min, max, step, value, disabled, 'aria-label': label, oninput: () => { const v = +inp.value; out.textContent = fmt(v); onSet(v); } });
    return h('label', { class: 'gen-range' + (disabled ? ' disabled' : '') }, h('span', { class: 'gen-range-label' }, label, out), inp);
  };
  const chips = <T extends string>(all: T[], on: T[], name: (v: T) => string, onToggle: (v: T) => void) =>
    h('div', { class: 'chips' }, ...all.map((v) => h('button', { class: 'chip' + (on.includes(v) ? ' on' : ''), 'aria-pressed': String(on.includes(v)), onclick: () => onToggle(v) }, name(v))));
  const toggleIn = <T>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  const seedIn = h('input', { type: 'text', value: s.seed, class: 'gen-seed', 'aria-label': t('Seed'), onchange: () => { s.seed = seedIn.value.trim() || s.seed; s.variants = [s.seed, ...s.variants.slice(1)]; rerender(); } });

  const side = h('aside', { class: 'gen-side', 'aria-label': t('Parameters') },
    sec(t('Style'), h('div', { class: 'gen-styles' }, ...STYLES.map((st) => h('button', {
      class: 'gen-style' + (p.style === st ? ' on' : ''), 'aria-pressed': String(p.style === st),
      onclick: () => { p.style = st; if (st === 'mixed' && !p.caveShare) p.caveShare = 40; rerender(); },
    }, icon(st === 'rooms' ? 'build' : st === 'mixed' ? 'cave' : 'roomPoly', 20), styleName(st))))),
    sec(t('Preset'),
      h('div', { class: 'chips' }, ...PRESET_ORDER.map((id) => h('button', {
        class: 'chip' + (s.preset === id ? ' on' : ''), 'aria-pressed': String(s.preset === id),
        onclick: () => { s.preset = id; s.params = clone(PRESETS[id]); s.seed = `${seedPrefix(id)}-${s.seed.split('-').pop()}`; s.variants = freshVariants(s); rerender(); },
      }, presetName(id)))),
      h('p', { class: 'hint' }, presetDesc(s.preset))),
    s.mode === 'new'
      ? sec(t('Size'), h('div', { class: 'seg' }, ...SIZES.map(([n, c, r], i) => h('button', {
        class: i === s.size ? 'on' : '', onclick: () => { s.size = i; s.cols = c; s.rows = r; rerender(); },
      }, `${n()} ${c}×${r}`))))
      : sec(t('Size'), h('p', { class: 'hint' }, t('Same as the current map: {c}×{r} squares', { c: s.cols, r: s.rows }))),
    sec(t('Seed'),
      h('div', { class: 'gen-seed-row' }, seedIn,
        iconBtn('dice', t('Random seed'), () => { s.seed = randomSeed(seedPrefix(s.preset)); s.variants = freshVariants(s); rerender(); }),
        iconBtn('copy', t('Copy seed'), () => { navigator.clipboard?.writeText(s.seed).then(() => toast(t('Seed copied')), () => {}); })),
      h('p', { class: 'hint' }, t('Same seed + same options = same dungeon. Note it down or share it.'))),
    h('button', { class: 'gen-adv', 'aria-expanded': String(s.advanced), onclick: () => { s.advanced = !s.advanced; rerender(false); } },
      t('Advanced options'), icon(s.advanced ? 'chevronUp' : 'chevron', 16)),
    s.advanced ? h('div', { class: 'gen-adv-body' },
      sec(t('Rooms'),
        range(t('Number of rooms'), p.rooms, 3, 25, 1, String, (v) => setParam('rooms', v)),
        range(t('Smallest room'), p.minSize, 2, 10, 1, (v) => t('{n} sq.', { n: v }), (v) => { p.minSize = v; if (p.maxSize < v) p.maxSize = v; schedule(ed); }),
        range(t('Largest room'), p.maxSize, 3, 14, 1, (v) => t('{n} sq.', { n: v }), (v) => { p.maxSize = v; if (p.minSize > v) p.minSize = v; schedule(ed); }),
        h('span', { class: 'gen-label' }, t('Shapes')),
        chips<RoomShape>(ROOM_SHAPES, p.shapes, shapeName, (v) => { const n = toggleIn(p.shapes, v); if (n.length) { p.shapes = n; rerender(); } })),
      sec(t('Corridors'),
        h('div', { class: 'gen-row' }, h('span', { class: 'gen-label' }, t('Width')),
          h('div', { class: 'seg' }, ...([[1, '1'], [2, '2'], [0, t('Mixed')]] as [0 | 1 | 2, string][]).map(([v, l]) => h('button', { class: p.corridorWidth === v ? 'on' : '', onclick: () => setParam('corridorWidth', v, true) }, l)))),
        range(t('Loops (alternative routes)'), p.loops, 0, 4, 1, levelName, (v) => setParam('loops', v)),
        range(t('Dead ends'), p.deadEnds, 0, 4, 1, levelName, (v) => setParam('deadEnds', v))),
      sec(t('Caves'),
        range(t('Natural part'), p.style === 'mixed' ? p.caveShare : 0, 0, 90, 5, (v) => v + '%', (v) => setParam('caveShare', v), p.style !== 'mixed'),
        p.style !== 'mixed' ? h('p', { class: 'hint' }, t('Available with the “Mixed with caves” style.')) : null),
      sec(t('Doors and traps'),
        range(t('Doors on passages'), p.doors, 0, 100, 5, (v) => v + '%', (v) => setParam('doors', v)),
        range(t('Secret doors'), p.secretDoors, 0, 50, 5, (v) => v + '%', (v) => setParam('secretDoors', v)),
        range(t('Traps'), p.traps, 0, 4, 1, levelName, (v) => setParam('traps', v)),
        h('p', { class: 'hint' }, t('Traps and secret doors are only visible to you.'))),
      sec(t('Furnishing and atmosphere'),
        h('span', { class: 'gen-label' }, t('Room themes')),
        chips<RoomTheme>(ROOM_THEMES, p.themes, themeName, (v) => { p.themes = toggleIn(p.themes, v); rerender(); }),
        range(t('Furniture density'), p.furniture, 0, 4, 1, levelName, (v) => setParam('furniture', v)),
        range(t('Darkness'), Math.round(p.ambient * 100), 0, 95, 5, (v) => v + '%', (v) => setParam('ambient', v / 100)),
        h('label', { class: 'toggle' }, h('input', { type: 'checkbox', checked: p.fog, onchange: (e: Event) => setParam('fog', (e.target as HTMLInputElement).checked) }), h('span', null, t('Fog of war enabled'))),
        h('label', { class: 'toggle' }, h('input', { type: 'checkbox', checked: p.numbers, onchange: (e: Event) => setParam('numbers', (e.target as HTMLInputElement).checked) }), h('span', null, t('Number the rooms (only for you)'))))) : null,
  );

  // ---------------------------------------------------------------- preview
  const variants = h('div', { class: 'gen-variants' }, ...s.variants.map((seed, i) => {
    const cached = cache.get(cacheKey(s, seed, 360));
    return h('button', {
      class: 'gen-variant' + (seed === s.seed ? ' on' : '') + (cached ? '' : ' loading'), 'data-i': String(i), 'aria-pressed': String(seed === s.seed),
      onclick: () => { s.seed = seed; rerender(); },
    }, h('img', { src: cached?.url || '', alt: '' }), h('span', null, seed));
  }));
  const mainCached = cache.get(cacheKey(s, s.seed, 1400));
  const main = h('main', { class: 'gen-main' },
    h('div', { class: 'gen-main-head' }, h('h2', null, t('Preview')), h('div', { class: 'gen-stats' })),
    h('div', { class: 'gen-preview' + (mainCached ? '' : ' busy') },
      h('img', { src: mainCached?.url || '', alt: t('Dungeon preview') }),
      h('div', { class: 'gen-spinner' }, t('Generating…')),
      h('button', { class: 'chip-btn gen-reroll', onclick: () => { s.seed = randomSeed(seedPrefix(s.preset)); s.variants = freshVariants(s); rerender(); } }, icon('rotate', 16), t('Another seed'))),
    h('h2', null, t('Variants with the same options')),
    variants);

  el.append(h('div', { class: 'gen-body' }, side, main));
  (el.querySelector('.gen-side') as HTMLElement).scrollTop = scroll;
  if (mainCached) { s.stats = mainCached.stats; updateStats(ed); }
}
