import {Component, OnInit} from '@angular/core';
import {UsersService} from '../../services/users/users.service';
import {PlaceService} from '../../services/place/place/place.service';
import {TransactionService} from './services/transaction/transaction.service';
import {AuthService} from "../../../login/services/auth/auth.service";
import {EUserRole} from "../../../../common/types/IUser";

@Component({
	selector: 'app-transactions',
	templateUrl: './transactions.component.html',
	styleUrls: ['./transactions.component.scss']
})
export class TransactionsComponent implements OnInit {
	public addTransactionAllowed: boolean = false

	constructor(
		public authService: AuthService,
		protected transactionService: TransactionService,
		protected usersService: UsersService,
		protected placeService: PlaceService,
	) {
	}

	public ngOnInit(): void {
		this.addTransactionAllowed = this.authService.user!.roles!.some((role) => role === EUserRole.ADMIN || role === EUserRole.POWER_SALESMAN);
	}
}
