import { EUserRole, IUser } from '../../src/app/common/types/IUser';
import { EPermission } from '../../src/app/modules/login/services/auth/types/EPermission';

const ALL: EPermission[] = Object.values(EPermission);

const READ_ONLY: EPermission[] = [
	EPermission.APIAccess,
	EPermission.UserReadOwn,
	EPermission.PlaceReadOwn,
	EPermission.GoodsReadOwn,
	EPermission.CardReadUser,
];

const WORKER: EPermission[] = [
	EPermission.APIAccess,
	EPermission.CanUserLoginToPlace,
	EPermission.UserRead, EPermission.UserReadOwn,
	EPermission.PlaceRead, EPermission.PlaceReadDetail, EPermission.PlaceReadOwn,
	EPermission.PlaceEditOwnGoods,
	EPermission.GoodsRead, EPermission.GoodsReadOwn,
	EPermission.GoodsTypeRead,
	EPermission.CurrencyRead, EPermission.CurrenciesAccountsRead,
	EPermission.CardRead, EPermission.CardAssign, EPermission.CardReadUser,
	EPermission.TransactionRead, EPermission.TransactionCreatePayment,
	EPermission.TransactionCreateDeposit, EPermission.TransactionCreateWithdraw,
];

const POWER_SALESMAN: EPermission[] = [
	...WORKER,
	EPermission.TransactionCancellation,
	EPermission.GoodsCreateOwn, EPermission.GoodsEditOwn,
];

/**
 * Returns the permissions a user with the given roles should have.
 * Mirrors the real backend's role→permission map closely enough to make
 * permission-gated UI assertions meaningful in mock mode. ADMIN gets every
 * permission; lower roles get a curated subset so a regression that changes
 * a permission check actually breaks role-segregation tests.
 */
export function permissionsForRoles(roles: EUserRole[] = []): EPermission[] {
	if (roles.includes(EUserRole.ADMIN)) return ALL;
	if (roles.includes(EUserRole.POWER_SALESMAN)) return POWER_SALESMAN;
	if (roles.includes(EUserRole.WORKER)) return WORKER;
	if (roles.includes(EUserRole.MEMBER)) return READ_ONLY;
	return [];
}

export function permissionsForUser(user: Pick<IUser, 'roles'>): EPermission[] {
	return permissionsForRoles(user.roles ?? []);
}
