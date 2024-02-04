import {Injectable, signal} from '@angular/core';
import {BehaviorSubject, map, Observable} from 'rxjs';
import {EUserRole, IUser} from '../../../../common/types/IUser';
import {OrderService} from '../order/order.service';
import {TransactionService} from '../../../admin/modules/transactions/services/transaction/transaction.service';
import {IPlace} from '../../../../common/types/IPlace';
import {ITransactionRecordDeposit} from '../../../admin/modules/transactions/services/transaction/types/ITransaction';
import {CurrencyService} from '../../../admin/services/currency/currency.service';
import {ICurrencyAccount} from '../../../../common/types/ICurrency';
import {UsersService} from '../../../admin/services/users/users.service';
import {AuthService} from '../../../login/services/auth/auth.service';
import {toSignal} from '@angular/core/rxjs-interop';

@Injectable({
	providedIn: 'root',
})
export class CustomerService {

	#customerSubject: BehaviorSubject<IUser | null> = new BehaviorSubject<IUser | null>(null);
	public customer$: Observable<IUser | null> = this.#customerSubject.asObservable().pipe(
		map((customer) => {
			this.transformUserName(customer?.name ?? '');
			return customer;
		}),
	);

	#currencyAccountSubject: BehaviorSubject<ICurrencyAccount | null> = new BehaviorSubject<ICurrencyAccount | null>(null);
	public currencyAccount$: Observable<ICurrencyAccount | null> = this.#currencyAccountSubject.asObservable();

	public isLogged: boolean = false;

	constructor(
		protected orderService: OrderService,
		protected transactionService: TransactionService,
		protected currencyService: CurrencyService,
		protected usersService: UsersService,
		protected authService: AuthService,
	) {

	}

	public get currencyAccount(): ICurrencyAccount | null {
		return this.#currencyAccountSubject.getValue();
	}

	public get customer(): IUser | null {
		return this.#customerSubject.getValue();
	}

	public set currencyAccount(value: ICurrencyAccount | null) {
		this.#currencyAccountSubject.next(value);
	}

	public set customer(value: IUser | null) {
		this.loadCurrencyAccount(value?.id!).then(() => {
			this.#customerSubject.next(value);
			this.isLogged = value !== null;
			this.orderService.clearOrder();
		});
	}

	public async chargeMoney(amount: number, place: IPlace): Promise<void> {
		try {
			const records: ITransactionRecordDeposit[] = [{
				creatorId: -1,
				amount: amount,
				text: '',
			}];

			await this.transactionService.deposit(
				this.customer!.id!,
				place.id!,
				this.currencyAccount?.currencyId ?? (await this.currencyService.getDefaultCurrency()).id!,
				records,
			);

			await this.loadCurrencyAccount(this.customer!.id!);
		} catch(e) {
			throw e;
		}
	}

	public async dischargeMoney(place: IPlace): Promise<void> {
		try {
			const records: ITransactionRecordDeposit[] = [{
				creatorId: this.authService.user!.id,
				amount: this.currencyAccount!.currentAmount,
				text: 'Vybití peněz',
			}];

			await this.transactionService.withDraw(
				this.customer!.id!,
				place.id!,
				this.currencyAccount?.currencyId ?? (await this.currencyService.getDefaultCurrency()).id!,
				records,
			);

			await this.loadCurrencyAccount(this.customer!.id!);
		} catch(e) {
			throw e;
		}
	}

	public async stornoLastTransaction(transactionId: number): Promise<void> {
		try {
			await this.transactionService.storno(transactionId);
			await this.loadCurrencyAccount(this.customer!.id!);
		} catch(e) {
			throw e;
		}
	}

	public logout(): void {
		this.customer = null;
		this.currencyAccount = null;
	}

	protected async loadCurrencyAccount(userId?: number): Promise<void> {
		if(!userId) {
			this.currencyAccount = null;
			return;
		}

		this.currencyAccount = (await this.usersService.getUserCurrencyAccounts(userId))[0];
		this.orderService.balance = this.currencyAccount?.currentAmount;
	}

	private transformUserName(name: string): string {
		// return full name for admin, otherwise shorten
		if(this.authService.hasRole(EUserRole.ADMIN)) {
			return name;
		}

		let result;
		const nameParts = name.split(' ');

		result = nameParts[0];
		if(nameParts[1]) {
			result += ' ' + nameParts[1][0] + '.';
		}

		return result;
	}
}
