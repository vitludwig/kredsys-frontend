import {inject, Injectable} from '@angular/core';
import {
	ITransaction,
	ITransactionRecordDeposit,
	ITransactionRecordPayment, ITransactionRecordWithdraw,
	ITransactionResponse,
} from './types/ITransaction';
import {firstValueFrom} from 'rxjs';
import { HttpClient } from '@angular/common/http';
import {ETime} from '../../../../../../common/types/ETime';
import {ECacheTag} from '../../../../../../common/types/ECacheTag';
import {IPaginatedResponse} from '../../../../../../common/types/IPaginatedResponse';
import {cache, invalidateCache} from '../../../../../../common/decorators/cache';
import {ETransactionType} from "./types/ETransactionType";
import {IStatisticsFilter, ITransactionStatistics} from "./types/ITransactionStatistics";
import {ConfigService} from "../../../../../../common/services/config/config.service";

@Injectable({
	providedIn: 'root',
})
export class TransactionService {
	private http: HttpClient = inject(HttpClient);
	private configService = inject(ConfigService);

	@cache(ETime.MINUTE * 2, [ECacheTag.TRANSACTION])
	public getTransactionDetail(id: number, type?: ETransactionType): Promise<ITransactionResponse> {
		const params: { type?: ETransactionType } = {};
		if(type) {
			params['type'] = type
		}

		return firstValueFrom(this.http.get<ITransactionResponse>(this.configService.config.apiUrl + 'transactions/' + id, {params: params}));
	}

	@cache(ETime.MINUTE * 2, [ECacheTag.TRANSACTIONS])
	public getTransactions(page: number = 1, pageSize: number = 15, filter: string = '', orderBy: string = ''): Promise<IPaginatedResponse<ITransaction>> {
		const params = {
			page,
			pageSize,
			filter,
			orderBy,
		};
		return firstValueFrom(this.http.get<IPaginatedResponse<ITransaction>>(this.configService.config.apiUrl + 'transactions', {params: params}));
	}

	@cache(ETime.MINUTE * 2, [ECacheTag.TRANSACTIONS])
	public getStatistics(currencyId: number, filterBy?: Partial<IStatisticsFilter>): Promise<ITransactionStatistics> {
		const params = {
			ignoreCancellation: true,
			...filterBy
		};
		return firstValueFrom(this.http.get<ITransactionStatistics>(this.configService.config.apiUrl + 'statistics/' + currencyId + '/goods', {params: params}));
	}

  @cache(ETime.MINUTE * 2, [ECacheTag.TRANSACTIONS])
	public getExcelStatistics(currencyId: number): Promise<Blob> {
		return firstValueFrom(this.http.get<Blob>(this.configService.config.apiUrl + 'statistics/' + currencyId + '/statistics-all-download', {responseType: 'blob' as 'json'}));
	}

	@invalidateCache([ECacheTag.TRANSACTIONS, ECacheTag.TRANSACTION])
  public pay(userId: number, placeId: number, records: ITransactionRecordPayment[], cardUid: number | null = null, info: string = ''): Promise<ITransactionResponse> {
  	return firstValueFrom(this.http.post<ITransactionResponse>(this.configService.config.apiUrl + 'transactions/payment', {
  		info: info,
  		userId: userId,
  		placeId: placeId,
  		records: records,
  		cardUid: cardUid ?? null,
  	}));
  }

	@invalidateCache([ECacheTag.TRANSACTIONS, ECacheTag.TRANSACTION])
	public deposit(userId: number, placeId: number, currencyId: number, records: ITransactionRecordDeposit[], cardUid: number | null = null, info: string = ''): Promise<ITransactionResponse> {
		return firstValueFrom(this.http.post<ITransactionResponse>(this.configService.config.apiUrl + 'transactions/deposit', {
			info: info,
			userId: userId,
			placeId: placeId,
			records: records,
			currencyId: currencyId,
			cardUid: cardUid ?? null,
		}));
	}

	@invalidateCache([ECacheTag.TRANSACTIONS, ECacheTag.TRANSACTION])
	public withDraw(userId: number, placeId: number, currencyId: number, records: ITransactionRecordWithdraw[], cardUid: number | null = null): Promise<ITransactionResponse> {
		return firstValueFrom(this.http.post<ITransactionResponse>(this.configService.config.apiUrl + 'transactions/withDraw', {
			info: '',
			userId: userId,
			placeId: placeId,
			records: records,
			currencyId: currencyId,
			cardUid: cardUid ?? null,
		}));
	}

	@invalidateCache([ECacheTag.TRANSACTIONS, ECacheTag.TRANSACTION])
	public storno(transactionId: number): Promise<ITransactionResponse> {
		return firstValueFrom(this.http.put<ITransactionResponse>(this.configService.config.apiUrl + 'transactions/' + transactionId + '/cancellation', {}));
	}
}
