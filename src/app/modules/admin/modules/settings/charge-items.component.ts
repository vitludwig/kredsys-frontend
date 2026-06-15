import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { IDepositItem } from '../../../../common/types/IDepositItem';
import { SettingsService } from '../../services/settings/settings.service';
import { AlertService } from '../../../../common/services/alert/alert.service';

const MAX_AMOUNT = 100_000;

interface ItemViewModel {
  data: IDepositItem;
  editing: boolean;
  isNew: boolean;
  original?: IDepositItem;
}

@Component({
	selector: 'app-charge-items',
	templateUrl: './charge-items.component.html',
	styleUrls: ['./charge-items.component.scss'],
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [FormsModule, MatButtonModule, MatExpansionModule, MatFormFieldModule, MatIconModule, MatInputModule],
})
export class ChargeItemsComponent implements OnInit {
	private settingsService = inject(SettingsService);
	private alertService = inject(AlertService);
	private cdr = inject(ChangeDetectorRef);

	protected viewModels: ItemViewModel[] = [];
	protected isLoading = true;
	protected isSaving = false;

	async ngOnInit(): Promise<void> {
		const items = await this.settingsService.getDepositItems();
		this.viewModels = items.map(item => ({ data: item, editing: false, isNew: false }));
		this.isLoading = false;
		this.cdr.markForCheck();
	}

	addItem(): void {
		this.viewModels = [...this.viewModels, { data: { label: '', amount: 0 }, editing: true, isNew: true }];
	}

	removeItem(index: number): void {
		this.viewModels = this.viewModels.filter((_, i) => i !== index);
	}

	toggleEdit(index: number): void {
		const vm = this.viewModels[index];
		if (vm.editing) {
			vm.data = { ...vm.original! };
			vm.editing = false;
		} else {
			vm.original = { ...vm.data };
			vm.editing = true;
		}
		this.cdr.markForCheck();
	}

	async save(): Promise<void> {
		const items = this.viewModels.map(vm => vm.data);
		const trimmedLabels = items.map(i => i.label.trim());

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

		const invalidAmount = items.find(
			i => !Number.isFinite(i.amount) || i.amount <= 0 || i.amount > MAX_AMOUNT || !Number.isInteger(i.amount)
		);
		if (invalidAmount !== undefined) {
			this.alertService.error(`Každá položka musí mít kladnou celou částku (max ${MAX_AMOUNT} Kč)`);
			return;
		}

		this.isSaving = true;
		this.cdr.markForCheck();

		try {
			const toSave = items.map((item, i) => ({ label: trimmedLabels[i], amount: item.amount }));
			await this.settingsService.saveDepositItems(toSave);
			this.viewModels.forEach((vm, i) => {
				vm.data.label = trimmedLabels[i];
				vm.editing = false;
				vm.isNew = false;
				vm.original = undefined;
			});
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
