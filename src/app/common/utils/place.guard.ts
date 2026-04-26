import {inject} from '@angular/core';
import {Router, ActivatedRouteSnapshot, RouterStateSnapshot, CanActivateFn} from '@angular/router';
import {PlaceService} from '../../modules/admin/services/place/place/place.service';
import {ERoute} from '../types/ERoute';
import {filter, map, take} from 'rxjs';

export const placeGuard: CanActivateFn = (next: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
	const placeService = inject(PlaceService);
	const router = inject(Router);

	if(placeService.selectedPlace) {
		return true;
	}

	const savedPlaceId = localStorage.getItem('selectedPlaceId');
	if(savedPlaceId && savedPlaceId !== 'null') {
		return placeService.selectedPlace$.pipe(
			filter(place => place !== null),
			take(1),
			map(() => true),
		);
	}

	router.navigate(['/' + ERoute.PLACE_SELECT], {queryParams: {returnUrl: state.url}});
	return false;
}
