import {inject, Injectable} from '@angular/core';
import {CurrencyService} from '../../../modules/admin/services/currency/currency.service';
import {AuthService} from '../../../modules/login/services/auth/auth.service';

@Injectable({
	providedIn: 'root'
})
export class InitService {

	private currencyService: CurrencyService = inject(CurrencyService);
	private authService: AuthService = inject(AuthService);

	public async init(): Promise<void> {
		if(this.authService.isLogged) {
			this.currencyService.defaultCurrency = await this.currencyService.getDefaultCurrency();
		}
	}
}
