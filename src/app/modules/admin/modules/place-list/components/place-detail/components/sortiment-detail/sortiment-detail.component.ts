import {Component, ElementRef, Inject, OnInit, ViewChild} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {ESaleItemType} from '../../../../../../../sale/types/ESaleItemType';
import {IGoods} from '../../../../../../../../common/types/IGoods';
import {GoodsService} from '../../../../../../services/goods/goods.service';
import {COMMA, ENTER} from '@angular/cdk/keycodes';
import {MatChipInputEvent} from '@angular/material/chips';
import {MatAutocompleteSelectedEvent} from '@angular/material/autocomplete';

@Component({
	selector: 'app-sortiment-detail',
	templateUrl: './sortiment-detail.component.html',
	styleUrls: ['./sortiment-detail.component.scss'],
})
export class SortimentDetailComponent implements OnInit {
	public allGoods: IGoods[] = [];
	public allOptions: string[] = [];
	public selectedOptions: string[] = [];

	public selectedGoods: IGoods[] = [];
	public isEdit: boolean = false;
	public isLoading: boolean = true;
	public separatorKeysCodes: number[] = [ENTER, COMMA];

	public readonly ESaleItemType = ESaleItemType;

	@ViewChild('itemInput')
	public itemInput: ElementRef<HTMLInputElement>;

	constructor(
		public goodsService: GoodsService,
		protected dialogRef: MatDialogRef<SortimentDetailComponent>,
		@Inject(MAT_DIALOG_DATA) protected data: { existingItems: IGoods[] },
	) {
	}

	public async ngOnInit(): Promise<void> {
		try {
			this.isLoading = true;
			const existingItemsId = this.data.existingItems.map((obj) => obj.id);
			this.allGoods = (await this.goodsService.getAllGoods())
				.filter((obj) => !existingItemsId.includes(obj.id));
			this.allOptions = this.allGoods.map((obj) => obj.name);
		} catch(e) {
			console.error('Cannot load goods: ', e);
		} finally {
			this.isLoading = false;
		}
	}

	public addItem(event: MatChipInputEvent): void {
		const name = (event.value || '');
		const item = this.allGoods.find((obj) => obj.name === name);

		if(name && item) {
			this.selectedOptions.push(name);
			this.selectedGoods.push(item);
		}

		event.chipInput!.clear();
	}

	public itemSelected(event: MatAutocompleteSelectedEvent): void {
		const name = event.option.viewValue;
		const item = this.allGoods.find((obj) => obj.name === name);
		if(item) {
			this.selectedOptions.push(name);
			this.selectedGoods.push(item);
		}

		this.itemInput.nativeElement.value = '';
	}

	public removeItem(name: string): void {
		const index = this.selectedOptions.indexOf(name);

		if(index >= 0) {
			this.selectedOptions.splice(index, 1);
			this.selectedGoods = this.selectedGoods.filter((obj) => obj.name !==  name);
		}
	}


	public async onSubmit(): Promise<void> {
		this.dialogRef.close(this.selectedGoods);
	}

}
