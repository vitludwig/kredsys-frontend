import {Component, inject} from '@angular/core';
import {PlaceService} from '../admin/services/place/place/place.service';
import {CustomerService} from './services/customer/customer.service';

@Component({
	selector: 'app-sale',
	templateUrl: './sale.component.html',
	styleUrls: ['./sale.component.scss'],
	standalone: false
})
export class SaleComponent {
  public placeService = inject(PlaceService);
  public customerService = inject(CustomerService);

	public reorderMode = false;
}
