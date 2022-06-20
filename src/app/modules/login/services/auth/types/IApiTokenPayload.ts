export interface IApiTokenPayload {
	aud: string // audience "cybertown"
	iss: string // issuer "cybertown"
	exp: number // expiration
	'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name': string // user login
	'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier': string // user id
}
