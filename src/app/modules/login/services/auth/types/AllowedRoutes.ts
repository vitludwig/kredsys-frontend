import {EnumHashMap} from '../../../../../common/types/EnumHashMap';
import {ERoute} from '../../../../../common/types/ERoute';
import {EPermission} from './EPermission';
import {EUserRole} from '../../../../../common/types/IUser';

const allowedRoutes: EnumHashMap<EUserRole, ERoute[]> = {
	[EUserRole.ADMIN]: Object.values(ERoute), // all routes
	[EUserRole.POWER_SALESMAN]: [
		ERoute.SALE,
		ERoute.ADMIN,
		ERoute.ADMIN_PLACES,
		ERoute.ADMIN_USERS,
		ERoute.ADMIN_CHARGE,
		ERoute.ADMIN_TRANSACTIONS,
		ERoute.PLACE_SELECT,
		ERoute.CARD_INFO,
		ERoute.CHECK_IN,
	],
	[EUserRole.MEMBER]: [
		ERoute.CARD_INFO,
	],
	[EUserRole.WORKER]: [
		ERoute.SALE,
	],
}

/**
 * Preparation for FE ACL implementation
 */
// const allowedRoutes: EnumHashMap<ERoute, EPermission[]> = {
// 		[ERoute.LOGIN]: [EPermission.APIAccess],
// 		[ERoute.LOGIN_SIGN_IN]: [EPermission.APIAccess],
// 		[ERoute.PLACE_SELECT]: [EPermission.PlaceRead],
// 		[ERoute.CHECK_IN]: [EPermission.UserCreate],
// 		[ERoute.SALE]: [EPermission.CardReadUser],
// 		[ERoute.ADMIN]: [],
// 		[ERoute.ADMIN_USERS]: [EPermission.UserRead],
// 		[ERoute.ADMIN_PLACES]: [EPermission.PlaceRead],
// 		[ERoute.ADMIN_GOODS]: [EPermission.GoodsRead],
// 		[ERoute.ADMIN_GOODS_TYPES]: [EPermission.GoodsTypeRead],
// 		[ERoute.ADMIN_CURRENCIES]: [EPermission.CurrencyRead],
// 		[ERoute.ADMIN_CHARGE]: [EPermission.TransactionCreateDeposit],
// 		[ERoute.ADMIN_TRANSACTIONS]: [EPermission.TransactionRead],
// 		[ERoute.ADMIN_CHANGE_PASSWORD]: [EPermission.UserEdit],
// 		[ERoute.CARD_INFO]: [EPermission.CardRead],
// 		[ERoute.EDIT]: [],
// 		[ERoute.NEW]: [],
// }

export default allowedRoutes;
