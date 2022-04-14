import {Component, Input, OnInit} from '@angular/core';
import {OrderService} from '../../services/order/order.service';
import {SaleService} from '../../services/sale/sale.service';
import {IOrderItem} from '../../types/IOrderItem';
import {IPlace} from '../../../../common/types/IPlace';
import {CardService} from '../../../admin/services/card/card.service';
import {UsersService} from '../../../admin/services/users/users.service';
import {CustomerService} from '../../services/customer/customer.service';
import {ITransactionRecordPayment} from '../../../../common/services/transaction/types/ITransaction';
import {TransactionService} from '../../../../common/services/transaction/transaction.service';
import {MatSnackBar} from '@angular/material/snack-bar';

@Component({
	selector: 'app-sale-summary',
	templateUrl: './sale-summary.component.html',
	styleUrls: ['./sale-summary.component.scss']
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
		protected snackBar: MatSnackBar,
	) {
	}

	public openEditDialog(item: IOrderItem): void {
		this.saleService.openSaleDialog({
			item: item.item,
			edit: true,
			count: item.count
		});
	}

	public async loadUserId(uid: number): Promise<void> {
		this.customerService.customer = await this.usersService.getUserByCardUid(uid);
	}

	public async submitOrder(): Promise<void> {
		const records: ITransactionRecordPayment[] = [];
		const customerId = this.customerService.customer?.id!;
		for(const item of this.orderService.items) {
			records.push({
				creatorId: customerId,
				goodsId: item.item.id,
				multiplier: item.count,
			})
		}
		try {
			const result = await this.transactionService.pay(customerId, this.place.id!, records);
			const audio = new Audio('assets/finish.mp3');
			audio.play();
			// for balance update
			// this.orderService.balance = this.orderService.balance - result.amount;
			this.customerService.logout();
		} catch(e) {
			console.error('Cannot make payment: ', e);
			this.snackBar.open('Něco se posralo při platbě');
		}
	}
}
