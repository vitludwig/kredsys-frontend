import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {OrderService} from '../../services/order/order.service';
import {IOrderItem} from '../../types/IOrderItem';
import {IPlace} from '../../../../common/types/IPlace';
import {UsersService} from '../../../admin/services/users/users.service';
import {CustomerService} from '../../services/customer/customer.service';
import {AlertService} from '../../../../common/services/alert/alert.service';
import {HttpErrorResponse} from '@angular/common/http';
import {TransactionService} from '../../../admin/modules/transactions/services/transaction/transaction.service';
import {ITransactionRecordPayment} from '../../../admin/modules/transactions/services/transaction/types/ITransaction';
import {Subject, takeUntil} from 'rxjs';

@Component({
	selector: 'app-sale-summary',
	templateUrl: './sale-summary.component.html',
	styleUrls: ['./sale-summary.component.scss'],
})
export class SaleSummaryComponent implements OnInit, OnDestroy {
	@Input()
	public place: IPlace | null = null

	protected totalLeft: number;
	protected isUserLoaded: boolean = false;
	protected payInProgress: boolean = false;

	protected unsubscribe: Subject<void> = new Subject();

	constructor(
		public orderService: OrderService,
		public usersService: UsersService,
		public customerService: CustomerService,
		protected transactionService: TransactionService,
		protected alertService: AlertService,
	) {
	}

	public ngOnInit(): void {
		this.orderService.orderChange$
			.pipe(takeUntil(this.unsubscribe))
			.subscribe(() => {
				if(this.customerService.currencyAccount) {
					this.totalLeft = this.customerService.currencyAccount.currentAmount - this.orderService.total;
				}
			})

		this.customerService.currencyAccount$
			.pipe(takeUntil(this.unsubscribe))
			.subscribe(async (currencyAccount) => {
				if(currencyAccount) {
					this.totalLeft = currencyAccount.currentAmount - this.orderService.total;
				} else {
					this.totalLeft = 0;
				}
			});

		this.customerService.customer$
			.pipe(takeUntil(this.unsubscribe))
			.subscribe(async (user) => {
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
		if(this.orderService.items.length === 0 || !this.place) {
			return;
		}

		this.payInProgress = true;
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

			this.orderService.clearOrder();
			this.customerService.logout();

			this.alertService.success('Prodáno!');
		} catch(e) {
			console.error('Cannot make payment: ', e);
			if(e instanceof HttpErrorResponse) {
				if(e.error.Code === 404) {
					this.alertService.error('Nebyl nalezen uživatelův účet, pošli ho na infostánek!');
				} else {
					this.alertService.error(e.error.Message ?? 'Vyskytla se neznámá chyba');
				}
			} else {
				this.alertService.error('Vyskytla se neznámá chyba');
			}
		} finally {
			this.payInProgress = false;
		}
	}
}
