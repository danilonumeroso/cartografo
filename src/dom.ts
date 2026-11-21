import { t } from './i18n';
export type Child = Node | string | number | null | undefined | false | Child[];

export function h<K extends keyof HTMLElementTagNameMap>(tag: K, props: Record<string, any> | null = null, ...kids: Child[]): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  if (props) for (const [k, v] of Object.entries(props)) {
    if (v === undefined || v === null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k === 'html') el.innerHTML = v;
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k in el && k !== 'list') (el as any)[k] = v;
    else el.setAttribute(k, v === true ? '' : String(v));
  }
  append(el, kids);
  return el;
}
function append(el: Node, kids: Child[]) {
  for (const k of kids) {
    if (k === null || k === undefined || k === false) continue;
    if (Array.isArray(k)) append(el, k);
    else el.appendChild(typeof k === 'object' ? k : document.createTextNode(String(k)));
  }
}

export function field(label: string, ...control: Child[]) {
  return h('label', { class: 'field' }, h('span', { class: 'field-label' }, label), ...control);
}

export function slider(label: string, value: number, min: number, max: number, step: number, onInput: (v: number) => void, fmt: (v: number) => string = (v) => String(v)) {
  const out = h('span', { class: 'field-value' }, fmt(value));
  const inp = h('input', { type: 'range', min, max, step, value, oninput: () => { const v = parseFloat(inp.value); out.textContent = fmt(v); onInput(v); } });
  return h('label', { class: 'field slider' }, h('span', { class: 'field-label' }, label, out), inp);
}

export function select(label: string, opts: [string, string][], value: string, onChange: (v: string) => void) {
  const s = h('select', { onchange: () => onChange(s.value) }, ...opts.map(([v, l]) => h('option', { value: v, selected: v === value }, l)));
  return field(label, s);
}

export function check(label: string, value: boolean, onChange: (v: boolean) => void) {
  const c = h('input', { type: 'checkbox', checked: value, onchange: () => onChange(c.checked) });
  return h('label', { class: 'check' }, c, h('span', null, label));
}

export function text(label: string, value: string, onInput: (v: string) => void, placeholder = '') {
  const i = h('input', { type: 'text', value, placeholder, oninput: () => onInput(i.value) });
  return field(label, i);
}

export function area(label: string, value: string, onInput: (v: string) => void, rows = 4, placeholder = '') {
  const t = h('textarea', { rows, placeholder, oninput: () => onInput(t.value) });
  t.value = value;
  return field(label, t);
}

export function num(label: string, value: number, onChange: (v: number) => void, min?: number, max?: number, step = 1) {
  const i = h('input', { type: 'number', value, min, max, step, onchange: () => { const v = parseFloat(i.value); if (!isNaN(v)) onChange(v); } });
  return field(label, i);
}

export function color(label: string, value: string, onInput: (v: string) => void) {
  const i = h('input', { type: 'color', value, oninput: () => onInput(i.value) });
  return field(label, i);
}

export function btn(label: Child, onClick: (e: MouseEvent) => void, cls = '', title = '') {
  return h('button', { class: 'btn ' + cls, onclick: onClick, title: title || undefined }, label);
}

export function seg<T extends string>(opts: [T, string][], value: T, onChange: (v: T) => void) {
  const wrap = h('div', { class: 'seg' });
  for (const [v, l] of opts) {
    wrap.appendChild(h('button', { class: v === value ? 'on' : '', onclick: () => { onChange(v); wrap.querySelectorAll('button').forEach((b) => b.classList.remove('on')); (wrap.querySelector(`[data-v="${CSS.escape(v)}"]`) as HTMLElement)?.classList.add('on'); }, 'data-v': v }, l));
  }
  return wrap;
}

export function section(title: string, ...kids: Child[]) {
  return h('section', { class: 'sec' }, h('h3', null, title), ...kids);
}
export function row(...kids: Child[]) { return h('div', { class: 'row' }, ...kids); }
export function hint(t: string) { return h('p', { class: 'hint', html: t }); }

export function modal(title: string, body: Child, actions: { label: string; cls?: string; onClick?: () => boolean | void | Promise<boolean | void> }[] = [], wide = false) {
  const back = h('div', { class: 'modal-back' });
  const close = () => back.remove();
  const box = h('div', { class: 'modal' + (wide ? ' wide' : '') },
    h('header', null, h('h2', null, title), h('button', { class: 'icon-btn', onclick: close, title: t('Close') }, '✕')),
    h('div', { class: 'modal-body' }, body),
    actions.length ? h('footer', null, ...actions.map((a) => h('button', { class: 'btn ' + (a.cls || ''), onclick: async () => { const r = await a.onClick?.(); if (r !== false) close(); } }, a.label))) : null,
  );
  back.appendChild(box);
  back.addEventListener('pointerdown', (e) => { if (e.target === back) close(); });
  document.body.appendChild(back);
  return close;
}

