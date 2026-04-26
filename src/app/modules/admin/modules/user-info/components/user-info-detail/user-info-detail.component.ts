import { Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatTimepickerModule } from '@angular/material/timepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { firstValueFrom, Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';

import { WithSubscriptions } from '../../../../../../common/components/with-subscriptions';
import { IUser } from '../../../../../../common/types/IUser';
import { ICurrencyAccount } from '../../../../../../common/types/ICurrency';
import { ICard } from '../../../../../../common/types/ICard';
import { ITransaction } from '../../../transactions/services/transaction/types/ITransaction';
import { ETransactionType } from '../../../transactions/services/transaction/types/ETransactionType';
import { TransactionService } from '../../../transactions/services/transaction/transaction.service';
import { UsersService } from '../../../../services/users/users.service';
import { GoodsService } from '../../../../services/goods/goods.service';
import { AlertService } from '../../../../../../common/services/alert/alert.service';
import { ConfirmDialogComponent } from '../../../../../../common/components/confirm-dialog/confirm-dialog.component';
import { ERoute } from '../../../../../../common/types/ERoute';
import { ChargeDialogComponent } from '../charge-dialog/charge-dialog.component';
import { DischargeDialogComponent } from '../discharge-dialog/discharge-dialog.component';
import { AssignCardDialogComponent } from '../assign-card-dialog/assign-card-dialog.component';
import { NewTransactionDialogComponent } from '../new-transaction-dialog/new-transaction-dialog.component';
import { TransactionsModule } from '../../../transactions/transactions.module';
import { ITransactionStatistics } from '../../../transactions/services/transaction/types/ITransactionStatistics';
import { CurrencyService } from '../../../../services/currency/currency.service';

export interface ITransactionFilter {
  text: string;
  dateFrom: string;
  dateTo: string;
  amountMin: number | null;
  amountMax: number | null;
  type: ETransactionType | null;
  sort: string;
}

interface ITransactionRecordRow {
  goodsName: string;
  multiplier: number;
  amount: number;
}

@Component({
  selector: 'app-user-info-detail',
  templateUrl: './user-info-detail.component.html',
  styleUrls: ['./user-info-detail.component.scss'],
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatTimepickerModule,
    TransactionsModule,
  ],
  providers: [
    provideNativeDateAdapter(),
  ],
})
export class UserInfoDetailComponent extends WithSubscriptions implements OnInit {
  @Input() user!: IUser;
  @Input() currencyAccount: ICurrencyAccount | null = null;
  @Input() accountLoaded = false;
  @Input() transactions: ITransaction[] = [];
  @Input() transactionsTotal = 0;
  @Input() cards: ICard[] = [];
  @Input() placeId: number | null = null;
  @Input() defaultCurrencyId: number | null = null;

  @Output() refresh = new EventEmitter<void>();
  @Output() loadMoreTransactions = new EventEmitter<void>();
  @Output() filterChange = new EventEmitter<ITransactionFilter>();

  protected readonly String = String;
  protected readonly ETransactionType = ETransactionType;

  protected filterText = '';
  protected filterDateFrom: Date | null = null;
  protected filterDateTo: Date | null = null;
  // Draft state used inside the datepicker popup (separate from committed value)
  protected draftDateFrom: Date | null = null;
  protected draftTimeFrom: Date | null = null;
  protected draftDateTo: Date | null = null;
  protected draftTimeTo: Date | null = null;
  protected filterAmountMin: number | null = null;
  protected filterAmountMax: number | null = null;
  protected filterType: ETransactionType | null = null;
  protected sortField: 'created' | 'amount' = 'created';
  protected sortDir: 'asc' | 'desc' = 'desc';

  protected expandedTransactionId: number | null = null;
  protected transactionRecords: ITransactionRecordRow[] = [];
  protected loadingRecords = false;

  protected statsExpanded = false;
  protected loadingStats = false;
  protected statistics: ITransactionStatistics | null = null;

  private filterChange$ = new Subject<void>();

  private dialog = inject(MatDialog);
  private router = inject(Router);
  private transactionService = inject(TransactionService);
  private usersService = inject(UsersService);
  private goodsService = inject(GoodsService);
  private currencyService = inject(CurrencyService);
  private alertService = inject(AlertService);

  public ngOnInit(): void {
    this.filterChange$
      .pipe(debounceTime(400), takeUntil(this.destroy$))
      .subscribe(() => this.emitFilter());
  }

  protected get avatarInitial(): string {
    return this.user?.name?.[0]?.toUpperCase() ?? '?';
  }

  protected get financialDisabled(): boolean {
    return this.placeId === null;
  }

  protected get financialTooltip(): string {
    return this.financialDisabled ? 'Nejprve vyberte místo (Place Select)' : '';
  }

