import { defineConfig, chromium } from 'playwright/test';
import { existsSync } from 'node:fs';

const baseURL = 'http://127.0.0.1:5199';
export default defineConfig({
  testDir: './tests/e2e',
  outputDir: 'node_modules/.cache/cartografo-playwright',
  timeout: 60_000,
  workers: 1,
  expect: { timeout: 10_000 },
  use: {
    baseURL, browserName: 'chromium',
    channel: existsSync(chromium.executablePath()) ? 'chromium' : 'chrome',
    viewport: { width: 1440, height: 960 }, actionTimeout: 10_000,
  },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 5199 --strictPort',
    url: baseURL, reuseExistingServer: false,
  },
});
