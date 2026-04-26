import { ICurrencyAccount } from '../../../src/app/common/types/ICurrency';

export const currencyAccounts: ICurrencyAccount[] = [
	{ id: 1,  userId: 1,  currencyId: 1, currentAmount: 1000, overdraftLimit: 0   },
	{ id: 2,  userId: 2,  currencyId: 1, currentAmount: 0,    overdraftLimit: 0   },
	{ id: 3,  userId: 3,  currencyId: 1, currentAmount: 500,  overdraftLimit: 0   },
	{ id: 4,  userId: 4,  currencyId: 1, currentAmount: 500,  overdraftLimit: 0   },
	{ id: 5,  userId: 5,  currencyId: 1, currentAmount: 50,   overdraftLimit: 100 },
	{ id: 6,  userId: 6,  currencyId: 1, currentAmount: 0,    overdraftLimit: 0   },
	{ id: 7,  userId: 7,  currencyId: 1, currentAmount: 200,  overdraftLimit: 0   },
	{ id: 8,  userId: 8,  currencyId: 1, currentAmount: 750,  overdraftLimit: 0   },
	{ id: 9,  userId: 9,  currencyId: 1, currentAmount: 0,    overdraftLimit: 0   },
	{ id: 10, userId: 10, currencyId: 1, currentAmount: 100,  overdraftLimit: 0   },
];
