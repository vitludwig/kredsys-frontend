import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {MatTableDataSource} from '@angular/material/table';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {firstValueFrom, map, merge, startWith, Subject, switchMap, takeUntil} from 'rxjs';
import {ActivatedRoute} from '@angular/router';
import {debounce} from '../../../../common/decorators/debounce';
import {ERoute} from 'src/app/common/types/ERoute';
import {GoodsService} from '../../services/goods/goods.service';
import {IGoods, IGoodsTableSource, IGoodsType} from '../../../../common/types/IGoods';
import {CurrencyService} from '../../services/currency/currency.service';
import {Utils} from '../../../../common/utils/Utils';
import {ICurrency} from '../../../../common/types/ICurrency';
import { HttpErrorResponse } from "@angular/common/http";
import {AlertService} from "../../../../common/services/alert/alert.service";
import {PlaceService} from '../../services/place/place/place.service';
import {IPlace} from '../../../../common/types/IPlace';
import {MatDialog} from '@angular/material/dialog';
import {GoodsAddToPlaceDialogComponent} from './components/goods-add-to-place-dialog/goods-add-to-place-dialog.component';

@Component({
    selector: 'app-goods-list',
    templateUrl: './goods-list.component.html',
    styleUrls: ['./goods-list.component.scss'],
    standalone: false
})
export class GoodsListComponent implements OnInit, OnDestroy {
	public goodsDisplayedColumns: string[] = ['name', 'type', 'price', 'places', 'actions'];
	public goodsTypesDisplayedColumns: string[] = ['name', 'actions'];

	public places: IPlace[] = [];
	protected placesById: Record<number, string> = {};
	protected placeFilter: number | null = null;
	protected searchTerm: string = '';
	protected editMode: boolean = false;

	public goodsDataSource: MatTableDataSource<IGoodsTableSource>;
	public goodsTypesDataSource: MatTableDataSource<IGoodsType>;

	public goodsTotal: number = 0;
	public goodsTypesTotal: number = 0;

	public isLoading: boolean = false;

	@ViewChild(MatPaginator)
	public paginator: MatPaginator;

	@ViewChild(MatSort)
	public sort: MatSort;

	public readonly ERoute = ERoute;

	protected unsubscribe: Subject<void> = new Subject<void>();

	constructor(
		public route: ActivatedRoute,
		protected goodsService: GoodsService,
		protected currencyService: CurrencyService,
		protected alertService: AlertService,
		protected placeService: PlaceService,
		protected dialog: MatDialog,
	) {

	}

	public async ngOnInit(): Promise<void> {
		this.places = await this.placeService.getAllPlaces();
		this.placesById = {};
		for(const place of this.places) {
			if(place.id != null) {
				this.placesById[place.id] = place.name;
			}
		}

		await this.loadGoods();
		await this.loadGoodsTypes();

		merge(this.paginator.page, this.paginator.pageSize)
			.pipe(
				startWith({}),
				switchMap(() => {
					this.isLoading = true;

					return this.goodsService.getGoods(
						this.searchTerm,
						this.paginator.pageIndex + 1,
						this.paginator.pageSize,
						this.placeFilter,
					);
				}),
				map((data) => {
					// Flip flag to show that loading has finished.
					this.isLoading = false;

					if(data === null) {
						return [];
					}

					this.goodsTotal = data.count;
					return data.data;
				}),
				takeUntil(this.unsubscribe),
			)
			.subscribe(async (data) => {
				this.goodsDataSource.data = await this.transformGoodsToSource(data);
			});
	}

	@debounce()
	public onSearch(value: string = ''): void {
		this.searchTerm = value;
		this.loadGoods();
	}

	public onPlaceFilterChange(): void {
		this.loadGoods();
	}

	public placeName(id: number): string {
		return this.placesById[id] ?? ('#' + id);
	}

	public async openAddToPlace(row: IGoodsTableSource): Promise<void> {
		const existing = row.placeIds ?? [];
		const available = this.places.filter(p => p.id != null && !existing.includes(p.id));

		if(available.length === 0) {
			this.alertService.error('Zboží je už přidáno na všech místech');
			return;
		}

		const ref = this.dialog.open(GoodsAddToPlaceDialogComponent, {
			width: '360px',
			data: {places: available},
		});

		const placeId = await firstValueFrom(ref.afterClosed());
		if(placeId == null) {
			return;
		}

		try {
			await this.placeService.addGoods(row.id!, placeId);
			this.updateRowPlaces(row, [...existing, placeId]);
		} catch(e) {
			console.error('Cannot add goods to place', e);
			this.alertService.error('Nepodařilo se přidat zboží na místo');
		}
	}

	public async removeFromPlace(row: IGoodsTableSource, placeId: number): Promise<void> {
		try {
			await this.placeService.removeGoods(row.id!, placeId);
			this.updateRowPlaces(row, (row.placeIds ?? []).filter(id => id !== placeId));
		} catch(e) {
			console.error('Cannot remove goods from place', e);
			this.alertService.error('Nepodařilo se odebrat zboží z místa');
		}
	}

	private updateRowPlaces(row: IGoodsTableSource, placeIds: number[]): void {
		row.placeIds = placeIds;
		// Re-emit so the table re-renders the chips.
		this.goodsDataSource.data = [...this.goodsDataSource.data];
	}

	protected async loadGoods(page: number = 0, pageSize: number = 15): Promise<void> {
		const goods = await this.goodsService.getGoods(this.searchTerm, page, pageSize, this.placeFilter);

		this.goodsDataSource = new MatTableDataSource<IGoodsTableSource>(await this.transformGoodsToSource(goods.data));
		this.goodsTotal = goods.count;
	}

	protected async loadGoodsTypes(): Promise<void> {
		const goodsTypes = await this.goodsService.getGoodsTypes();
		this.goodsTypesDataSource = new MatTableDataSource<IGoodsType>(goodsTypes);
	}

	protected async transformGoodsToSource(source: IGoods[]): Promise<IGoodsTableSource[]> {
		const data: IGoodsTableSource[] = [];
		const types = Utils.toHashMap<IGoodsType>((await this.goodsService.getGoodsTypes()), 'id');
		const currencies = Utils.toHashMap<ICurrency>((await this.currencyService.getCurrencies()).data, 'id');

		for(const item of source) {
			data.push({
				...item,
				currency: currencies[item.currencyId!].code,
				type: types[item.goodsTypeId!].name,
			});
		}

		return data;
	}

	public applyFilter(event: Event): void {
		const filterValue = (event.target as HTMLInputElement).value;
		this.goodsDataSource.filter = filterValue.trim().toLowerCase();

		if(this.goodsDataSource.paginator) {
			this.goodsDataSource.paginator.firstPage();
		}
	}

	public async removeGoodsType(id: number): Promise<void> {
		try {
			await this.goodsService.removeGoodsType(id);
			this.loadGoodsTypes();
		} catch(e) {
			console.error('Cannot remove goods type', e);
			if(e instanceof HttpErrorResponse) {
				this.alertService.error(e.error.Message);
			} else {
				this.alertService.error('Nepodařilo se odstranit typ zboží');
			}
		}
	}

	public async removeGoods(id: number): Promise<void> {
		try {
			await this.goodsService.removeGoods(id);
			this.loadGoods();
		} catch(e) {
			console.error('Cannot remove goods', e);
			if(e instanceof HttpErrorResponse) {
				this.alertService.error(e.error.Message);
			} else {
				this.alertService.error('Nepodařilo se odstranit zboží');
			}
		}
	}

	public ngOnDestroy(): void {
		this.unsubscribe.next();
	}

}
