import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { IUser } from '../../../../../../common/types/IUser';
import { ICurrencyAccount } from '../../../../../../common/types/ICurrency';

@Component({
  selector: 'app-user-info-discharge-dialog',
  templateUrl: './discharge-dialog.component.html',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule, MatDividerModule],
})
export class DischargeDialogComponent {
  private dialogRef = inject(MatDialogRef<DischargeDialogComponent>);
  protected data: { user: IUser; account: ICurrencyAccount } = inject(MAT_DIALOG_DATA);

  protected confirm(): void {
    this.dialogRef.close(true);
  }
}
