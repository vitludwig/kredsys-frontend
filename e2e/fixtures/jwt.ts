import type { EUserRole } from '../../src/app/common/types/IUser';

export interface JwtPayload {
	sub: string;
	name: string;
	email: string;
	roles: EUserRole[];
	exp: number;
}

/**
 * Mints an unsigned JWT for E2E. Uses `alg: 'none'` and an empty signature
 * segment — the canonical "this token is unverified" form. Any real backend
 * that performs even minimal validation will reject it. The previous form
 * `<header>.<body>.signature` claimed `alg: HS256` while the signature was
 * the literal string "signature", a footgun: if the dev server were
 * accidentally pointed at a real backend with permissive verification, the
 * token *might* be honoured.
 */
export function createMockJwt(payload: JwtPayload): string {
	const b64 = (obj: object) => Buffer.from(JSON.stringify(obj)).toString('base64url');
	const header = b64({ alg: 'none', typ: 'JWT' });
	const body = b64(payload);
	return `${header}.${body}.`;
}
