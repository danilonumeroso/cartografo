import { closePopover, h, icon, popover } from '../dom';
import { DoorKind, PathKind, TokenKind, TokenSize, WallStyle } from '../model';
import { stampThumb } from '../stamps';
import { getTexture, TEX_BY_ID, texGroup, TEXTURES, type TexGroup } from '../textures';
import { ctx2d, makeCanvas } from '../util';
import { t } from '../i18n';

export const WALL_NAMES: [WallStyle, string][] = [
  ['stone', t('Stone')], ['brick', t('Brick')], ['wood', t('Wood')], ['cave', t('Rough rock')], ['dark', t('Dark stone')], ['marble', t('Marble')],
  ['sandstone', t('Sandstone')], ['palisade', t('Log palisade')], ['hedge', t('Hedge')], ['ice', t('Ice')], ['obsidian', t('Obsidian')], ['bone', t('Bone')], ['crystal', t('Crystal')],
];
export const WALL_SWATCH: Record<WallStyle, string> = {
  stone: '#7d786f', brick: '#8a4b36', wood: '#5b3e26', cave: '#655a50', dark: '#3e3c42', marble: '#e4dfd4', sandstone: '#c8a26a',
  palisade: '#6a4a2c', hedge: '#2e5a22', ice: '#a8d4ea', obsidian: '#221c2c', bone: '#cfc2a0', crystal: '#7aa8e0',
};
export const DOOR_NAMES: [DoorKind, string][] = [
  ['wood', t('Wood')], ['double', t('Double')], ['iron', t('Portcullis')], ['secret', t('Secret')], ['arch', t('Archway')],
  ['stone', t('Stone slab')], ['bars', t('Cell door')], ['curtain', t('Curtain')],
];
export const PATH_NAMES: [PathKind, string, string][] = [['river', t('River'), 'river'], ['road', t('Road'), 'road'], ['trail', t('Trail'), 'trail'], ['border', t('Border'), 'border'], ['citywall', t('City wall'), 'wall']];
export const PATH_WIDTH: Record<PathKind, number> = { river: 12, road: 7, trail: 5, border: 8, citywall: 26 };
export const FLOORS = TEXTURES.filter((t) => t.floor && !t.world).map((t) => t.id);
export const TOKEN_PRESETS: { name: string; kind: TokenKind; size: TokenSize }[] = [
  { name: t('Party'), kind: 'pc', size: 'medium' },
  { name: t('Hero'), kind: 'pc', size: 'medium' }, { name: 'Goblin', kind: 'monster', size: 'small' }, { name: t('Kobold'), kind: 'monster', size: 'small' },
  { name: t('Skeleton'), kind: 'monster', size: 'medium' }, { name: t('Orc'), kind: 'monster', size: 'medium' }, { name: t('Wolf'), kind: 'monster', size: 'medium' },
  { name: 'Ogre', kind: 'monster', size: 'large' }, { name: 'Troll', kind: 'monster', size: 'large' }, { name: t('Dragon'), kind: 'monster', size: 'huge' },
  { name: t('Merchant'), kind: 'npc', size: 'medium' }, { name: t('Guard'), kind: 'ally', size: 'medium' },
];

const swatchCache = new Map<string, string>();
export function texSwatch(id: string) {
  let u = swatchCache.get(id);
  if (!u) {
    const c = makeCanvas(64, 64);
    ctx2d(c).drawImage(getTexture(id), 40, 40, 160, 160, 0, 0, 64, 64);
    u = c.toDataURL();
    swatchCache.set(id, u);
  }
  return u;
}
const thumbCache = new Map<string, string>();
export function sThumb(id: string) { let u = thumbCache.get(id); if (!u) { u = stampThumb(id, 96); thumbCache.set(id, u); } return u; }

/** Thumbnail <img> rendered only when it scrolls into view (the library has hundreds of props). */
const pendingThumbs: HTMLImageElement[] = [];
let thumbTimer = 0;
function pumpThumbs() {
  thumbTimer = 0;
  const t0 = performance.now();
  while (pendingThumbs.length && performance.now() - t0 < 12) {
    const img = pendingThumbs.shift()!;
    if (img.isConnected) img.src = sThumb(img.dataset.stamp!);
  }
  if (pendingThumbs.length) thumbTimer = window.setTimeout(pumpThumbs, 0);
}
let thumbObserver: IntersectionObserver | null = null;
export function lazyThumb(id: string): HTMLImageElement {
  const img = h('img', { alt: '', 'data-stamp': id, class: 'lazy' }) as HTMLImageElement;
  const cached = thumbCache.get(id);
  if (cached) { img.src = cached; img.classList.remove('lazy'); return img; }
  if (typeof IntersectionObserver === 'undefined') { img.src = sThumb(id); return img; }
  thumbObserver ??= new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      const el = e.target as HTMLImageElement;
      thumbObserver!.unobserve(el); el.classList.remove('lazy');
      pendingThumbs.push(el);
    }
    if (pendingThumbs.length && !thumbTimer) thumbTimer = window.setTimeout(pumpThumbs, 0);
  }, { rootMargin: '120px' });
  thumbObserver.observe(img);
  return img;
}
export const texName = (id: string) => TEX_BY_ID.get(id)?.name || id;

