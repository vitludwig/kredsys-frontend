import {Pipe, PipeTransform} from '@angular/core';
import {EUserRole} from '../../../../../../common/types/IUser';
import allowedRoutes from '../../types/AllowedRoutes';
import {ERoute} from '../../../../../../common/types/ERoute';
import {PlaceService} from "../../../../../admin/services/place/place/place.service";
import allowedPlaceRoutes from "../../types/AllowedPlaceRoutes";
import {EPlaceRole} from "../../../../../../common/types/IPlace";

@Pipe({
	name: 'canAccessRoute'
})
export class CanAccessRoutePipe implements PipeTransform {

	constructor(
		protected placeService: PlaceService,
	) {
	}

	public transform(roles: EUserRole[], route: ERoute): boolean {
		if(!roles) {
			return false;
		}

		const userCanAccess = Object.entries(allowedRoutes).some(([role, allowedRoutes]) => roles.includes(role as EUserRole) && allowedRoutes.includes(route));
		// const placeCanAccess = Object.entries(allowedPlaceRoutes).some(([role, allowedRoutes]) => roles.includes(role as EPlaceRole) && allowedRoutes.includes(route));
		let placeCanAccess = true;
		if(this.placeService.placeRole) {
			placeCanAccess = allowedPlaceRoutes[this.placeService.placeRole!].includes(route);
		}
		return userCanAccess || placeCanAccess;
	}

}
