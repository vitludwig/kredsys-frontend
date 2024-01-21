import {AfterViewInit, Component, inject, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {Animations} from '../../../../../../common/utils/animations';
import {MatPaginator} from '@angular/material/paginator';
import {ITransaction} from '../../services/transaction/types/ITransaction';
import {TransactionService} from '../../services/transaction/transaction.service';
import {GoodsService} from '../../../../services/goods/goods.service';
import {IPaginatedResponse} from "../../../../../../common/types/IPaginatedResponse";
import {ETransactionType} from "../../services/transaction/types/ETransactionType";
import {AlertService} from "../../../../../../common/services/alert/alert.service";
import {map, merge, of, startWith, Subject, switchMap, takeUntil} from "rxjs";
import {CurrencyService} from "../../../../services/currency/currency.service";
import {ITransactionStatistics,} from '../../services/transaction/types/ITransactionStatistics';
import {PlaceService} from '../../../../services/place/place/place.service';
import {MatSort, Sort} from '@angular/material/sort';
import {MatTableDataSource} from '@angular/material/table';

@Component({
	selector: 'app-transactions-list',
	templateUrl: './transactions-list.component.html',
	styleUrls: ['./transactions-list.component.scss'],
	animations: [
		Animations.expandableTable,
	],
})
export class TransactionsListComponent implements OnInit, AfterViewInit, OnDestroy {
	@ViewChild(MatSort)
	public sort: MatSort;
	protected displayedColumns: string[] = ['amount', 'type', 'place', 'userName', 'created', 'actions'];
	protected detailLoading: boolean = true;
	protected expandedRow: ITransaction | null;
	protected transactionDetails: {goodsName: string, amount: number, price: number}[] = [];
	protected dataSource: MatTableDataSource<ITransaction>;
	protected transactionsTotal: number = 0;
	protected statsDataFrom: string = '';
	protected statsDataTo: string = '';
	protected statistics: ITransactionStatistics;
	protected placesById: Record<number, string> = {};
	protected listLoading: boolean = true;
	protected readonly ETransactionType = ETransactionType;
	private transactionService: TransactionService = inject(TransactionService);
	private currencyService: CurrencyService = inject(CurrencyService);
	private alertService: AlertService = inject(AlertService);

	@ViewChild(MatPaginator)
	public paginator: MatPaginator;
	private placeService: PlaceService = inject(PlaceService);
	private goodsService: GoodsService = inject(GoodsService);
	private unsubscribe: Subject<void> = new Subject<void>();
	#filterBy: string;
	#filterByRecord: Partial<ITransaction>;

	public get filterBy(): string {
		return this.#filterBy;
	}

	@Input()
	public set filterBy(value: Partial<ITransaction>) {
		this.#filterBy = this.transformFilterBy(value);
		this.#filterByRecord = value; // TODO: new paging, remove after api for statistics is gridify ready
	}

	public async ngAfterViewInit(): Promise<void> {
		const data = await this.getData();
		this.loadDataSource(data.data, data.count);

		merge(this.paginator.page, this.paginator.pageSize)
			.pipe(
				startWith({}),
				switchMap(() => {
					this.listLoading = true;

					return this.getData();
				}),
				map((data) => {
					// Flip flag to show that loading has finished.
					this.listLoading = false;

					if(data === null) {
						return {count: 0, data: []};
					}

					return data;
				}),
				takeUntil(this.unsubscribe),
			)
			.subscribe((data) => {
				this.loadDataSource(data.data, data.count);
			});
	}

	public async ngOnInit(): Promise<void> {
		const places = await this.placeService.getAllPlaces();
		for(const place of places) {
			this.placesById[place.id!] = place.name;
		}
	}

	public async stornoTransaction(id: number): Promise<void> {
		try {
			await this.transactionService.storno(id);
			this.loadDataSource(this.dataSource.data.filter((transaction) => transaction.id !== id), this.transactionsTotal - 1);
			await this.loadStatisticsData();
			this.alertService.success('Transakce stornována');
		} catch(e) {
			console.error("Failed to storno transaction", e);
			this.alertService.error("Nepodařilo se stornovat transakci");
		}
	}

	protected async loadStatisticsData(): Promise<void> {
		const currency = await this.currencyService.getDefaultCurrency();
		let filterBy: { [key: string]: any } = {
			usersFilter: this.#filterByRecord.userId ? [this.#filterByRecord.userId] : [],
			placesFilter: this.#filterByRecord.placeId ? [this.#filterByRecord.placeId] : [],
			fromDate: this.statsDataFrom,
			toDate: this.statsDataTo,
		};
		// const filterBy = `${this.filterBy}, created >= ${this.statsDataFrom}, created <= ${this.statsDataTo}`; // TODO: new paging
		this.statistics = await this.transactionService.getStatistics(currency.id!, filterBy);
	}

	public async filterStatsData(reset: boolean = false): Promise<void> {
		if(reset) {
			this.statsDataFrom = '';
			this.statsDataTo = '';
		}
		this.loadStatisticsData();
	}

	public async showDetail(row: ITransaction): Promise<void> {
		if(row === this.expandedRow) {
			this.expandedRow = null;
			return;
		}
		this.detailLoading = true;

		try {
			this.expandedRow = row;
			this.transactionDetails = [];

			if(row.type === ETransactionType.PAYMENT) {
				const records = (await this.transactionService.getTransaction(row.id!)).records;
				for(const record of records) {
					const goods = await this.goodsService.getGoodie(record.goodsId);
					this.transactionDetails.push({
						goodsName: goods.name,
						amount: record.multiplier,
						price: record.amountSum,
					})
				}
			}
		} catch(e) {
			console.error('Cannot load transaction detail');
		} finally {
			this.detailLoading = false;
		}
	}

	protected async getData(
		page: number = this.paginator.pageIndex,
		pageSize: number = this.paginator.pageSize,
		filter: string = this.filterBy,
		sort: string =  ''
	): Promise<IPaginatedResponse<ITransaction>> {
		if(!this.paginator) {
			return {
				count: 0,
				data: [],
			};
		}

		try {
			// add 1 to page because paginator starts from 0
			return this.transactionService.getTransactions(page + 1, pageSize, filter, sort);
		} catch(e) {
			throw e;
		}
	}

	protected async sortData(value: Sort): Promise<void> {
		const sortedData = await this.getData(this.paginator.pageIndex,  this.paginator.pageSize, this.filterBy,`${value.active} ${value.direction}`);
		this.loadDataSource(sortedData.data, sortedData.count);
	}

	private loadDataSource(data: ITransaction[], total: number): void {
		if(!this.dataSource) {
			this.dataSource = new MatTableDataSource(data);
			// this.dataSource.paginator = this.paginator;
			this.dataSource.sort = this.sort;
		} else {
			this.dataSource.data = data;
		}

		this.transactionsTotal = total;
	}

	private transformFilterBy(filterBy: Partial<ITransaction>): string {
		filterBy = {
			...filterBy,
			cancellation: false,
		};
		return Object.entries(filterBy).map(([key, value]) => `${key} = ${value}`).join(', ');
	}

	public ngOnDestroy(): void {
		this.unsubscribe.next();
	}
}
