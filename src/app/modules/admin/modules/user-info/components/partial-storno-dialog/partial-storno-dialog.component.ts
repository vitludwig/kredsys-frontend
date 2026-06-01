import {Component, inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from '@angular/material/dialog';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {DecimalPipe} from '@angular/common';
import {ITransactionRecord} from '../../../transactions/services/transaction/types/ITransaction';

interface IStornoLine {
	goodsId: number;
	name: string;
	unitPrice: number;
	quantity: number;   // original multiplier
	creatorId?: number;
	stornoQty: number;  // how many to cancel (0..quantity)
}

export interface IPartialStornoResult {
	// Records to re-charge in a new transaction (the kept portion).
	keep: { goodsId: number; multiplier: number; creatorId?: number }[];
}

@Component({
	selector: 'app-partial-storno-dialog',
	templateUrl: './partial-storno-dialog.component.html',
	styleUrls: ['./partial-storno-dialog.component.scss'],
	standalone: true,
	imports: [MatDialogModule, MatButtonModule, MatIconModule, DecimalPipe],
})
export class PartialStornoDialogComponent {
	private dialogRef = inject(MatDialogRef<PartialStornoDialogComponent, IPartialStornoResult | null>);
	private data: { records: ITransactionRecord[] } = inject(MAT_DIALOG_DATA);

	protected lines: IStornoLine[] = (this.data.records ?? [])
		.filter((r) => r.goodsId != null)
		.map((r) => ({
			goodsId: r.goodsId,
			name: r.goodsName ?? ('#' + r.goodsId),
			unitPrice: r.multiplier > 0 ? r.amountSum / r.multiplier : r.amountSum,
			quantity: r.multiplier,
			creatorId: r.creatorId,
			stornoQty: r.multiplier, // default: cancel everything
		}));

	protected dec(line: IStornoLine): void {
		if (line.stornoQty > 0) {
			line.stornoQty--;
		}
	}

	protected inc(line: IStornoLine): void {
		if (line.stornoQty < line.quantity) {
			line.stornoQty++;
		}
	}

	protected keepQty(line: IStornoLine): number {
		return line.quantity - line.stornoQty;
	}

	protected get stornoLines(): IStornoLine[] {
		return this.lines.filter((l) => l.stornoQty > 0);
	}

	protected get keptLines(): IStornoLine[] {
		return this.lines.filter((l) => this.keepQty(l) > 0);
	}

	protected get totalStornoQty(): number {
		return this.lines.reduce((sum, l) => sum + l.stornoQty, 0);
	}

	protected get totalStornoAmount(): number {
		return this.lines.reduce((sum, l) => sum + l.stornoQty * l.unitPrice, 0);
	}

	protected get totalKeepAmount(): number {
		return this.lines.reduce((sum, l) => sum + this.keepQty(l) * l.unitPrice, 0);
	}

	protected confirm(): void {
		const keep = this.lines
			.map((l) => ({goodsId: l.goodsId, multiplier: this.keepQty(l), creatorId: l.creatorId}))
			.filter((k) => k.multiplier > 0);
		this.dialogRef.close({keep});
	}
}
