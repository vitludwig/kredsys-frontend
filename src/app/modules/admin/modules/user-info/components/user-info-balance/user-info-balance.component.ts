import { Component, computed, inject, input, output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { firstValueFrom } from 'rxjs';

import { IUser } from '../../../../../../common/types/IUser';
import { ICurrencyAccount } from '../../../../../../common/types/ICurrency';
import { TransactionService } from '../../../transactions/services/transaction/transaction.service';
import { AlertService } from '../../../../../../common/services/alert/alert.service';
import { ChargeDialogComponent } from '../charge-dialog/charge-dialog.component';
import { DischargeDialogComponent } from '../discharge-dialog/discharge-dialog.component';

@Component({
	selector: 'app-user-info-balance',
	templateUrl: './user-info-balance.component.html',
	styleUrls: ['./user-info-balance.component.scss'],
	standalone: true,
	imports: [
		MatButtonModule,
		MatCardModule,
		MatIconModule,
		MatProgressSpinnerModule,
		MatTooltipModule,
	],
})
export class UserInfoBalanceComponent {
	user = input.required<IUser>();
	currencyAccount = input<ICurrencyAccount | null>(null);
	accountLoaded = input(false);
	placeId = input<number | null>(null);
	defaultCurrencyId = input<number | null>(null);

	refresh = output<void>();

	protected financialDisabled = computed(() => this.placeId() === null);
	protected financialTooltip = computed(() =>
		this.financialDisabled() ? 'Nejprve vyberte místo (Place Select)' : '',
	);
	protected effectiveCurrencyId = computed(() =>
		this.currencyAccount()?.currencyId ?? this.defaultCurrencyId() ?? null,
	);
	protected chargeDisabled = computed(() => this.financialDisabled());
	protected dischargeDisabled = computed(() =>
		this.financialDisabled() || !this.currencyAccount() || (this.currencyAccount()!.currentAmount <= 0),
	);
	protected dischargeTooltip = computed(() => {
		if (this.financialDisabled()) return this.financialTooltip();
		if (!this.currencyAccount()) return 'Uživatel nemá účet';
		if (this.currencyAccount()!.currentAmount <= 0) return 'Nulový zůstatek';
		return '';
	});

	private dialog = inject(MatDialog);
	private transactionService = inject(TransactionService);
	private alertService = inject(AlertService);

	protected async onCharge(): Promise<void> {
		const userId = this.user().id;
		const placeId = this.placeId();
		if (userId == null || placeId === null) return;

		const ref = this.dialog.open(ChargeDialogComponent, { width: '420px' });
		const amount: number | undefined = await firstValueFrom(ref.afterClosed());
		if (!amount || amount <= 0) return;

		const currencyId = this.effectiveCurrencyId();
		if (currencyId === null) {
			this.alertService.error('Nelze určit měnu');
			return;
		}

		try {
			await this.transactionService.deposit(userId, placeId, currencyId, [
				{ text: 'Dobití kreditu', amount },
			]);
			this.alertService.success('Kredit nabit');
			this.refresh.emit();
		} catch {
			this.alertService.error('Chyba při nabíjení kreditu');
		}
	}

	protected async onDischarge(): Promise<void> {
		const account = this.currencyAccount();
		const placeId = this.placeId();
		const userId = this.user().id;
		if (!account || account.currentAmount <= 0 || placeId === null || userId == null) return;

		const ref = this.dialog.open(DischargeDialogComponent, {
			width: '420px',
			data: { user: this.user(), account },
		});
		const confirmed = await firstValueFrom(ref.afterClosed());
		if (!confirmed) return;

		try {
			await this.transactionService.withDraw(userId, placeId, account.currencyId, [
				{ text: 'Výběr kreditu', amount: account.currentAmount },
			]);
			this.alertService.success('Kredit vybrán');
			this.refresh.emit();
		} catch {
			this.alertService.error('Chyba při výběru kreditu');
		}
	}
}
