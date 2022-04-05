import {Component, Input, OnInit} from '@angular/core';
import {OrderService} from '../../services/order/order.service';
import {SaleService} from '../../services/sale/sale.service';
import {IOrderItem} from '../../types/IOrderItem';
import {IPlace} from '../../../../common/types/IPlace';

@Component({
	selector: 'app-sale-summary',
	templateUrl: './sale-summary.component.html',
	styleUrls: ['./sale-summary.component.scss']
})
export class SaleSummaryComponent {
	@Input()
	public place: IPlace;

	constructor(
		public orderService: OrderService,
		public saleService: SaleService,
	) {
	}

	public openEditDialog(item: IOrderItem): void {
		this.saleService.openSaleDialog({
			item: item.item,
			edit: true,
			count: item.count
		});
	}
}
