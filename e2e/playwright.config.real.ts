import baseConfig from './playwright.config';
import { defineConfig } from '@playwright/test';

export default defineConfig({
  ...baseConfig,
  // In real mode, the backend + frontend are assumed to be already running.
  // Override BASE_URL via env if needed.
  use: {
    ...baseConfig.use,
    baseURL: process.env['E2E_BASE_URL'] || 'http://localhost:4200',
  },
  webServer: undefined,
});
