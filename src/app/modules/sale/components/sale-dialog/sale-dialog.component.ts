import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA} from '@angular/material/dialog';
import {ISaleDialogData} from './types/ISaleDialogData';
import {OrderService} from '../../services/order/order.service';

@Component({
	selector: 'app-sale-dialog',
	templateUrl: './sale-dialog.component.html',
	styleUrls: ['./sale-dialog.component.scss']
})
export class SaleDialogComponent implements OnInit {
	private _count: number = 1;

	public get count(): number {
		return this._count;
	}

	public set count(value: number) {
		if (value < 1) {
			return;
		}
		this._count = value;
	}

	constructor(
		protected orderService: OrderService,
		@Inject(MAT_DIALOG_DATA) public data: ISaleDialogData
	) {
		if(this.data.edit && this.data.count !== undefined) {
			this._count = this.data.count;
		}
	}

	public ngOnInit(): void {
	}

	public addItem(): void {
		if(this.data.edit) {
			this.orderService.editItem(this.data.item, this.count);
		} else {
			this.orderService.addItem(this.data.item, this.count);
		}
	}
}
