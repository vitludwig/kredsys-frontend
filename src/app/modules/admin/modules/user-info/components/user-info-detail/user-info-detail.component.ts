import { Component, inject, input, output } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';

import { IUser } from '../../../../../../common/types/IUser';
import { ICurrencyAccount } from '../../../../../../common/types/ICurrency';
import { ICard } from '../../../../../../common/types/ICard';
import { IGroup } from '../../../../../groups/types/IGroup';
import { ITransactionResponse } from '../../../transactions/services/transaction/types/ITransaction';
import { ETransactionType } from '../../../transactions/services/transaction/types/ETransactionType';
import { ERoute } from '../../../../../../common/types/ERoute';
import { UsersService } from '../../../../services/users/users.service';
import { AlertService } from '../../../../../../common/services/alert/alert.service';
import { ConfirmDialogComponent } from '../../../../../../common/components/confirm-dialog/confirm-dialog.component';
import { UserInfoProfileComponent } from '../user-info-profile/user-info-profile.component';
import { UserInfoBalanceComponent } from '../user-info-balance/user-info-balance.component';
import { UserInfoTransactionsComponent } from '../user-info-transactions/user-info-transactions.component';
import { UserInfoCardsComponent } from '../user-info-cards/user-info-cards.component';
import { UserInfoStatisticsComponent } from '../user-info-statistics/user-info-statistics.component';

export interface ITransactionFilter {
	text: string;
	dateFrom: string;
	dateTo: string;
	amountMin: number | null;
	amountMax: number | null;
	type: ETransactionType | null;
	sort: string;
}

@Component({
	selector: 'app-user-info-detail',
	templateUrl: './user-info-detail.component.html',
	styleUrls: ['./user-info-detail.component.scss'],
	standalone: true,
	imports: [
		MatButtonModule,
		UserInfoProfileComponent,
		UserInfoBalanceComponent,
		UserInfoTransactionsComponent,
		UserInfoCardsComponent,
		UserInfoStatisticsComponent,
	],
})
export class UserInfoDetailComponent {
	user = input.required<IUser>();
	currencyAccount = input<ICurrencyAccount | null>(null);
	accountLoaded = input(false);
	transactions = input<ITransactionResponse[]>([]);
	transactionsTotal = input(0);
	cards = input<ICard[]>([]);
	groups = input<IGroup[]>([]);
	placeId = input<number | null>(null);
	defaultCurrencyId = input<number | null>(null);

	refresh = output<void>();
	loadMoreTransactions = output<void>();
	filterChange = output<ITransactionFilter>();

	private dialog = inject(MatDialog);
	private router = inject(Router);
	private usersService = inject(UsersService);
	private alertService = inject(AlertService);

	protected onChangePassword(): void {
		void this.router.navigate([
			ERoute.ADMIN,
			ERoute.ADMIN_USERS,
			this.user().id,
			ERoute.ADMIN_CHANGE_PASSWORD,
		]);
	}

	protected async onToggleBlock(): Promise<void> {
		const user = this.user();
		const willBlock = !user.blocked;
		const action = willBlock ? 'zablokovat' : 'odblokovat';
		const ref = this.dialog.open(ConfirmDialogComponent, {
			width: '300px',
			data: {
				title: `${action.charAt(0).toUpperCase() + action.slice(1)} uživatele`,
				text: `Opravdu chceš ${action} účet ${user.name}?`,
			},
		});
		const confirmed: boolean | undefined = await firstValueFrom(ref.afterClosed());
		if (!confirmed) return;
		try {
			await this.usersService.setUserBlocked(user, willBlock);
			this.alertService.success(willBlock ? 'Uživatel zablokován' : 'Uživatel odblokován');
			this.refresh.emit();
		} catch {
			this.alertService.error('Chyba při změně stavu uživatele');
		}
	}
}
