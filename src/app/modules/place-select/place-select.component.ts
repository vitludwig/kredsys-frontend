import {Component, OnInit} from '@angular/core';
import {PlaceService} from '../admin/services/place/place/place.service';
import {IPlace} from '../../common/types/IPlace';
import {Router} from '@angular/router';
import {ERoute} from '../../common/types/ERoute';
import {HttpErrorResponse} from '@angular/common/http';
import {AlertService} from '../../common/services/alert/alert.service';

@Component({
	selector: 'app-place-select',
	templateUrl: './place-select.component.html',
	styleUrls: ['./place-select.component.scss'],
})
export class PlaceSelectComponent implements OnInit{
	public place: IPlace;
	public places: IPlace[] = [];
	public errorMsg: string;

	constructor(
		public placeService: PlaceService,
		protected router: Router,
		protected alertService: AlertService,
	) {

	}

	public async ngOnInit(): Promise<void> {
		try {
			this.places = await this.placeService.getAllPlaces();
		} catch(e) {
			if(e instanceof HttpErrorResponse) {
				if(e.status === 403) {
					this.errorMsg = 'Nejste oprávněn vybrat místo, zavolejte někoho s oprávněním nastavit zařízení';
				}
			} else {
				this.errorMsg = 'Nepodařilo se načíst seznam míst';
			}
		}
	}

	public async selectPlace(): Promise<void> {
		this.placeService.selectedPlace = await this.placeService.getPlace(this.place.id!);
		this.router.navigate(['/' + ERoute.SALE]);
	}

}
