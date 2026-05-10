import { Component, effect, inject, input, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { IUser } from '../../../../../../common/types/IUser';
import { TransactionService } from '../../../transactions/services/transaction/transaction.service';
import { CurrencyService } from '../../../../services/currency/currency.service';
import { AlertService } from '../../../../../../common/services/alert/alert.service';
import { ITransactionStatistics } from '../../../transactions/services/transaction/types/ITransactionStatistics';
import { TransactionsModule } from '../../../transactions/transactions.module';

@Component({
	selector: 'app-user-info-statistics',
	templateUrl: './user-info-statistics.component.html',
	styleUrls: ['./user-info-statistics.component.scss'],
	standalone: true,
	imports: [
		MatButtonModule,
		MatIconModule,
		MatProgressSpinnerModule,
		TransactionsModule,
	],
})
export class UserInfoStatisticsComponent {
	user = input.required<IUser>();

	protected statsExpanded = signal(false);
	protected loadingStats = signal(false);
	protected statistics = signal<ITransactionStatistics | null>(null);

	private transactionService = inject(TransactionService);
	private currencyService = inject(CurrencyService);
	private alertService = inject(AlertService);

	constructor() {
		effect(() => {
			this.user();
			this.statistics.set(null);
			this.statsExpanded.set(false);
		});
	}

	protected async onToggleStats(): Promise<void> {
		this.statsExpanded.update(v => !v);
		if (!this.statsExpanded() || this.statistics()) return;
		if (this.user().id == null) return;

		this.loadingStats.set(true);
		try {
			const currency = this.currencyService.defaultCurrency
				?? await this.currencyService.getDefaultCurrency();
			this.statistics.set(await this.transactionService.getStatistics(currency.id!, {
				usersFilter: [this.user().id!],
			}));
		} catch {
			this.alertService.error('Chyba při načítání statistik');
		} finally {
			this.loadingStats.set(false);
		}
	}
}
