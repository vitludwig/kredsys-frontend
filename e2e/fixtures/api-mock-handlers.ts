import { on, paginated, MockState } from './api-mock';
import { createMockJwt } from './jwt';
import { permissionsForRoles } from './permissions';

function pageParams(url: URL): { page: number; pageSize: number } {
	return {
		page: Number(url.searchParams.get('page') ?? 1),
		pageSize: Number(url.searchParams.get('pageSize') ?? 50),
	};
}

function userName(state: MockState, userId: number | undefined): string {
	if (userId == null) return '';
	return state.users.find(u => u.id === userId)?.name ?? '';
}

function placeName(state: MockState, placeId: number | undefined): string {
	if (placeId == null) return '';
	return state.places.find(p => p.id === placeId)?.name ?? '';
}

interface PaymentRecord { goodsId: number; multiplier: number; creatorId?: number }
interface DepositRecord { amount: number; text?: string; creatorId?: number }

function buildPaymentRecords(state: MockState, records: PaymentRecord[]): {
	records: any[];
	total: number;
} {
	let total = 0;
	const built: any[] = [];
	for (const r of records ?? []) {
		const g = state.goods.find(x => x.id === r.goodsId);
		const price = g?.price ?? 0;
		const multiplier = Number(r.multiplier ?? 0);
		const sum = price * multiplier;
		total += sum;
		built.push({
			id: ++state.nextId.transaction,
			creatorId: r.creatorId,
			text: g?.name ?? '',
			type: 'Payment',
			transactionId: 0,
			goodsId: r.goodsId,
			modifyLogId: 0,
			created: new Date().toISOString(),
			amountSum: sum,
			amountItem: price,
			multiplier,
		});
	}
	return { records: built, total };
}

// AUTH
// Real backend returns 401 with the raw string body
// "Username or password is incorrect or user is blocked." for BOTH invalid
// credentials AND blocked users (no enumeration). LoginComponent does an
// exact-match `e.error === '...'` check, so the mock must return that
// literal string (not a JSON-wrapped error).
const LOGIN_FAIL_BODY = 'Username or password is incorrect or user is blocked.';

on('POST', /^authentication\/user\/email$/, ({ body, state }) => {
	// AuthService.login sends { email, secret, apiToken? }; tests using
	// FixtureUser.password may also send `password`. Accept both.
	const candidatePw = body?.secret ?? body?.password;
	const u = state.users.find(x => x.email === body?.email && x.password === candidatePw);
	if (!u) return { status: 401, body: LOGIN_FAIL_BODY };
	if (u.blocked) return { status: 401, body: LOGIN_FAIL_BODY };
	const token = createMockJwt({
		sub: String(u.id), name: u.name, email: u.email, roles: u.roles,
		exp: Math.floor(Date.now() / 1000) + 24 * 3600,
	});
	return {
		body: {
			token,
			userId: u.id,
			placeId: 0,
			roles: u.roles,
			permissions: permissionsForRoles(u.roles),
		},
	};
});

