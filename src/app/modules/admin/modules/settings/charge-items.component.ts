import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { IChargeItem } from '../../../../common/types/IChargeItem';
import { SettingsService } from '../../services/settings/settings.service';
import { AlertService } from '../../../../common/services/alert/alert.service';

@Component({
  selector: 'app-charge-items',
  templateUrl: './charge-items.component.html',
  styleUrls: ['./charge-items.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule],
})
export class ChargeItemsComponent implements OnInit {
  private settingsService = inject(SettingsService);
  private alertService = inject(AlertService);
  private cdr = inject(ChangeDetectorRef);

  protected items: IChargeItem[] = [];

  async ngOnInit(): Promise<void> {
    this.items = await this.settingsService.getChargeItems();
    this.cdr.markForCheck();
  }

  addItem(): void {
    this.items = [...this.items, { label: '', amount: 0 }];
  }

  removeItem(index: number): void {
    this.items = this.items.filter((_, i) => i !== index);
  }

  async save(): Promise<void> {
    try {
      await this.settingsService.saveChargeItems(this.items);
      this.alertService.success('Nastavení uloženo');
    } catch {
      this.alertService.error('Chyba při ukládání nastavení');
    }
  }
}