let toastEl: HTMLElement | null = null;
let toastT: number | undefined;
export function toast(msg: string, ms = 2200) {
  if (!toastEl) { toastEl = h('div', { class: 'toast' }); document.body.appendChild(toastEl); }
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastT);
  toastT = window.setTimeout(() => toastEl!.classList.remove('show'), ms);
}

export function pickFile(accept: string, multiple = false): Promise<File[]> {
  return new Promise((res) => {
    const i = h('input', { type: 'file', accept, multiple, style: { display: 'none' } });
    i.onchange = () => { res([...(i.files || [])]); i.remove(); };
    document.body.appendChild(i);
    i.click();
  });
}

const I = (body: string) => body;
export const ICONS: Record<string, string> = {
  select: I('<path d="M5 3l14 8-6.5 1.5L9 19z"/>'),
  paint: I('<path d="M4 20c2.5 0 4.5-1.5 4.5-4 0-1.5 1-2.5 2.5-2.5s2.5 1 2.5 2.5C13.5 18.5 10 20 4 20z"/><path d="M11.5 13.5L20 4l1 1-8 10"/>'),
  build: I('<rect x="4" y="4" width="16" height="16" rx="1"/><path d="M4 12h6M14 12h6"/>'),
  furnish: I('<path d="M5 11V6a2 2 0 012-2h10a2 2 0 012 2v5"/><path d="M3 11h18v5H3zM5 16v4M19 16v4"/>'),
  annotate: I('<path d="M12 21s-6-6-6-11a6 6 0 0112 0c0 5-6 11-6 11z"/><circle cx="12" cy="10" r="2"/>'),
  roomRect: I('<rect x="4" y="5" width="16" height="14" rx="1"/>'),
  roomPoly: I('<path d="M4 8l7-4 9 5-2 10H7z"/>'),
  cave: I('<path d="M3 18c1-6 3-11 9-11s8 5 9 11"/><path d="M8 18c.5-3 2-5 4-5s3.5 2 4 5"/>'),
  wall: I('<path d="M3 6h18v12H3z"/><path d="M3 12h18M9 6v6M15 12v6"/>'),
  river: I('<path d="M3 7c3-2 5 2 8 0s5-2 7 0 3 1 3 1"/><path d="M3 13c3-2 5 2 8 0s5-2 7 0 3 1 3 1"/><path d="M3 19c3-2 5 2 8 0s5-2 7 0 3 1 3 1"/>'),
  road: I('<path d="M8 3L5 21M16 3l3 18"/><path d="M12 4v3M12 11v3M12 18v2"/>'),
  trail: I('<circle cx="5" cy="18" r="1.2"/><circle cx="9" cy="13" r="1.2"/><circle cx="14" cy="11" r="1.2"/><circle cx="18" cy="6" r="1.2"/>'),
  border: I('<path d="M3 18l4-6 4 3 4-8 6 4" stroke-dasharray="3 2"/>'),
  door: I('<path d="M6 21V4a1 1 0 011-1h10a1 1 0 011 1v17"/><path d="M3 21h18"/><circle cx="14.5" cy="12" r="1"/>'),
  light: I('<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 00-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0012 3z"/>'),
  token: I('<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.5-7 8-7s8 3 8 7"/>'),
  tokenAdd: I('<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.5-7 8-7M18 15v6M15 18h6"/>'),
  text: I('<path d="M5 5h14M12 5v15M9 20h6"/>'),
  marker: I('<path d="M12 21s-6-6-6-11a6 6 0 0112 0c0 5-6 11-6 11z"/><circle cx="12" cy="10" r="2"/>'),
  measure: I('<path d="M3 17L17 3l4 4L7 21z"/><path d="M7 13l2 2M10 10l2 2M13 7l2 2"/>'),
  eye: I('<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'),
  eyeOff: I('<path d="M3 3l18 18"/><path d="M10.6 6.1A9.7 9.7 0 0112 6c5 0 9 6 9 6a17 17 0 01-3 3.4M6.6 6.6A17 17 0 003 12s4 6 9 6a9 9 0 004.5-1.2"/>'),
  fog: I('<path d="M7 18h10a4 4 0 000-8 6 6 0 00-11.5 1.5A3.5 3.5 0 007 18z"/>'),
  revealRoom: I('<rect x="4" y="4" width="16" height="16" rx="1"/><path d="M9 12l2 2 4-4"/>'),
  ping: I('<circle cx="12" cy="12" r="2"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="10"/>'),
  undo: I('<path d="M9 14L4 9l5-5"/><path d="M4 9h11a5 5 0 010 10h-3"/>'),
  redo: I('<path d="M15 14l5-5-5-5"/><path d="M20 9H9a5 5 0 000 10h3"/>'),
  tv: I('<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>'),
  more: I('<circle cx="5" cy="12" r="1.3" fill="currentColor"/><circle cx="12" cy="12" r="1.3" fill="currentColor"/><circle cx="19" cy="12" r="1.3" fill="currentColor"/>'),
  chevron: I('<path d="M6 9l6 6 6-6"/>'),
  chevronUp: I('<path d="M6 15l6-6 6 6"/>'),
  plus: I('<path d="M12 5v14M5 12h14"/>'),
  minus: I('<path d="M5 12h14"/>'),
  x: I('<path d="M6 6l12 12M18 6L6 18"/>'),
  copy: I('<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2h2"/>'),
  trash: I('<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>'),
  rotate: I('<path d="M20 11a8 8 0 10-2.3 5.7"/><path d="M20 4v7h-7"/>'),
  flip: I('<path d="M12 3v18"/><path d="M8 7L3 17h5zM16 7l5 10h-5z"/>'),
  dice: I('<rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="9" cy="9" r="1" fill="currentColor"/><circle cx="15" cy="15" r="1" fill="currentColor"/><circle cx="15" cy="9" r="1" fill="currentColor"/><circle cx="9" cy="15" r="1" fill="currentColor"/>'),
  check: I('<path d="M5 12l5 5 9-10"/>'),
  search: I('<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>'),
  download: I('<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>'),
  upload: I('<path d="M12 15V4M7 9l5-5 5 5M5 20h14"/>'),
  play: I('<path d="M7 4v16l13-8z"/>'),
  edit: I('<path d="M4 20l4-1 11-11-3-3L5 16l-1 4zM14 6l3 3"/>'),
  arrowRight: I('<path d="M5 12h14M13 6l6 6-6 6"/>'),
  arrowLeft: I('<path d="M19 12H5M11 6l-6 6 6 6"/>'),
  settings: I('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z"/>'),
  image: I('<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 9"/>'),
  map: I('<path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/>'),
  help: I('<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 015 0c0 1.7-2.5 2-2.5 3.5M12 17h.01"/>'),
  swords: I('<path d="M5 19L19 5M14 5h5v5M5 5l14 14M5 14v5h5"/>'),
  globe: I('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18"/>'),
  expand: I('<path d="M4 8V4h4M20 8V4h-4M4 16v4h4M20 16v4h-4"/>'),
};
export function icon(name: string, size = 20) {
  return h('span', { class: 'ico', 'aria-hidden': 'true', html: `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] || ''}</svg>` });
}

