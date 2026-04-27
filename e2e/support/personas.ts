import { test as base, Page } from '@playwright/test';
import { authAdapter, MODE } from '../fixtures/auth-adapter';
import { installApiMock, MockApi, MockState } from '../fixtures/api-mock';
// Side-effect import — registers route handlers via on(...) on api-mock's routes array.
// Imported here (not in api-mock.ts) to avoid a circular initialization between the
// router module and the handlers module.
import '../fixtures/api-mock-handlers';
import { adminUser, workerUser, powerUser, memberUser } from '../fixtures/data/users';
import { place1 } from '../fixtures/data/places';
import { cleanupE2eEntities } from './cleanup';
import { installBrowserShims } from './browser-shims';

type Personas = {
	browserShims: void;
	consoleGuard: void;
	mockApi: MockApi | null;
	mockState: MockState | null;
	asAdmin: Page;
	asWorker: Page;
	asPowerSalesman: Page;
	asMember: Page;
};

export const test = base.extend<Personas>({
	// Auto-fixture: shims required for the app to boot in headless Chromium.
	// Runs in BOTH mock and real mode. Must precede any navigation.
	browserShims: [async ({ page }, use) => {
		await installBrowserShims(page);
		await use();
	}, { auto: true }],

	// Auto-fixture: collects browser-side errors and fails the test if any
	// unexpected page error or console.error occurred during the test.
	// Opt out per-test via test.info().annotations.push({ type: 'allow-console-errors' }).
	consoleGuard: [async ({ page }, use, testInfo) => {
		const errors: string[] = [];
		const onConsole = (msg: { type(): string; text(): string }) => {
			if (msg.type() === 'error') errors.push(`[console.error] ${msg.text()}`);
		};
		const onPageError = (err: Error) => {
			errors.push(`[pageerror] ${err.message}`);
		};
		page.on('console', onConsole);
		page.on('pageerror', onPageError);
		await use();
		page.off('console', onConsole);
		page.off('pageerror', onPageError);
		const allow = testInfo.annotations.some(a => a.type === 'allow-console-errors');
		if (errors.length && !allow && testInfo.status === 'passed') {
			testInfo.status = 'failed';
			throw new Error(
				`Test passed but the page emitted ${errors.length} console/page errors:\n` +
				errors.join('\n'),
			);
		}
	}, { auto: true }],

	// Composed: mockApi is the source-of-truth in mock mode (router + state +
	// per-test override hook). mockState is a convenience accessor that just
	// surfaces .state — kept for the common case where a test only wants to
	// peek/mutate state without intercepting requests.
	mockApi: [async ({ page }, use) => {
		if (MODE === 'mock') {
			const api = await installApiMock(page);
			await use(api);
		} else {
			await use(null);
		}
	}, { auto: true }],

	mockState: async ({ mockApi }, use) => {
		await use(mockApi?.state ?? null);
	},

	asAdmin: async ({ page, mockState }, use) => {
		void mockState;
		await authAdapter.loginAs(page, adminUser);
		await use(page);
		if (MODE === 'real') await cleanupE2eEntities(page);
	},

	asWorker: async ({ page, mockState }, use) => {
		void mockState;
		await authAdapter.loginAs(page, workerUser);
		await authAdapter.selectPlace(page, place1.id);
		await use(page);
		if (MODE === 'real') await cleanupE2eEntities(page);
	},

	asPowerSalesman: async ({ page, mockState }, use) => {
		void mockState;
		await authAdapter.loginAs(page, powerUser);
		await authAdapter.selectPlace(page, place1.id);
		await use(page);
		if (MODE === 'real') await cleanupE2eEntities(page);
	},

	asMember: async ({ page, mockState }, use) => {
		void mockState;
		await authAdapter.loginAs(page, memberUser);
		await use(page);
		if (MODE === 'real') await cleanupE2eEntities(page);
	},
});

export { expect } from '@playwright/test';
