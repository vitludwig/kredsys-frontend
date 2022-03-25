export interface ICard {
	id: number;
	userId: number;
	type: ECardType;
	blocked: boolean;
}

export enum ECardType {
	BASIC = 'basic'
}
