import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {UsersService} from "../../../admin/services/users/users.service";
import {ITransaction} from "../../../admin/modules/transactions/services/transaction/types/ITransaction";
import {TransactionService} from "../../../admin/modules/transactions/services/transaction/transaction.service";
import {GoodsService} from "../../../admin/services/goods/goods.service";

@Component({
	selector: 'app-storno-dialog',
	templateUrl: './storno-dialog.component.html',
	styleUrls: ['./storno-dialog.component.scss']
})
export class StornoDialogComponent implements OnInit{
	public lastTransaction: ITransaction;
	public purchased: any[] = [];
    
	constructor(
		protected usersService: UsersService,
		protected transactionService: TransactionService,
		protected goodsService: GoodsService,
		protected dialogRef: MatDialogRef<StornoDialogComponent>,
		@Inject(MAT_DIALOG_DATA) public userId: number,
	) {
	}
    
	public async ngOnInit(): Promise<void> {
		this.lastTransaction = (await this.usersService.getUserTransactions(this.userId,0, 1)).data[0];
		const transaction = await this.transactionService.getTransaction(this.lastTransaction.id);
        
		for(const record of transaction.records) {
			const goodie = await this.goodsService.getGoodie(record.goodsId);
			this.purchased.push({
				name: goodie.name,
				amount: record.amountSum
			})
		}
		console.log(this.purchased);
	}

	public submit(): void {
		this.dialogRef.close(this.lastTransaction.id);
		// this.userService.chargeMoney(this.amount);
	}

}
