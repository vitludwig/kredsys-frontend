import {Injectable} from '@angular/core';
import {
	ITransaction,
	ITransactionRecordDeposit,
	ITransactionRecordPayment,
	ITransactionResponse,
} from './types/ITransaction';
import {firstValueFrom} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {ETime} from '../../../../../../common/types/ETime';
import {ECacheTag} from '../../../../../../common/types/ECacheTag';
import {environment} from '../../../../../../../environments/environment';
import {IPaginatedResponse} from '../../../../../../common/types/IPaginatedResponse';
import {cache} from '../../../../../../common/decorators/cache';

@Injectable({
	providedIn: 'root',
})
export class TransactionService {

	constructor(
		protected http: HttpClient,
	) {
	}

	@cache(ETime.HOUR, [ECacheTag.TRANSACTION])
	public getTransaction(id: number): Promise<ITransactionResponse> {
		return firstValueFrom(this.http.get<ITransactionResponse>(environment.apiUrl + 'transactions/' + id));
	}

	// TODO: after backend support filtering, fix this method (limit)
	@cache(ETime.HOUR, [ECacheTag.TRANSACTIONS])
	public getTransactions(offset: number = 0, limit: number = 15, filterBy: Partial<ITransaction>): Promise<IPaginatedResponse<ITransaction>> {
		const params = {
			offset: 0,
			limit: limit,
			...filterBy
		};
		return firstValueFrom(this.http.get<IPaginatedResponse<ITransaction>>(environment.apiUrl + 'transactions', {params: params}));
	}

	public pay(userId: number, placeId: number, records: ITransactionRecordPayment[]): Promise<ITransactionResponse> {
		return firstValueFrom(this.http.post<ITransactionResponse>(environment.apiUrl + 'transactions/payment', {
			info: '',
			userId: userId,
			placeId: placeId,
			records: records,
		}));
	}

	public deposit(userId: number, placeId: number, currencyId: number, records: ITransactionRecordDeposit[]): Promise<ITransactionResponse> {
		return firstValueFrom(this.http.post<ITransactionResponse>(environment.apiUrl + 'transactions/deposit', {
			info: '',
			userId: userId,
			placeId: placeId,
			records: records,
			currencyId: currencyId,
		}));
	}
}
