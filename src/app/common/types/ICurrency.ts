export interface ICurrency {
	id?: number;
	name: string;
	code: string;
	symbol: string;
	minRechargeAmountWarn: number;
	maxRechargeAmountWarn: number;
	blocked: boolean;
}
