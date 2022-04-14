export interface IUser {
	id?: number;
	name: string;
	email: string;
	memberId: number;
	role?: EUserRole; // basic, band, org...
}

export enum EUserRole {
	ADMIN = 'admin',
	VISITOR = 'visitor',
	MERCHANT = 'merchant',
}
