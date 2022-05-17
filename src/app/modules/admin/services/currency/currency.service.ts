import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {IPaginatedResponse} from '../../../../common/types/IPaginatedResponse';
import {ICurrency, ICurrencyAccount} from '../../../../common/types/ICurrency';
import {firstValueFrom} from 'rxjs';
import {environment} from '../../../../../environments/environment';
import {IGoods} from '../../../../common/types/IGoods';

@Injectable({
	providedIn: 'root'
})
export class CurrencyService {
	protected limit = 10;

	constructor(
        protected http: HttpClient,
    ) {
	}

    public getCurrencies(search: string = '', page: number = 1, limit = this.limit): Promise<IPaginatedResponse<ICurrency>> {
	    const params = {
		    offset: (page - 1) * this.limit,
		    limit: limit,
	    };

	    return firstValueFrom(this.http.get<IPaginatedResponse<ICurrency>>(environment.apiUrl + 'currencies', {params: params}));
    }

	public async getCurrency(id: number): Promise<ICurrency> {
		return firstValueFrom(this.http.get<ICurrency>(environment.apiUrl + 'currencies/' + id));
	}

	public async editCurrency(item: ICurrency): Promise<ICurrency> {
		return firstValueFrom(this.http.put<ICurrency>(environment.apiUrl + 'currencies/' + item.id, item));
	}

	public async addCurrency(item: ICurrency): Promise<ICurrency> {
		return firstValueFrom(this.http.post<ICurrency>(environment.apiUrl + 'currencies', item));
	}

	public getCurrencyAccount(id: number): Promise<ICurrencyAccount> {
		return firstValueFrom(this.http.get<ICurrencyAccount>(environment.apiUrl + 'currencyaccounts/' + id));
	}

	public editCurrencyAccount(id: number, data: ICurrencyAccount): Promise<ICurrencyAccount> {
		return firstValueFrom(this.http.put<ICurrencyAccount>(environment.apiUrl + 'currencyaccounts/' + id, {
			overdraftLimit: data.overdraftLimit
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
		}
	}
}
