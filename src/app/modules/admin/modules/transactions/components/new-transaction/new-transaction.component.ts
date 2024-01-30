import {Component, OnInit} from '@angular/core';
import {TransactionService} from "../../services/transaction/transaction.service";
import {CurrencyService} from "../../../../services/currency/currency.service";
import {ICurrency} from "../../../../../../common/types/ICurrency";
import {ETransactionType} from "../../services/transaction/types/ETransactionType";
import {
	ITransactionRecord,
	ITransactionRecordDeposit,
	ITransactionRecordPayment,
	ITransactionRecordWithdraw,
	ITransactionResponse
} from "../../services/transaction/types/ITransaction";
import {UsersService} from "../../../../services/users/users.service";
import {GoodsService} from "../../../../services/goods/goods.service";
import {PlaceService} from "../../../../services/place/place/place.service";
import {HttpErrorResponse} from "@angular/common/http";
import {AlertService} from "../../../../../../common/services/alert/alert.service";

@Component({
	selector: 'app-new-transaction',
	templateUrl: './new-transaction.component.html',
	styleUrls: ['./new-transaction.component.scss']
})
export class NewTransactionComponent implements OnInit {
	public userId: number | null;
	public placeId: number | null;
	public records: any[] = [];
    
	public currency: ICurrency;
	public isLoading: boolean = true;

	public readonly ETransactionType = ETransactionType;

	public get type(): ETransactionType | null {
		return this._type;
	}

	public set type(value: ETransactionType | null) {
		this._type = value;
		this.records = [];
	}

	private _type: ETransactionType | null;

	constructor(
		protected transactionService: TransactionService,
		protected currencyService: CurrencyService,
		protected goodsService: GoodsService,
		protected usersService: UsersService,
		protected placeService: PlaceService,
		protected alertService: AlertService,
	) { }

	public async ngOnInit(): Promise<void> {
		try {
			this.isLoading = true;
			this.currency = await this.currencyService.getDefaultCurrency();
		} catch(e) {
			this.alertService.error('Nepodařilo se načíst měnu');
			console.error('Cannot load currency data: ', e);
		} finally {
			this.isLoading = false;
		}

	}

	public addRecord(): void {
		switch(this._type) {
			case ETransactionType.PAYMENT:
				this.records.push({
					multiplier: 1
				});
				break;

			case ETransactionType.DEPOSIT:
				this.records.push({
					amount: 0
				})
				break;
			case ETransactionType.WITHDRAW:
				this.records.push({
					amount: 0
				})
				break;
		}
	}

	public removeRecord(record: ITransactionRecord): void {
		this.records = this.records.filter((obj) => obj !== record);
	}

	public loadUsers = () => {
		return this.usersService.getUsers();
	}

	public loadPlaces = () => {
		return this.placeService.getPlaces();
	}

	public loadGoods = () => {
		return this.goodsService.getGoods();
	}

	public async submit(): Promise<void> {
		if(this.records.length === 0) {
			this.alertService.error('Vyber položky transakce');
			return;
		}

		try {
			switch (this._type) {
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
			this.alertService.success('Transakce byla úspěšně přidána');
			this.resetForm();
		} catch (e) {
			console.error("Transaction error", e);
			if(e instanceof HttpErrorResponse) {
				if(e.error.Message) {
					this.alertService.error(this.getErrorMessage(e.error.Message));
				} else {
					this.alertService.error('Nepodařilo se přidat transakci');
				}
			} else {
				this.alertService.error('Nepodařilo se přidat transakci');
			}
		}
	}

	private getErrorMessage(message: string): string {
		let errorMsg = message;
		if(message.includes('Currency account')) {
			errorMsg = 'Uživatel ještě neprovedl první nabití';
		}

		if(message.includes('Not enough money')) {
			errorMsg = 'Uživatel nemá dostatek peněz';
		}

		if(message.includes('Entity not found')) {
			errorMsg = 'Položka nenalezena';
		}

		return errorMsg;
	}
    
	protected async submitPayment(): Promise<ITransactionResponse> {
		return this.transactionService.pay(this.userId!, this.placeId!, this.records as ITransactionRecordPayment[]);
	}

	protected async submitDeposit(): Promise<ITransactionResponse> {
		return this.transactionService.deposit(this.userId!, this.placeId!, this.currency.id!, this.records as ITransactionRecordDeposit[]);
	}

	protected async submitWithdraw(): Promise<ITransactionResponse> {
		return this.transactionService.withDraw(this.userId!, this.placeId!, this.currency.id!, this.records as ITransactionRecordWithdraw[]);
	}

	protected resetForm(): void {
		this.type = null;
		this.userId = null;
		this.placeId = null;
		this.records = [];
	}
}
