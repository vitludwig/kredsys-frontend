import {Injectable} from '@angular/core';
import {
	ITransaction,
	ITransactionRecordDeposit,
	ITransactionRecordPayment, ITransactionRecordWithdraw,
	ITransactionResponse,
} from './types/ITransaction';
import {firstValueFrom} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {ETime} from '../../../../../../common/types/ETime';
import {ECacheTag} from '../../../../../../common/types/ECacheTag';
import {environment} from '../../../../../../../environments/environment';
import {IPaginatedResponse} from '../../../../../../common/types/IPaginatedResponse';
import {cache, invalidateCache} from '../../../../../../common/decorators/cache';
import {ETransactionType} from "./types/ETransactionType";
import {IStatisticsFilter, ITransactionStatistics} from "./types/ITransactionStatistics";

@Injectable({
	providedIn: 'root',
})
export class TransactionService {

	constructor(
		protected http: HttpClient,
	) {
	}

	@cache(ETime.MINUTE * 2, [ECacheTag.TRANSACTION])
	public getTransaction(id: number, type?: ETransactionType): Promise<ITransactionResponse> {
		const params: Partial<ITransaction> = {};
		if(type) {
			params['type'] = type
		}

		return firstValueFrom(this.http.get<ITransactionResponse>(environment.apiUrl + 'transactions/' + id, {params: params}));
	}

	@cache(ETime.MINUTE * 2, [ECacheTag.TRANSACTIONS])
	public getTransactions(page: number = 1, pageSize: number = 15, filter: string = '', orderBy: string = ''): Promise<IPaginatedResponse<ITransaction>> {
		const params = {
			page,
			pageSize,
			filter,
			orderBy,
		};
		return firstValueFrom(this.http.get<IPaginatedResponse<ITransaction>>(environment.apiUrl + 'transactions', {params: params}));
	}

	@cache(ETime.MINUTE * 2, [ECacheTag.TRANSACTIONS])
	public getStatistics(currencyId: number, filterBy?: Partial<IStatisticsFilter>): Promise<ITransactionStatistics> {
		const params = {
			ignoreCancellation: true,
			...filterBy
		};
		return firstValueFrom(this.http.get<ITransactionStatistics>(environment.apiUrl + 'statistics/' + currencyId + '/goods', {params: params}));
	}

	@invalidateCache([ECacheTag.TRANSACTIONS, ECacheTag.TRANSACTION])
	public pay(userId: number, placeId: number, records: ITransactionRecordPayment[]): Promise<ITransactionResponse> {
		return firstValueFrom(this.http.post<ITransactionResponse>(environment.apiUrl + 'transactions/payment', {
			info: '',
			userId: userId,
			placeId: placeId,
			records: records,
		}));
	}

	@invalidateCache([ECacheTag.TRANSACTIONS, ECacheTag.TRANSACTION])
	public deposit(userId: number, placeId: number, currencyId: number, records: ITransactionRecordDeposit[]): Promise<ITransactionResponse> {
		return firstValueFrom(this.http.post<ITransactionResponse>(environment.apiUrl + 'transactions/deposit', {
			info: '',
			userId: userId,
			placeId: placeId,
			records: records,
			currencyId: currencyId,
		}));
	}

	@invalidateCache([ECacheTag.TRANSACTIONS, ECacheTag.TRANSACTION])
	public withDraw(userId: number, placeId: number, currencyId: number, records: ITransactionRecordWithdraw[]): Promise<ITransactionResponse> {
		return firstValueFrom(this.http.post<ITransactionResponse>(environment.apiUrl + 'transactions/withDraw', {
			info: '',
			userId: userId,
			placeId: placeId,
			records: records,
			currencyId: currencyId,
		}));
	}

	@invalidateCache([ECacheTag.TRANSACTIONS, ECacheTag.TRANSACTION])
	public storno(transactionId: number): Promise<ITransactionResponse> {
		return firstValueFrom(this.http.put<ITransactionResponse>(environment.apiUrl + 'transactions/' + transactionId + '/cancellation', {}));
	}
}
