import { test as base, Page } from '@playwright/test';
import { authAdapter, MODE } from '../fixtures/auth-adapter';
import { installApiMock, MockState } from '../fixtures/api-mock';
import { adminUser, workerUser, powerUser, memberUser } from '../fixtures/data/users';
import { place1 } from '../fixtures/data/places';
import { cleanupE2eEntities } from './cleanup';

type Personas = {
	mockState: MockState | null;
	asAdmin: Page;
	asWorker: Page;
	asPowerSalesman: Page;
	asMember: Page;
};

export const test = base.extend<Personas>({
	mockState: async ({ page }, use) => {
		if (MODE === 'mock') {
			const state = await installApiMock(page);
			await use(state);
		} else {
			await use(null);
		}
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
	},
});

export { expect } from '@playwright/test';
