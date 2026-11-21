import './style.css';
import { preloadTextures } from './textures';
import { loadPhotos } from './photos';
import { PROP_FILES } from './stamps';
import { nextFrame } from './util';
import { t } from './i18n';

const root = document.getElementById('app')!;
const loader = document.getElementById('loader');
const loaderText = document.getElementById('loader-text');
if (loaderText) loaderText.textContent = t('Preparing brushes and parchment…');

// The published build keeps a copy of itself so it opens offline (not in dev, where it would cache stale modules).
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  const sw = navigator.serviceWorker;
  // On the first visit the page loads its textures, props and fonts before the worker takes over: once it
  // does, fetch them again through it so they are kept too (the browser's HTTP cache makes this cheap).
  const warm = () => {
    for (const e of performance.getEntriesByType('resource')) {
      const u = new URL(e.name);
      // Google Fonts allow CORS, so the kept copy can serve the page's own (CORS) font requests
      if (u.origin === location.origin || u.host.startsWith('fonts.')) fetch(u).catch(() => {});
    }
    // label fonts are only downloaded when first drawn: load every style now, while online
    for (const f of ['Almendra', 'Cinzel', 'IM Fell English', 'MedievalSharp', 'Pirata One', 'Uncial Antiqua', 'Inter'])
      for (const s of ['', '700 ', 'italic ']) document.fonts.load(`${s}16px "${f}"`).catch(() => {});
  };
  if (!sw.controller) sw.addEventListener('controllerchange', warm, { once: true });
  sw.register('./sw.js').catch(() => { /* offline support is optional */ });
}

(async () => {
  await nextFrame();
  // photo textures replace painted ones, so they must be in before the first texture is built
  await Promise.race([loadPhotos(PROP_FILES), new Promise((r) => setTimeout(r, 4000))]);
  preloadTextures();
  if (new URLSearchParams(location.search).has('player')) {
    const { Player } = await import('./player');
    await new Player(root).init();
  } else {
    const { Editor } = await import('./editor');
    const ed = new Editor(root);
    (window as any).editor = ed;
    await ed.init();
  }
  loader?.remove();
})().catch((e) => {
  console.error(e);
  if (loader) loader.textContent = t('Startup error: ') + (e?.message || e);
});
