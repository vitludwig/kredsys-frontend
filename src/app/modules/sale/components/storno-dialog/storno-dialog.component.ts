import {Component, inject, OnInit} from '@angular/core';
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
	protected lastTransaction: ITransaction | null = null;
	protected purchased: { name: string, amount: number, multiplier: number }[] = [];
	private usersService: UsersService = inject(UsersService);
	private transactionService: TransactionService = inject(TransactionService);
	private goodsService: GoodsService = inject(GoodsService);
	private placeService: PlaceService = inject(PlaceService);
	private dialogRef: MatDialogRef<StornoDialogComponent> = inject(MatDialogRef);
	private userId: number = inject<number>(MAT_DIALOG_DATA);

	public async ngOnInit(): Promise<void> {
		this.loadTransactions();
	}

	public submit(): void {
		this.dialogRef.close(this.lastTransaction?.id || null);
	}

	private async loadTransactions(): Promise<void> {
		const filter = `
			type=${ETransactionType.PAYMENT},
			placeId=${this.placeService.selectedPlace!.id},
			cancellation=false
		`;
		const sortBy = 'created desc';
		const result = (await this.usersService.getUserTransactions(this.userId,0, 1, filter, sortBy)).data;

		if(result.length === 0) {
			return;
		}

		this.lastTransaction = result[0];
		// user-transctions endpoint doesn't return detail of transaction with records
		const transaction = await this.transactionService.getTransactionDetail(this.lastTransaction.id);

		for(const record of transaction.records) {
			const goodie = await this.goodsService.getGoodie(record.goodsId);
			this.purchased.push({
				name: goodie.name,
				amount: record.amountSum,
				multiplier: record.multiplier,
			})
		}
	}

}
