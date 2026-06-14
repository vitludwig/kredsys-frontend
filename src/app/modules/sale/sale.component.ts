import {Component, inject, OnDestroy} from '@angular/core';
import {PlaceService} from '../admin/services/place/place/place.service';
import {CustomerService} from './services/customer/customer.service';

@Component({
	selector: 'app-sale',
	templateUrl: './sale.component.html',
	styleUrls: ['./sale.component.scss'],
	standalone: false
})
export class SaleComponent implements OnDestroy {
	public placeService = inject(PlaceService);
	public customerService = inject(CustomerService);

	public reorderMode = false;

	// A customer is card-logged-in only within /sale. Leaving the route destroys this
	// component, so log the card user out to avoid carrying the session to other routes.
	public ngOnDestroy(): void {
		this.customerService.logout();
	}
}
