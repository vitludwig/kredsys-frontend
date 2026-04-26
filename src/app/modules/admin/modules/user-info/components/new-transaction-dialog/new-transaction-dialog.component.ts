import { AfterViewInit, Component, inject, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { TransactionsModule } from '../../../transactions/transactions.module';
import { NewTransactionComponent } from '../../../transactions/components/new-transaction/new-transaction.component';
import { IUser } from '../../../../../../common/types/IUser';

@Component({
  selector: 'app-user-info-new-transaction-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule, TransactionsModule],
  template: `
    <button mat-icon-button mat-dialog-close style="position:absolute;top:8px;right:8px" aria-label="Zavřít">
      <mat-icon>close</mat-icon>
    </button>
    <div mat-dialog-content>
      <app-new-transaction #newTransaction></app-new-transaction>
    </div>
    <div mat-dialog-actions align="end">
      <button mat-stroked-button (click)="onClose()">Zavřít</button>
    </div>
  `,
})
export class NewTransactionDialogComponent implements AfterViewInit {
  protected data: { user: IUser; placeId: number | null } = inject(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef<NewTransactionDialogComponent>);

  @ViewChild('newTransaction') protected newTransaction!: NewTransactionComponent;

  public ngAfterViewInit(): void {
    // Pre-fill the user and place after the child view is ready
    setTimeout(() => {
      this.newTransaction.user = this.data.user;
      this.newTransaction.placeId = this.data.placeId;
    });
  }

  protected onClose(): void {
    // Close with `true` so the parent triggers a refresh
    this.dialogRef.close(true);
  }
}