  protected get effectiveCurrencyId(): number | null {
    return this.currencyAccount?.currencyId ?? this.defaultCurrencyId ?? null;
  }

  protected get hasMoreTransactions(): boolean {
    return this.transactions.length < this.transactionsTotal;
  }

  protected canStorno(tx: ITransaction): boolean {
    return tx.type === ETransactionType.PAYMENT && !tx.cancellation;
  }

  protected typeLabel(type: ETransactionType): string {
    switch (type) {
      case ETransactionType.PAYMENT: return 'Platba';
      case ETransactionType.DEPOSIT: return 'Dobití';
      case ETransactionType.WITHDRAW: return 'Výběr';
      default: return type;
    }
  }

  protected onFilterChange(): void {
    this.filterChange$.next();
  }

  protected onSortChange(): void {
    // Sort changes apply immediately (no debounce needed)
    this.emitFilter();
  }

  protected onResetFilter(): void {
    this.filterText = '';
    this.filterDateFrom = null;
    this.filterDateTo = null;
    this.draftDateFrom = null;
    this.draftTimeFrom = null;
    this.draftDateTo = null;
    this.draftTimeTo = null;
    this.filterAmountMin = null;
    this.filterAmountMax = null;
    this.filterType = null;
    this.sortField = 'created';
    this.sortDir = 'desc';
    this.emitFilter();
  }

  protected onPopupOpened(side: 'from' | 'to'): void {
    const current = side === 'from' ? this.filterDateFrom : this.filterDateTo;
    const fallback = current ?? new Date();
    if (side === 'from') {
      this.draftDateFrom = new Date(fallback);
      this.draftTimeFrom = new Date(fallback);
    } else {
      this.draftDateTo = new Date(fallback);
      this.draftTimeTo = new Date(fallback);
    }
  }

  protected onPopupApply(side: 'from' | 'to'): void {
    const draftDate = side === 'from' ? this.draftDateFrom : this.draftDateTo;
    const draftTime = side === 'from' ? this.draftTimeFrom : this.draftTimeTo;
    // If only time was set without a date, fall back to today
    const baseDate = draftDate ?? new Date();
    const time = draftTime ?? new Date();
    const merged = new Date(baseDate);
    merged.setHours(time.getHours(), time.getMinutes(), 0, 0);
    if (side === 'from') this.filterDateFrom = merged;
    else this.filterDateTo = merged;
    this.filterChange$.next();
  }

  protected onPopupClear(side: 'from' | 'to'): void {
    if (side === 'from') {
      this.filterDateFrom = null;
      this.draftDateFrom = null;
      this.draftTimeFrom = null;
    } else {
      this.filterDateTo = null;
      this.draftDateTo = null;
      this.draftTimeTo = null;
    }
    this.filterChange$.next();
  }

