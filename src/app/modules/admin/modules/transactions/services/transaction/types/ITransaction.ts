import {ETransactionType} from "./ETransactionType";

export interface ITransaction {
	info: string;
	userId: number;
	id: number;
	type: ETransactionType;
	placeId: number;
	created: string;
	amount: number;
	currencyId: number;
	cancellation: boolean;
	userName: string;
	placeName: string;
}

export interface ITransactionRecord {
	creatorId: number;
	text: string,
	id: number;
	type: string; // Create... TODO: create enum
	transactionId: number;
	goodsId: number;
	modifyLogId: number;
	created: Date;
	amountSum: number;
	amountItem: number;
	multiplier: number
}
export interface ITransactionRecordPayment {
	creatorId?: number;
	goodsId: number;
	multiplier: number;
}

export interface ITransactionRecordDeposit {
	creatorId?: number;
	text: string;
	amount: number;
}

export interface ITransactionRecordWithdraw {
	creatorId?: number;
	text: string;
	amount: number;
}

export interface ITransactionResponse extends ITransaction {
	records: ITransactionRecord[]; // TODO type that correctly
}
