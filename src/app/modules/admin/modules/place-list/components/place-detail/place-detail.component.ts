import {Component, inject, OnInit} from '@angular/core';
import {IPlace} from '../../../../../../common/types/IPlace';
import {ERoute} from '../../../../../../common/types/ERoute';
import {ActivatedRoute, NavigationStart, Router} from '@angular/router';
import {PlaceService} from '../../../../services/place/place/place.service';
import {CdkDragDrop, moveItemInArray} from '@angular/cdk/drag-drop';
import {MatDialog} from '@angular/material/dialog';
import {SortimentDetailComponent} from './components/sortiment-detail/sortiment-detail.component';
import {IGoods} from '../../../../../../common/types/IGoods';
import {AlertService} from '../../../../../../common/services/alert/alert.service';
import { HttpErrorResponse } from '@angular/common/http';
import {filter, takeUntil} from "rxjs";
import {WithSubscriptionsComponent} from "../../../../../../common/components/with-subscriptions.component";
import {CanComponentDeactivate} from "../../../../../../common/types/CanComponentDeactivate";

@Component({
    selector: 'app-place-detail',
    templateUrl: './place-detail.component.html',
    styleUrls: ['./place-detail.component.scss'],
    standalone: false
})
export class PlaceDetailComponent extends WithSubscriptionsComponent implements OnInit, CanComponentDeactivate {
  public readonly placeService = inject(PlaceService);
  protected readonly route = inject(ActivatedRoute);
  protected readonly router = inject(Router);
  protected readonly dialog = inject(MatDialog);
  protected readonly alertService = inject(AlertService);

	public place: IPlace;
	public goods: IGoods[] = [];
	public isLoading: boolean = false;
	public isEdit: boolean = false;
  protected goodsPositionChanged: boolean = false;

	public readonly ERoute = ERoute;

  public canDeactivate(): boolean {
    if (!this.goodsPositionChanged) {
      return true;
    }

    return window.confirm(
      'Pozice zboží nebyla uložena, opravdu chcete odejít?'
    );
  };

	public async ngOnInit(): Promise<void> {
		this.isLoading = true;
		try {
			const placeId = Number(this.route.snapshot.paramMap.get('id'));
			if(placeId) {
				this.place = Object.assign({}, await this.placeService.getPlace(placeId));
				this.goods = (await this.placeService.getPlaceGoods(placeId)).map((obj) => obj.goods);
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

    this.router.events
      .pipe(
        takeUntil(this.destroy$),
        filter((e) => e instanceof NavigationStart)
      )
      .subscribe()
	}


	public async onSubmit(): Promise<void> {
		// TODO: pridat osetren erroru, globalne
		try {
			if(this.isEdit) {
				await this.placeService.editPlace(this.place!);
				this.alertService.success('Místo upraveno!');
			} else {
				const place = await this.placeService.addPlace(this.place!);

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
      this.goodsPositionChanged = true;
			moveItemInArray(this.goods, event.previousIndex, event.currentIndex);
		} catch(e) {
			console.error('Canot move goods: ', e);
			this.alertService.error('Chyba při změně pořadí sortimentu');
		}
	}

  protected async confirmPosition(): Promise<void> {
    try {
      await this.placeService.moveGoods(this.place!.id!, this.goods);
      this.goodsPositionChanged = false;
      this.alertService.success('Pozice zboží změněna');
    } catch(e) {
      console.error('Canot move goods: ', e);
      this.alertService.error('Nepovedlo se změnit pořadí');
    }
  }

	public async removeItem(id: number): Promise<void> {
		try {
      if(this.isEdit) {
        await this.placeService.removeGoods(id, this.place!.id!);
      }
			this.goods = this.goods.filter((obj) => obj.id !== id);
		} catch(e) {
			this.alertService.error('Nepodařilo se odebrat zboží');
			console.error('Cannot remove item', e)
		}
	}

	public openSortimentDetailDialog(): void {
		const dialog = this.dialog.open<SortimentDetailComponent>(SortimentDetailComponent, {
			width: '50%',
      panelClass: 'responsive-dialog-container',
			autoFocus: 'dialog',
      position: {
        top: '50px'
      },
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
				}
        this.goods.push(...result);
			} catch(e) {
				if(e instanceof HttpErrorResponse) {
					this.alertService.error(e.error.Message ?? 'Chyba při přidávání sortimentu');
				}
			}
		});
	}

}
