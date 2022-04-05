import {Component, Input, OnInit} from '@angular/core';
import {ISaleItem} from '../../types/ISaleItem';
import {SaleService} from '../../services/sale/sale.service';
import {ESaleItemType} from '../../types/ESaleItemType';
import {OrderService} from '../../services/order/order.service';
import {IPlace} from '../../../../common/types/IPlace';

@Component({
	selector: 'app-dashboard',
	templateUrl: './dashboard.component.html',
	styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
	@Input()
	public place: IPlace;

	public items: ISaleItem[] = [];

	constructor(
		protected saleService: SaleService,
		protected orderService: OrderService,
	) {
	}

	public async ngOnInit(): Promise<void> {
		for(const item of this.place.goods) {
			this.items.push({
				...item,
				image: this.getItemImage(item.type),
			})
		}
	}

	public openAddDialog(item: ISaleItem): void {
		this.saleService.openSaleDialog({
			item: item,
			edit: false,
		})
	}

	protected getItemImage(type: ESaleItemType): string {
		switch(type) {
			case ESaleItemType.BEER:
				return 'beer'
			case ESaleItemType.SHOT:
				return 'shot'
			case ESaleItemType.FOOD:
				return 'food'
			case ESaleItemType.OTHER:
				return 'other'
			default:
				return 'other'
		}
	}

}
