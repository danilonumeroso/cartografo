import { h, icon } from '../dom';
import type { Editor } from '../editor';
import { CONDITIONS, Token, TOKEN_KIND_COLORS } from '../model';
import { iconBtn } from './common';

export function renderInitiative(ed: Editor) {
  const p = ed.el.initPanel;
  p.innerHTML = '';
  p.hidden = ed.mode !== 'session';
  if (p.hidden) return;
  const doc = ed.rt.doc, cb = doc.combat;
  const toks = new Map(doc.tokens.map((t) => [t.id, t]));
  const members = cb.members.map((id) => toks.get(id)).filter(Boolean) as Token[];
  const others = doc.tokens.filter((t) => !cb.members.includes(t.id));
  const rr = () => ed.refreshUI();

  p.append(h('div', { class: 'init-head' },
    h('div', { class: 'init-titles' },
      h('small', null, cb.active ? 'Combattimento' : 'Iniziativa'),
      h('strong', null, cb.active ? `Round ${cb.round}` : members.length ? 'Pronti a combattere' : 'Nessun combattimento')),
    members.length ? h('button', { class: 'chip-btn', title: 'Tira 1d20 + modificatore per PNG e mostri', onclick: () => { ed.rollInitiative('npc'); rr(); } }, icon('dice', 16), 'Tira') : ''));

  const list = h('ol', { class: 'init-rows' });
  for (const t of members) list.append(row(ed, t, true));
  const body = h('div', { class: 'init-body' }, list);
  if (!members.length) body.append(h('p', { class: 'init-empty' }, doc.tokens.length ? 'Aggiungi le pedine al combattimento per gestire l\'ordine dei turni.' : 'Nessuna pedina sulla mappa. Usa «Pedina» nella barra in basso per piazzarne una.'));
  if (others.length) {
    body.append(h('div', { class: 'init-sub' }, h('span', null, 'Fuori dal combattimento'),
      h('button', { class: 'link-btn', onclick: () => { ed.mutate('Combattimento', () => { cb.members.push(...others.map((t) => t.id)); ed.sortCombat(); }); rr(); } }, 'Aggiungi tutte')));
    const ol = h('ol', { class: 'init-rows' });
    for (const t of others) ol.append(row(ed, t, false));
    body.append(ol);
  }
  p.append(body);

  const foot = h('div', { class: 'init-foot' });
  if (cb.active) {
    foot.append(
      h('button', { class: 'btn-primary big', onclick: () => { ed.nextTurn(1); rr(); } }, 'Turno successivo', icon('arrowRight', 18)),
      h('div', { class: 'init-foot-row' },
        h('button', { class: 'chip-btn', 'aria-label': 'Turno precedente', title: 'Turno precedente', onclick: () => { ed.nextTurn(-1); rr(); } }, icon('arrowLeft', 16)),
        h('button', { class: 'chip-btn grow', onclick: () => { ed.mutate('Fine combattimento', () => { cb.active = false; cb.turn = null; cb.round = 1; }); rr(); } }, 'Fine combattimento')));
  } else if (members.length) {
    foot.append(h('button', { class: 'btn-primary big', onclick: () => { ed.sortCombat(); ed.nextTurn(1); rr(); } }, icon('play', 18), 'Inizia combattimento'));
  }
  foot.append(h('p', { class: 'init-note' }, 'I punti ferita li vedi solo tu: la TV mostra nomi e condizioni.'));
  p.append(foot);
}

function row(ed: Editor, t: Token, inCombat: boolean) {
  const cb = ed.rt.doc.combat;
  const turn = cb.active && cb.turn === t.id;
  const dead = t.maxHp > 0 && t.hp <= 0;
  const f = t.maxHp ? Math.max(0, Math.min(1, t.hp / t.maxHp)) : 0;
  const sel = ed.sel?.kind === 'token' && ed.sel.id === t.id;
  const focus = () => { ed.select({ kind: 'token', id: t.id }); ed.centerOn(t.x, t.y, false); };
  const init = h('input', {
    type: 'number', class: 'init-num', value: t.init ?? '', placeholder: '–', 'aria-label': 'Iniziativa di ' + t.name,
    onchange: () => { ed.mutate('Iniziativa', () => { t.init = init.value === '' ? null : +init.value; ed.sortCombat(); }); ed.refreshUI(); },
  });
  const conds = t.conditions.map((c) => CONDITIONS.find((x) => x.id === c)).filter(Boolean);
  return h('li', { class: 'init-row' + (turn ? ' turn' : '') + (sel ? ' sel' : '') + (dead ? ' dead' : '') + (t.hidden ? ' hidden-tok' : '') },
    inCombat ? init : h('span', { class: 'dot big', style: { background: TOKEN_KIND_COLORS[t.kind] } }),
    h('div', { class: 'init-main' },
      h('div', { class: 'init-name' },
        inCombat ? h('span', { class: 'dot', style: { background: TOKEN_KIND_COLORS[t.kind] } }) : '',
        h('button', { class: 'link', onclick: focus }, t.name),
        turn ? h('span', { class: 'tag turn' }, 'di turno') : '',
        t.hidden ? h('span', { class: 'tag' }, 'nascosta') : ''),
      t.maxHp ? h('div', { class: 'init-hp' }, h('span', { class: 'hpbar' }, h('span', { style: { width: f * 100 + '%', background: f > 0.5 ? '#5CC28A' : f > 0.25 ? '#E0B030' : '#E26A5F' } })), h('small', null, `${t.hp}/${t.maxHp}`)) : '',
      conds.length ? h('div', { class: 'init-conds' }, ...conds.map((c) => h('span', { class: 'cond-tag', title: c!.name }, c!.icon + ' ' + c!.name))) : ''),
    inCombat
      ? iconBtn('x', 'Togli dal combattimento', () => { ed.mutate('Combattimento', () => ed.removeFromCombat(t.id)); ed.refreshUI(); }, 'row-x')
      : h('div', { class: 'row-actions' },
        iconBtn(t.hidden ? 'eyeOff' : 'eye', t.hidden ? 'Mostra ai giocatori' : 'Nascondi ai giocatori', () => { ed.mutate('Visibilità', () => { t.hidden = !t.hidden; }); ed.refreshUI(); }),
        iconBtn('plus', 'Aggiungi al combattimento', () => { ed.mutate('Combattimento', () => { cb.members.push(t.id); ed.sortCombat(); }); ed.refreshUI(); })));
}
