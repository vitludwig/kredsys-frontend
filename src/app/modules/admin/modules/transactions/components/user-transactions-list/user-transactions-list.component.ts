import { Component} from '@angular/core';
import {ITransaction} from "../../services/transaction/types/ITransaction";
import {TransactionService} from "../../services/transaction/transaction.service";
import {UsersService} from "../../../../services/users/users.service";
import {ActivatedRoute} from "@angular/router";
import {IPaginatedResponse} from "../../../../../../common/types/IPaginatedResponse";
import {IUser} from "../../../../../../common/types/IUser";

@Component({
	selector: 'app-user-transactions-list',
	templateUrl: './user-transactions-list.component.html',
	styleUrls: ['./user-transactions-list.component.scss']
})
export class UserTransactionsListComponent {
	protected filterBy: Partial<ITransaction> = {};

	private _selectedUser: IUser;

	public get selectedUser(): IUser {
		return this._selectedUser;
	}

	public set selectedUser(value: IUser) {
		this._selectedUser = value;
		this.filterBy = {userId: value.id};
	}

	constructor(
		protected transactionService: TransactionService,
		protected usersService: UsersService,
		protected route: ActivatedRoute,
	) {
	}

	public getUsers = (search: string): Promise<IPaginatedResponse<IUser>> => {
		if(typeof search !== 'string') {

		}
		return this.usersService.getUsers(search);
	}
}
