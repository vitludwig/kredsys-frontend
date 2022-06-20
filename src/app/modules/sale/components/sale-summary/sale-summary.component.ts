import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {OrderService} from '../../services/order/order.service';
import {SaleService} from '../../services/sale/sale.service';
import {IOrderItem} from '../../types/IOrderItem';
import {IPlace} from '../../../../common/types/IPlace';
import {UsersService} from '../../../admin/services/users/users.service';
import {CustomerService} from '../../services/customer/customer.service';
import {AlertService} from '../../../../common/services/alert/alert.service';
import {HttpErrorResponse} from '@angular/common/http';
import {TransactionService} from '../../../admin/modules/transactions/services/transaction/transaction.service';
import {ITransactionRecordPayment} from '../../../admin/modules/transactions/services/transaction/types/ITransaction';
import {ICurrencyAccount} from '../../../../common/types/ICurrency';
import {Subject, takeUntil} from 'rxjs';

@Component({
	selector: 'app-sale-summary',
	templateUrl: './sale-summary.component.html',
	styleUrls: ['./sale-summary.component.scss'],
})
export class SaleSummaryComponent implements OnInit, OnDestroy {
	@Input()
	public place: IPlace;

	public totalLeft: number;
	public currencyAccount: ICurrencyAccount | null;
	public isUserLoaded: boolean = false;

	protected unsubscribe: Subject<void> = new Subject();

	constructor(
		public orderService: OrderService,
		public saleService: SaleService,
		public usersService: UsersService,
		public customerService: CustomerService,
		protected transactionService: TransactionService,
		protected alertService: AlertService,
	) {
	}

	public ngOnInit(): void {
		this.orderService.orderChange$
			.pipe(takeUntil(this.unsubscribe))
			.subscribe((items) => {
				if(this.currencyAccount) {
					this.totalLeft = this.currencyAccount.currentAmount - this.orderService.total;
				}
			})

		this.customerService.customer$
			.pipe(takeUntil(this.unsubscribe))
			.subscribe((user) => {
				if(!user) {
					this.isUserLoaded = false;
				}
			})
	}

	public ngOnDestroy(): void {
		this.unsubscribe.next();
	}

	public async loadUserId(uid: number): Promise<void> {
		try {
			this.customerService.customer = await this.usersService.getUserByCardUid(uid);
			this.currencyAccount = (await this.usersService.getUserCurrencyAccounts(this.customerService.customer.id!))[0];
			console.log(this.currencyAccount);
			this.isUserLoaded = true;

		} catch(e) {
			if(e instanceof HttpErrorResponse) {
				this.alertService.error(e.error.Message);
			}
		}
	}

	public setItemAmount(item: IOrderItem, value: number): void {
		if(item.count + value === 0) {
			this.orderService.removeItem(item.item.id);
		}
		item.count += value;
		this.orderService.refreshTotal();
	}

	public async submitOrder(): Promise<void> {
		if(this.orderService.items.length === 0) {
			return;
		}

		const records: ITransactionRecordPayment[] = [];
		const customerId = this.customerService.customer?.id!;
		for(const item of this.orderService.items) {
			records.push({
				creatorId: customerId,
				goodsId: item.item.id,
				multiplier: item.count,
			});
		}
		try {
			await this.transactionService.pay(customerId, this.place.id!, records);
			const audio = new Audio('assets/finish.mp3');
			audio.play();

			this.orderService.clearOrder();
			this.customerService.logout();
		} catch(e) {
			console.error('Cannot make payment: ', e);
			if(e instanceof HttpErrorResponse) {
				if(e.error.Code === 404) {
					this.alertService.error('Nebyl nalezen uživatelům účet, hybaj na infostánek!');
				} else {
					this.alertService.error(e.error.Message);
				}
			} else {
				this.alertService.error('Vyskytla se neznámá chyba');
			}
		}
	}
}
