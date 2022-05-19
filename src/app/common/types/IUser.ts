export interface IUser {
	id?: number;
	name: string;
	email: string;
	memberId: number | null;
	role?: EUserRole; // basic, band, org...
	blocked: boolean;
}

export enum EUserRole {
	ADMIN = 'admin',
	VISITOR = 'visitor',
	MERCHANT = 'merchant',
}
