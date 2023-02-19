import {Component, OnInit} from '@angular/core';
import {EPlaceRole, IPlace} from '../../../../../../common/types/IPlace';
import {ERoute} from '../../../../../../common/types/ERoute';
import {ActivatedRoute, Router} from '@angular/router';
import {PlaceService} from '../../../../services/place/place/place.service';
import {CdkDragDrop, moveItemInArray} from '@angular/cdk/drag-drop';
import {MatDialog} from '@angular/material/dialog';
import {SortimentDetailComponent} from './components/sortiment-detail/sortiment-detail.component';
import {IGoods} from '../../../../../../common/types/IGoods';
import {AlertService} from '../../../../../../common/services/alert/alert.service';
import {HttpErrorResponse} from '@angular/common/http';

@Component({
	selector: 'app-place-detail',
	templateUrl: './place-detail.component.html',
	styleUrls: ['./place-detail.component.scss'],
})
export class PlaceDetailComponent implements OnInit {
	public place: IPlace;
	public placeRole: EPlaceRole = EPlaceRole.BAR;
	public goods: IGoods[] = [];
	public isLoading: boolean = false;
	public isEdit: boolean = false;

	public readonly EPlaceRole = EPlaceRole;
	public readonly ERoute = ERoute;

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
			if(placeId) {
				this.place = Object.assign({}, await this.placeService.getPlace(placeId));
				this.placeRole = await this.placeService.getPlaceRole(placeId);
				this.goods = await this.placeService.getPlaceGoods(placeId);
				this.isEdit = true;
			} else {
				this.place = Object.assign({}, this.placeService.createNewPlace());
				this.isEdit = false;
			}
		} catch(e) {
			this.alertService.error('Nepodařilo se načíst detail místa');
			console.error(e);
		} finally {
			this.isLoading = false;
		}
	}


	public async onSubmit(): Promise<void> {
		// TODO: pridat osetren erroru, globalne
		try {
			if(this.isEdit) {
				await this.placeService.editPlace(this.place!);
				await this.placeService.editPlaceRole(this.place!.id!, this.placeRole);
				this.alertService.success('Místo upraveno!');
			} else {
				const place = await this.placeService.addPlace(this.place!);
				await this.placeService.editPlaceRole(place.id!, this.placeRole);

				for(const item of this.goods) {
					this.placeService.addGoods(item.id!, place.id!);
				}
				this.alertService.success('Místo přidáno!');
			}
			this.router.navigate([ERoute.ADMIN, ERoute.ADMIN_PLACES]);
		} catch(e) {
			this.alertService.error('Chyba při zpracování místa');
		}
	}

	public async drop(event: CdkDragDrop<string[]>): Promise<void> {
		try {
			await this.placeService.moveGoods(this.place!.id!, this.goods[event.previousIndex].id!, this.goods[event.currentIndex].id!);
			moveItemInArray(this.goods, event.previousIndex, event.currentIndex);
		} catch(e) {
			console.error('Canot move goods: ', e);
			this.alertService.error('Chyba při změně pořadí sortimentu');
		}
	}

	public async removeItem(id: number): Promise<void> {
		try {
			await this.placeService.removeGoods(id, this.place!.id!);
			this.goods = this.goods.filter((obj) => obj.id !== id);
		} catch(e) {
			this.alertService.success('Nepodařilo se odebrat zboží');
			console.error('Cannot remove item', e)
		}
	}

	public openSortimentDetailDialog(): void {
		const dialog = this.dialog.open<SortimentDetailComponent>(SortimentDetailComponent, {
			width: '300px',
			minWidth: '250px',
			autoFocus: 'dialog',
			data: {
				existingItems: this.goods,
			}
		});

		dialog.afterClosed().subscribe(async (result) => {
			if(!result) {
				return;
			}

			try {
				if(this.place.id) {
					for(const item of result) {
						await this.placeService.addGoods(item.id, this.place.id);
					}
					this.goods.push(...result);
				}
			} catch(e) {
				if(e instanceof HttpErrorResponse) {
					this.alertService.error(e.error.Message ?? 'Chyba při přidávání sortimentu');
				}
			}
		});
	}

}
