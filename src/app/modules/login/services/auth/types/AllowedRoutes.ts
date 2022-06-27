import {EnumHashMap} from '../../../../../common/types/EnumHashMap';
import {EUserRole} from '../../../../../common/types/IUser';
import {ERoute} from '../../../../../common/types/ERoute';

const allowedRoutes: EnumHashMap<EUserRole, ERoute[]> = {
	[EUserRole.ADMIN]: Object.values(ERoute), // all routes
	[EUserRole.PLACE]: [
		ERoute.SALE,
		ERoute.ADMIN,
		ERoute.ADMIN_PLACES,
		ERoute.CARD_INFO,
	],
	[EUserRole.POWER_SALESMAN]: [
		ERoute.SALE,
		ERoute.ADMIN,
		ERoute.ADMIN_PLACES,
		ERoute.PLACE_SELECT,
		ERoute.ADMIN_CHARGE,
		ERoute.CARD_INFO,
	],
	[EUserRole.REGISTRAR]: [
		ERoute.CHECK_IN,
		ERoute.ADMIN,
		ERoute.ADMIN_USERS,
		ERoute.ADMIN_CHARGE,
		ERoute.CARD_INFO,
	],
	[EUserRole.MEMBER]: [
		ERoute.CARD_INFO,
	],
	[EUserRole.WORKER]: [
		ERoute.SALE,
		ERoute.ADMIN,
		ERoute.ADMIN_PLACES,
	],
}

export default allowedRoutes;
