import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {UsersService} from "../../../admin/services/users/users.service";
import {ITransaction} from "../../../admin/modules/transactions/services/transaction/types/ITransaction";
import {TransactionService} from "../../../admin/modules/transactions/services/transaction/transaction.service";
import {GoodsService} from "../../../admin/services/goods/goods.service";
import {ETransactionType} from "../../../admin/modules/transactions/services/transaction/types/ETransactionType";
import {PlaceService} from "../../../admin/services/place/place/place.service";

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
		protected placeService: PlaceService,
		protected dialogRef: MatDialogRef<StornoDialogComponent>,
		@Inject(MAT_DIALOG_DATA) public userId: number,
	) {
	}
    
	public async ngOnInit(): Promise<void> {
		const result = (await this.usersService.getUserTransactions(this.userId,0, 1, {
			type: ETransactionType.PAYMENT,
			placeId: this.placeService.selectedPlace!.id,
			cancellation: false,
		})).data;

		if(result.length === 0) {
			return;
		}

		this.lastTransaction = result[0];
		const transaction = await this.transactionService.getTransaction(this.lastTransaction.id);
        
		for(const record of transaction.records) {
			const goodie = await this.goodsService.getGoodie(record.goodsId);
			this.purchased.push({
				name: goodie.name,
				amount: record.amountSum
			})
		}
	}

	public submit(): void {
		this.dialogRef.close(this.lastTransaction.id);
	}

}
