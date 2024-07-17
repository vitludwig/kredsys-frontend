import {inject} from '@angular/core';
import {Router, ActivatedRouteSnapshot, RouterStateSnapshot, CanActivateFn} from '@angular/router';
import {PlaceService} from '../../modules/admin/services/place/place/place.service';
import {ERoute} from '../types/ERoute';

export const placeGuard: CanActivateFn = (next: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
	const placeService = inject(PlaceService);
	const router = inject(Router);

	if(placeService.selectedPlace) {
		return true;
	}

	// not logged in so redirect to login page with the return url
	router.navigate(['/' + ERoute.PLACE_SELECT], {queryParams: {returnUrl: state.url}});
	return false;
}
