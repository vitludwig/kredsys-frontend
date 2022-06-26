import {Component, OnInit} from '@angular/core';
import {UsersService} from '../../services/users/users.service';
import {PlaceService} from '../../services/place/place/place.service';
import {TransactionService} from './services/transaction/transaction.service';
import {ITransaction} from './services/transaction/types/ITransaction';

@Component({
	selector: 'app-transactions',
	templateUrl: './transactions.component.html',
	styleUrls: ['./transactions.component.scss']
})
export class TransactionsComponent implements OnInit {
	public allTransactions: ITransaction[];


	constructor(
		protected transactionService: TransactionService,
		protected usersService: UsersService,
		protected placeService: PlaceService,

	) {
	}

	public async ngOnInit(): Promise<void> {

	}



}
