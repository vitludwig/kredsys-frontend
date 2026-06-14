import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { IChargeItem } from '../../../../../../common/types/IChargeItem';
import { SettingsService } from '../../../../services/settings/settings.service';

@Component({
	selector: 'app-user-info-charge-dialog',
	templateUrl: './charge-dialog.component.html',
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [FormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule],
})
export class ChargeDialogComponent implements OnInit {
	private dialogRef = inject(MatDialogRef<ChargeDialogComponent>);
	private settingsService = inject(SettingsService);
	private cdr = inject(ChangeDetectorRef);

	protected amount: number = 0;
	protected readonly predefinedAmounts = [500, 800, 1000, 1500, 2000];
	protected isLoading = true;
	protected chargeItems: IChargeItem[] = [];

	async ngOnInit(): Promise<void> {
		this.chargeItems = await this.settingsService.getChargeItems();
		this.isLoading = false;
		this.cdr.markForCheck();
	}

	protected submit(): void {
		this.dialogRef.close(this.amount);
	}
}
