import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {MatTableDataSource} from '@angular/material/table';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {map, merge, startWith, Subject, switchMap, takeUntil} from 'rxjs';
import {ActivatedRoute} from '@angular/router';
import {debounce} from '../../../../common/decorators/debounce';
import {ERoute} from 'src/app/common/types/ERoute';
import {GoodsService} from '../../services/goods/goods.service';
import {IGoods, IGoodsTableSource, IGoodsType} from '../../../../common/types/IGoods';
import {CurrencyService} from '../../services/currency/currency.service';
import {Utils} from '../../../../common/utils/Utils';
import {ICurrency} from '../../../../common/types/ICurrency';

@Component({
	selector: 'app-goods-list',
	templateUrl: './goods-list.component.html',
	styleUrls: ['./goods-list.component.scss'],
})
export class GoodsListComponent implements OnInit, OnDestroy {
	public goodsDisplayedColumns: string[] = ['name', 'type', 'price', 'currency', 'actions'];
	public goodsTypesDisplayedColumns: string[] = ['name', 'actions'];

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
	) {

	}

	public async ngOnInit(): Promise<void> {
		await this.loadData();

		merge(this.paginator.page, this.paginator.pageSize)
			.pipe(
				startWith({}),
				switchMap(() => {
					this.isLoading = true;
					const offset = this.paginator.pageIndex * this.paginator.pageSize

					return this.goodsService.getGoods(
						'',
						offset >= 0 ? offset : 0,
						this.paginator.pageSize
					);
				}),
				map((data) => {
					// Flip flag to show that loading has finished.
					this.isLoading = false;

					if(data === null) {
						return [];
					}

					this.goodsTotal = data.total;
					return data.data;
				}),
				takeUntil(this.unsubscribe),
			)
			.subscribe(async (data) => {
				this.goodsDataSource.data = await this.transformGoodsToSource(data);
			});
	}

	@debounce()
	public onSearch(value: string): void {
		this.loadData(value);
	}

	protected async loadData(search: string = '', offset: number = 0, limit: number = 15): Promise<void> {
		const goods = await this.goodsService.getGoods(search, offset, limit);
		const goodsTypes = await this.goodsService.getGoodsTypes();

		this.goodsDataSource = new MatTableDataSource<IGoodsTableSource>(await this.transformGoodsToSource(goods.data));
		this.goodsTotal = goods.total;

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

	public ngOnDestroy(): void {
		this.unsubscribe.next();
	}

}
