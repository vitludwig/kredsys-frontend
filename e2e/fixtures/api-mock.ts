import { Page, Route } from '@playwright/test';
import {
	users, places, goods, goodsTypes, currencies, currencyAccounts,
	cards, groups, userGroups, transactions, FixtureUser, FixtureCard,
} from './data';

export interface MockState {
	users: FixtureUser[];
	places: typeof places;
	goods: typeof goods;
	goodsTypes: typeof goodsTypes;
	currencies: typeof currencies;
	accounts: typeof currencyAccounts;
	cards: FixtureCard[];
	groups: typeof groups;
	userGroups: typeof userGroups;
	transactions: typeof transactions;
	nextId: {
		user: number;
		place: number;
		goods: number;
		goodsType: number;
		currency: number;
		group: number;
		transaction: number;
		card: number;
	};
}

export function createMockState(): MockState {
	return {
		users:        structuredClone(users)            as FixtureUser[],
		places:       structuredClone(places),
		goods:        structuredClone(goods),
		goodsTypes:   structuredClone(goodsTypes),
		currencies:   structuredClone(currencies),
		accounts:     structuredClone(currencyAccounts),
		cards:        structuredClone(cards)            as FixtureCard[],
		groups:       structuredClone(groups),
		userGroups:   structuredClone(userGroups),
		transactions: structuredClone(transactions),
		nextId: { user: 1000, place: 1000, goods: 1000, goodsType: 1000, currency: 1000, group: 1000, transaction: 10000, card: 1000 },
	};
}

interface HandlerContext {
	url: URL;
	body: any;
	state: MockState;
	match: RegExpMatchArray;
}

interface HandlerResult {
	status?: number;
	body: any;
}

type Handler = (ctx: HandlerContext) => HandlerResult | Promise<HandlerResult>;

interface RouteEntry {
	method: string;
	pattern: RegExp;
	handler: Handler;
}

// Default handler registry, populated at module load by api-mock-handlers.ts.
// Per-installation overrides (registered via MockApi.override) take precedence
// and live for the lifetime of the page; the default registry is read-only
// from a test's perspective.
const defaultRoutes: RouteEntry[] = [];

export function on(method: string, pattern: RegExp, handler: Handler): void {
	defaultRoutes.push({ method, pattern, handler });
}

function matchAgainst(routes: RouteEntry[], method: string, path: string):
	{ handler: Handler; match: RegExpMatchArray } | null {
	for (const r of routes) {
		if (r.method !== method) continue;
		const m = path.match(r.pattern);
		if (m) return { handler: r.handler, match: m };
	}
	return null;
}

function paginated<T>(items: T[], page = 1, pageSize = 50) {
	// Backend uses 1-based pagination; Angular Material paginator sends pageIndex+1.
	const safePage = page < 1 ? 1 : page;
	const start = (safePage - 1) * pageSize;
	return {
		data: items.slice(start, start + pageSize),
		count: items.length,
	};
}

// Matches /api/v1.1/<path> and /kredsys-api/<path> (the public flow).
const API_PREFIX_RE = /^.*\/(api\/v1\.1|kredsys-api)\//;

export interface MockApi {
	state: MockState;
	/**
	 * Register a per-installation route override. Overrides are checked BEFORE
	 * the default handler set, so a test can simulate a 5xx / network error
	 * for one endpoint without touching the global registry.
	 *
	 * Usage:
	 *   test('500 on save', async ({ mockApi }) => {
	 *     mockApi.override('POST', /^users$/, () => ({ status: 500, body: {} }));
	 *     ...
	 *   });
	 */
	override(method: string, pattern: RegExp, handler: Handler): void;
}

export async function installApiMock(page: Page, state = createMockState()): Promise<MockApi> {
	const overrides: RouteEntry[] = [];

	await page.route(/\/(api\/v1\.1|kredsys-api)\//, async (route: Route) => {
		const req = route.request();
		const url = new URL(req.url());
		const path = url.pathname.replace(API_PREFIX_RE, '');

		const matched =
			matchAgainst(overrides, req.method(), path)
			?? matchAgainst(defaultRoutes, req.method(), path);

		if (!matched) {
			// console.error so the consoleGuard fails the test on contract drift
			// (silent 404 + empty body was masking new endpoints / typos).
			// Return 599 (non-standard) so consumers cannot mistake it for a
			// legitimate 404 from the backend.
			console.error(`[mock] UNHANDLED ${req.method()} ${path}`);
			return route.fulfill({
				status: 599,
				contentType: 'application/json',
				body: JSON.stringify({ error: `mock: unhandled ${req.method()} ${path}` }),
			});
		}

		let body: any = undefined;
		try { body = req.postDataJSON(); } catch { body = undefined; }

		try {
			const result = await matched.handler({ url, body, state, match: matched.match });
			return route.fulfill({
				status: result.status ?? 200,
				contentType: 'application/json',
				body: JSON.stringify(result.body),
			});
		} catch (err) {
			console.error(`[mock] handler error ${req.method()} ${path}:`, err);
			return route.fulfill({ status: 500, contentType: 'application/json', body: '{}' });
		}
	});

	return {
		state,
		override(method, pattern, handler) {
			overrides.unshift({ method, pattern, handler });
		},
	};
}

export { paginated };
