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
    h('header', null, h('h2', null, title), h('button', { class: 'icon-btn', onclick: close, title: 'Chiudi' }, '✕')),
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

export const ICONS: Record<string, string> = {
  select: '<path d="M5 3l14 8-6.5 1.5L9 19z"/>',
  terrain: '<path d="M4 20c2.5 0 4.5-1.5 4.5-4 0-1.5 1-2.5 2.5-2.5s2.5 1 2.5 2.5C13.5 18.5 10 20 4 20z"/><path d="M11.5 13.5L20 4l1 1-8 10"/>',
  room: '<rect x="4" y="4" width="16" height="16" rx="1"/><path d="M4 12h6M14 12h6"/>',
  cave: '<path d="M3 18c1-6 3-11 9-11s8 5 9 11"/><path d="M8 18c.5-3 2-5 4-5s3.5 2 4 5"/>',
  wall: '<path d="M3 6h18v12H3z"/><path d="M3 12h18M9 6v6M15 12v6"/>',
  door: '<path d="M6 21V4a1 1 0 011-1h10a1 1 0 011 1v17"/><path d="M3 21h18"/><circle cx="14.5" cy="12" r="1"/>',
  stamp: '<path d="M12 3l3 6h6l-5 4 2 7-6-4-6 4 2-7-5-4h6z"/>',
  light: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 00-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0012 3z"/>',
  token: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.5-7 8-7s8 3 8 7"/>',
  text: '<path d="M5 5h14M12 5v15M9 20h6"/>',
  marker: '<path d="M12 21s-6-6-6-11a6 6 0 0112 0c0 5-6 11-6 11z"/><circle cx="12" cy="10" r="2"/>',
  measure: '<path d="M3 17L17 3l4 4L7 21z"/><path d="M7 13l2 2M10 10l2 2M13 7l2 2"/>',
  fog: '<path d="M7 18h10a4 4 0 000-8 6 6 0 00-11.5 1.5A3.5 3.5 0 007 18z"/>',
  ping: '<circle cx="12" cy="12" r="2"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="10"/>',
  undo: '<path d="M9 14L4 9l5-5"/><path d="M4 9h11a5 5 0 010 10h-3"/>',
  redo: '<path d="M15 14l5-5-5-5"/><path d="M20 9H9a5 5 0 000 10h3"/>',
};
export function icon(name: string) {
  return h('span', { class: 'ico', html: `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] || ''}</svg>` });
}
