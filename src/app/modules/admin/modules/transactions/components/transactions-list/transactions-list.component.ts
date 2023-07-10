import {AfterViewInit, Component, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {UsersService} from '../../../../services/users/users.service';
import {Animations} from '../../../../../../common/utils/animations';
import {MatPaginator} from '@angular/material/paginator';
import {ITransaction,} from '../../services/transaction/types/ITransaction';
import {TransactionService} from '../../services/transaction/transaction.service';
import {GoodsService} from '../../../../services/goods/goods.service';
import {IPaginatedResponse} from "../../../../../../common/types/IPaginatedResponse";
import DatalabelsPlugin from 'chartjs-plugin-datalabels';
import {ChartConfiguration, ChartData, TooltipItem, TooltipModel} from 'chart.js';
import {BaseChartDirective} from 'ng2-charts';
import {ETransactionType} from "../../services/transaction/types/ETransactionType";
import {AlertService} from "../../../../../../common/services/alert/alert.service";
import {map, merge, startWith, Subject, switchMap, takeUntil} from "rxjs";
import {CurrencyService} from "../../../../services/currency/currency.service";
import {ITransactionStatistics} from '../../services/transaction/types/ITransactionStatistics';
import {PlaceService} from '../../../../services/place/place/place.service';

@Component({
	selector: 'app-transactions-list',
	templateUrl: './transactions-list.component.html',
	styleUrls: ['./transactions-list.component.scss'],
	animations: [
		Animations.expandableTable,
	],
})
export class TransactionsListComponent implements OnInit, AfterViewInit, OnDestroy {
	public displayedColumns: string[] = ['amount', 'type', 'place', 'userName', 'created', 'actions'];
	public listLoading: boolean = true;

	public transactionData: ITransaction[] = [];
	public transactionsTotal: number = 0;

	public statsDataFrom: string = '';
	public statsDataTo: string = '';
	public statistics: ITransactionStatistics;
	public placesById: Record<number, string> = {};

	@ViewChild(MatPaginator)
	public paginator: MatPaginator;

	@Input()
	public dataLoader: (id: number, offset: number, limit: number, filterBy: Partial<ITransaction>) => Promise<IPaginatedResponse<ITransaction>>

	public get filterBy(): Partial<ITransaction> {
		return {
			...this.#filterBy,
			cancellation: false,
		};
	}

	@Input()
	public set filterBy(value: Partial<ITransaction>) {
		this.#filterBy = value;
		if(value) {
			setTimeout(() => {
				this.loadData();
			})
		}
	}

	public readonly ETransactionType = ETransactionType;

	protected unsubscribe: Subject<void> = new Subject<void>();

	#filterBy: Partial<ITransaction>;

	constructor(
		protected usersService: UsersService,
		protected transactionService: TransactionService,
		protected currencyService: CurrencyService,
		protected alertService: AlertService,
		protected placeService: PlaceService,
	) {
	}

	public async ngOnInit(): Promise<void> {
		const places = await this.placeService.getAllPlaces();
		for(const place of places) {
			this.placesById[place.id!] = place.name;
		}
	}

	public async ngAfterViewInit(): Promise<void> {
		merge(this.paginator.page, this.paginator.pageSize)
			.pipe(
				startWith({}),
				switchMap(() => {
					this.listLoading = true;
					const offset = this.paginator.pageIndex * this.paginator.pageSize;

					return this.transactionService.getTransactions(
						offset >= 0 ? offset : 0,
						this.paginator.pageSize,
						this.filterBy
					);
				}),
				map((data) => {
					// Flip flag to show that loading has finished.
					this.listLoading = false;

					if(data === null) {
						return [];
					}

					this.transactionsTotal = data.total;
					return data.data;
				}),
				takeUntil(this.unsubscribe),
			)
			.subscribe((data) => {
				this.transactionData = data;
			});
	}

	public async stornoTransaction(id: number): Promise<void> {
		try {
			await this.transactionService.storno(id);
			await this.loadData();
			this.alertService.success('Transakce stornována');
		} catch(e) {
			console.error("Failed to storno transaction", e);
			this.alertService.error("Nepodařilo se stornovat transakci");
		}
	}

	public async filterStatsData(reset: boolean = false): Promise<void> {
		if(reset) {
			this.statsDataFrom = '';
			this.statsDataTo = '';
		}
		this.loadStatisticsData();
	}

	protected async loadStatisticsData(): Promise<void> {
		const currency = await this.currencyService.getDefaultCurrency();
		let filterBy: { [key: string]: any } = {
			usersFilter: this.filterBy.userId ? [this.filterBy.userId] : [],
			placesFilter: this.filterBy.placeId ? [this.filterBy.placeId] : [],
			fromDate: this.statsDataFrom,
			toDate: this.statsDataTo,
		};
		this.statistics = await this.transactionService.getStatistics(currency.id!, filterBy);
	}

	protected async loadData(): Promise<void> {
		if(!this.paginator) {
			return;
		}
		const offset = this.paginator.pageIndex * this.paginator.pageSize;
		const result = await this.transactionService.getTransactions(offset, this.paginator.pageSize, this.filterBy);

		await this.loadStatisticsData();

		this.transactionData = result.data;
		this.transactionsTotal = result.total;
	}

	public ngOnDestroy(): void {
		this.unsubscribe.next();
	}
}
