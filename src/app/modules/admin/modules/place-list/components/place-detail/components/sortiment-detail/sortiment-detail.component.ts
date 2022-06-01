import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {ESaleItemType} from '../../../../../../../sale/types/ESaleItemType';
import {IGoods} from '../../../../../../../../common/types/IGoods';
import {GoodsService} from '../../../../../../services/goods/goods.service';

@Component({
	selector: 'app-sortiment-detail',
	templateUrl: './sortiment-detail.component.html',
	styleUrls: ['./sortiment-detail.component.scss'],
})
export class SortimentDetailComponent implements OnInit {
	public allGoods: IGoods[] = [];
	public selectedGoods: IGoods;
	public isEdit: boolean = false;
	public isLoading: boolean = true;

	public readonly ESaleItemType = ESaleItemType;

	constructor(
		public goodsService: GoodsService,
		protected dialogRef: MatDialogRef<SortimentDetailComponent>,
	) {
	}

	public async ngOnInit(): Promise<void> {
		try {
			this.isLoading = true;
			this.allGoods = await this.goodsService.getAllGoods();
		} catch(e) {
			console.error('Cannot load goods: ', e);
		} finally {
			this.isLoading = false;
		}
	}

	public async onSubmit(): Promise<void> {
		this.dialogRef.close(this.selectedGoods);
	}

}
