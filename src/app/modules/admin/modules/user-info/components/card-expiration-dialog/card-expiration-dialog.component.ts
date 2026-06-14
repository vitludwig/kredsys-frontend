import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

export interface ICardExpirationDialogData {
	expirationDate: string | null;
}

@Component({
	selector: 'app-card-expiration-dialog',
	templateUrl: './card-expiration-dialog.component.html',
	standalone: true,
	imports: [FormsModule, MatDialogModule, MatButtonModule],
})
export class CardExpirationDialogComponent {
	private dialogRef = inject(MatDialogRef<CardExpirationDialogComponent>);
	private data: ICardExpirationDialogData = inject(MAT_DIALOG_DATA);

	// bound to <input type="datetime-local">, format "YYYY-MM-DDTHH:mm"
	protected value: string = this.toInputValue(this.data.expirationDate);

	protected onSave(): void {
		this.dialogRef.close(this.toIso(this.value));
	}

	protected onClear(): void {
		this.dialogRef.close(null);
	}

	protected onCancel(): void {
		this.dialogRef.close(undefined);
	}

	// stored ISO -> input value (local wall-clock "YYYY-MM-DDTHH:mm")
	private toInputValue(iso: string | null): string {
		if (!iso) return '';
		const d = new Date(iso);
		if (isNaN(d.getTime())) return '';
		const pad = (n: number) => String(n).padStart(2, '0');
		return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
	}

	// input value -> naive local ISO with seconds, no timezone; '' -> null
	private toIso(input: string): string | null {
		if (!input) return null;
		return input.length === 16 ? `${input}:00` : input;
	}
}
