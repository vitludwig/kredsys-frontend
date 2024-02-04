import {Component, inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {IUser} from "../../../../common/types/IUser";
import {ICurrencyAccount} from "../../../../common/types/ICurrency";

@Component({
	selector: 'app-discharge-dialog',
	templateUrl: './discharge-dialog.component.html',
	styleUrls: ['./discharge-dialog.component.scss']
})
export class DischargeDialogComponent {
	protected data: { user: IUser; currencyAccount: ICurrencyAccount } = inject(MAT_DIALOG_DATA);
	private dialogRef: MatDialogRef<DischargeDialogComponent> = inject(MatDialogRef);

	protected submit(): void {
		this.dialogRef.close(true);
	}

}
