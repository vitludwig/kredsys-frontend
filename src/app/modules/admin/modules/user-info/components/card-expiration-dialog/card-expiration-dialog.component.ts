import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatTimepickerModule } from '@angular/material/timepicker';
import { provideNativeDateAdapter } from '@angular/material/core';

export interface ICardExpirationDialogData {
	expirationDate: string | null;
	// When true the dialog edits a ticket: shows a warning that the change cascades to every card.
	cascadeWarning?: boolean;
}

@Component({
	selector: 'app-card-expiration-dialog',
	templateUrl: './card-expiration-dialog.component.html',
	standalone: true,
	imports: [
		FormsModule,
		MatDialogModule,
		MatButtonModule,
		MatIconModule,
		MatFormFieldModule,
		MatInputModule,
		MatDatepickerModule,
		MatTimepickerModule,
	],
	providers: [provideNativeDateAdapter()],
})
export class CardExpirationDialogComponent {
	private dialogRef = inject(MatDialogRef<CardExpirationDialogComponent>);
	private data: ICardExpirationDialogData = inject(MAT_DIALOG_DATA);

	protected readonly cascadeWarning: boolean = this.data.cascadeWarning ?? false;

	// bound to <mat-datepicker> (via onDateChange, which preserves the time) and to <mat-timepicker> (two-way; it preserves the date)
	protected value: Date | null = this.toDate(this.data.expirationDate);

	// Guards against a double-click closing/saving twice while the dialog animates out.
	protected saving = false;

	protected onSave(): void {
		if (this.saving) return;
		this.saving = true;
		this.dialogRef.close(this.toIso(this.value));
	}

	protected onClear(): void {
		if (this.saving) return;
		this.saving = true;
		this.dialogRef.close(null);
	}

	protected onCancel(): void {
		this.dialogRef.close(undefined);
	}

	// The datepicker emits the picked day at midnight (NativeDateAdapter zeroes the time), which would
	// wipe a time already chosen in the timepicker. Merge the picked Y/M/D with the time held in `value`.
	// (The timepicker preserves the date itself, so only the datepicker needs this.)
	protected onDateChange(picked: Date | null): void {
		if (!picked) {
			this.value = null;
			return;
		}
		const merged = new Date(picked);
		if (this.value) {
			merged.setHours(this.value.getHours(), this.value.getMinutes(), 0, 0);
		}
		this.value = merged;
	}

	// stored ISO (utcDateInterceptor re-tags it as UTC on read) -> Date in local wall-clock, or null
	private toDate(iso: string | null): Date | null {
		if (!iso) return null;
		const d = new Date(iso);
		return isNaN(d.getTime()) ? null : d;
	}

	// local wall-clock Date -> the equivalent UTC instant, zone-less ("YYYY-MM-DDTHH:mm:ss"). The backend stores
	// timestamps naive-as-UTC and utcDateInterceptor re-tags them as UTC on read, so emitting UTC here makes the
	// wall-clock round-trip without the +offset drift. Zone-less (no 'Z') keeps Kind=Unspecified for the
	// `timestamp without time zone` column. null -> null.
	private toIso(value: Date | null): string | null {
		if (!value || isNaN(value.getTime())) return null;
		return value.toISOString().slice(0, 19);
	}
}
