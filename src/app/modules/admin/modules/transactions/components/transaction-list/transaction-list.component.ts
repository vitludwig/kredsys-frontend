import {AfterViewInit, Component, Input, ViewChild} from '@angular/core';
import {ITransaction} from '../../../../../../common/services/transaction/types/ITransaction';
import {UsersService} from '../../../../services/users/users.service';
import {HashMap} from '../../../../../../common/types/HashMap';
import {IUser} from '../../../../../../common/types/IUser';
import {Animations} from '../../../../../../common/utils/animations';
import {MatSort} from '@angular/material/sort';
import {MatTableDataSource} from '@angular/material/table';
import {MatPaginator} from '@angular/material/paginator';

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
	public users: HashMap<IUser> = {};
	public expandedRow: ITransaction | null;

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

		this.expandedRow = row;

		if(!this.users[row.userId]) {
			this.users[row.userId] = await this.usersService.getUser(row.userId); // TODO: cache this in userService or, ideally, by decorator on request
		}
	}

	public onSearch(value: string): void {
		// this.transactions = this.transactions.filter((transaction) => {
		// 	return transaction.
		// })
	}

}
