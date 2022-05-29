export interface IUser {
	id?: number;
	name: string;
	email: string;
	memberId: number | null;
	role?: EUserRole; // basic, band, org...
	blocked: boolean;
}

export enum EUserRole {
	ADMIN = 'Admin',
	MEMBER = 'Member',
	PLACE = 'Place',
	REGISTRAR = 'Registrar',
	POWER_SALESMAN = 'PowerSalesman',
}
