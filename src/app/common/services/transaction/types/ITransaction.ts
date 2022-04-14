export interface ITransaction {
	info: string;
	userId: number;
	id: number;
	type: 'Payment' | 'Deposit';
	placeId: number;
	created: string;
	amount: number;
	currencyId: number;
	cancellation: boolean;
}

export interface ITransactionRecord {
	creatorId: number;
}
export interface ITransactionRecordPayment extends ITransactionRecord {
	goodsId: number;
	multiplier: number;
}

export interface ITransactionRecordDeposit extends ITransactionRecord {
	text: string;
	amount: number;
}

export interface ITransactionResponse extends ITransaction {
	records: any[]; // TODO type that correctly
}
