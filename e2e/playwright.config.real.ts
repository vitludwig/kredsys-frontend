// IMPORTANT: set E2E_MODE before importing anything that reads it.
// MODE in fixtures/auth-adapter.ts is evaluated at module load — without
// this assignment, running this config directly (bypassing the npm script)
// would silently use the mock adapter against a real backend.
process.env['E2E_MODE'] = 'real';

import baseConfig from './playwright.config';
import { defineConfig } from '@playwright/test';

const baseURL = process.env['E2E_BASE_URL'] ?? 'http://localhost:4200';

// Hard fail if pointed at a non-default host without explicit consent.
// Real-mode runs delete entities by `e2e-` prefix; an unguarded URL is
// a destructive footgun.
const allowedDefaults = ['localhost', '127.0.0.1', '::1'];
let host = '';
try {
	host = new URL(baseURL).hostname;
} catch {
	throw new Error(`[e2e] invalid E2E_BASE_URL: ${baseURL}`);
}
if (!allowedDefaults.includes(host) && process.env['E2E_ALLOW_DESTRUCTIVE'] !== '1') {
	throw new Error(
		`[e2e] real-mode targeting non-default host '${host}'.\n` +
		`Real-mode tests delete entities matching the 'e2e-' prefix and may\n` +
		`damage a shared environment. To proceed, set E2E_ALLOW_DESTRUCTIVE=1\n` +
		`AND list the host in E2E_ALLOWED_HOSTS.`,
	);
}

console.log(`[e2e] real mode -> ${baseURL}`);

export default defineConfig({
	...baseConfig,
	use: {
		...baseConfig.use,
		baseURL,
	},
	webServer: undefined,
});
