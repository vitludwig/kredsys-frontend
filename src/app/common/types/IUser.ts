export interface IUser {
	id?: number;
	name: string;
	email: string;
	password?: string;
	memberId: number | null;
	roles?: EUserRole[]; // basic, band, org...
	blocked: boolean;
}

export enum EUserRole {
	ADMIN = 'Admin',
	MEMBER = 'Member',
	WORKER = 'Worker',
	POWER_SALESMAN = 'PowerSalesman',
}
