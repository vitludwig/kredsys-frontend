import {Component} from '@angular/core';
import {UsersService} from '../../services/users/users.service';
import {CurrencyService} from '../../services/currency/currency.service';
import {AuthService} from '../../../login/services/auth/auth.service';
import {PlaceService} from '../../services/place/place/place.service';
import {AlertService} from '../../../../common/services/alert/alert.service';
import {TransactionService} from '../transactions/services/transaction/transaction.service';
import {ITransactionRecordDeposit} from '../transactions/services/transaction/types/ITransaction';
import {IChargeResult} from './types/IChargeResult';

@Component({
	selector: 'app-charge',
	templateUrl: './charge.component.html',
	styleUrls: ['./charge.component.scss'],
})
export class ChargeComponent {

	constructor(
		protected transactionService: TransactionService,
		protected usersService: UsersService,
		protected currencyService: CurrencyService,
		protected authService: AuthService,
		protected placeService: PlaceService,
		protected alertService: AlertService,
	) {
	}

	public async onCharge(chargeData: IChargeResult): Promise<void> {
		const records: ITransactionRecordDeposit[] = [{
			creatorId: this.authService.user?.id ?? -1,
			amount: chargeData.amount,
			text: '',
		}];

		try {
			let currencyId = chargeData.currencyId;
			if(!currencyId) {
				currencyId = (await this.currencyService.getDefaultCurrency()).id!;
			}

			await this.transactionService.deposit(
				chargeData.user.id!,
				this.placeService.selectedPlace!.id!,
				currencyId,
				records,
			);
			this.alertService.success('Peňauze dobity!');
		} catch(e) {
			console.error('Cannot deposit money: ', e);
			this.alertService.error('Nepodařilo se dobít peňauze');
		}
	}

}
