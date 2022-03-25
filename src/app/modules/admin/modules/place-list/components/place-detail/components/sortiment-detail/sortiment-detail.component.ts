import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA} from '@angular/material/dialog';
import {IPlaceSortimentItem} from '../../../../../../../../common/types/IPlace';
import {PlaceService} from '../../../../../../services/place/place/place.service';
import {ESaleItemType} from '../../../../../../../sale/types/ESaleItemType';

@Component({
	selector: 'app-sortiment-detail',
	templateUrl: './sortiment-detail.component.html',
	styleUrls: ['./sortiment-detail.component.scss']
})
export class SortimentDetailComponent implements OnInit {
	public isEdit: boolean = false;

	public readonly ESaleItemType = ESaleItemType;

	constructor(
		public placeService: PlaceService,
		@Inject(MAT_DIALOG_DATA) public data: IPlaceSortimentItem
	) {
	}

	public ngOnInit(): void {
		if (!this.data) {
			this.data = {
				name: '',
				price: 0,
				currency: 'Kč',
				type: ESaleItemType.FOOD,
			}
			this.isEdit = false;
		} else {
			this.isEdit = true;
		}
	}

	public async onSubmit(): Promise<void> {
		await this.placeService.addSortimentItem(this.data);
	}

}
