import {Injectable} from '@angular/core';
import {CurrencyService} from '../../../modules/admin/services/currency/currency.service';
import {AuthService} from '../../../modules/login/services/auth/auth.service';

@Injectable({
	providedIn: 'root'
})
export class InitService {

	constructor(
		private currencyService: CurrencyService,
		private authService: AuthService,
	) {
	}

	public async init(): Promise<void> {
		if(this.authService.isLogged) {
			this.currencyService.defaultCurrency = await this.currencyService.getDefaultCurrency();
		}
	}
}
