export interface IAuthenticationResponse {
	token: string;
	userId: number;
	placeId: number;
	roles: string[]; // TODO: replace with enum
}
