import {inject, Injectable} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {IPaginatedResponse} from '../../../../common/types/IPaginatedResponse';
import {ICurrency, ICurrencyAccount} from '../../../../common/types/ICurrency';
import {firstValueFrom, from, Observable} from 'rxjs';
import {cache, invalidateCache} from '../../../../common/decorators/cache';
import {ECacheTag} from '../../../../common/types/ECacheTag';
import {ETime} from '../../../../common/types/ETime';
import {ConfigService} from "../../../../common/services/config/config.service";

@Injectable({
	providedIn: 'root',
})
export class CurrencyService {
	private configService: ConfigService = inject(ConfigService);
	private http: HttpClient = inject(HttpClient);

	protected limit = 10;
	public defaultCurrency: ICurrency; // filled in app init or on first request

  @cache(ETime.MINUTE * 2, [ECacheTag.CURRENCIES])
	public getCurrencies(search: string = '', page: number = 0, pageSize: number = this.limit): Promise<IPaginatedResponse<ICurrency>> {
		let filter = '';

		if (search) {
			filter += `name#=*${search}/i`;
		}
		const params = {
			filter,
			page,
			pageSize
		};

		return firstValueFrom(this.http.get<IPaginatedResponse<ICurrency>>(this.configService.config.apiUrl + 'currencies', {params: params}));
	}

  /**
   * For now first currency, in future change this flow after currencies are discussed
   */
  @cache(ETime.MINUTE * 2, [ECacheTag.CURRENCIES])
  public async getDefaultCurrency(): Promise<ICurrency> {
  	if (!this.defaultCurrency) {
  		this.defaultCurrency = (await this.getCurrencies()).data[0];
  	}

  	return this.defaultCurrency;
  }

  public getDefaultCurrency$(): Observable<ICurrency> {
  	return from(this.getDefaultCurrency());
  }

  @cache(ETime.MINUTE * 2, [ECacheTag.CURRENCY])
  public async getCurrency(id: number): Promise<ICurrency> {
  	return firstValueFrom(this.http.get<ICurrency>(this.configService.config.apiUrl + 'currencies/' + id));
  }

  @invalidateCache([ECacheTag.CURRENCY, ECacheTag.CURRENCIES])
  public async editCurrency(item: ICurrency): Promise<ICurrency> {
  	return firstValueFrom(this.http.put<ICurrency>(this.configService.config.apiUrl + 'currencies/' + item.id, item));
  }

  @invalidateCache([ECacheTag.CURRENCY, ECacheTag.CURRENCIES])
  public async addCurrency(item: ICurrency): Promise<ICurrency> {
  	return firstValueFrom(this.http.post<ICurrency>(this.configService.config.apiUrl + 'currencies', item));
  }

  public getCurrencyAccount(id: number): Promise<ICurrencyAccount> {
  	return firstValueFrom(this.http.get<ICurrencyAccount>(this.configService.config.apiUrl + 'currencyaccounts/' + id));
  }

  public editCurrencyAccount(id: number, data: ICurrencyAccount): Promise<ICurrencyAccount> {
  	return firstValueFrom(this.http.put<ICurrencyAccount>(this.configService.config.apiUrl + 'currencyaccounts/' + id, {
  		overdraftLimit: data.overdraftLimit,
  	}));
  }

  public createCurrencyAccount(data: { userId: number; currencyId: number; overdraftLimit?: number }): Promise<ICurrencyAccount> {
  	return firstValueFrom(this.http.post<ICurrencyAccount>(this.configService.config.apiUrl + 'currencyaccounts', {
  		userId: data.userId,
  		currencyId: data.currencyId,
  		overdraftLimit: data.overdraftLimit ?? 0,
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
