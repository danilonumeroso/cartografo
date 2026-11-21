import { defineConfig } from 'vite';

// Relative asset paths, so the same build works at a domain root and under a sub-path
// such as GitHub Pages (https://<user>.github.io/cartografo/).
export default defineConfig({
  base: './',
  // listed by the service worker (public/sw.js) to keep every script, including lazy ones, for offline use
  build: { manifest: 'manifest.json' },
});