// USERS
on('GET', /^users$/, ({ url, state }) => {
	const { page, pageSize } = pageParams(url);
	const includeBlocked = url.searchParams.get('includeBlocked');
	const filter = url.searchParams.get('filter') ?? '';
	let list = state.users;
	// Honour the most common filter forms the frontend emits:
	//   blocked=true|false                       (UserList toggle)
	//   name#=*<text>/i | memberId ^ <text>      (search)
	const blockedMatch = filter.match(/blocked=(true|false)/);
	if (blockedMatch && includeBlocked !== 'true') {
		const want = blockedMatch[1] === 'true';
		list = list.filter(u => !!u.blocked === want);
	}
	const searchMatch = filter.match(/name#=\*([^/]+)\/i/);
	if (searchMatch) {
		const q = searchMatch[1].toLowerCase();
		list = list.filter(u =>
			u.name.toLowerCase().includes(q) || String(u.memberId ?? '').includes(q),
		);
	}
	return { body: paginated(list, page, pageSize) };
});
on('GET', /^users\/(\d+)$/, ({ match, state }) => {
	const id = Number(match[1]);
	const u = state.users.find(x => x.id === id);
	if (!u) return { status: 404, body: { error: 'not found' } };
	const { password: _pw, ...safe } = u;
	void _pw;
	return { body: safe };
});
on('POST', /^users$/, ({ body, state }) => {
	const id = ++state.nextId.user;
	const u = { roles: [], blocked: false, ...body, id };
	state.users.push(u);
	const { password: _pw, ...safe } = u;
	void _pw;
	return { body: safe };
});
on('PUT', /^users\/(\d+)$/, ({ match, body, state }) => {
	const id = Number(match[1]);
	const i = state.users.findIndex(x => x.id === id);
	if (i < 0) return { status: 404, body: {} };
	state.users[i] = { ...state.users[i], ...body, id };
	const { password: _pw, ...safe } = state.users[i];
	void _pw;
	return { body: safe };
});
on('DELETE', /^users\/(\d+)$/, ({ match, state }) => {
	const id = Number(match[1]);
	// Cascade — match real backend behaviour: clear user's cards / accounts /
	// group memberships so list views don't show orphans.
	state.users = state.users.filter(x => x.id !== id);
	state.cards = state.cards.filter(c => c.userId !== id);
	state.accounts = state.accounts.filter(a => a.userId !== id);
	state.userGroups = state.userGroups.filter(ug => ug.userId !== id);
	return { body: {} };
});
on('PUT', /^users\/(\d+)\/roles$/, ({ match, body, state }) => {
	const id = Number(match[1]);
	const u = state.users.find(x => x.id === id);
	if (u) u.roles = body.roles;
	return { body: { roles: body?.roles ?? [] } };
});
on('PUT', /^users\/(\d+)\/changepassword$/, () => ({ body: {} }));

// USER → cards / transactions / accounts / card-assign
on('GET', /^users\/(\d+)\/cards$/, ({ match, url, state }) => {
	const id = Number(match[1]);
	const list = state.cards.filter(c => c.userId === id);
	const { page, pageSize } = pageParams(url);
	return { body: paginated(list, page, pageSize) };
});
on('GET', /^users\/(\d+)\/transactions$/, ({ match, url, state }) => {
	const id = Number(match[1]);
	const list = state.transactions.filter(t => t.userId === id);
	const { page, pageSize } = pageParams(url);
	return { body: paginated(list, page, pageSize) };
});
on('GET', /^users\/(\d+)\/accounts$/, ({ match, url, state }) => {
	const id = Number(match[1]);
	const list = state.accounts.filter(a => a.userId === id);
	const { page, pageSize } = pageParams(url);
	return { body: paginated(list, page, pageSize) };
});
on('POST', /^users\/(\d+)\/card$/, ({ match, body, state }) => {
	const userId = Number(match[1]);
	if (!body?.uid) {
		return { status: 400, body: { error: 'uid required' } };
	}
	const uid = Number(body.uid);
	if (state.cards.some(c => c.uid === uid)) {
		return { status: 409, body: { error: 'card already exists' } };
	}
	const id = ++state.nextId.card;
	const card = {
		id,
		uid,
		userId,
		type: body.type ?? 'Card',
		description: body.description ?? '',
		blocked: false,
		expirationDate: body.expirationDate,
	};
	state.cards.push(card as any);
	return { body: card };
});

// CARDS
on('GET', /^cards$/, ({ url, state }) => {
	const { page, pageSize } = pageParams(url);
	return { body: paginated(state.cards, page, pageSize) };
});
on('GET', /^cards\/(\d+)\/user$/, ({ match, state }) => {
	const uid = Number(match[1]);
	const c = state.cards.find(x => x.uid === uid);
	if (!c) return { status: 404, body: {} };
	const u = state.users.find(x => x.id === c.userId);
	if (!u) return { status: 404, body: {} };
	const { password: _pw, ...safe } = u;
	void _pw;
	return { body: safe };
});
on('DELETE', /^cards\/(\d+)$/, ({ match, state }) => {
	const id = Number(match[1]);
	state.cards = state.cards.filter(x => x.id !== id);
	return { body: {} };
});

// PLACES
on('GET', /^places$/, ({ url, state }) => {
	const { page, pageSize } = pageParams(url);
	return { body: paginated(state.places, page, pageSize) };
});
on('GET', /^places\/(\d+)$/, ({ match, state }) => {
	const id = Number(match[1]);
	const p = state.places.find(x => x.id === id);
	return p ? { body: p } : { status: 404, body: {} };
});
on('GET', /^places\/(\d+)\/roles$/, ({ match, state }) => {
	const id = Number(match[1]);
	const p = state.places.find(x => x.id === id);
	return { body: { roles: p?.type ? [p.type] : [] } };
});
// Real backend returns IPlaceGoodsResponse[] = { position, goods }[]
// (consumer: PlaceService.getPlaceGoods → IPlaceGoodsResponse, see IPlace.ts).
on('GET', /^places\/(\d+)\/goods$/, ({ match, url, state }) => {
	const id = Number(match[1]);
	const list = state.goods
		.filter(g => g.placeId === id)
		.map((g, i) => ({ position: i, goods: g }));
	const { page, pageSize } = pageParams(url);
	return { body: paginated(list, page, pageSize) };
});
on('GET', /^places\/(\d+)\/transactions$/, ({ match, url, state }) => {
	const id = Number(match[1]);
	const list = state.transactions.filter(t => t.placeId === id);
	const { page, pageSize } = pageParams(url);
	return { body: paginated(list, page, pageSize) };
});
// PlaceService.addPlace POSTs to "places/" (trailing slash) — be lenient.
on('POST', /^places\/?$/, ({ body, state }) => {
	const id = ++state.nextId.place;
	const p = { ...body, id };
	state.places.push(p);
	return { body: p };
});
on('PUT', /^places\/(\d+)$/, ({ match, body, state }) => {
	const id = Number(match[1]);
	const i = state.places.findIndex(x => x.id === id);
	if (i < 0) return { status: 404, body: {} };
	state.places[i] = { ...state.places[i], ...body, id };
	return { body: state.places[i] };
});
on('PUT', /^places\/(\d+)\/roles$/, ({ match, body, state }) => {
	const id = Number(match[1]);
	const p = state.places.find(x => x.id === id);
	if (p) p.type = body?.roles?.[0];
	return { body: { roles: body?.roles ?? [] } };
});
on('DELETE', /^places\/(\d+)$/, ({ match, state }) => {
	const id = Number(match[1]);
	state.places = state.places.filter(x => x.id !== id);
	return { body: {} };
});
// Anchor explicitly — earlier the unanchored `places/(\d+)/goods` would also
// match `places/1/goods/42` and any future `places/1/goodsfoo`.
on('POST', /^places\/(\d+)\/goods(\?|$)/, ({ match, url, state }) => {
	const placeId = Number(match[1]);
	const goodsId = Number(url.searchParams.get('goodsId'));
	const g = state.goods.find(x => x.id === goodsId);
	if (g) g.placeId = placeId;
	return { body: {} };
});
on('DELETE', /^places\/(\d+)\/goods\/(\d+)$/, ({ match, state }) => {
	const goodsId = Number(match[2]);
	const g = state.goods.find(x => x.id === goodsId);
	if (g) g.placeId = null;
	return { body: {} };
});
// Drag-to-reorder sortiment: PATCH places/:id/goods/move with number[] (IDs)
// in the new order. Mock persists the order into state.goods.
on('PATCH', /^places\/(\d+)\/goods\/move$/, ({ match, body, state }) => {
	const placeId = Number(match[1]);
	const newOrder = (body ?? []) as number[];
	const idToPosition = new Map(newOrder.map((id, i) => [id, i]));
	state.goods.sort((a, b) => {
		if (a.placeId !== placeId && b.placeId !== placeId) return 0;
		if (a.placeId !== placeId) return 1;
		if (b.placeId !== placeId) return -1;
		return (idToPosition.get(a.id!) ?? 0) - (idToPosition.get(b.id!) ?? 0);
	});
	return { body: {} };
});

// GOODS + GOODS TYPES
on('GET', /^goods$/, ({ url, state }) => {
	const { page, pageSize } = pageParams(url);
	return { body: paginated(state.goods, page, pageSize) };
});
on('GET', /^goods\/(\d+)$/, ({ match, state }) => {
	const id = Number(match[1]);
	const g = state.goods.find(x => x.id === id);
	return g ? { body: g } : { status: 404, body: {} };
});
on('POST', /^goods$/, ({ body, state }) => {
	const id = ++state.nextId.goods;
	const g = { ...body, id };
	state.goods.push(g);
	return { body: g };
});
on('PUT', /^goods\/(\d+)$/, ({ match, body, state }) => {
	const id = Number(match[1]);
	const i = state.goods.findIndex(x => x.id === id);
	if (i < 0) return { status: 404, body: {} };
	state.goods[i] = { ...state.goods[i], ...body, id };
	return { body: state.goods[i] };
});
on('DELETE', /^goods\/(\d+)$/, ({ match, state }) => {
	const id = Number(match[1]);
	state.goods = state.goods.filter(x => x.id !== id);
	return { body: {} };
});
on('GET', /^goodstypes$/, ({ url, state }) => {
	const { page, pageSize } = pageParams(url);
	return { body: paginated(state.goodsTypes, page, pageSize) };
});
on('GET', /^goodstypes\/(\d+)$/, ({ match, state }) => {
	const id = Number(match[1]);
	const t = state.goodsTypes.find(x => x.id === id);
	return t ? { body: t } : { status: 404, body: {} };
});
on('POST', /^goodstypes$/, ({ body, state }) => {
	const id = ++state.nextId.goodsType;
	const t = { ...body, id };
	state.goodsTypes.push(t);
	return { body: t };
});
on('PUT', /^goodstypes\/(\d+)$/, ({ match, body, state }) => {
	const id = Number(match[1]);
	const i = state.goodsTypes.findIndex(x => x.id === id);
	if (i < 0) return { status: 404, body: {} };
	state.goodsTypes[i] = { ...state.goodsTypes[i], ...body, id };
	return { body: state.goodsTypes[i] };
});
on('DELETE', /^goodstypes\/(\d+)$/, ({ match, state }) => {
	const id = Number(match[1]);
	state.goodsTypes = state.goodsTypes.filter(x => x.id !== id);
	return { body: {} };
});

// CURRENCIES
on('GET', /^currencies$/, ({ url, state }) => {
	const { page, pageSize } = pageParams(url);
	return { body: paginated(state.currencies, page, pageSize) };
});
on('GET', /^currencies\/(\d+)$/, ({ match, state }) => {
	const id = Number(match[1]);
	const c = state.currencies.find(x => x.id === id);
	return c ? { body: c } : { status: 404, body: {} };
});
on('POST', /^currencies$/, ({ body, state }) => {
	const id = ++state.nextId.currency;
	const c = { ...body, id };
	state.currencies.push(c);
	return { body: c };
});
on('PUT', /^currencies\/(\d+)$/, ({ match, body, state }) => {
	const id = Number(match[1]);
	const i = state.currencies.findIndex(x => x.id === id);
	if (i < 0) return { status: 404, body: {} };
	state.currencies[i] = { ...state.currencies[i], ...body, id };
	return { body: state.currencies[i] };
});

// CURRENCY ACCOUNTS
on('GET', /^currencyaccounts\/(\d+)$/, ({ match, state }) => {
	const id = Number(match[1]);
	const a = state.accounts.find(x => x.id === id);
	return a ? { body: a } : { status: 404, body: {} };
});
on('PUT', /^currencyaccounts\/(\d+)$/, ({ match, body, state }) => {
	const id = Number(match[1]);
	const a = state.accounts.find(x => x.id === id);
	if (a) {
		Object.assign(a, body);
		// Defensive: overdraftLimit can't be negative.
		if (a.overdraftLimit < 0) a.overdraftLimit = 0;
	}
	return { body: a ?? {} };
});

// TRANSACTIONS
on('GET', /^transactions$/, ({ url, state }) => {
	const { page, pageSize } = pageParams(url);
	return { body: paginated(state.transactions, page, pageSize) };
});
on('GET', /^transactions\/(\d+)$/, ({ match, state }) => {
	const id = Number(match[1]);
	const t = state.transactions.find(x => x.id === id);
	if (!t) return { status: 404, body: {} };
	// ITransactionResponse extends ITransaction with records[].
	return { body: { ...t, records: (t as any).records ?? [] } };
});
// TransactionService.pay POSTs { info, userId, placeId, records: [{ goodsId, multiplier }] }
on('POST', /^transactions\/payment$/, ({ body, state }) => {
	const userId: number = body?.userId;
	const placeId: number = body?.placeId;
	const acc = state.accounts.find(a => a.userId === userId);
	const { records, total } = buildPaymentRecords(state, body?.records ?? []);

	// Overdraft enforcement — match real backend semantics.
	if (acc) {
		const newBalance = acc.currentAmount - total;
		if (newBalance < -acc.overdraftLimit) {
			return { status: 400, body: { error: 'overdraft' } };
		}
		acc.currentAmount = newBalance;
	}

	const id = ++state.nextId.transaction;
	const tx = {
		id,
		userId,
		placeId,
		amount: -total,
		currencyId: 1,
		created: new Date().toISOString(),
		type: 'Payment',
		cancellation: false,
		info: body?.info ?? '',
		userName: userName(state, userId),
		placeName: placeName(state, placeId),
		records,
	} as any;
	state.transactions.unshift(tx);
	return { body: tx };
});
on('POST', /^transactions\/deposit$/, ({ body, state }) => {
	const userId: number = body?.userId;
	const placeId: number = body?.placeId;
	const recs: DepositRecord[] = body?.records ?? [];
	const amt = recs.reduce((s, r) => s + Number(r.amount ?? 0), 0);
	const acc = state.accounts.find(a => a.userId === userId);
	if (acc) acc.currentAmount += amt;
	const id = ++state.nextId.transaction;
	const tx = {
		id,
		userId,
		placeId,
		amount: amt,
		currencyId: body?.currencyId ?? 1,
		created: new Date().toISOString(),
		type: 'Deposit',
		cancellation: false,
		info: body?.info ?? '',
		userName: userName(state, userId),
		placeName: placeName(state, placeId),
		records: recs.map(r => ({
			id: ++state.nextId.transaction,
			creatorId: r.creatorId,
			text: r.text ?? '',
			type: 'Deposit',
			transactionId: id,
			goodsId: 0,
			modifyLogId: 0,
			created: new Date().toISOString(),
			amountSum: r.amount,
			amountItem: r.amount,
			multiplier: 1,
		})),
	} as any;
	state.transactions.unshift(tx);
	return { body: tx };
});
on('POST', /^transactions\/withDraw$/, ({ body, state }) => {
	const userId: number = body?.userId;
	const placeId: number = body?.placeId;
	const recs: DepositRecord[] = body?.records ?? [];
	const amt = recs.reduce((s, r) => s + Number(r.amount ?? 0), 0);
	const acc = state.accounts.find(a => a.userId === userId);
	if (acc) {
		const newBalance = acc.currentAmount - amt;
		if (newBalance < -acc.overdraftLimit) {
			return { status: 400, body: { error: 'overdraft' } };
		}
		acc.currentAmount = newBalance;
	}
	const id = ++state.nextId.transaction;
	const tx = {
		id,
		userId,
		placeId,
		amount: -amt,
		currencyId: body?.currencyId ?? 1,
		created: new Date().toISOString(),
		type: 'Withdraw',
		cancellation: false,
		info: body?.info ?? '',
		userName: userName(state, userId),
		placeName: placeName(state, placeId),
		records: recs.map(r => ({
			id: ++state.nextId.transaction,
			creatorId: r.creatorId,
			text: r.text ?? '',
			type: 'Withdraw',
			transactionId: id,
			goodsId: 0,
			modifyLogId: 0,
			created: new Date().toISOString(),
			amountSum: -r.amount,
			amountItem: r.amount,
			multiplier: 1,
		})),
	} as any;
	state.transactions.unshift(tx);
	return { body: tx };
});
// Storno: flip cancellation on the original AND append a compensating row,
// matching backend semantics so list-after-storno tests see the new row.
on('PUT', /^transactions\/(\d+)\/cancellation$/, ({ match, state }) => {
	const id = Number(match[1]);
	const tx = state.transactions.find(t => t.id === id) as any;
	if (!tx) return { status: 404, body: {} };
	const acc = state.accounts.find(a => a.userId === tx.userId);
	if (acc) acc.currentAmount -= tx.amount; // reverse the original effect
	tx.cancellation = true;
	const compensatingId = ++state.nextId.transaction;
	const compensating = {
		id: compensatingId,
		userId: tx.userId,
		placeId: tx.placeId,
		amount: -tx.amount,
		currencyId: tx.currencyId,
		created: new Date().toISOString(),
		type: tx.type,
		cancellation: true,
		info: `Storno tx#${tx.id}`,
		userName: tx.userName,
		placeName: tx.placeName,
		records: [],
	};
	state.transactions.unshift(compensating);
	return { body: { ...tx, records: tx.records ?? [] } };
});

// STATISTICS
// Consumer expects ITransactionStatistics: { currencyId, sumGoods, sumPrice, sumTransactions, goods[] }
on('GET', /^statistics\/(\d+)\/goods$/, ({ match, state }) => {
	const currencyId = Number(match[1]);
	const txs = state.transactions.filter(t => t.currencyId === currencyId);
	const sumPrice = txs.reduce((s, t) => s + Math.max(0, -t.amount), 0);
	return {
		body: {
			currencyId,
			sumGoods: 0,
			sumPrice,
			sumTransactions: txs.length,
			goods: [],
		},
	};
});
// Consumer expects IGroupStatistics: { sumGoods, sumPrice, groupsStatistics: [{ group, statistics }] }
on('GET', /^statistics\/(\d+)\/groups-statistics$/, ({ match, state }) => {
	const currencyId = Number(match[1]);
	return {
		body: {
			sumGoods: 0,
			sumPrice: 0,
			groupsStatistics: state.groups.map(g => ({
				group: g,
				statistics: {
					currencyId,
					sumGoods: 0,
					sumPrice: 0,
					sumTransactions: 0,
					goods: [],
				},
			})),
		},
	};
});
// Excel/CSV download — return an empty blob. Just enough that the request
// resolves; tests that care about the file should mock per-test.
on('GET', /^statistics\/(\d+)\/statistics-all-download$/, () => ({
	body: '',
}));

// GROUPS
on('GET', /^groups$/, ({ url, state }) => {
	const { page, pageSize } = pageParams(url);
	return { body: paginated(state.groups, page, pageSize) };
});
on('GET', /^groups\/(\d+)$/, ({ match, state }) => {
	const id = Number(match[1]);
	const g = state.groups.find(x => x.id === id);
	return g ? { body: g } : { status: 404, body: {} };
});
on('POST', /^groups$/, ({ body, state }) => {
	const id = ++state.nextId.group;
	const g = { ...body, id };
	state.groups.push(g);
	return { body: g };
});
on('PUT', /^groups\/(\d+)$/, ({ match, body, state }) => {
	const id = Number(match[1]);
	const i = state.groups.findIndex(x => x.id === id);
	if (i < 0) return { status: 404, body: {} };
	state.groups[i] = { ...state.groups[i], ...body, id };
	return { body: state.groups[i] };
});
on('DELETE', /^groups\/(\d+)$/, ({ match, state }) => {
	const id = Number(match[1]);
	state.groups = state.groups.filter(x => x.id !== id);
	state.userGroups = state.userGroups.filter(ug => ug.groupId !== id);
	return { body: {} };
});
on('GET', /^groups\/(\d+)\/users$/, ({ match, url, state }) => {
	const groupId = Number(match[1]);
	const userIds = state.userGroups
		.filter(ug => ug.groupId === groupId)
		.map(ug => ug.userId);
	const list = state.users
		.filter(u => u.id && userIds.includes(u.id))
		.map(({ password: _pw, ...rest }) => { void _pw; return rest; });
	const { page, pageSize } = pageParams(url);
	return { body: paginated(list, page, pageSize) };
});
on('GET', /^users\/(\d+)\/groups$/, ({ match, state }) => {
	const userId = Number(match[1]);
	const ids = state.userGroups
		.filter(ug => ug.userId === userId)
		.map(ug => ug.groupId);
	return { body: state.groups.filter(g => ids.includes(g.id)) };
});
on('POST', /^groups\/(\d+)\/users\/(\d+)$/, ({ match, state }) => {
	const groupId = Number(match[1]);
	const userId = Number(match[2]);
	if (!state.userGroups.some(ug => ug.groupId === groupId && ug.userId === userId)) {
		state.userGroups.push({ groupId, userId });
	}
	const u = state.users.find(x => x.id === userId);
	if (u) {
		u.groups = [...new Set([...(u.groups ?? []), groupId])];
	}
	return { body: {} };
});
on('DELETE', /^groups\/(\d+)\/users\/(\d+)$/, ({ match, state }) => {
	const groupId = Number(match[1]);
	const userId = Number(match[2]);
	state.userGroups = state.userGroups.filter(x => !(x.groupId === groupId && x.userId === userId));
	const u = state.users.find(x => x.id === userId);
	if (u && u.groups) {
		u.groups = u.groups.filter(g => g !== groupId);
	}
	return { body: {} };
});

// PUBLIC kredsys-api endpoints (used by /public/card-info)
on('GET', /^userIdByCard\/(\d+)$/, ({ match, state }) => {
	const uid = Number(match[1]);
	const c = state.cards.find(x => x.uid === uid);
	if (!c) return { status: 404, body: {} };
	return { body: { userId: c.userId } };
});
on('GET', /^userInfo\/(\d+)\/[^/]+$/, ({ match, state }) => {
	const userId = Number(match[1]);
	const u = state.users.find(x => x.id === userId);
	if (!u) return { status: 404, body: {} };
	const { password: _pw, ...safe } = u;
	void _pw;
	return { body: safe };
});
