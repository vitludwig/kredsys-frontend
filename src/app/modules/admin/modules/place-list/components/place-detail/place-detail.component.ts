import {Component, OnInit} from '@angular/core';
import {EPlaceRole, IPlace} from '../../../../../../common/types/IPlace';
import {ERoute} from '../../../../../../common/types/ERoute';
import {ActivatedRoute, Router} from '@angular/router';
import {PlaceService} from '../../../../services/place/place/place.service';
import {CdkDragDrop} from '@angular/cdk/drag-drop';
import {MatDialog} from '@angular/material/dialog';
import {SortimentDetailComponent} from './components/sortiment-detail/sortiment-detail.component';
import {IGoods} from '../../../../../../common/types/IGoods';
import {AlertService} from '../../../../../../common/services/alert/alert.service';

@Component({
	selector: 'app-place-detail',
	templateUrl: './place-detail.component.html',
	styleUrls: ['./place-detail.component.scss']
})
export class PlaceDetailComponent implements OnInit {
	public place: IPlace;
	public goods: IGoods[] = [];
	public isLoading: boolean = false;
	public isEdit: boolean = false;

	public readonly EPlaceRole = EPlaceRole;

	constructor(
		public placeService: PlaceService,
		protected route: ActivatedRoute,
		protected router: Router,
		protected dialog: MatDialog,
		protected alertService: AlertService,
	) {
	}

	public async ngOnInit(): Promise<void> {
		this.isLoading = true;
		try {
			const placeId = Number(this.route.snapshot.paramMap.get('id'));
			if (placeId) {
				console.log('is edit');
				this.place = Object.assign({}, await this.placeService.getPlace(placeId));
				this.goods = await this.placeService.getPlaceGoods(placeId);
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
			const place = await this.placeService.addPlace(this.place!);
			for(const item of this.goods) {
				this.placeService.addGoods(item.id!, place.id!);
			}
		}
		this.router.navigate([ERoute.ADMIN, ERoute.ADMIN_PLACES]);
	}

	public drop(event: CdkDragDrop<string[]>): void {
		// TODO: implement sorting goods
		// moveItemInArray(this.place.goods, event.previousIndex, event.currentIndex);
	}

	public openSortimentDetailDialog(): void {
		const dialog = this.dialog.open<SortimentDetailComponent>(SortimentDetailComponent, {
			width: '300px',
			minWidth: '250px',
			autoFocus: 'dialog',
		});

		dialog.afterClosed().subscribe(async (result) => {
			if(!result) {
				return;
			}

			try {
				if(this.place.id) {
					await this.placeService.addGoods(result.id, this.place.id);
					this.goods.push(result)
				}
			} catch(e) {
				// TODO: dodelat spravne validace
				// @ts-ignore
				this.alertService.error(e.error.Message ?? 'Chyba při přidávání sortimentu');
			}
		});
	}

}
