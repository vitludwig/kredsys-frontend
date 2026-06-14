import {Pipe, PipeTransform} from '@angular/core';
import {EUserRole} from '../../../../../../common/types/IUser';
import allowedRoutes from '../../types/AllowedRoutes';
import {ERoute} from '../../../../../../common/types/ERoute';

@Pipe({
	name: 'canAccessRoute',
	standalone: false
})
export class CanAccessRoutePipe implements PipeTransform {

	public transform(roles: EUserRole[] | undefined, route: ERoute): boolean {
		if(!roles) {
			return false;
		}

		// Menu visibility is driven purely by the user's role.
		return Object.entries(allowedRoutes)
			.some(([role, routes]) => roles.includes(role as EUserRole) && routes.includes(route));
	}

}
