import {Injectable} from '@angular/core';
import {Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot} from '@angular/router';
import {PlaceService} from '../../modules/admin/services/place/place/place.service';
import {ERoute} from '../types/ERoute';


@Injectable({providedIn: 'root'})
export class PlaceGuard implements CanActivate {
	constructor(
		protected router: Router,
		protected placeService: PlaceService,
	) {
	}

	public async canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> {
		const selectedPlace = this.placeService.selectedPlace;
		if(selectedPlace) {
			return true;
		} else {
			const selectedId = localStorage.getItem('selectedPlaceId');
			console.log('storage: ', selectedId);
			if(selectedId) {
				this.placeService.selectedPlace = await this.placeService.getPlace(Number(selectedId));
				console.log('place loaded', this.placeService.selectedPlace);
				return true;
			}
		}

		// not logged in so redirect to login page with the return url
		this.router.navigate(['/' + ERoute.PLACE_SELECT], {queryParams: {returnUrl: state.url}});
		return false;
	}
}
