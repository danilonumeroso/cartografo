import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import ts from 'typescript';
import { expect, it, vi } from 'vitest';
import { IT } from '../../src/i18n-it';

it('defaults to English and substitutes parameters in Italian', async () => {
  const en = await import('../../src/i18n');
  expect(en.t('Round {n}', { n: 2 })).toBe('Round 2');
  vi.resetModules();
  vi.stubGlobal('localStorage', { getItem: () => 'it' });
  try {
    const italian = await import('../../src/i18n');
    expect(italian.lang).toBe('it');
    expect(italian.t('New map')).toBe('Nuova mappa');
    expect(italian.t('Round {n}', { n: 3 })).not.toContain('{n}');
  } finally { vi.unstubAllGlobals(); }
});

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? sourceFiles(path) : path.endsWith('.ts') ? [path] : [];
  });
}

it('covers all translation calls and preserves every placeholder', () => {
  const identical = new Set(['Dungeon', 'zoom', 'Round {n}']);
  const issues = new Set<string>();
  function check(arg: ts.Expression) {
    if (ts.isConditionalExpression(arg)) { check(arg.whenTrue); check(arg.whenFalse); return; }
    // A nested translation is already visited as a call in its own right.
    if (ts.isCallExpression(arg) && arg.expression.getText() === 't') return;
    if (!ts.isStringLiteralLike(arg)) { issues.add('Unresolved key: ' + arg.getText()); return; }
    const key = arg.text;
    if (identical.has(key)) return;
    if (!IT[key]?.trim() || IT[key] === key) { issues.add(key); return; }
    const holes = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort().join(',');
    if (holes(key) !== holes(IT[key])) issues.add('Placeholders: ' + key);
  }
  for (const file of sourceFiles('src')) {
    const tree = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
    function visit(node: ts.Node) {
      if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === 't') check(node.arguments[0]);
      ts.forEachChild(node, visit);
    }
    visit(tree);
  }
  expect([...issues].sort()).toEqual([]);
});
