import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { firstValueFrom } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter } from 'rxjs/operators';
import { UsersService } from '../../services/users/users.service';
import { PlaceService } from '../../services/place/place/place.service';
import { AlertService } from '../../../../common/services/alert/alert.service';
import { CurrencyService } from '../../services/currency/currency.service';
import { GroupsService } from '../../../groups/services/groups.service';
import { IUser } from '../../../../common/types/IUser';
import { ICurrencyAccount } from '../../../../common/types/ICurrency';
import { ICard } from '../../../../common/types/ICard';
import { IGroup } from '../../../groups/types/IGroup';
import { ITransactionResponse } from '../transactions/services/transaction/types/ITransaction';
import { ITransactionFilter, UserInfoDetailComponent } from './components/user-info-detail/user-info-detail.component';
import { CardLoaderComponent } from '../../../../common/components/card-loader/card-loader.component';

@Component({
	selector: 'app-user-info',
	templateUrl: './user-info.component.html',
	styleUrls: ['./user-info.component.scss'],
	imports: [
		FormsModule,
		ReactiveFormsModule,
		MatFormFieldModule,
		MatInputModule,
		MatAutocompleteModule,
		MatButtonModule,
		MatIconModule,
		MatProgressSpinnerModule,
		UserInfoDetailComponent,
		CardLoaderComponent,
	],
})
export class UserInfoComponent implements OnInit {
	private destroyRef = inject(DestroyRef);
	private usersService = inject(UsersService);
	private placeService = inject(PlaceService);
	private alertService = inject(AlertService);
	private currencyService = inject(CurrencyService);
	private groupsService = inject(GroupsService);

	protected searchControl = new FormControl<string | IUser>('');
	protected userOptions: IUser[] = [];
	protected isSearching = false;
	protected defaultCurrencyId: number | null = null;

	protected selectedUser: IUser | null = null;
	protected currencyAccount: ICurrencyAccount | null = null;
	protected accountLoaded = false;
	protected transactions: ITransactionResponse[] = [];
	protected transactionsTotal = 0;
	protected transactionsPage = 0;
	protected cards: ICard[] = [];
	protected groups: IGroup[] = [];
	protected placeId: number | null = null;

	private static readonly TRANSACTIONS_PAGE_SIZE = 20;
	private static readonly DEFAULT_SORT = 'created desc';
	private static readonly SORT_TIEBREAKER = ', id desc';
	private transactionFilter = '';
	private transactionSort = UserInfoComponent.DEFAULT_SORT + UserInfoComponent.SORT_TIEBREAKER;
	private filterEpoch = 0;

	public ngOnInit(): void {
		this.defaultCurrencyId = this.currencyService.defaultCurrency?.id ?? null;

		this.searchControl.valueChanges.pipe(
			debounceTime(300),
			distinctUntilChanged(),
			filter(v => typeof v === 'string' && (v as string).length >= 2),
			takeUntilDestroyed(this.destroyRef),
		).subscribe(search => void this.doSearch(search as string));

		this.placeService.selectedPlace$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(place => {
			this.placeId = place?.id ?? null;
		});
	}

	private async doSearch(query: string): Promise<void> {
		this.isSearching = true;
		try {
			const result = await this.usersService.getUsers(query, 0, 10);
			this.userOptions = result.data;
		} catch {
			this.alertService.error('Chyba při hledání uživatele');
		} finally {
			this.isSearching = false;
		}
	}

	protected displayFn(user: IUser | string): string {
		if (typeof user === 'string') return user;
		return user?.name ?? '';
	}

	protected onUserSelected(user: IUser): void {
		this.selectedUser = user;
		this.transactionFilter = '';
		this.transactionSort = UserInfoComponent.DEFAULT_SORT + UserInfoComponent.SORT_TIEBREAKER;
		this.loadUserData(user);
	}

	protected onClose(): void {
		this.selectedUser = null;
		this.currencyAccount = null;
		this.accountLoaded = false;
		this.transactions = [];
		this.transactionsTotal = 0;
		this.transactionsPage = 0;
		this.cards = [];
		this.groups = [];
		this.userOptions = [];
		this.searchControl.setValue('');
	}

	protected async onCardLoaded(uid: number): Promise<void> {
		try {
			const { user } = await this.usersService.getUserByCardUid(uid);
			this.searchControl.setValue(user);
			this.onUserSelected(user);
		} catch {
			this.alertService.error('Karta nenalezena');
		}
	}

