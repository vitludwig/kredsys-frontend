import {Component, OnInit} from '@angular/core';
import {OrderService} from '../../services/order/order.service';
import {SaleService} from '../../services/sale/sale.service';
import {ISaleItem} from '../../types/ISaleItem';
import {IOrderItem} from '../../types/IOrderItem';

@Component({
	selector: 'app-sale-summary',
	templateUrl: './sale-summary.component.html',
	styleUrls: ['./sale-summary.component.scss']
})
export class SaleSummaryComponent implements OnInit {

	constructor(
		public orderService: OrderService,
		public saleService: SaleService,
	) {
	}

	public ngOnInit(): void {
	}

	public openEditDialog(item: IOrderItem): void {
		this.saleService.openSaleDialog({
			item: item.item,
			edit: true,
			count: item.count
		});
	}
}
