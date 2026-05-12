import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { IChargeItem } from '../../../../common/types/IChargeItem';
import { SettingsService } from '../../../admin/services/settings/settings.service';

@Component({
  selector: 'app-charge-dialog',
  templateUrl: './charge-dialog.component.html',
  styleUrls: ['./charge-dialog.component.scss'],
  standalone: false
})
export class ChargeDialogComponent implements OnInit {
  protected dialogRef = inject(MatDialogRef<ChargeDialogComponent>);
  protected amount: number = inject(MAT_DIALOG_DATA);
  private settingsService = inject(SettingsService);
  private cdr = inject(ChangeDetectorRef);

  protected predefinedAmounts: number[] = [500, 800, 1000, 1500, 2000];
  protected chargeItems: IChargeItem[] = [];

  async ngOnInit(): Promise<void> {
    this.chargeItems = await this.settingsService.getChargeItems();
    this.cdr.detectChanges();
  }

  public submit(): void {
    this.dialogRef.close(this.amount);
  }
}
