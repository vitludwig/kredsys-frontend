import {Injectable} from '@angular/core';
import {ISaleItem} from '../../types/ISaleItem';
import {ESaleItemType} from '../../types/ESaleItemType';
import {SaleDialogComponent} from '../../components/sale-dialog/sale-dialog.component';
import {ISaleDialogData} from '../../components/sale-dialog/types/ISaleDialogData';
import {MatDialog} from '@angular/material/dialog';

@Injectable({
	providedIn: 'root'
})
export class SaleService {
	protected saleItems: ISaleItem[] = [];

	constructor(
		protected dialog: MatDialog
	) {
		for (let i = 1; i <= 20; i++) {
			this.saleItems.push({
				id: i,
				name: 'Polozka ' + i,
				currency: 'Kč',
				price: 30,
				type: i <= 5 ? ESaleItemType.BEER : i > 5 && i < 10 ? ESaleItemType.SHOT : i >= 10 && i < 13 ? ESaleItemType.FOOD : ESaleItemType.OTHER,
			})
		}
	}

	public async getSaleItems(): Promise<ISaleItem[]> {
		return this.saleItems;
	}

	public openSaleDialog(data: ISaleDialogData): void {
		this.dialog.open<SaleDialogComponent, ISaleDialogData>(SaleDialogComponent, {
			width: '300px',
			minWidth: '250px',
			autoFocus: 'dialog',
			data: data,
		});

		// dialogRef.afterClosed().subscribe(result => {
		// 	console.log(`Dialog result: ${result}`);
		// });
	}
}
