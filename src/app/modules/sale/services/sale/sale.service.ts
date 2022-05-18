import {Injectable} from '@angular/core';
import {ISaleItem} from '../../types/ISaleItem';
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
}
