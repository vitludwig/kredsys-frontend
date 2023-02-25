import { Component} from '@angular/core';
import {ITransaction} from "../../services/transaction/types/ITransaction";
import {TransactionService} from "../../services/transaction/transaction.service";
import {UsersService} from "../../../../services/users/users.service";
import {ActivatedRoute} from "@angular/router";
import {IPaginatedResponse} from "../../../../../../common/types/IPaginatedResponse";
import {IUser} from "../../../../../../common/types/IUser";
import {Observable} from "rxjs";
import {ETransactionType} from "../../services/transaction/types/ETransactionType";

@Component({
	selector: 'app-user-transactions-list',
	templateUrl: './user-transactions-list.component.html',
	styleUrls: ['./user-transactions-list.component.scss']
})
export class UserTransactionsListComponent {
	public selectedUser: IUser;
	public filterBy: Partial<ITransaction> = {};
	public filteredOptions: Observable<any>;

	public readonly ETransactionType = ETransactionType;

	constructor(
		protected transactionService: TransactionService,
		protected usersService: UsersService,
		protected route: ActivatedRoute,
	) {
	}

	public getUsers = (search: string): Promise<IPaginatedResponse<IUser>> => {
		return this.usersService.getUsers(search);
	}

	public loadData = (id: number, offset: number = 0, limit: number = 15, filterBy: Partial<ITransaction>): Promise<IPaginatedResponse<ITransaction>> => {
		return this.usersService.getUserTransactions(id, offset, limit, filterBy);
	}
}
