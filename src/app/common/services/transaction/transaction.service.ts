import {Injectable} from '@angular/core';
import {
	ITransaction,
	ITransactionRecordDeposit,
	ITransactionRecordPayment,
	ITransactionResponse
} from './types/ITransaction';
import {firstValueFrom} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../../../environments/environment';

@Injectable({
	providedIn: 'root'
})
export class TransactionService {

	constructor(
		protected http: HttpClient,
	) {
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
			currencyId: currencyId
		}));
	}
}
