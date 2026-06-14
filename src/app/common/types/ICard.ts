export enum EUserCardType {
	CARD = 'Card',
	TICKET = 'Ticket',
}

export interface ICard {
	id?: number; // card DB id
	uid?: number; // card device id
	description: string;
	type: EUserCardType;
	expirationDate?: string | null; // naive local ISO, e.g. "2026-12-31T23:59:00"; null = no expiration
	blocked?: boolean;
	userId?: number; // zatim je tu objekt uzivatele, Patrik by to mel zmenit jen na id
}
