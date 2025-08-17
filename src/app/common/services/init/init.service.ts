import {inject, Injectable} from '@angular/core';
import {CurrencyService} from '../../../modules/admin/services/currency/currency.service';
import {AuthService} from '../../../modules/login/services/auth/auth.service';
import {ConfigService} from "../config/config.service";

@Injectable({
	providedIn: 'root'
})
export class InitService {

	private currencyService: CurrencyService = inject(CurrencyService);
	private authService: AuthService = inject(AuthService);
	private configService: ConfigService = inject(ConfigService);

	public async init(): Promise<void> {
    await this.configService.loadAppConfig();
    await this.authService.init();

		if(this.authService.isLogged) {
			this.currencyService.defaultCurrency = await this.currencyService.getDefaultCurrency();
		}
	}
}