	private async loadUserData(user: IUser): Promise<void> {
		if (user.id == null) {
			this.alertService.error('Uživatel nemá přiřazené ID');
			return;
		}

		this.accountLoaded = false;
		this.transactionsPage = 1;
		this.currencyAccount = null;
		this.transactions = [];
		this.transactionsTotal = 0;
		this.cards = [];
		this.groups = [];

		const groupIds = user.groups ?? [];
		const [accountsResult, txResult, cardsResult, ...groupResults] = await Promise.allSettled([
			this.usersService.getUserCurrencyAccounts(user.id),
			this.usersService.getUserTransactions(
				user.id, 1, UserInfoComponent.TRANSACTIONS_PAGE_SIZE,
				this.transactionFilter, this.transactionSort,
			),
			this.usersService.getUserCards(user.id, true),
			...groupIds.map(id => firstValueFrom(this.groupsService.getGroup(id))),
		]);

		if (accountsResult.status === 'fulfilled') {
			this.currencyAccount = accountsResult.value[0] ?? null;
		} else {
			this.alertService.error('Chyba při načítání účtu');
		}

		if (txResult.status === 'fulfilled') {
			this.transactions = txResult.value.data;
			this.transactionsTotal = txResult.value.count;
		} else {
			this.alertService.error('Chyba při načítání transakcí');
		}

		if (cardsResult.status === 'fulfilled') {
			this.cards = cardsResult.value.data;
		} else {
			this.alertService.error('Chyba při načítání karet');
		}

		this.groups = groupResults
			.filter((r): r is PromiseFulfilledResult<IGroup> => r.status === 'fulfilled')
			.map(r => r.value);

		this.accountLoaded = true;
	}

	protected async onRefresh(): Promise<void> {
		if (!this.selectedUser) return;
		try {
			this.selectedUser = await this.usersService.getUser(this.selectedUser.id!);
			await this.loadUserData(this.selectedUser);
		} catch {
			this.alertService.error('Chyba při aktualizaci dat');
		}
	}

	protected async onLoadMoreTransactions(): Promise<void> {
		if (!this.selectedUser) return;
		const epoch = this.filterEpoch;
		this.transactionsPage++;
		try {
			const result = await this.usersService.getUserTransactions(
				this.selectedUser.id!, this.transactionsPage, UserInfoComponent.TRANSACTIONS_PAGE_SIZE,
				this.transactionFilter, this.transactionSort,
			);
			if (epoch !== this.filterEpoch) return;
			this.transactions = [...this.transactions, ...result.data];
		} catch {
			this.transactionsPage--;
			this.alertService.error('Chyba při načítání transakcí');
		}
	}

	protected async onTransactionFilterChange(txFilter: ITransactionFilter): Promise<void> {
		this.transactionFilter = this.buildFilterString(txFilter);
		this.transactionSort = `${txFilter.sort}${UserInfoComponent.SORT_TIEBREAKER}`;
		this.transactionsPage = 1;
		this.filterEpoch++;
		if (!this.selectedUser?.id) return;
		try {
			const result = await this.usersService.getUserTransactions(
				this.selectedUser.id, 1, UserInfoComponent.TRANSACTIONS_PAGE_SIZE,
				this.transactionFilter, this.transactionSort,
			);
			this.transactions = result.data;
			this.transactionsTotal = result.count;
		} catch {
			this.alertService.error('Chyba při načítání transakcí');
		}
	}

	private buildFilterString(txFilter: ITransactionFilter): string {
		const parts: string[] = [];
		if (txFilter.text) {
			const safe = txFilter.text.replace(/[,|]/g, ' ').trim();
			if (safe) parts.push(`info#=*${safe}/i | placeName#=*${safe}/i`);
		}
		if (txFilter.dateFrom) parts.push(`created>=${txFilter.dateFrom}`);
		if (txFilter.dateTo) parts.push(`created<=${txFilter.dateTo}`);
		if (txFilter.amountMin !== null && txFilter.amountMin !== undefined) {
			parts.push(`amount>=${txFilter.amountMin}`);
		}
		if (txFilter.amountMax !== null && txFilter.amountMax !== undefined) {
			parts.push(`amount<=${txFilter.amountMax}`);
		}
		if (txFilter.type) {
			parts.push(`type=${txFilter.type}`);
		}
		return parts.join(', ');
	}
}
