export interface ICard {
	id?: number; // card DB id
	uid?: number; // card device id
	description: string;
	type: 'Card' | unknown;
	expirationDate?: string; // "2022-04-02T14:54:52.794Z"
	blocked?: boolean;
	userId?: number; // zatim je tu objekt uzivatele, Patrik by to mel zmenit jen na id
}
