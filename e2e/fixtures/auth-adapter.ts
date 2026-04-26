import { Page } from '@playwright/test';
import { createMockJwt } from './jwt';
import { FixtureUser } from './data/users';
import { places } from './data/places';

export const MODE: 'mock' | 'real' = process.env['E2E_MODE'] === 'real' ? 'real' : 'mock';

// Grants every backend permission to the impersonated user. Mock mode doesn't
// enforce permissions so this is harmless; the value mirrors what an admin
// session would carry. Kept inline to avoid importing the EPermission enum
// into fixture code.
const ALL_PERMISSIONS = [
	'APIAccess', 'CanUserLoginToPlace',
	'CurrencyRead', 'CurrencyCreate', 'CurrencyEdit', 'CurrencyDelete',
	'CurrenciesAccountsRead', 'CurrenciesAccountsEdit',
	'CardRead', 'CardAssign', 'CardEdit', 'CardBlock', 'CardUnBlock', 'CardDelete', 'CardReadUser',
	'GoodsTypeRead', 'GoodsTypeCreate', 'GoodsTypeEdit', 'GoodsTypeDelete',
	'GoodsRead', 'GoodsReadOwn', 'GoodsCreate', 'GoodsCreateOwn', 'GoodsEdit', 'GoodsEditOwn', 'GoodsDelete',
	'UserRead', 'UserReadOwn', 'UserCreate', 'UserEdit', 'UserDelete',
	'PlaceRead', 'PlaceReadDetail', 'PlaceReadOwn', 'PlaceCreate', 'PlaceEdit', 'PlaceEditOwnGoods', 'PlaceDelete',
	'TransactionRead', 'TransactionManage', 'TransactionCreatePayment',
	'TransactionCreateDeposit', 'TransactionCreateWithdraw', 'TransactionCancellation',
	'StatisticsRead', 'LogsRead',
];

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

class MockAuthAdapter implements AuthAdapter {
	async loginAs(page: Page, user: FixtureUser, opts: { debug?: boolean } = {}): Promise<void> {
		const token = createMockJwt({
			sub: String(user.id),
			name: user.name,
			email: user.email,
			roles: user.roles,
			exp: Math.floor(Date.now() / 1000) + 3600,
		});
		const inj: MockAuthInjection = {
			userId: String(user.id),
			apiToken: token,
			permissions: JSON.stringify(ALL_PERMISSIONS),
			debug: opts.debug ?? true,
		};
		await page.addInitScript((data: MockAuthInjection) => {
			localStorage.setItem('userId', data.userId);
			localStorage.setItem('apiToken', data.apiToken);
			localStorage.setItem('permissions', data.permissions);
			if (data.debug) localStorage.setItem('isDebug', 'true');
		}, inj);
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
		const res = await page.request.post('/api/v1.1/authentication/user/email', {
			data: { email: user.email, password: user.password },
		});
		if (!res.ok()) throw new Error(`real login failed for ${user.email}: ${res.status()}`);
		const json = await res.json();
		const token = json.token ?? json.accessToken ?? json.jwt;
		if (!token) throw new Error(`real login response missing token: ${JSON.stringify(json)}`);
		const userId = json.userId ?? json.user?.id;
		const permissions = json.permissions ?? [];
		const inj: MockAuthInjection = {
			userId: String(userId),
			apiToken: token,
			permissions: JSON.stringify(permissions),
			debug: opts.debug ?? true,
		};
		await page.addInitScript((data: MockAuthInjection) => {
			localStorage.setItem('userId', data.userId);
			localStorage.setItem('apiToken', data.apiToken);
			localStorage.setItem('permissions', data.permissions);
			if (data.debug) localStorage.setItem('isDebug', 'true');
		}, inj);
	}

	async selectPlace(page: Page, placeId: number): Promise<void> {
		await page.goto('/place-select');
		await page.getByTestId(`place-option-${placeId}`).click();
	}
}

export const authAdapter: AuthAdapter = MODE === 'real'
	? new RealAuthAdapter()
	: new MockAuthAdapter();
