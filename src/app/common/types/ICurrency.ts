export interface ICurrency {
	id?: number;
	name: string;
	code: string;
	symbol: string;
	minRechargeAmountWarn: number;
	maxRechargeAmountWarn: number;
	blocked: boolean;
}

export interface ICurrencyAccount {
	id: number;
	userId: number
	overdraftLimit: number;
	currentAmount: number;
	currencyId: number;
}


