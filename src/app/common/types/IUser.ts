export interface IUser {
	id?: number;
	name: string;
	email: string | null;
	password?: string;
	memberId: number | null;
	roles: EUserRole[]; // basic, band, org...
	blocked: boolean;
	groups?: number[];
	ticketId?: string | null;
}

export enum EUserRole {
	ADMIN = 'Admin',
	MEMBER = 'Member',
	WORKER = 'Worker',
	POWER_SALESMAN = 'PowerSalesman',
}
