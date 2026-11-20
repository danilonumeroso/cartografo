import { closePopover, h, icon, popover } from '../dom';
import { DoorKind, TokenKind, TokenSize, WallStyle } from '../model';
import { stampThumb } from '../stamps';
import { getTexture, TEX_BY_ID, TEXTURES } from '../textures';
import { ctx2d, makeCanvas } from '../util';

export const WALL_NAMES: [WallStyle, string][] = [['stone', 'Pietra'], ['brick', 'Mattoni'], ['wood', 'Legno'], ['cave', 'Roccia grezza']];
export const WALL_SWATCH: Record<WallStyle, string> = { stone: '#7d786f', brick: '#8a4b36', wood: '#5b3e26', cave: '#655a50' };
export const DOOR_NAMES: [DoorKind, string][] = [['wood', 'Legno'], ['double', 'Doppia'], ['iron', 'Grata'], ['secret', 'Segreta'], ['arch', 'Arco']];
export const FLOORS = TEXTURES.filter((t) => t.floor).map((t) => t.id);
export const TOKEN_PRESETS: { name: string; kind: TokenKind; size: TokenSize }[] = [
  { name: 'Eroe', kind: 'pc', size: 'medium' }, { name: 'Goblin', kind: 'monster', size: 'small' }, { name: 'Coboldo', kind: 'monster', size: 'small' },
  { name: 'Scheletro', kind: 'monster', size: 'medium' }, { name: 'Orco', kind: 'monster', size: 'medium' }, { name: 'Lupo', kind: 'monster', size: 'medium' },
  { name: 'Ogre', kind: 'monster', size: 'large' }, { name: 'Troll', kind: 'monster', size: 'large' }, { name: 'Drago', kind: 'monster', size: 'huge' },
  { name: 'Mercante', kind: 'npc', size: 'medium' }, { name: 'Guardia', kind: 'ally', size: 'medium' },
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
    const grid = h('div', { class: 'swatches' }, ...ids.map((id) => h('button', {
      class: 'swatch' + (id === value ? ' on' : ''), title: texName(id),
      onclick: () => { closePopover(); onPick(id); },
    }, h('img', { src: texSwatch(id), alt: '' }), h('span', null, texName(id)))));
    popover(b, h('div', { class: 'pop-body' }, h('div', { class: 'pop-title' }, caption), grid));
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
