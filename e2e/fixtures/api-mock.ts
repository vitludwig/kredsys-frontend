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
		nextId: { user: 1000, place: 1000, goods: 1000, currency: 1000, group: 1000, transaction: 10000, card: 1000 },
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

const routes: RouteEntry[] = [];

export function on(method: string, pattern: RegExp, handler: Handler): void {
	routes.push({ method, pattern, handler });
}

function matchRoute(method: string, path: string): { handler: Handler; match: RegExpMatchArray } | null {
	for (const r of routes) {
		if (r.method !== method) continue;
		const m = path.match(r.pattern);
		if (m) return { handler: r.handler, match: m };
	}
	return null;
}

function paginated<T>(items: T[], page = 0, pageSize = 50) {
	const start = page * pageSize;
	return {
		data: items.slice(start, start + pageSize),
		total: items.length,
		page,
		pageSize,
	};
}

export async function installApiMock(page: Page, state = createMockState()): Promise<MockState> {
	await page.route('**/api/v1.1/**', async (route: Route) => {
		const req = route.request();
		const url = new URL(req.url());
		const path = url.pathname.replace(/^.*\/api\/v1\.1\//, '');

		const matched = matchRoute(req.method(), path);
		if (!matched) {
			console.warn(`[mock] unhandled ${req.method()} ${path}`);
			return route.fulfill({ status: 404, contentType: 'application/json', body: '{}' });
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
	return state;
}

export { paginated };

// Side-effect import — registers route handlers via on(...)
// eslint-disable-next-line import/order
import './api-mock-handlers';
