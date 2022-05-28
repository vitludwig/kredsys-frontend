import {Component} from '@angular/core';
import {PlaceService} from '../admin/services/place/place/place.service';
import {EPlaceRole, IPlace} from '../../common/types/IPlace';
import {Router} from '@angular/router';
import {ERoute} from '../../common/types/ERoute';

@Component({
	selector: 'app-place-select',
	templateUrl: './place-select.component.html',
	styleUrls: ['./place-select.component.scss'],
})
export class PlaceSelectComponent {
	public place: IPlace;
	public places: IPlace[] = [];
	constructor(
		public placeService: PlaceService,
		protected router: Router,
	) {
		this.getAllPlaces().then((p) => this.places = p);
	}

	public async getAllPlaces(): Promise<IPlace[]> {
		return this.placeService.getAllPlaces();
	}

	public async selectPlace(): Promise<void> {
		this.placeService.selectedPlace = await this.placeService.getPlace(this.place.id!);
		this.router.navigate(['/' + ERoute.SALE]);
	}

}
