import {Component, OnInit} from '@angular/core';
import {TransactionService} from "../../services/transaction/transaction.service";
import {CurrencyService} from "../../../../services/currency/currency.service";
import {ICurrency} from "../../../../../../common/types/ICurrency";
import {ETransactionType} from "../../services/transaction/types/ETransactionType";
import {
	ITransaction,
	ITransactionRecordDeposit,
	ITransactionRecordPayment,
	ITransactionRecordWithdraw, ITransactionResponse
} from "../../services/transaction/types/ITransaction";
import {FormControl} from "@angular/forms";
import {debounceTime, distinctUntilChanged, Observable, startWith, switchMap} from "rxjs";
import {IUser} from "../../../../../../common/types/IUser";
import {UsersService} from "../../../../services/users/users.service";
import {GoodsService} from "../../../../services/goods/goods.service";

@Component({
	selector: 'app-new-transaction',
	templateUrl: './new-transaction.component.html',
	styleUrls: ['./new-transaction.component.scss']
})
export class NewTransactionComponent implements OnInit {
	public selectedUser: IUser;
	public type: ETransactionType;
	public userId: number;
	public placeId: number;
	public records: ITransactionRecordPayment[] | ITransactionRecordDeposit[] | ITransactionRecordWithdraw[];
    
	public currency: ICurrency;
	public isLoading: boolean = true;
    
	constructor(
		protected transactionService: TransactionService,
		protected currencyService: CurrencyService,
		protected goodsService: GoodsService,
		protected usersService: UsersService,
	) { }

	public async ngOnInit(): Promise<void> {
		try {
			this.isLoading = true;
			this.currency = await this.currencyService.getDefaultCurrency();
		} catch(e) {
			console.error('Cannot load data: ', e);
		} finally {
			this.isLoading = false;
		}

	}

	public loadData = (value: string) => {
		return this.usersService.getUsers(value);
	}

	public async submit(): Promise<void> {
		switch (this.type) {
			case ETransactionType.PAYMENT:
				await this.submitPayment();
				break;
			case ETransactionType.DEPOSIT:
				await this.submitDeposit();
				break;
			case ETransactionType.WITHDRAW:
				await this.submitWithdraw();
				break;
		}
	}
    
	protected async submitPayment(): Promise<ITransactionResponse> {
		return this.transactionService.pay(this.userId, this.placeId, this.records as ITransactionRecordPayment[]);
	}

	protected async submitDeposit(): Promise<ITransactionResponse> {
		return this.transactionService.deposit(this.userId, this.placeId, this.currency.id!, this.records as ITransactionRecordDeposit[]);
	}

	protected async submitWithdraw(): Promise<ITransactionResponse> {
		return this.transactionService.withDraw(this.userId, this.placeId, this.currency.id!, this.records as ITransactionRecordWithdraw[]);
	}
}
