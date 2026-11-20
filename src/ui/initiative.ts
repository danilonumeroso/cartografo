import { h, icon, toast } from '../dom';
import type { Editor } from '../editor';
import { CONDITIONS, Token, TOKEN_KIND_COLORS } from '../model';
import { iconBtn } from './common';
import { t } from '../i18n';

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
      h('small', null, cb.active ? t('Combat') : t('Initiative')),
      h('strong', null, cb.active ? t('Round {n}', { n: cb.round }) : members.length ? t('Ready to fight') : t('No combat'))),
    members.length ? h('button', { class: 'chip-btn', title: t('Roll 1d20 + modifier for NPCs, monsters and anyone without initiative'), onclick: () => { const n = ed.rollInitiative(); toast(n ? t('Rolled initiative for {n}', { n }) : t('Everyone already has an initiative')); rr(); } }, icon('dice', 16), t('Roll')) : ''));

  const list = h('ol', { class: 'init-rows' });
  for (const t of members) list.append(row(ed, t, true));
  const body = h('div', { class: 'init-body' }, list);
  if (!members.length) body.append(h('p', { class: 'init-empty' }, doc.tokens.length ? t('Add tokens to combat to manage the turn order.') : t('No tokens on the map. Use “Token” in the bottom bar to place one.')));
  if (others.length) {
    body.append(h('div', { class: 'init-sub' }, h('span', null, t('Out of combat')),
      h('button', { class: 'link-btn', onclick: () => { ed.mutate(t('Combat'), () => { cb.members.push(...others.map((t) => t.id)); ed.sortCombat(); }); rr(); } }, t('Add all'))));
    const ol = h('ol', { class: 'init-rows' });
    for (const t of others) ol.append(row(ed, t, false));
    body.append(ol);
  }
  p.append(body);

  const foot = h('div', { class: 'init-foot' });
  if (cb.active) {
    foot.append(
      h('button', { class: 'btn-primary big', onclick: () => { ed.nextTurn(1); rr(); } }, t('Next turn'), icon('arrowRight', 18)),
      h('div', { class: 'init-foot-row' },
        h('button', { class: 'chip-btn', 'aria-label': t('Previous turn'), title: t('Previous turn'), onclick: () => { ed.nextTurn(-1); rr(); } }, icon('arrowLeft', 16)),
        h('button', { class: 'chip-btn grow', onclick: () => { ed.mutate(t('End combat'), () => { cb.active = false; cb.turn = null; cb.round = 1; }); rr(); } }, t('End combat'))));
  } else if (members.length) {
    foot.append(h('button', { class: 'btn-primary big', onclick: () => { ed.sortCombat(); ed.nextTurn(1); rr(); } }, icon('play', 18), t('Start combat')));
  }
  foot.append(h('p', { class: 'init-note' }, t('Only you see hit points: the TV shows names and conditions.')));
  p.append(foot);
}

function row(ed: Editor, tok: Token, inCombat: boolean) {
  const cb = ed.rt.doc.combat;
  const turn = cb.active && cb.turn === tok.id;
  const dead = tok.maxHp > 0 && tok.hp <= 0;
  const f = tok.maxHp ? Math.max(0, Math.min(1, tok.hp / tok.maxHp)) : 0;
  const sel = ed.sel?.kind === 'token' && ed.sel.id === tok.id;
  const focus = () => { ed.select({ kind: 'token', id: tok.id }); ed.centerOn(tok.x, tok.y, false); };
  const init = h('input', {
    type: 'number', class: 'init-num', value: tok.init ?? '', placeholder: '–', 'aria-label': t('Initiative for {name}', { name: tok.name }),
    onchange: () => { ed.mutate(t('Initiative'), () => { tok.init = init.value === '' ? null : +init.value; ed.sortCombat(); }); ed.refreshUI(); },
  });
  const conds = tok.conditions.map((c) => CONDITIONS.find((x) => x.id === c)).filter(Boolean);
  return h('li', { class: 'init-row' + (turn ? ' turn' : '') + (sel ? ' sel' : '') + (dead ? ' dead' : '') + (tok.hidden ? ' hidden-tok' : '') },
    inCombat ? init : h('span', { class: 'dot big', style: { background: TOKEN_KIND_COLORS[tok.kind] } }),
    h('div', { class: 'init-main' },
      h('div', { class: 'init-name' },
        inCombat ? h('span', { class: 'dot', style: { background: TOKEN_KIND_COLORS[tok.kind] } }) : '',
        h('button', { class: 'link', onclick: focus }, tok.name),
        turn ? h('span', { class: 'tag turn' }, t('current turn')) : '',
        tok.hidden ? h('span', { class: 'tag' }, t('hidden')) : ''),
      tok.maxHp ? h('div', { class: 'init-hp' }, h('span', { class: 'hpbar' }, h('span', { style: { width: f * 100 + '%', background: f > 0.5 ? '#5CC28A' : f > 0.25 ? '#E0B030' : '#E26A5F' } })), h('small', null, `${tok.hp}/${tok.maxHp}`)) : '',
      conds.length ? h('div', { class: 'init-conds' }, ...conds.map((c) => h('span', { class: 'cond-tag', title: c!.name }, c!.icon + ' ' + c!.name))) : ''),
    inCombat
      ? iconBtn('x', t('Remove from combat'), () => { ed.mutate(t('Combat'), () => ed.removeFromCombat(tok.id)); ed.refreshUI(); }, 'row-x')
      : h('div', { class: 'row-actions' },
        iconBtn(tok.hidden ? 'eyeOff' : 'eye', tok.hidden ? t('Show to players') : t('Hide from players'), () => { ed.mutate(t('Visibility'), () => { tok.hidden = !tok.hidden; }); ed.refreshUI(); }),
        iconBtn('plus', t('Add to combat'), () => { ed.mutate(t('Combat'), () => { cb.members.push(tok.id); ed.sortCombat(); }); ed.refreshUI(); })));
}
