export interface IUser {
	id?: number;
	name: string;
	credit?: number;
	role?: EUserRole; // basic, band, org...
}

export enum EUserRole {
	ADMIN = 'admin',
	VISITOR = 'visitor',
	MERCHANT = 'merchant',
}
