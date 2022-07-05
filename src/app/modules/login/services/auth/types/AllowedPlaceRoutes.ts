import {EnumHashMap} from '../../../../../common/types/EnumHashMap';
import {ERoute} from '../../../../../common/types/ERoute';
import {EPlaceRole} from "../../../../../common/types/IPlace";

const allowedPlaceRoutes: EnumHashMap<EPlaceRole, ERoute[]> = {
	[EPlaceRole.INFO_POINT]: Object.values(ERoute), // all routes
	[EPlaceRole.REGISTRATION]: [
		ERoute.CARD_INFO,
		ERoute.CHECK_IN,
	],
	[EPlaceRole.USER_INFO]: [
		ERoute.CARD_INFO,
	],
	[EPlaceRole.BAR]: [
		ERoute.SALE,
		ERoute.CARD_INFO
	],
}

export default allowedPlaceRoutes;
