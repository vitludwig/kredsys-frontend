import { Page } from '@playwright/test';
import { createMockJwt } from './jwt';
import { FixtureUser } from './data/users';
import { places } from './data/places';
import { permissionsForUser } from './permissions';

export const MODE: 'mock' | 'real' = process.env['E2E_MODE'] === 'real' ? 'real' : 'mock';

export interface AuthAdapter {
	loginAs(page: Page, user: FixtureUser, opts?: { debug?: boolean }): Promise<void>;
	selectPlace(page: Page, placeId: number): Promise<void>;
}

interface MockAuthInjection {
	userId: string;
	apiToken: string;
	permissions: string;
	debug: boolean;
}

async function injectAuthState(page: Page, inj: MockAuthInjection): Promise<void> {
	await page.addInitScript((data: MockAuthInjection) => {
		localStorage.setItem('userId', data.userId);
		localStorage.setItem('apiToken', data.apiToken);
		localStorage.setItem('permissions', data.permissions);
		// Write isDebug unconditionally — writing only the truthy branch left
		// stale 'true' values from prior tests when context is reused.
		localStorage.setItem('isDebug', String(!!data.debug));
	}, inj);
}

class MockAuthAdapter implements AuthAdapter {
	async loginAs(page: Page, user: FixtureUser, opts: { debug?: boolean } = {}): Promise<void> {
		const token = createMockJwt({
			sub: String(user.id),
			name: user.name,
			email: user.email,
			roles: user.roles,
			// 24h — tests run in --ui mode or paused with `await page.pause()`
			// would otherwise hit expired tokens after 1h.
			exp: Math.floor(Date.now() / 1000) + 24 * 3600,
		});
		await injectAuthState(page, {
			userId: String(user.id),
			apiToken: token,
			// Per-role permissions (sourced from EPermission enum so renames break
			// compilation). Granting ALL_PERMISSIONS to every persona — including
			// member — defeats role-based testing.
			permissions: JSON.stringify(permissionsForUser(user)),
			debug: opts.debug ?? true,
		});
	}

	async selectPlace(page: Page, placeId: number): Promise<void> {
		const place = places.find(p => p.id === placeId);
		if (!place) throw new Error(`unknown place ${placeId}`);
		await page.addInitScript((p) => {
			localStorage.setItem('selectedPlaceId', String(p.id));
			if (p.apiToken) localStorage.setItem('placeToken', p.apiToken);
		}, place);
	}
}

class RealAuthAdapter implements AuthAdapter {
	async loginAs(page: Page, user: FixtureUser, opts: { debug?: boolean } = {}): Promise<void> {
		// Real backend expects { email, secret }; tests can also pass `password`
		// for compatibility with how FixtureUser is shaped.
		const res = await page.request.post('/api/v1.1/authentication/user/email', {
			data: { email: user.email, secret: user.password, password: user.password },
		});
		if (!res.ok()) throw new Error(`real login failed for ${user.email}: ${res.status()}`);
		const json = await res.json();
		const token = json.token;
		if (!token) {
			throw new Error(
				`real login response missing 'token' field. Got keys: ${Object.keys(json).join(', ')}`,
			);
		}
		const userId = json.userId ?? json.user?.id;
		const permissions = json.permissions ?? [];
		await injectAuthState(page, {
			userId: String(userId),
			apiToken: token,
			permissions: JSON.stringify(permissions),
			debug: opts.debug ?? false,
		});
	}

	async selectPlace(page: Page, placeId: number): Promise<void> {
		await page.goto('/place-select');
		await page.getByTestId(`place-option-${placeId}`).click();
		await page.waitForURL(/\/sale|\/place-select/);
	}
}

export const authAdapter: AuthAdapter = MODE === 'real'
	? new RealAuthAdapter()
	: new MockAuthAdapter();