  protected formatDateTimeLabel(d: Date | null): string {
    if (!d) return '';
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}.${mm}.${yyyy} ${this.formatTimeHHMM(d)}`;
  }

  private formatTimeHHMM(d: Date): string {
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }

  private emitFilter(): void {
    this.filterChange.emit({
      text: this.filterText.trim(),
      dateFrom: this.filterDateFrom ? this.filterDateFrom.toISOString() : '',
      dateTo: this.filterDateTo ? this.filterDateTo.toISOString() : '',
      amountMin: this.filterAmountMin,
      amountMax: this.filterAmountMax,
      type: this.filterType,
      sort: `${this.sortField} ${this.sortDir}`,
    });
  }

  protected async toggleTransactionDetail(tx: ITransaction): Promise<void> {
    // Only PAYMENT transactions are expandable
    if (tx.type !== ETransactionType.PAYMENT) return;

    if (this.expandedTransactionId === tx.id) {
      this.expandedTransactionId = null;
      this.transactionRecords = [];
      return;
    }

    this.expandedTransactionId = tx.id;
    this.transactionRecords = [];

    this.loadingRecords = true;
    try {
      const detail = await this.transactionService.getTransactionDetail(tx.id);
      const rows: ITransactionRecordRow[] = [];
      for (const record of detail.records) {
        const goodie = await this.goodsService.getGoodie(record.goodsId);
        rows.push({
          goodsName: goodie.name,
          multiplier: record.multiplier,
          amount: record.amountSum,
        });
      }
      this.transactionRecords = rows;
    } catch {
      this.alertService.error('Chyba při načítání položek transakce');
    } finally {
      this.loadingRecords = false;
    }
  }

  protected async onCharge(): Promise<void> {
    const ref = this.dialog.open(ChargeDialogComponent, { width: '420px' });
    const amount: number | undefined = await firstValueFrom(ref.afterClosed());
    if (!amount || amount <= 0) return;

    const currencyId = this.effectiveCurrencyId;
    if (currencyId === null) {
      this.alertService.error('Nelze určit měnu');
      return;
    }

    try {
      await this.transactionService.deposit(this.user.id!, this.placeId!, currencyId, [
        { text: 'Dobití kreditu', amount },
      ]);
      this.alertService.success('Kredit nabit');
      this.refresh.emit();
    } catch {
      this.alertService.error('Chyba při nabíjení kreditu');
    }
  }

  protected async onDischarge(): Promise<void> {
    if (!this.currencyAccount || this.currencyAccount.currentAmount <= 0 || this.placeId === null) return;

    const ref = this.dialog.open(DischargeDialogComponent, {
      width: '420px',
      data: { user: this.user, account: this.currencyAccount },
    });
    const confirmed = await firstValueFrom(ref.afterClosed());
    if (!confirmed) return;

    try {
      await this.transactionService.withDraw(
        this.user.id!,
        this.placeId!,
        this.currencyAccount.currencyId,
        [{ text: 'Výběr kreditu', amount: this.currencyAccount.currentAmount }],
      );
      this.alertService.success('Kredit vybrán');
      this.refresh.emit();
    } catch {
      this.alertService.error('Chyba při výběru kreditu');
    }
  }

  protected async onStorno(transaction: ITransaction): Promise<void> {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Stornovat transakci',
        text: `Opravdu stornovat ${Math.abs(transaction.amount)} Kč?`,
      },
    });
    const confirmed = await firstValueFrom(ref.afterClosed());
    if (!confirmed) return;

    try {
      await this.transactionService.storno(transaction.id);
      this.alertService.success('Transakce stornována');
      this.refresh.emit();
    } catch {
      this.alertService.error('Chyba při stornování transakce');
    }
  }

  protected async onToggleStats(): Promise<void> {
    this.statsExpanded = !this.statsExpanded;
    if (!this.statsExpanded || this.statistics) return;
    if (this.user.id == null) return;
    this.loadingStats = true;
    try {
      const currency = this.currencyService.defaultCurrency
        ?? await this.currencyService.getDefaultCurrency();
      this.statistics = await this.transactionService.getStatistics(currency.id!, {
        usersFilter: [this.user.id],
      });
    } catch {
      this.alertService.error('Chyba při načítání statistik');
    } finally {
      this.loadingStats = false;
    }
  }

  protected async onAddTransaction(): Promise<void> {
    const ref = this.dialog.open(NewTransactionDialogComponent, {
      width: '720px',
      maxWidth: '95vw',
      data: { user: this.user, placeId: this.placeId },
    });
    const result = await firstValueFrom(ref.afterClosed());
    if (result) this.refresh.emit();
  }

  protected async onAssignCard(): Promise<void> {
    const ref = this.dialog.open(AssignCardDialogComponent, {
      width: '420px',
      data: { userId: this.user.id! },
    });
    const result = await firstValueFrom(ref.afterClosed());
    if (result) {
      this.refresh.emit();
    }
  }

  protected async onToggleCardBlocked(card: ICard): Promise<void> {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Odebrat kartu',
        text: `Opravdu odebrat kartu?`,
      },
    });
    const confirmed = await firstValueFrom(ref.afterClosed());
    if (!confirmed) return;

    try {
      await this.usersService.deleteUserCard(card.id!);
      this.alertService.success('Karta odebrána');
      this.refresh.emit();
    } catch {
      this.alertService.error('Chyba při odebrání karty');
    }
  }

  protected onEditProfile(): void {
    void this.router.navigate(
      [ERoute.ADMIN, ERoute.ADMIN_USERS, this.user.id, ERoute.EDIT],
      { queryParams: { returnUrl: `/${ERoute.ADMIN}/${ERoute.ADMIN_USER_INFO}` } },
    );
  }

  protected onChangePassword(): void {
    void this.router.navigate([
      ERoute.ADMIN,
      ERoute.ADMIN_USERS,
      this.user.id,
      ERoute.ADMIN_CHANGE_PASSWORD,
    ]);
  }

  protected async onToggleBlock(): Promise<void> {
    const isCurrentlyBlocked = this.user.blocked;
    const action = isCurrentlyBlocked ? 'odblokovat' : 'zablokovat';
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '300px',
      data: {
        title: `${action.charAt(0).toUpperCase() + action.slice(1)} uživatele`,
        text: `Opravdu chceš ${action} účet ${this.user.name}?`,
      },
    });
    const confirmed: boolean | undefined = await firstValueFrom(ref.afterClosed());
    if (!confirmed) return;
    try {
      await this.usersService.setUserBlocked(this.user, !isCurrentlyBlocked);
      this.alertService.success(isCurrentlyBlocked ? 'Uživatel odblokován' : 'Uživatel zablokován');
      this.refresh.emit();
    } catch {
      this.alertService.error('Chyba při změně stavu uživatele');
    }
  }
}
