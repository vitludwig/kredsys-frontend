import { Page } from '@playwright/test';
import { createMockJwt } from './jwt';
import { FixtureUser } from './data/users';
import { places } from './data/places';

export const MODE: 'mock' | 'real' = process.env['E2E_MODE'] === 'real' ? 'real' : 'mock';

export interface AuthAdapter {
	loginAs(page: Page, user: FixtureUser, opts?: { debug?: boolean }): Promise<void>;
	selectPlace(page: Page, placeId: number): Promise<void>;
}

class MockAuthAdapter implements AuthAdapter {
	async loginAs(page: Page, user: FixtureUser, opts: { debug?: boolean } = {}): Promise<void> {
		const token = createMockJwt({
			sub: String(user.id),
			name: user.name,
			email: user.email,
			roles: user.roles,
			exp: Math.floor(Date.now() / 1000) + 3600,
		});
		const debug = opts.debug ?? true;
		await page.addInitScript(([t, d]: [string, boolean]) => {
			localStorage.setItem('token', t);
			if (d) localStorage.setItem('isDebug', 'true');
		}, [token, debug] as [string, boolean]);
	}

	async selectPlace(page: Page, placeId: number): Promise<void> {
		const place = places.find(p => p.id === placeId);
		if (!place) throw new Error(`unknown place ${placeId}`);
		await page.addInitScript((p) => {
			localStorage.setItem('selectedPlace', JSON.stringify(p));
		}, place);
	}
}

class RealAuthAdapter implements AuthAdapter {
	async loginAs(page: Page, user: FixtureUser, opts: { debug?: boolean } = {}): Promise<void> {
		const res = await page.request.post('/api/v1.1/authentication/user/email', {
			data: { email: user.email, password: user.password },
		});
		if (!res.ok()) throw new Error(`real login failed for ${user.email}: ${res.status()}`);
		const json = await res.json();
		const token = json.token ?? json.accessToken ?? json.jwt;
		if (!token) throw new Error(`real login response missing token: ${JSON.stringify(json)}`);
		const debug = opts.debug ?? true;
		await page.addInitScript(([t, d]: [string, boolean]) => {
			localStorage.setItem('token', t);
			if (d) localStorage.setItem('isDebug', 'true');
		}, [token, debug] as [string, boolean]);
	}

	async selectPlace(page: Page, placeId: number): Promise<void> {
		await page.goto('/place-select');
		await page.getByTestId(`place-option-${placeId}`).click();
	}
}

export const authAdapter: AuthAdapter = MODE === 'real'
	? new RealAuthAdapter()
	: new MockAuthAdapter();
