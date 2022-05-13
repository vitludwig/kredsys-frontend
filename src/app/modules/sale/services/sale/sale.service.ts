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
