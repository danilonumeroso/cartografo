import { expect, it, vi } from 'vitest';
import { History } from '../../src/history';
import { Editor } from '../../src/editor';
import { hpStatus, migrateDoc, newDoc, newToken } from '../../src/model';

it('merges rapid edits of the same property and restores both endpoints', () => {
  const history = new History();
  let value = 1;
  for (const next of [2, 3, 4]) {
    const before = value;
    value = next;
    history.push({ label: 'Scale', key: 'crate.scale', undo: () => { value = before; }, redo: () => { value = next; } });
  }
  history.undo();
  expect(value).toBe(1);
  expect(history.canUndo).toBe(false);
  history.redo();
  expect(value).toBe(4);
});

it('keeps different targets separate and clears redo after a branching edit', () => {
  const h = new History();
  const add = (key: string) => h.push({ key, label: key, undo() {}, redo() {} });
  add('A.scale'); add('B.scale'); add('B.name');
  h.undo(); h.undo();
  expect(h.canUndo).toBe(true);
  add('C.name');
  expect(h.canRedo).toBe(false);
  h.clear();
  expect([h.canUndo, h.canRedo]).toEqual([false, false]);
});

it('restores legacy map content with usable grid and combat defaults', () => {
  const token = newToken(150, 250, 'pc', 'Scout');
  const doc = migrateDoc(JSON.parse(JSON.stringify({ id: 'old', name: 'Ruins', cols: 20, rows: 15, tokens: [token] })));
  expect(doc).toMatchObject({ id: 'old', name: 'Ruins', cols: 20, rows: 15, tokens: [token], grid: { feet: 5 }, combat: { active: false, members: [] }, rooms: [], doors: [] });
});

it('distinguishes injured and healthy tokens for the DM', () => {
  const token = newToken(50, 50);
  const healthy = hpStatus(token);
  expect(healthy).toBeTruthy();
  const injured = hpStatus({ ...token, hp: 4 });
  expect(injured).toBeTruthy();
  expect(injured).not.toBe(healthy);
});

function combatFixture() {
  const doc = newDoc('Arena', 20, 15);
  doc.tokens = (['pc', 'ally', 'monster', 'npc'] as const).map((kind, i) => ({
    ...newToken(0, 0, kind, ['Bard', 'Axe', 'Wyrm', 'Scout'][i]), init: [60, 60, 60, 61][i], initMod: [3, 3, 1, 0][i],
  }));
  doc.combat.members = doc.tokens.map(t => t.id);
  // Exercise the real ordering and dice logic without mounting the canvas editor.
  const editor = Object.assign(Object.create(Editor.prototype), { rt: { doc }, mutate: (_: string, fn: () => void) => fn() }) as Editor;
  return { doc, editor };
}

it('sorts initiative by score, modifier, then name', () => {
  const { doc, editor } = combatFixture();
  editor.sortCombat();
  expect(doc.combat.members.map(id => doc.tokens.find(t => t.id === id)!.name)).toEqual(['Scout', 'Axe', 'Bard', 'Wyrm']);
});

it('rolls a d20 plus modifier for NPCs and monsters and preserves PC scores', () => {
  const { doc, editor } = combatFixture();
  for (const [random, die] of [[0, 1], [0.999, 20]]) {
    const rng = vi.spyOn(Math, 'random').mockReturnValue(random);
    try { editor.rollInitiative('npc'); } finally { rng.mockRestore(); }
    expect(doc.tokens.map(t => t.init).filter((_, i) => i !== 1)).toEqual([60, die + 1, die]);
  }
});

// Regression §3.2: Roll used to change allies as well as NPCs and monsters.
it('preserves ally initiative on an NPC and monster roll', () => {
  const { doc, editor } = combatFixture();
  editor.rollInitiative('npc');
  expect(doc.tokens[1].init).toBe(60);
});
