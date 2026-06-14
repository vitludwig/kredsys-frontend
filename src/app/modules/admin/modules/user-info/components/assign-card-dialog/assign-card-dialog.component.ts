import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UsersService } from '../../../../services/users/users.service';
import { AlertService } from '../../../../../../common/services/alert/alert.service';
import { CardLoaderComponent } from '../../../../../../common/components/card-loader/card-loader.component';
import { EUserCardType } from '../../../../../../common/types/ICard';

@Component({
	selector: 'app-user-info-assign-card-dialog',
	templateUrl: './assign-card-dialog.component.html',
	standalone: true,
	imports: [
		MatDialogModule,
		MatButtonModule,
		MatIconModule,
		MatProgressSpinnerModule,
		CardLoaderComponent,
	],
})
export class AssignCardDialogComponent {
	private dialogRef = inject(MatDialogRef<AssignCardDialogComponent>);
	private data: { userId: number } = inject(MAT_DIALOG_DATA);
	private usersService = inject(UsersService);
	private alertService = inject(AlertService);

	protected inProgress = false;

	protected async onCardLoaded(cardUid: number): Promise<void> {
		if (this.inProgress) return;
		this.inProgress = true;
		try {
			await this.usersService.addUserCard(this.data.userId, cardUid, '', EUserCardType.CARD);
			this.alertService.success('Karta přiřazena');
			this.dialogRef.close(true);
		} catch {
			this.alertService.error('Chyba při přiřazení karty — karta může být již přiřazena jinému uživateli');
		} finally {
			this.inProgress = false;
		}
	}
}
