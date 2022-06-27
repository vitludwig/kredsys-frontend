import {Component, Input, OnInit, ViewChild} from '@angular/core';
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

@Component({
	selector: 'app-transactions-list',
	templateUrl: './transactions-list.component.html',
	styleUrls: ['./transactions-list.component.scss'],
	animations: [
		Animations.expandableTable,
	],
})
export class TransactionsListComponent implements OnInit {
	public displayedColumns: string[] = ['amount', 'type', 'created'];
	public dataSource: MatTableDataSource<ITransaction>;
	public expandedRow: ITransaction | null;

	public transactionsMap: HashMap<ITransactionResponse> = {};
	public transactionRecordsMap: HashMap<ITransactionRecord[]> = {};
	public goodsMap: HashMap<IGoods> = {};

	public detailReady: boolean = false;

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
						return item.label + ': ' + item.formattedValue + 'Kč';
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
		datasets: [ {
			data: []
		} ]
	};

	public pieChartType: ChartType = 'pie';
	public pieChartPlugins = [ DatalabelsPlugin ];

	@ViewChild(MatSort)
	public sort: MatSort;

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
			this.loadData()
		}

	}

	@ViewChild(BaseChartDirective)
	protected chart: BaseChartDirective | undefined;

	#filterBy: Partial<ITransaction>;

	constructor(
		protected usersService: UsersService,
		protected transactionService: TransactionService,
		protected goodsService: GoodsService,
	) {
	}

	public async ngOnInit(): Promise<void> {
		this.loadData();
	}

	protected async loadData(): Promise<void> {
		try {
			const allTransactions = (await this.dataLoader(this.filterBy.id!, 0, 9999999, this.filterBy)).data;
			this.dataSource = new MatTableDataSource<ITransaction>(allTransactions);
			this.dataSource.paginator = this.paginator;
			const chartData: HashMap<number> = {};
			this.goodsMap = Utils.toHashMap(await this.goodsService.getAllGoods(), 'id');

			// TODO: remove requesting every transaction after BE sends records in transaction (BE 18.)
			for (const transaction of allTransactions) {
				const transactionDetail = await this.transactionService.getTransaction(transaction.id, ETransactionType.PAYMENT);
				if(transactionDetail.type !== ETransactionType.PAYMENT) {
					continue;
				}

				for(const record of transactionDetail.records) {

					if(this.transactionRecordsMap[transaction.id] === undefined) {
						this.transactionRecordsMap[transaction.id] = [record];
					} else {
						this.transactionRecordsMap[transaction.id].push(record);
					}

					const goodie = this.goodsMap[record.goodsId] as IGoods;
					if(chartData[goodie.name] === undefined) {
						chartData[goodie.name] = goodie.price!
					} else {
						chartData[goodie.name] += goodie.price!
					}
				}
			}

			this.pieChartData.labels = Object.keys(chartData);
			this.pieChartData.datasets[0].data = Object.values(chartData);
			this.chart?.update();
		} catch(e) {
			console.error("Failed to load transactions", e);
		}
	}

	public async showDetail(row: ITransaction): Promise<void> {
		if(row === this.expandedRow) {
			this.expandedRow = null;
			return;
		}
		this.detailReady = false;
		try {
			this.expandedRow = row;
			this.detailReady = true;
		} catch(e) {
			console.error('Cannot load transaction detail');
		}
	}

	public onSearch(value: string): void {
		// this.transactions = this.transactions.filter((transaction) => {
		// 	return transaction.
		// })
	}

}
