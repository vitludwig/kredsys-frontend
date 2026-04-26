import type { EUserRole } from '../../src/app/common/types/IUser';

export interface JwtPayload {
	sub: string;
	name: string;
	email: string;
	roles: EUserRole[];
	exp: number;
}

export function createMockJwt(payload: JwtPayload): string {
	const b64 = (obj: object) => Buffer.from(JSON.stringify(obj)).toString('base64url');
	const header = b64({ alg: 'HS256', typ: 'JWT' });
	const body = b64(payload);
	return `${header}.${body}.signature`;
}
