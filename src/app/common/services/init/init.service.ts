import {Injectable} from '@angular/core';
import {CurrencyService} from '../../../modules/admin/services/currency/currency.service';

@Injectable({
	providedIn: 'root'
})
export class InitService {

	constructor(protected currencyService: CurrencyService) {
	}

	public async init(): Promise<void> {
		this.currencyService.defaultCurrency = await this.currencyService.getDefaultCurrency();
	}
}
