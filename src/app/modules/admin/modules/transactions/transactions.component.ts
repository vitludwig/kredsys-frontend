import {Component, OnInit} from '@angular/core';
import {UsersService} from '../../services/users/users.service';
import {PlaceService} from '../../services/place/place/place.service';
import {TransactionService} from './services/transaction/transaction.service';
import {AuthService} from "../../../login/services/auth/auth.service";
import {EUserRole} from "../../../../common/types/IUser";
import {CurrencyService} from "../../services/currency/currency.service";

@Component({
    selector: 'app-transactions',
    templateUrl: './transactions.component.html',
    styleUrls: ['./transactions.component.scss'],
    standalone: false
})
export class TransactionsComponent implements OnInit {
	public addTransactionAllowed: boolean = false
  protected isLoading: boolean = false;

	constructor(
		public authService: AuthService,
		protected transactionService: TransactionService,
		protected usersService: UsersService,
		protected placeService: PlaceService,
		protected currencyService: CurrencyService,
	) {
	}

	public ngOnInit(): void {
		this.addTransactionAllowed = this.authService.user!.roles!.some((role) => role === EUserRole.ADMIN || role === EUserRole.POWER_SALESMAN);
	}

  // TODO: reformat and catch errors
  protected async downloadStatistics() {
    try {
      this.isLoading = true;
      const currency = await this.currencyService.getDefaultCurrency();
      const file = await this.transactionService.getExcelStatistics(currency.id!);
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(file);
      link.download = 'kredsys-report.xlsx';
      link.click();
    } finally {
      this.isLoading = false;
    }
  }
}
