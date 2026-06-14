export interface FixtureCard {
	id: number;
	uid: number;
	userId: number;
	type?: string;
	description?: string;
	blocked?: boolean;
	expirationDate?: string | null;
}

// Fixed far-past / far-future timestamps so expiration tests stay deterministic
// regardless of when they run.
export const PAST_EXPIRATION = '2020-01-01T00:00:00';
export const FUTURE_EXPIRATION = '2099-12-31T23:59:00';

export const cards: FixtureCard[] = [
	{ id: 1,  uid: 1111111111, userId: 4 },
	{ id: 2,  uid: 2222222222, userId: 5 },
	{ id: 3,  uid: 3333333333, userId: 3 },
	{ id: 4,  uid: 4444444444, userId: 7 },
	{ id: 5,  uid: 5555555555, userId: 8 },
	{ id: 6,  uid: 6666666666, userId: 9 },
	{ id: 7,  uid: 7777777777, userId: 10 },
	{ id: 8,  uid: 8888888888, userId: 1 },
	// --- expiration scenarios ---
	// Edita (id 11) — sole card, expired: display / edit / sale-overlay tests.
	{ id: 101, uid: 1010101010, userId: 11, expirationDate: PAST_EXPIRATION },
	// Eva (id 10) — extra blocked card: blocked-display / unblock test.
	{ id: 102, uid: 1020202020, userId: 10, blocked: true },
	// Lucie (id 8) — extra active card WITH a (future) expiration: add-card-guard test.
	{ id: 103, uid: 1030303030, userId: 8, expirationDate: FUTURE_EXPIRATION },
];

export const marieCard = cards[0];
export const janaCard  = cards[1];
export const expiredCard = cards.find(c => c.id === 101)!;
export const blockedCard = cards.find(c => c.id === 102)!;
export const activeExpiringCard = cards.find(c => c.id === 103)!;
