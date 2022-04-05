import {Component, OnInit} from '@angular/core';
import {EPlaceRole, IPlace, IPlaceSortimentItem} from '../../../../../../common/types/IPlace';
import {ERoute} from '../../../../../../common/types/ERoute';
import {ActivatedRoute, Router} from '@angular/router';
import {PlaceService} from '../../../../services/place/place/place.service';
import {CdkDragDrop, moveItemInArray} from '@angular/cdk/drag-drop';
import {MatDialog} from '@angular/material/dialog';
import {SortimentDetailComponent} from './components/sortiment-detail/sortiment-detail.component';
import {ESaleItemType} from '../../../../../sale/types/ESaleItemType';

@Component({
	selector: 'app-place-detail',
	templateUrl: './place-detail.component.html',
	styleUrls: ['./place-detail.component.scss']
})
export class PlaceDetailComponent implements OnInit {
	public place: IPlace;
	public isLoading: boolean = false;
	public isEdit: boolean = false;

	public readonly EPlaceRole = EPlaceRole;

	constructor(
		public placeService: PlaceService,
		protected route: ActivatedRoute,
		protected router: Router,
		protected dialog: MatDialog,
	) {
	}

	public async ngOnInit(): Promise<void> {
		this.isLoading = true;
		try {
			const placeId = Number(this.route.snapshot.paramMap.get('id'));
			if (placeId) {
				console.log('is edit');
				this.place = Object.assign({}, await this.placeService.getPlace(placeId));
				this.isEdit = true;
			} else {
				console.log('is new');
				this.place = Object.assign({}, this.placeService.createNewPlace());
				this.isEdit = false;
			}
		} catch (e) {
			// TODO: handle
			console.error(e);
		} finally {
			this.isLoading = false
		}
	}


	public async onSubmit(): Promise<void> {
		// TODO: pridat osetren erroru, globalne
		if (this.isEdit) {
			await this.placeService.editPlace(this.place!);
		} else {
			await this.placeService.addPlace(this.place!);
		}
		this.router.navigate([ERoute.ADMIN, ERoute.ADMIN_PLACES]);
	}

	public drop(event: CdkDragDrop<string[]>): void {
		moveItemInArray(this.place.goods, event.previousIndex, event.currentIndex);
	}

	public openSortimentDetailDialog(data?: IPlaceSortimentItem): void {
		let newItem = data ?? {
			name: '',
			price: null,
			currency: 'Kč',
			type: ESaleItemType.FOOD,
		};
		const dialog = this.dialog.open<SortimentDetailComponent, IPlaceSortimentItem>(SortimentDetailComponent, {
			width: '300px',
			minWidth: '250px',
			autoFocus: 'dialog',
			data: newItem,
		});

		dialog.afterClosed().subscribe((result) => {
			this.place.goods.push(result)
		});
	}

}
