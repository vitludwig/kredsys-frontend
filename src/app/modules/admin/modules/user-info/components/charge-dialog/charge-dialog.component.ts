import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
	selector: 'app-user-info-charge-dialog',
	templateUrl: './charge-dialog.component.html',
	standalone: true,
	imports: [FormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule],
})
export class ChargeDialogComponent {
	private dialogRef = inject(MatDialogRef<ChargeDialogComponent>);

	protected amount: number = 0;
	protected readonly predefinedAmounts = [200, 500, 800, 1000, 1500, 2000];

	protected submit(): void {
		this.dialogRef.close(this.amount);
	}
}
