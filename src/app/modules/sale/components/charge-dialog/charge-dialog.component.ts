import {Component, inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {ConfigService} from "../../../../common/services/config/config.service";

@Component({
	selector: 'app-charge-dialog',
	templateUrl: './charge-dialog.component.html',
	styleUrls: ['./charge-dialog.component.scss'],
})
export class ChargeDialogComponent {
  protected dialogRef = inject(MatDialogRef<ChargeDialogComponent>);
  protected amount: number = inject(MAT_DIALOG_DATA)
  private configService = inject(ConfigService);

	protected predefinedAmounts: number[] = [500, 800, 1000, 1500, 2000];
  protected cruciblePrice = this.configService.config.cruciblePrice;

	public submit(): void {
		this.dialogRef.close(this.amount);
	}

}
