import {EnumHashMap} from '../../../../../common/types/EnumHashMap';
import {EUserRole} from '../../../../../common/types/IUser';
import {ERoute} from '../../../../../common/types/ERoute';

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

export default allowedRoutes;
