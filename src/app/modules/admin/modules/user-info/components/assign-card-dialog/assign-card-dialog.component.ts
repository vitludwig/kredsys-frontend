import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UsersService } from '../../../../services/users/users.service';
import { AlertService } from '../../../../../../common/services/alert/alert.service';

@Component({
  selector: 'app-user-info-assign-card-dialog',
  templateUrl: './assign-card-dialog.component.html',
  standalone: true,
  imports: [FormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
})
export class AssignCardDialogComponent {
  private dialogRef = inject(MatDialogRef<AssignCardDialogComponent>);
  private data: { userId: number } = inject(MAT_DIALOG_DATA);
  private usersService = inject(UsersService);
  private alertService = inject(AlertService);

  protected cardUid: number | null = null;
  protected inProgress = false;

  protected async submit(): Promise<void> {
    if (!this.cardUid || this.inProgress) return;
    this.inProgress = true;
    try {
      await this.usersService.addUserCard(this.data.userId, this.cardUid, '', 'Card');
      this.alertService.success('Karta přiřazena');
      this.dialogRef.close(true);
    } catch {
      this.alertService.error('Chyba při přiřazení karty — karta může být již přiřazena jinému uživateli');
    } finally {
      this.inProgress = false;
    }
  }
}
