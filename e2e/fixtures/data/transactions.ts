import { ITransaction } from '../../../src/app/modules/admin/modules/transactions/services/transaction/types/ITransaction';
import { ETransactionType } from '../../../src/app/modules/admin/modules/transactions/services/transaction/types/ETransactionType';
import { users } from './users';
import { places } from './places';

const dayMs = 86_400_000;
const now = Date.parse('2026-04-26T12:00:00Z');
const daysAgo = (n: number) => new Date(now - n * dayMs).toISOString();

const userName = (id: number) => users.find(u => u.id === id)!.name;
const placeName = (id: number) => places.find(p => p.id === id)!.name;

interface TxSeed {
	id: number;
	userId: number;
	placeId: number;
	amount: number;
	dayOffset: number;
	info?: string;
}

const seeds: TxSeed[] = [
	{ id: 1,  userId: 4,  placeId: 1, amount: -50,  dayOffset: 1  },
	{ id: 2,  userId: 4,  placeId: 1, amount: -80,  dayOffset: 1  },
	{ id: 3,  userId: 5,  placeId: 1, amount: -30,  dayOffset: 2  },
	{ id: 4,  userId: 5,  placeId: 2, amount: -70,  dayOffset: 3  },
	{ id: 5,  userId: 7,  placeId: 1, amount: -100, dayOffset: 5  },
	{ id: 6,  userId: 4,  placeId: 1, amount: 500,  dayOffset: 7  },
	{ id: 7,  userId: 5,  placeId: 3, amount: 200,  dayOffset: 14 },
	{ id: 8,  userId: 8,  placeId: 2, amount: -60,  dayOffset: 15 },
	{ id: 9,  userId: 8,  placeId: 1, amount: -50,  dayOffset: 20 },
	{ id: 10, userId: 7,  placeId: 2, amount: -35,  dayOffset: 25 },
	{ id: 11, userId: 4,  placeId: 2, amount: -100, dayOffset: 30 },
	{ id: 12, userId: 5,  placeId: 1, amount: -25,  dayOffset: 35 },
	{ id: 13, userId: 9,  placeId: 1, amount: -80,  dayOffset: 40 },
	{ id: 14, userId: 10, placeId: 1, amount: 100,  dayOffset: 45 },
	{ id: 15, userId: 10, placeId: 1, amount: -25,  dayOffset: 50 },
	{ id: 16, userId: 8,  placeId: 2, amount: -90,  dayOffset: 60 },
	{ id: 17, userId: 4,  placeId: 1, amount: -40,  dayOffset: 70 },
	{ id: 18, userId: 7,  placeId: 1, amount: -50,  dayOffset: 80 },
	{ id: 19, userId: 5,  placeId: 1, amount: -30,  dayOffset: 85 },
	{ id: 20, userId: 9,  placeId: 2, amount: -70,  dayOffset: 88 },
	{ id: 21, userId: 4,  placeId: 1, amount: -25,  dayOffset: 2  },
	{ id: 22, userId: 5,  placeId: 1, amount: -40,  dayOffset: 4  },
	{ id: 23, userId: 7,  placeId: 1, amount: -55,  dayOffset: 6  },
	{ id: 24, userId: 8,  placeId: 1, amount: -65,  dayOffset: 8  },
	{ id: 25, userId: 9,  placeId: 1, amount: -75,  dayOffset: 10 },
	{ id: 26, userId: 10, placeId: 1, amount: -85,  dayOffset: 12 },
	{ id: 27, userId: 4,  placeId: 2, amount: -45,  dayOffset: 16 },
	{ id: 28, userId: 5,  placeId: 2, amount: -55,  dayOffset: 18 },
	{ id: 29, userId: 7,  placeId: 2, amount: -65,  dayOffset: 22 },
	{ id: 30, userId: 8,  placeId: 2, amount: -75,  dayOffset: 28 },
];

export const transactions: ITransaction[] = seeds.map(s => ({
	id: s.id,
	userId: s.userId,
	placeId: s.placeId,
	amount: s.amount,
	currencyId: 1,
	created: daysAgo(s.dayOffset),
	type: s.amount >= 0 ? ETransactionType.DEPOSIT : ETransactionType.PAYMENT,
	cancellation: false,
	info: s.info ?? '',
	userName: userName(s.userId),
	placeName: placeName(s.placeId),
}));
