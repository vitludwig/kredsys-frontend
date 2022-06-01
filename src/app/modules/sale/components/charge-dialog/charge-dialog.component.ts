import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';

@Component({
	selector: 'app-charge-dialog',
	templateUrl: './charge-dialog.component.html',
	styleUrls: ['./charge-dialog.component.scss'],
})
export class ChargeDialogComponent {
	public predefinedAmounts: number[] = [500, 800, 1000, 1500, 2000];

	constructor(
		protected dialogRef: MatDialogRef<ChargeDialogComponent>,
		@Inject(MAT_DIALOG_DATA) public amount: number,
	) {
	}

	public submit(): void {
		this.dialogRef.close(this.amount);
		// this.userService.chargeMoney(this.amount);
	}

}
