import {AfterViewInit, Component, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {UsersService} from '../../../../services/users/users.service';
import {HashMap} from '../../../../../../common/types/HashMap';
import {Animations} from '../../../../../../common/utils/animations';
import {MatSort} from '@angular/material/sort';
import {MatTableDataSource} from '@angular/material/table';
import {MatPaginator} from '@angular/material/paginator';
import {ITransaction, ITransactionRecord, ITransactionResponse} from '../../services/transaction/types/ITransaction';
import {TransactionService} from '../../services/transaction/transaction.service';
import {GoodsService} from '../../../../services/goods/goods.service';
import {IGoods} from '../../../../../../common/types/IGoods';
import {IPaginatedResponse} from "../../../../../../common/types/IPaginatedResponse";
import DatalabelsPlugin from 'chartjs-plugin-datalabels';
import {ChartConfiguration, ChartData, ChartType, TooltipItem, TooltipModel} from 'chart.js';
import {BaseChartDirective} from 'ng2-charts';
import {Utils} from "../../../../../../common/utils/Utils";
import {ETransactionType} from "../../services/transaction/types/ETransactionType";
import {AlertService} from "../../../../../../common/services/alert/alert.service";
import {filter, map, merge, startWith, Subject, switchMap, takeUntil} from "rxjs";
import {CurrencyService} from "../../../../services/currency/currency.service";

@Component({
	selector: 'app-transactions-list',
	templateUrl: './transactions-list.component.html',
	styleUrls: ['./transactions-list.component.scss'],
	animations: [
		Animations.expandableTable,
	],
})
export class TransactionsListComponent implements AfterViewInit, OnDestroy {
	public displayedColumns: string[] = ['amount', 'type', 'created', 'userName', 'actions'];
	public expandedRow: ITransaction | null;

	public goodsMap: HashMap<IGoods> = {};

	public detailLoading: boolean = true;
	public listLoading: boolean = true;

	public transactionData: ITransaction[] = [];
	public transactionsTotal: number = 0;

	// Pie
	public pieChartOptions: ChartConfiguration['options'] = {
		responsive: true,
		plugins: {
			legend: {
				display: true,
				position: 'top',
			},
			datalabels: {
				formatter: (value, ctx) => {
					if (ctx.chart.data.labels) {
						return ctx.chart.data.labels[ctx.dataIndex];
					}
				},
			},
			tooltip: {
				callbacks: {
					label: function(this: TooltipModel<any>, item: TooltipItem<any>) {
						return item.label + ': ' + item.formattedValue + 'ks';
					}
				}
			}
		}
	};
	// public pieChartData: ChartData<'pie', number[], string | string[]> = {
	// 	labels: [ 'Download', 'Store', 'Mail Sales' ],
	// 	datasets: [ {
	// 		data: [ 300, 500, 100 ]
	// 	} ]
	// };
	public pieChartData: ChartData<'pie', number[], string | string[]> = {
		labels: [],
		datasets: [
			{
				data: [] // amount
			},
		]
	};

	public pieChartType: ChartType = 'pie';
	public pieChartPlugins = [ DatalabelsPlugin ];

	@ViewChild(MatPaginator)
	public paginator: MatPaginator;

	@Input()
	public dataLoader: (id: number, offset: number, limit: number, filterBy: Partial<ITransaction>) => Promise<IPaginatedResponse<ITransaction>>

	public get filterBy(): Partial<ITransaction> {
		return this.#filterBy;
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

	@ViewChild(BaseChartDirective)
	protected chart: BaseChartDirective | undefined;
	protected unsubscribe: Subject<void> = new Subject<void>();

	#filterBy: Partial<ITransaction>;

	constructor(
		protected usersService: UsersService,
		protected transactionService: TransactionService,
		protected goodsService: GoodsService,
		protected currencyService: CurrencyService,
		protected alertService: AlertService,
	) {
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
				console.log('nre data: ', data);
				this.transactionData = data;
			});
	}

	public async stornoTransaction(id: number): Promise<void> {
		try {
			await this.transactionService.storno(id);
		} catch(e) {
			console.error("Failed to storno transaction", e);
			this.alertService.error("Nepodařilo se stornovat transakci");
		}
	}

	public async showDetail(row: ITransaction): Promise<void> {
		if(row === this.expandedRow) {
			this.expandedRow = null;
			return;
		}
		this.detailLoading = true;
		try {
			this.expandedRow = row;

		} catch(e) {
			console.error('Cannot load transaction detail');
		} finally {
			this.detailLoading = false;
		}
	}

	public onSearch(value: string): void {
		// this.transactions = this.transactions.filter((transaction) => {
		// 	return transaction.
		// })
	}

	protected async loadData(): Promise<void> {
		if(!this.paginator) {
			return;
		}
		const offset = this.paginator.pageIndex * this.paginator.pageSize;
		const result = await this.transactionService.getTransactions(offset, this.paginator.pageSize, this.filterBy);

		const currency = await this.currencyService.getDefaultCurrency();
		let filterBy: {[key: string]: number[]} = {
			usersFilter: this.filterBy.userId ? [this.filterBy.userId] : [],
			placesFilter: this.filterBy.placeId ? [this.filterBy.placeId] : [],
		};

		const chartData = await this.transactionService.getStatistics(currency.id!, filterBy);

		this.pieChartData.labels = chartData.goods.map((obj) => obj.goodsName);
		this.pieChartData.datasets[0].data = chartData.goods.map((obj) => obj.sumGoods);

		this.chart?.update();

		this.transactionData = result.data;
		this.transactionsTotal = result.total;
		// try {
		// 	const allTransactions = (await this.dataLoader(this.filterBy.id!, 0, 9999999, this.filterBy)).data;
		// 	this.dataSource = new MatTableDataSource<ITransaction>(allTransactions);
		// 	this.dataSource.paginator = this.paginator;
		// 	const chartData: HashMap<number> = {};
		// 	this.goodsMap = Utils.toHashMap(await this.goodsService.getAllGoods(), 'id');
		//
		// 	// TODO: remove requesting every transaction after BE sends records in transaction (BE 18.)
		// 	for (const transaction of allTransactions) {
		// 		const transactionDetail = await this.transactionService.getTransaction(transaction.id, ETransactionType.PAYMENT);
		// 		if(transactionDetail.type !== ETransactionType.PAYMENT) {
		// 			continue;
		// 		}
		//
		// 		for(const record of transactionDetail.records) {
		//
		// 			if(this.transactionRecordsMap[transaction.id] === undefined) {
		// 				this.transactionRecordsMap[transaction.id] = [record];
		// 			} else {
		// 				this.transactionRecordsMap[transaction.id].push(record);
		// 			}
		//
		// 			const goodie = this.goodsMap[record.goodsId] as IGoods;
		// 			if(chartData[goodie.name] === undefined) {
		// 				chartData[goodie.name] = goodie.price!
		// 			} else {
		// 				chartData[goodie.name] += goodie.price!
		// 			}
		// 		}
		// 	}
		//
		// 	this.pieChartData.labels = Object.keys(chartData);
		// 	this.pieChartData.datasets[0].data = Object.values(chartData);
		// 	this.chart?.update();
		// } catch(e) {
		// 	console.error("Failed to load transactions", e);
		// }
	}

	public ngOnDestroy(): void {
		this.unsubscribe.next();
	}
}