/** Large labelled tool button used in docks. */
export function subBtn(label: string, ico: string, active: boolean, onClick: () => void, title = '') {
  return h('button', { class: 'sub' + (active ? ' on' : ''), 'aria-pressed': String(active), title: title || label, onclick: onClick }, icon(ico, 18), h('span', null, label));
}
export function sep() { return h('span', { class: 'dock-sep' }); }

export function miniSlider(label: string, value: number, min: number, max: number, step: number, onInput: (v: number) => void, fmt: (v: number) => string = (v) => String(v)) {
  const out = h('span', { class: 'mini-val' }, fmt(value));
  const inp = h('input', { type: 'range', min, max, step, value, 'aria-label': label, oninput: () => { const v = parseFloat(inp.value); out.textContent = fmt(v); onInput(v); } });
  return h('label', { class: 'mini-slider' }, h('span', { class: 'mini-label' }, label), inp, out);
}

export function toggle(label: string, value: boolean, onChange: (v: boolean) => void) {
  const c = h('input', { type: 'checkbox', checked: value, onchange: () => onChange(c.checked) });
  return h('label', { class: 'toggle' }, c, h('span', null, label));
}

/** Button showing a swatch + caption that opens a grid of texture swatches. */
export function texPicker(caption: string, ids: string[], value: string, onPick: (id: string) => void) {
  const b: HTMLButtonElement = h('button', { class: 'picker', onclick: () => {
    const sw = (id: string) => h('button', {
      class: 'swatch' + (id === value ? ' on' : ''), title: texName(id),
      onclick: () => { closePopover(); onPick(id); },
    }, h('img', { src: texSwatch(id), alt: '' }), h('span', null, texName(id)));
    const groups: [TexGroup, string][] = [['w_land', t('Shape the coast: paint land, erase to flood it')], ['w_biome', t('Biomes, painted over land')], ['ground', t('Natural ground')], ['built', t('Built floors')], ['exotic', t('Exotic floors')], ['cover', t('Liquids and cover')]];
    const sections = groups.map(([g, label]) => [label, ids.filter((id) => texGroup(id) === g)] as const).filter(([, l]) => l.length);
    const body = sections.length > 1
      ? sections.flatMap(([label, list]) => [h('div', { class: 'pop-sub' }, label), h('div', { class: 'swatches' }, ...list.map(sw))])
      : [h('div', { class: 'swatches' }, ...ids.map(sw))];
    popover(b, h('div', { class: 'pop-body tex-pop' }, h('div', { class: 'pop-title' }, caption), ...body));
    requestAnimationFrame(() => document.querySelector('.tex-pop .swatch.on')?.scrollIntoView({ block: 'nearest' }));
  } },
  h('img', { class: 'picker-swatch', src: texSwatch(value), alt: '' }),
  h('span', { class: 'picker-text' }, h('small', null, caption), h('span', null, texName(value))),
  icon('chevron', 14));
  return b;
}

/** Button with caption + current value that opens a list of options. */
export function listPicker<T extends string>(caption: string, opts: [T, string][], value: T, onPick: (v: T) => void, swatch?: (v: T) => string) {
  const cur = opts.find((o) => o[0] === value)?.[1] || value;
  const b: HTMLButtonElement = h('button', { class: 'picker', onclick: () => {
    popover(b, h('div', { class: 'pop-body' }, h('div', { class: 'pop-title' }, caption),
      h('div', { class: 'pop-list' }, ...opts.map(([v, l]) => h('button', { class: v === value ? 'on' : '', onclick: () => { closePopover(); onPick(v); } },
        swatch ? h('span', { class: 'list-swatch', style: { background: swatch(v) } }) : null, l, v === value ? icon('check', 16) : null)))));
  } },
  swatch ? h('span', { class: 'picker-swatch', style: { background: swatch(value) } }) : null,
  h('span', { class: 'picker-text' }, h('small', null, caption), h('span', null, cur)),
  icon('chevron', 14));
  return b;
}

export function iconBtn(ico: string, label: string, onClick: (e: MouseEvent) => void, cls = '') {
  return h('button', { class: 'icon-btn ' + cls, 'aria-label': label, title: label, onclick: onClick }, icon(ico, 18));
}
