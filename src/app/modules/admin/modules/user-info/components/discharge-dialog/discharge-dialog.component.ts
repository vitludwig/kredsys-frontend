import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { IUser } from '../../../../../../common/types/IUser';
import { ICurrencyAccount } from '../../../../../../common/types/ICurrency';

@Component({
  selector: 'app-user-info-discharge-dialog',
  template: '',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
})
export class DischargeDialogComponent {
  protected data: { user: IUser; account: ICurrencyAccount } = inject(MAT_DIALOG_DATA);
  protected dialogRef = inject(MatDialogRef<DischargeDialogComponent>);
}
