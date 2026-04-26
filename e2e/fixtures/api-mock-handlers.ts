import { on, paginated } from './api-mock';
import { createMockJwt } from './jwt';

function pageParams(url: URL): { page: number; pageSize: number } {
	return {
		page: Number(url.searchParams.get('page') ?? 1),
		pageSize: Number(url.searchParams.get('pageSize') ?? 50),
	};
}

// AUTH
on('POST', /^authentication\/user\/email$/, ({ body, state }) => {
	// AuthService.login sends { email, secret, apiToken? }; tests using
	// FixtureUser.password may also send `password`. Accept both.
	const candidatePw = body?.secret ?? body?.password;
	const u = state.users.find(x => x.email === body?.email && x.password === candidatePw);
	if (!u) return { status: 401, body: { error: 'invalid credentials' } };
	if (u.blocked) return { status: 403, body: { error: 'blocked' } };
	const token = createMockJwt({
		sub: String(u.id), name: u.name, email: u.email, roles: u.roles,
		exp: Math.floor(Date.now() / 1000) + 3600,
	});
	return {
		body: {
			token,
			userId: u.id,
			placeId: 0,
			roles: u.roles,
			permissions: [],
		},
	};
});

// USERS
on('GET', /^users$/, ({ url, state }) => {
	const { page, pageSize } = pageParams(url);
	return { body: paginated(state.users, page, pageSize) };
});
on('GET', /^users\/(\d+)$/, ({ match, state }) => {
	const id = Number(match[1]);
	const u = state.users.find(x => x.id === id);
	return u ? { body: u } : { status: 404, body: { error: 'not found' } };
});
on('POST', /^users$/, ({ body, state }) => {
	const id = ++state.nextId.user;
	const u = { ...body, id };
	state.users.push(u);
	return { body: u };
});
on('PUT', /^users\/(\d+)$/, ({ match, body, state }) => {
	const id = Number(match[1]);
	const i = state.users.findIndex(x => x.id === id);
	if (i < 0) return { status: 404, body: {} };
	state.users[i] = { ...state.users[i], ...body, id };
	return { body: state.users[i] };
});
on('DELETE', /^users\/(\d+)$/, ({ match, state }) => {
	const id = Number(match[1]);
	state.users = state.users.filter(x => x.id !== id);
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
	const id = ++state.nextId.card;
	const card = { id, uid: body?.uid ?? Math.floor(Math.random() * 1e10), userId };
	state.cards.push(card);
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
	return u ? { body: u } : { status: 404, body: {} };
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
on('GET', /^places\/(\d+)\/goods$/, ({ match, url, state }) => {
	const id = Number(match[1]);
	const list = state.goods.filter(g => g.placeId === id);
	const { page, pageSize } = pageParams(url);
	return { body: paginated(list, page, pageSize) };
});
on('GET', /^places\/(\d+)\/transactions$/, ({ match, url, state }) => {
	const id = Number(match[1]);
	const list = state.transactions.filter(t => t.placeId === id);
	const { page, pageSize } = pageParams(url);
	return { body: paginated(list, page, pageSize) };
});
on('POST', /^places$/, ({ body, state }) => {
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
on('POST', /^places\/(\d+)\/goods/, ({ match, url, state }) => {
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
	const id = ++state.nextId.goods;
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
	if (a) Object.assign(a, body);
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
	return t ? { body: t } : { status: 404, body: {} };
});
on('POST', /^transactions\/payment$/, ({ body, state }) => {
	const id = ++state.nextId.transaction;
	const total = (body?.items ?? []).reduce(
		(s: number, i: any) => s + (i.price ?? 0) * (i.amount ?? 1),
		0,
	);
	const acc = state.accounts.find(a => a.userId === body?.userId);
	if (acc) acc.currentAmount -= total;
	const tx: any = {
		id,
		userId: body?.userId,
		placeId: body?.placeId,
		amount: -total,
		currencyId: 1,
		created: new Date().toISOString(),
		type: 'Payment',
		cancellation: false,
		info: '',
		userName: '',
		placeName: '',
	};
	state.transactions.unshift(tx);
	return { body: tx };
});
on('POST', /^transactions\/deposit$/, ({ body, state }) => {
	const id = ++state.nextId.transaction;
	const amt = Number(body?.amount ?? 0);
	const acc = state.accounts.find(a => a.userId === body?.userId);
	if (acc) acc.currentAmount += amt;
	const tx: any = {
		id,
		userId: body?.userId,
		placeId: body?.placeId,
		amount: amt,
		currencyId: 1,
		created: new Date().toISOString(),
		type: 'Deposit',
		cancellation: false,
		info: '',
		userName: '',
		placeName: '',
	};
	state.transactions.unshift(tx);
	return { body: tx };
});
on('POST', /^transactions\/withDraw$/, ({ body, state }) => {
	const id = ++state.nextId.transaction;
	const amt = Number(body?.amount ?? 0);
	const acc = state.accounts.find(a => a.userId === body?.userId);
	if (acc) acc.currentAmount -= amt;
	const tx: any = {
		id,
		userId: body?.userId,
		placeId: body?.placeId,
		amount: -amt,
		currencyId: 1,
		created: new Date().toISOString(),
		type: 'Withdraw',
		cancellation: false,
		info: '',
		userName: '',
		placeName: '',
	};
	state.transactions.unshift(tx);
	return { body: tx };
});
on('PUT', /^transactions\/(\d+)\/cancellation$/, ({ match, state }) => {
	const id = Number(match[1]);
	const tx = state.transactions.find(t => t.id === id);
	if (!tx) return { status: 404, body: {} };
	const acc = state.accounts.find(a => a.userId === tx.userId);
	if (acc) acc.currentAmount -= tx.amount;
	tx.cancellation = true;
	return { body: tx };
});

// STATISTICS
on('GET', /^statistics\/(\d+)\/goods$/, () => ({ body: { items: [] } }));
on('GET', /^statistics\/(\d+)\/groups-statistics$/, ({ state }) => ({
	body: state.groups.map(g => ({ group: g, items: [] })),
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
	return { body: {} };
});
on('POST', /^groups\/(\d+)\/users\/(\d+)$/, ({ match, state }) => {
	const groupId = Number(match[1]);
	const userId = Number(match[2]);
	state.userGroups.push({ groupId, userId });
	return { body: {} };
});
on('DELETE', /^groups\/(\d+)\/users\/(\d+)$/, ({ match, state }) => {
	const groupId = Number(match[1]);
	const userId = Number(match[2]);
	state.userGroups = state.userGroups.filter(x => !(x.groupId === groupId && x.userId === userId));
	return { body: {} };
});
