import {Component, OnInit} from '@angular/core';
import {ISaleItem} from '../../types/ISaleItem';
import {SaleService} from '../../services/sale/sale.service';
import {ESaleItemType} from '../../types/ESaleItemType';
import {OrderService} from '../../services/order/order.service';
import {MatDialog} from '@angular/material/dialog';
import {SaleDialogComponent} from '../sale-dialog/sale-dialog.component';
import {ISaleDialogData} from '../sale-dialog/types/ISaleDialogData';

@Component({
	selector: 'app-dashboard',
	templateUrl: './dashboard.component.html',
	styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
	public items: ISaleItem[] = [];

	constructor(
		protected saleService: SaleService,
		protected orderService: OrderService,
	) {
	}

	public async ngOnInit(): Promise<void> {
		const items = await this.saleService.getSaleItems();
		for (const item of items) {
			item.image = this.getItemImage(item.type);
		}
		this.items = items;
	}

	public openAddDialog(item: ISaleItem): void {
		this.saleService.openSaleDialog({
			item: item,
			edit: false,
		})
	}

	protected getItemImage(type: ESaleItemType): string {
		switch (type) {
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
