import { ICurrency } from '../../../src/app/common/types/ICurrency';

export const currencies: (ICurrency & { id: number })[] = [
	{ id: 1, name: 'Koruna festivalu', code: 'KRF', symbol: 'Kč',
		minRechargeAmountWarn: 100, maxRechargeAmountWarn: 5000, blocked: false },
	{ id: 2, name: 'BlockedCoin',      code: 'BLK', symbol: '₿',
		minRechargeAmountWarn: 0,   maxRechargeAmountWarn: 0,    blocked: true },
];

export const defaultCurrency = currencies[0];
export const blockedCurrency = currencies[1];
