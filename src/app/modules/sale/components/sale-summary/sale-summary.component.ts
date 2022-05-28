import {Component, Input} from '@angular/core';
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

@Component({
	selector: 'app-sale-summary',
	templateUrl: './sale-summary.component.html',
	styleUrls: ['./sale-summary.component.scss'],
})
export class SaleSummaryComponent {
	@Input()
	public place: IPlace;

	constructor(
		public orderService: OrderService,
		public saleService: SaleService,
		public usersService: UsersService,
		public customerService: CustomerService,
		protected transactionService: TransactionService,
		protected alertService: AlertService,
	) {
	}

	public async loadUserId(uid: number): Promise<void> {
		try {
			this.customerService.customer = await this.usersService.getUserByCardUid(uid);
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
