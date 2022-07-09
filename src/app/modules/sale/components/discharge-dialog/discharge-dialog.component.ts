import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {IUser} from "../../../../common/types/IUser";
import {ICurrencyAccount} from "../../../../common/types/ICurrency";

@Component({
  selector: 'app-discharge-dialog',
  templateUrl: './discharge-dialog.component.html',
  styleUrls: ['./discharge-dialog.component.scss']
})
export class DischargeDialogComponent {

  constructor(
    protected dialogRef: MatDialogRef<DischargeDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { user: IUser; currencyAccount: ICurrencyAccount},
  ) { }

  public submit(): void {
    this.dialogRef.close(true);
  }

}
