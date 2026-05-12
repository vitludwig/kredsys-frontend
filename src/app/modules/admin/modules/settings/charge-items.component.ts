import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { IChargeItem } from '../../../../common/types/IChargeItem';
import { SettingsService } from '../../services/settings/settings.service';
import { AlertService } from '../../../../common/services/alert/alert.service';

const MAX_AMOUNT = 100_000;

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
  protected isLoading = true;
  protected isSaving = false;

  async ngOnInit(): Promise<void> {
    this.items = await this.settingsService.getChargeItems();
    this.isLoading = false;
    this.cdr.markForCheck();
  }

  addItem(): void {
    this.items = [...this.items, { label: '', amount: 0 }];
  }

  removeItem(index: number): void {
    this.items = this.items.filter((_, i) => i !== index);
  }

  async save(): Promise<void> {
    const trimmedLabels = this.items.map(i => i.label.trim());

    const emptyLabel = trimmedLabels.find(l => !l);
    if (emptyLabel !== undefined) {
      this.alertService.error('Každá položka musí mít název');
      return;
    }

    const hasDuplicate = trimmedLabels.some(
      (l, idx) => trimmedLabels.findIndex(x => x.toLocaleLowerCase('cs') === l.toLocaleLowerCase('cs')) !== idx
    );
    if (hasDuplicate) {
      this.alertService.error('Názvy položek musí být jedinečné');
      return;
    }

    const invalidAmount = this.items.find(
      i => !Number.isFinite(i.amount) || i.amount <= 0 || i.amount > MAX_AMOUNT || !Number.isInteger(i.amount)
    );
    if (invalidAmount !== undefined) {
      this.alertService.error(`Každá položka musí mít kladnou celou částku (max ${MAX_AMOUNT} Kč)`);
      return;
    }

    this.isSaving = true;
    this.cdr.markForCheck();

    try {
      const toSave = this.items.map((item, i) => ({ label: trimmedLabels[i], amount: item.amount }));
      await this.settingsService.saveChargeItems(toSave);
      // Update labels in-place after successful save (preserves object refs → track item stable)
      this.items.forEach((item, i) => { item.label = trimmedLabels[i]; });
      this.alertService.success('Nastavení uloženo');
    } catch (e) {
      console.error(e);
      this.alertService.error('Chyba při ukládání nastavení');
    } finally {
      this.isSaving = false;
      this.cdr.markForCheck();
    }
  }
}
