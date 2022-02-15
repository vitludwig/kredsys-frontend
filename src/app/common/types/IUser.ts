export interface IUser {
	id: number;
	name: string;
	credit: number;
	role?: unknown; // basic, band, org...
}
