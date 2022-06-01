import {Component} from '@angular/core';
import {PlaceService} from '../admin/services/place/place/place.service';

@Component({
	selector: 'app-sale',
	templateUrl: './sale.component.html',
	styleUrls: ['./sale.component.scss'],
})
export class SaleComponent {


	constructor(
		public placeService: PlaceService,
	) {
	}

}
