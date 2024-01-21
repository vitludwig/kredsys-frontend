import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {MatTableDataSource} from '@angular/material/table';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {map, merge, startWith, Subject, switchMap, takeUntil} from 'rxjs';
import {ActivatedRoute} from '@angular/router';
import {GoodsService} from '../../services/goods/goods.service';
import {CurrencyService} from '../../services/currency/currency.service';
import {debounce} from '../../../../common/decorators/debounce';
import {ICurrency} from '../../../../common/types/ICurrency';
import { ERoute } from 'src/app/common/types/ERoute';

@Component({
	selector: 'app-currency-list',
	templateUrl: './currency-list.component.html',
	styleUrls: ['./currency-list.component.scss'],
})
export class CurrencyListComponent implements OnInit, OnDestroy {
	public displayedColumns: string[] = ['name', 'symbol', 'actions'];
	public dataSource: MatTableDataSource<ICurrency>;
	public total: number = 0;
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

		// TODO: create parent component for this common grid tasks
		merge(this.paginator.page, this.paginator.pageSize)
			.pipe(
				startWith({}),
				switchMap(() => {
					this.isLoading = true;

					return this.currencyService.getCurrencies(
						'',
						this.paginator.pageIndex + 1,
						this.paginator.pageSize
					);
				}),
				map((data) => {
					// Flip flag to show that loading has finished.
					this.isLoading = false;

					if(data === null) {
						return [];
					}

					this.total = data.count;
					return data.data;
				}),
				takeUntil(this.unsubscribe),
			)
			.subscribe((data) => {
				this.dataSource.data = data;
			});
	}

	@debounce()
	public onSearch(value: string): void {
		this.loadData(value);
	}

	protected async loadData(filter: string = '', page?: number, pageSize?: number): Promise<void> {
		const data = await this.currencyService.getCurrencies(filter, page, pageSize);

		this.dataSource = new MatTableDataSource<ICurrency>(data.data);
		this.total = data.count;
	}


	public applyFilter(event: Event): void {
		const filterValue = (event.target as HTMLInputElement).value;
		this.dataSource.filter = filterValue.trim().toLowerCase();

		if(this.dataSource.paginator) {
			this.dataSource.paginator.firstPage();
		}
	}

	public ngOnDestroy(): void {
		this.unsubscribe.next();
	}

}