let openPop: { el: HTMLElement; off: (e: PointerEvent) => void } | null = null;
export function closePopover() {
  if (!openPop) return;
  openPop.el.remove();
  window.removeEventListener('pointerdown', openPop.off, true);
  openPop = null;
}
/** Show a floating panel anchored to an element (above it by default). Toggles if already open for the same anchor. */
export function popover(anchor: HTMLElement, content: HTMLElement, place: 'above' | 'below' = 'above') {
  const same = openPop && (openPop.el as any)._anchor === anchor;
  closePopover();
  if (same) return;
  const el = h('div', { class: 'popover' }, content);
  (el as any)._anchor = anchor;
  document.body.appendChild(el);
  const r = anchor.getBoundingClientRect(), pr = el.getBoundingClientRect();
  const left = Math.max(8, Math.min(window.innerWidth - pr.width - 8, r.left + r.width / 2 - pr.width / 2));
  const top = place === 'above' ? r.top - pr.height - 10 : r.bottom + 10;
  el.style.left = left + 'px';
  el.style.top = Math.max(8, Math.min(window.innerHeight - pr.height - 8, top)) + 'px';
  const off = (e: PointerEvent) => { if (!el.contains(e.target as Node) && !anchor.contains(e.target as Node)) closePopover(); };
  setTimeout(() => window.addEventListener('pointerdown', off, true));
  openPop = { el, off };
}
