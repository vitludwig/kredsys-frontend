import {Component, OnInit} from '@angular/core';
import {EPlaceRole, IPlace, IPlaceSortimentItem} from '../../../../../../common/types/IPlace';
import {ERoute} from '../../../../../../common/types/ERoute';
import {ActivatedRoute, Router} from '@angular/router';
import {PlaceService} from '../../../../services/place/place/place.service';
import {CdkDragDrop, moveItemInArray} from '@angular/cdk/drag-drop';
import {MatDialog} from '@angular/material/dialog';
import {SortimentDetailComponent} from './components/sortiment-detail/sortiment-detail.component';

@Component({
	selector: 'app-place-detail',
	templateUrl: './place-detail.component.html',
	styleUrls: ['./place-detail.component.scss']
})
export class PlaceDetailComponent implements OnInit {
	public place: IPlace;
	public isLoading: boolean = false;
	public isEdit: boolean = false;
	public sortiment: IPlaceSortimentItem[] = [];

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
				await this.loadSortiment();
				this.isEdit = false;
			} else {
				console.log('is new');
				this.place = Object.assign({}, this.placeService.createNewPlace());
				this.isEdit = true;
			}
		} catch (e) {
			// TODO: handle
			console.error(e);
		} finally {
			this.isLoading = false
		}
	}

	protected async loadSortiment(): Promise<void> {
		this.sortiment = await this.placeService.getSortiment();
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
		moveItemInArray(this.sortiment, event.previousIndex, event.currentIndex);
		this.placeService.editSortiment(this.sortiment);
	}

	public openSortimentDetailDialog(data?: IPlaceSortimentItem): void {
		const dialog = this.dialog.open<SortimentDetailComponent, IPlaceSortimentItem>(SortimentDetailComponent, {
			width: '300px',
			minWidth: '250px',
			autoFocus: 'dialog',
			data: Object.assign({}, data),
		});

		dialog.afterClosed().subscribe((result) => {
			this.loadSortiment();
		});
	}

}
