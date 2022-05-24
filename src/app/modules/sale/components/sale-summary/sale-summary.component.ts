import {Component, Input, OnInit} from '@angular/core';
import {OrderService} from '../../services/order/order.service';
import {SaleService} from '../../services/sale/sale.service';
import {IOrderItem} from '../../types/IOrderItem';
import {IPlace} from '../../../../common/types/IPlace';
import {UsersService} from '../../../admin/services/users/users.service';
import {CustomerService} from '../../services/customer/customer.service';
import {ITransactionRecordPayment} from '../../../../common/services/transaction/types/ITransaction';
import {TransactionService} from '../../../../common/services/transaction/transaction.service';
import {AlertService} from '../../../../common/services/alert/alert.service';

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
		this.customerService.customer = await this.usersService.getUserByCardUid(uid);
	}

	public setItemAmount(item: IOrderItem, value: number): void {
		if(item.count + value === 0) {
			this.orderService.removeItem(item.item.id);
		}
		item.count += value;
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
			// @ts-ignore
			if(e.error.Code === 404) {
				this.alertService.error('Nebyl nalezen uživatelům účet, hybaj na infostánek!');
			} else {
				// @ts-ignore
				this.alertService.error(e.error.Message);
			}
		}
	}
}
