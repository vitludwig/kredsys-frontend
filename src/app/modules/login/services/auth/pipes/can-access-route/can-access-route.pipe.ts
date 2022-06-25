import {Pipe, PipeTransform} from '@angular/core';
import {EUserRole} from '../../../../../../common/types/IUser';
import allowedRoutes from '../../types/AllowedRoutes';
import {ERoute} from '../../../../../../common/types/ERoute';

@Pipe({
	name: 'canAccessRoute'
})
export class CanAccessRoutePipe implements PipeTransform {

	public transform(roles: EUserRole[], route: ERoute): boolean {
		// return true;
		// TODO: uncomment after backend return roles on GET users
		if(!roles) {
			return false;
		}
		return Object.entries(allowedRoutes).some(([role, allowedRoutes]) => roles.includes(role as EUserRole) && allowedRoutes.includes(route));
	}

}
