import { IUser, EUserRole } from '../../../src/app/common/types/IUser';

export type FixtureUser = IUser & { id: number; password: string };

export const users: FixtureUser[] = [
	{ id: 1, name: 'Admin Adminský',     email: 'admin@test.cz',   password: 'admin123',
		memberId: 1001, roles: [EUserRole.ADMIN],          blocked: false },
	{ id: 2, name: 'Pavel Pokladní',     email: 'worker@test.cz',  password: 'worker123',
		memberId: 1002, roles: [EUserRole.WORKER],         blocked: false },
	{ id: 3, name: 'Petr PowerSales',    email: 'power@test.cz',   password: 'power123',
		memberId: 1003, roles: [EUserRole.POWER_SALESMAN], blocked: false },
	{ id: 4, name: 'Marie Členka',       email: 'member@test.cz',  password: 'member123',
		memberId: 1004, roles: [EUserRole.MEMBER],         blocked: false, groups: [1] },
	{ id: 5, name: 'Jana Zákaznice',     email: 'jana@test.cz',    password: 'jana123',
		memberId: 1005, roles: [EUserRole.MEMBER],         blocked: false, groups: [1, 2] },
	{ id: 6, name: 'Karel Zablokovaný',  email: 'karel@test.cz',   password: 'karel123',
		memberId: 1006, roles: [EUserRole.MEMBER],         blocked: true },
	{ id: 7, name: 'Tomáš Tučný',        email: 'tomas@test.cz',   password: 'pwd123',
		memberId: 1007, roles: [EUserRole.MEMBER],         blocked: false },
	{ id: 8, name: 'Lucie Lišková',      email: 'lucie@test.cz',   password: 'pwd123',
		memberId: 1008, roles: [EUserRole.MEMBER],         blocked: false, groups: [2] },
	{ id: 9, name: 'Ondřej Otec',        email: 'ondrej@test.cz',  password: 'pwd123',
		memberId: 1009, roles: [EUserRole.MEMBER],         blocked: false, groups: [3] },
	{ id: 10, name: 'Eva Eko',           email: 'eva@test.cz',     password: 'pwd123',
		memberId: 1010, roles: [EUserRole.MEMBER],         blocked: false },
];

export const adminUser   = users[0];
export const workerUser  = users[1];
export const powerUser   = users[2];
export const memberUser  = users[3];
export const janaUser    = users[4];
export const blockedUser = users[5];
