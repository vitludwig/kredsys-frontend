import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {IPaginatedResponse} from '../../../../common/types/IPaginatedResponse';
import {ICurrency, ICurrencyAccount} from '../../../../common/types/ICurrency';
import {firstValueFrom} from 'rxjs';
import {environment} from '../../../../../environments/environment';
import {cache, invalidateCache} from '../../../../common/decorators/cache';
import {ECacheTag} from '../../../../common/types/ECacheTag';
import {ETime} from '../../../../common/types/ETime';

@Injectable({
	providedIn: 'root',
})
export class CurrencyService {
	protected limit = 10;
	protected defaultCurrency: ICurrency;

	constructor(
		protected http: HttpClient,
	) {
	}

	@cache(ETime.MINUTE * 2, [ECacheTag.CURRENCIES])
	public getCurrencies(search: string = '', offset: number = 0, limit = this.limit): Promise<IPaginatedResponse<ICurrency>> {
	    const params = {
		    offset: offset,
		    limit: limit,
			Name: search,
	    };

	    return firstValueFrom(this.http.get<IPaginatedResponse<ICurrency>>(environment.apiUrl + 'currencies', {params: params}));
	}

	/**
	 * For now first currency, in future change this flow after currencies are discussed
	 */
	@cache(ETime.MINUTE * 2, [ECacheTag.CURRENCIES])
	public async getDefaultCurrency(): Promise<ICurrency> {
		if(!this.defaultCurrency) {
			this.defaultCurrency = (await this.getCurrencies()).data[0];
		}

		return this.defaultCurrency;
	}

	@cache(ETime.MINUTE * 2, [ECacheTag.CURRENCY])
	public async getCurrency(id: number): Promise<ICurrency> {
		return firstValueFrom(this.http.get<ICurrency>(environment.apiUrl + 'currencies/' + id));
	}

	@invalidateCache([ECacheTag.CURRENCY, ECacheTag.CURRENCIES])
	public async editCurrency(item: ICurrency): Promise<ICurrency> {
		return firstValueFrom(this.http.put<ICurrency>(environment.apiUrl + 'currencies/' + item.id, item));
	}

	@invalidateCache([ECacheTag.CURRENCY, ECacheTag.CURRENCIES])
	public async addCurrency(item: ICurrency): Promise<ICurrency> {
		return firstValueFrom(this.http.post<ICurrency>(environment.apiUrl + 'currencies', item));
	}

	public getCurrencyAccount(id: number): Promise<ICurrencyAccount> {
		return firstValueFrom(this.http.get<ICurrencyAccount>(environment.apiUrl + 'currencyaccounts/' + id));
	}

	public editCurrencyAccount(id: number, data: ICurrencyAccount): Promise<ICurrencyAccount> {
		return firstValueFrom(this.http.put<ICurrencyAccount>(environment.apiUrl + 'currencyaccounts/' + id, {
			overdraftLimit: data.overdraftLimit,
		}));
	}

	public createNewCurrency(): ICurrency {
		return {
			name: '',
			code: '',
			symbol: '',
			minRechargeAmountWarn: 0,
			maxRechargeAmountWarn: 0,
			blocked: false,
		};
	}
}
