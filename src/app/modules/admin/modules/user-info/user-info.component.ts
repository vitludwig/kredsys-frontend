import { Component, inject, OnInit } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { debounceTime, distinctUntilChanged, filter, takeUntil } from 'rxjs/operators';
import { UsersService } from '../../services/users/users.service';
import { PlaceService } from '../../services/place/place/place.service';
import { AlertService } from '../../../../common/services/alert/alert.service';
import { CurrencyService } from '../../services/currency/currency.service';
import { WithSubscriptions } from '../../../../common/components/with-subscriptions';
import { IUser } from '../../../../common/types/IUser';
import { ICurrencyAccount } from '../../../../common/types/ICurrency';
import { ICard } from '../../../../common/types/ICard';
import { ITransaction } from '../transactions/services/transaction/types/ITransaction';
import { ITransactionFilter, UserInfoDetailComponent } from './components/user-info-detail/user-info-detail.component';

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
  ],
})
export class UserInfoComponent extends WithSubscriptions implements OnInit {
  private usersService = inject(UsersService);
  private placeService = inject(PlaceService);
  private alertService = inject(AlertService);
  private currencyService = inject(CurrencyService);

  protected searchControl = new FormControl<string | IUser>('');
  protected userOptions: IUser[] = [];
  protected isSearching = false;
  protected defaultCurrencyId: number | null = null;

  protected selectedUser: IUser | null = null;
  protected currencyAccount: ICurrencyAccount | null = null;
  protected accountLoaded = false;
  protected transactions: ITransaction[] = [];
  protected transactionsTotal = 0;
  protected transactionsPage = 0;
  protected cards: ICard[] = [];
  protected placeId: number | null = null;

  protected cardUidInput = '';

  private transactionFilter = '';
  private transactionSort = 'created desc';

  public ngOnInit(): void {
    this.defaultCurrencyId = this.currencyService.defaultCurrency?.id ?? null;

    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      filter(v => typeof v === 'string' && (v as string).length >= 2),
      takeUntil(this.destroy$),
    ).subscribe(search => void this.doSearch(search as string));

    this.placeService.selectedPlace$.pipe(takeUntil(this.destroy$)).subscribe(place => {
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
    this.userOptions = [];
    this.searchControl.setValue('');
    this.cardUidInput = '';
  }

  protected async onCardScan(): Promise<void> {
    if (!this.cardUidInput.trim()) return;
    const uid = parseInt(this.cardUidInput, 10);
    if (isNaN(uid)) {
      this.alertService.error('Zadej platné UID karty');
      return;
    }
    try {
      const user = await this.usersService.getUserByCardUid(uid);
      this.searchControl.setValue(user);
      this.onUserSelected(user);
    } catch {
      this.alertService.error('Karta nenalezena');
    }
    this.cardUidInput = '';
  }

  private async loadUserData(user: IUser): Promise<void> {
    if (user.id == null) {
      this.alertService.error('Uživatel nemá přiřazené ID');
      return;
    }

    this.accountLoaded = false;
    this.transactionsPage = 0;
    this.currencyAccount = null;
    this.transactions = [];
    this.transactionsTotal = 0;
    this.cards = [];

    try {
      const [accounts, txResult, cardsResult] = await Promise.all([
        this.usersService.getUserCurrencyAccounts(user.id),
        this.usersService.getUserTransactions(user.id, 0, 20, this.transactionFilter, this.transactionSort),
        this.usersService.getUserCards(user.id),
      ]);
      this.currencyAccount = accounts[0] ?? null;
      this.transactions = txResult.data;
      this.transactionsTotal = txResult.count;
      this.cards = cardsResult.data;
    } catch {
      this.alertService.error('Chyba při načítání dat uživatele');
    } finally {
      this.accountLoaded = true;
    }
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
    this.transactionsPage++;
    try {
      const result = await this.usersService.getUserTransactions(
        this.selectedUser.id!, this.transactionsPage, 20, this.transactionFilter, this.transactionSort,
      );
      this.transactions = [...this.transactions, ...result.data];
    } catch {
      this.alertService.error('Chyba při načítání transakcí');
    }
  }

  protected async onTransactionFilterChange(filter: ITransactionFilter): Promise<void> {
    this.transactionFilter = this.buildFilterString(filter);
    this.transactionSort = filter.sort;
    this.transactionsPage = 0;
    if (!this.selectedUser?.id) return;
    try {
      const result = await this.usersService.getUserTransactions(
        this.selectedUser.id, 0, 20, this.transactionFilter, this.transactionSort,
      );
      this.transactions = result.data;
      this.transactionsTotal = result.count;
    } catch {
      this.alertService.error('Chyba při načítání transakcí');
    }
  }

  private buildFilterString(filter: ITransactionFilter): string {
    const parts: string[] = [];
    if (filter.text) {
      parts.push(`info#=*${filter.text}/i | placeName#=*${filter.text}/i`);
    }
    if (filter.dateFrom) parts.push(`created>=${filter.dateFrom}`);
    if (filter.dateTo) parts.push(`created<=${filter.dateTo}`);
    if (filter.amountMin !== null && filter.amountMin !== undefined) {
      parts.push(`amount>=${filter.amountMin}`);
    }
    if (filter.amountMax !== null && filter.amountMax !== undefined) {
      parts.push(`amount<=${filter.amountMax}`);
    }
    return parts.join(', ');
  }
}
