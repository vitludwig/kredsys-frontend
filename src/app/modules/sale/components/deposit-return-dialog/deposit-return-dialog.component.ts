import { Component, inject, OnInit } from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { IDepositItem } from '../../../../common/types/IDepositItem';
import { SettingsService } from '../../../admin/services/settings/settings.service';

export interface IDepositReturnResult {
	amount: number;
	info: string;
}

// Stable prefix so deposit returns can be filtered/tracked in the transaction list.
const DEPOSIT_RETURN_PREFIX = 'Vrácení zálohy';

@Component({
	selector: 'app-deposit-return-dialog',
	templateUrl: './deposit-return-dialog.component.html',
	styleUrls: ['./deposit-return-dialog.component.scss'],
	standalone: true,
	imports: [MatDialogModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
})
export class DepositReturnDialogComponent implements OnInit {
	private dialogRef = inject(MatDialogRef<DepositReturnDialogComponent, IDepositReturnResult>);
	private settingsService = inject(SettingsService);

	protected items: IDepositItem[] = [];
	protected counts: number[] = [];
	protected isLoading = true;

	public async ngOnInit(): Promise<void> {
		this.items = await this.settingsService.getDepositItems();
		this.counts = this.items.map(() => 0);
		this.isLoading = false;
	}

	protected increment(index: number): void {
		this.counts[index]++;
	}

	protected decrement(index: number): void {
		if (this.counts[index] > 0) {
			this.counts[index]--;
		}
	}

	protected get total(): number {
		return this.items.reduce((sum, item, i) => sum + item.amount * this.counts[i], 0);
	}

	protected confirm(): void {
		if (this.total <= 0) {
			return;
		}
		this.dialogRef.close({ amount: this.total, info: this.buildInfo() });
	}

	private buildInfo(): string {
		const parts = this.items
			.map((item, i) => ({ item, count: this.counts[i] }))
			.filter(entry => entry.count > 0)
			.map(entry => `${entry.count}× ${entry.item.label}`);
		return `${DEPOSIT_RETURN_PREFIX}: ${parts.join(', ')}`;
	}
}
