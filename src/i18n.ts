import { IT } from './i18n-it';

export type Lang = 'en' | 'it';
export const LANGS: { id: Lang; name: string }[] = [
  { id: 'en', name: 'English' },
  { id: 'it', name: 'Italiano' },
];

const KEY = 'cartografo-lang';

function detect(): Lang {
  try {
    const v = localStorage.getItem(KEY);
    if (v === 'en' || v === 'it') return v;
  } catch { /* storage unavailable */ }
  return 'en';
}

/** Current UI language. Resolved once at startup; changing it reloads the page. */
export const lang: Lang = detect();
document.documentElement.lang = lang;

export function setLang(l: Lang) {
  try { localStorage.setItem(KEY, l); } catch { /* ignore */ }
}

/**
 * Translate an English UI string. English is the source language: keys are the
 * English text itself, so a missing translation falls back to English.
 * Placeholders use `{name}` syntax.
 */
export function t(en: string, params?: Record<string, string | number>): string {
  let s = lang === 'it' ? IT[en] ?? en : en;
  if (params) for (const [k, v] of Object.entries(params)) s = s.split(`{${k}}`).join(String(v));
  return s;
}
