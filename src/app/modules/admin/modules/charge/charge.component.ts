import {Component, OnInit} from '@angular/core';
import {ITransactionRecordDeposit} from '../../../../common/services/transaction/types/ITransaction';
import {TransactionService} from '../../../../common/services/transaction/transaction.service';
import {UsersService} from '../../services/users/users.service';
import {IUser} from '../../../../common/types/IUser';
import {CurrencyService} from '../../services/currency/currency.service';
import {ICurrency, ICurrencyAccount} from '../../../../common/types/ICurrency';
import {AuthService} from '../../../login/services/auth/auth.service';
import {PlaceService} from '../../services/place/place/place.service';
import {AlertService} from '../../../../common/services/alert/alert.service';

@Component({
	selector: 'app-charge',
	templateUrl: './charge.component.html',
	styleUrls: ['./charge.component.scss']
})
export class ChargeComponent implements OnInit {
	public amount: number | null;
	public predefinedAmounts: number[] = [500, 800, 1000, 1500, 2000];
	public user: IUser | null;
	public currencyAccount: ICurrencyAccount | null;
	protected defaultCurrency: ICurrency;

	constructor(
		protected transactionService: TransactionService,
		protected usersService: UsersService,
		protected currencyService: CurrencyService,
		protected authService: AuthService,
		protected placeService: PlaceService,
		protected alertService: AlertService,
	) {
	}

	public async ngOnInit(): Promise<void> {
		this.defaultCurrency = await this.currencyService.getDefaultCurrency();
	}

	public async setCardId(id: number): Promise<void> {
		this.user = await this.usersService.getUserByCardUid(id);
		this.currencyAccount = (await this.usersService.getUserCurrencyAccounts(this.user.id!))[0];
	}

	public async submit(): Promise<void> {
		const records: ITransactionRecordDeposit[] = [{
			creatorId: this.authService.user?.id ?? -1,
			amount: this.amount ?? 0,
			text: '',
		}];

		try {
			const result = await this.transactionService.deposit(
				this.user.id!,
				this.placeService.selectedPlace!.id!,
				this.currencyAccount?.currencyId ?? this.defaultCurrency.id!,
				records
			);
			this.alertService.success('Peňauze dobity!')
		} catch(e) {
			console.error('Cannot deposit money: ', e)
			this.alertService.error('Nepodařilo se dobít peňauze');
		} finally {
			this.user = null;
			this.currencyAccount = null;
			this.amount = null;
		}
	}

}
