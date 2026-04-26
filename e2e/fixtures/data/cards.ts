export interface FixtureCard {
	id: number;
	uid: number;
	userId: number;
}

export const cards: FixtureCard[] = [
	{ id: 1,  uid: 1111111111, userId: 4 },
	{ id: 2,  uid: 2222222222, userId: 5 },
	{ id: 3,  uid: 3333333333, userId: 3 },
	{ id: 4,  uid: 4444444444, userId: 7 },
	{ id: 5,  uid: 5555555555, userId: 8 },
	{ id: 6,  uid: 6666666666, userId: 9 },
	{ id: 7,  uid: 7777777777, userId: 10 },
	{ id: 8,  uid: 8888888888, userId: 1 },
];

export const marieCard = cards[0];
export const janaCard  = cards[1];
