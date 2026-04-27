import { defineConfig, devices } from '@playwright/test';

// Strict CI detection — process.env.CI may be set to the literal string
// 'false' on some runners (Jenkins, custom GitLab runners). !!'false' is true.
const isCI =
	process.env['CI'] === 'true' ||
	process.env['CI'] === '1' ||
	process.env['GITHUB_ACTIONS'] === 'true' ||
	process.env['GITLAB_CI'] === 'true';

export default defineConfig({
	testDir: './tests',
	outputDir: './test-results',
	fullyParallel: true,
	forbidOnly: isCI,
	retries: isCI ? 2 : 0,
	workers: isCI ? 2 : undefined,
	reporter: [['html', { outputFolder: 'playwright-report', open: 'never' }], ['list']],
	// Cold CI runners need more head-room — first navigation triggers Vite to
	// compile dozens of lazy chunks; first paint can exceed 5s on small runners.
	timeout: isCI ? 60_000 : 30_000,
	expect: { timeout: isCI ? 10_000 : 5_000 },

	use: {
		baseURL: 'http://localhost:4200',
		// retain-on-failure beats on-first-retry: with retries=2 and on-first-retry,
		// a test that fails twice in a row produces *no* trace.
		trace: 'retain-on-failure',
		screenshot: 'only-on-failure',
		video: 'retain-on-failure',
		actionTimeout: isCI ? 20_000 : 10_000,
		navigationTimeout: 30_000,
		// Pin locale + timezone so date / number / Czech-string assertions are
		// stable across machines.
		locale: 'cs-CZ',
		timezoneId: 'Europe/Prague',
	},

	projects: [
		{ name: 'chromium', use: { ...devices['Desktop Chrome'] } },
	],

	webServer: {
		// ng serve (Vite); npm start in this project runs the Express prod server, not what we want for E2E
		command: 'npx ng serve --proxy-config src/proxy.conf.json',
		url: 'http://localhost:4200',
		reuseExistingServer: !isCI,
		// Cold ng serve can take several minutes on small CI runners.
		timeout: 300_000,
		cwd: '..',
	},
});
