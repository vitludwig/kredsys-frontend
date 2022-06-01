import {AfterViewInit, Component, Input, ViewChild} from '@angular/core';
import {UsersService} from '../../../../services/users/users.service';
import {HashMap} from '../../../../../../common/types/HashMap';
import {IUser} from '../../../../../../common/types/IUser';
import {Animations} from '../../../../../../common/utils/animations';
import {MatSort} from '@angular/material/sort';
import {MatTableDataSource} from '@angular/material/table';
import {MatPaginator} from '@angular/material/paginator';
import {ITransaction, ITransactionResponse} from '../../services/transaction/types/ITransaction';
import {TransactionService} from '../../services/transaction/transaction.service';
import {GoodsService} from '../../../../services/goods/goods.service';
import {IGoods} from '../../../../../../common/types/IGoods';

@Component({
	selector: 'app-transaction-list',
	templateUrl: './transaction-list.component.html',
	styleUrls: ['./transaction-list.component.scss'],
	animations: [
		Animations.expandableTable,
	],
})
export class TransactionListComponent implements AfterViewInit {
	public displayedColumns: string[] = ['amount', 'type', 'created'];
	public dataSource: MatTableDataSource<ITransaction>;
	public expandedRow: ITransaction | null;

	public usersMap: HashMap<IUser> = {};
	public transactionsMap: HashMap<ITransactionResponse> = {};
	public goodsMap: HashMap<IGoods> = {};

	public detailReady: boolean = false;

	@ViewChild(MatSort)
	public sort: MatSort;

	@ViewChild(MatPaginator)
	public paginator: MatPaginator;


	public get transactions(): ITransaction[] {
		return this.#transactions;
	}

	@Input()
	public set transactions(value: ITransaction[]) {
		this.#transactions = value;
		if(this.dataSource) {
			this.dataSource.data = value;
		} else {
			this.dataSource = new MatTableDataSource<ITransaction>(value);
		}
	}

	#transactions: ITransaction[];

	constructor(
		protected usersService: UsersService,
		protected transactionService: TransactionService,
		protected goodsService: GoodsService,
	) {
	}

	public ngAfterViewInit(): void {
		this.dataSource.sort = this.sort;
		this.dataSource.paginator = this.paginator;
	}

	public async showDetail(row: ITransaction): Promise<void> {
		if(row === this.expandedRow) {
			this.expandedRow = null;
			return;
		}
		this.detailReady = false;
		try {
			this.expandedRow = row;

			this.usersMap[row.userId] = await this.usersService.getUser(row.userId);
			const transaction = await this.transactionService.getTransaction(row.id);
			this.transactionsMap[row.id] = transaction
			for(const record of transaction.records) {
				this.goodsMap[record.goodsId] = await this.goodsService.getGoodie(record.goodsId);
			}
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
