import {Component, EventEmitter, Input, Output} from '@angular/core';
import {IUser} from '../../../../../../common/types/IUser';
import {ICurrencyAccount} from '../../../../../../common/types/ICurrency';
import {TransactionService} from '../../../transactions/services/transaction/transaction.service';
import {UsersService} from '../../../../services/users/users.service';
import {CurrencyService} from '../../../../services/currency/currency.service';
import {AuthService} from '../../../../../login/services/auth/auth.service';
import {PlaceService} from '../../../../services/place/place/place.service';
import {AlertService} from '../../../../../../common/services/alert/alert.service';
import {IChargeResult} from '../../types/IChargeResult';
import {HttpErrorResponse} from "@angular/common/http";

@Component({
	selector: 'app-charge-form',
	templateUrl: './charge-form.component.html',
	styleUrls: ['./charge-form.component.scss']
})
export class ChargeFormComponent {
	public amount: number | null;
	public predefinedAmounts: number[] = [500, 800, 1000, 1500, 2000];
	public user: IUser | null;
	public currencyAccount: ICurrencyAccount | null;

	@Input()
	public set cardId(value: number | null) {
		this.#cardId = value;
		this.setCardId(value);
	}

	public get cardId(): number | null {
		return this.#cardId;
	}

	@Output()
	public charge: EventEmitter<IChargeResult> = new EventEmitter<IChargeResult>();

	#cardId: number | null;

	constructor(
		protected transactionService: TransactionService,
		protected usersService: UsersService,
		protected currencyService: CurrencyService,
		protected authService: AuthService,
		protected placeService: PlaceService,
		protected alertService: AlertService,
	) {
	}

	public async setCardId(id: number | null): Promise<void> {
		if(id === null) {
			return;
		}
		this.#cardId = id;
		try {
			this.user = await this.usersService.getUserByCardUid(id);
			this.currencyAccount = (await this.usersService.getUserCurrencyAccounts(this.user.id!))[0];
		} catch(e) {
			console.error(e);
			this.cardId = null;
			this.alertService.error('Uživatel s touto kartou je blokovaný nebo karta neexistuje');
		}
	}

	public async submit(): Promise<void> {
		if(!this.user || !this.currencyAccount) {
			return;
		}
		this.charge.emit({
			amount: this.amount ?? 0,
			user: this.user,
			currencyAccount: this.currencyAccount,
		});

		this.user = null;
		this.currencyAccount = null;
		this.amount = null;
		this.#cardId = null;
	}

}
