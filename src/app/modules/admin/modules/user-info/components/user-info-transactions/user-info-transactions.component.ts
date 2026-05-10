import { Component, computed, DestroyRef, effect, inject, input, output, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatTimepickerModule } from '@angular/material/timepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { firstValueFrom, Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

import { IUser } from '../../../../../../common/types/IUser';
import { ITransaction, ITransactionRecord, ITransactionResponse } from '../../../transactions/services/transaction/types/ITransaction';
import { ETransactionType } from '../../../transactions/services/transaction/types/ETransactionType';
import { TransactionService } from '../../../transactions/services/transaction/transaction.service';
import { AlertService } from '../../../../../../common/services/alert/alert.service';
import { ConfirmDialogComponent } from '../../../../../../common/components/confirm-dialog/confirm-dialog.component';
import { NewTransactionDialogComponent } from '../new-transaction-dialog/new-transaction-dialog.component';
import { TransactionsModule } from '../../../transactions/transactions.module';
import { ITransactionFilter } from '../user-info-detail/user-info-detail.component';

const RECORDS_PREVIEW_LIMIT = 3;

@Component({
	selector: 'app-user-info-transactions',
	templateUrl: './user-info-transactions.component.html',
	styleUrls: ['./user-info-transactions.component.scss'],
	standalone: true,
	imports: [
		DatePipe,
		DecimalPipe,
		FormsModule,
		MatButtonModule,
		MatIconModule,
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
export class UserInfoTransactionsComponent {
	user = input.required<IUser>();
	transactions = input<ITransactionResponse[]>([]);
	transactionsTotal = input(0);
	placeId = input<number | null>(null);
	accountLoaded = input(false);

	refresh = output<void>();
	loadMoreTransactions = output<void>();
	filterChange = output<ITransactionFilter>();

	protected readonly ETransactionType = ETransactionType;

	protected financialDisabled = computed(() => this.placeId() === null);
	protected financialTooltip = computed(() =>
		this.financialDisabled() ? 'Nejprve vyberte místo (Place Select)' : '',
	);
	protected hasMoreTransactions = computed(() =>
		this.transactions().length < this.transactionsTotal(),
	);

	// Filter state as signals so effect() can reset them reactively
	protected filterText = signal('');
	protected filterDateFrom = signal<Date | null>(null);
	protected filterDateTo = signal<Date | null>(null);
	protected draftDateFrom = signal<Date | null>(null);
	protected draftTimeFrom = signal<Date | null>(null);
	protected draftDateTo = signal<Date | null>(null);
	protected draftTimeTo = signal<Date | null>(null);
	protected filterAmountMin = signal<number | null>(null);
	protected filterAmountMax = signal<number | null>(null);
	protected filterType = signal<ETransactionType | null>(null);
	protected sortField = signal<'created' | 'amount'>('created');
	protected sortDir = signal<'asc' | 'desc'>('desc');

	private filterChange$ = new Subject<void>();
	private destroyRef = inject(DestroyRef);

	private dialog = inject(MatDialog);
	private transactionService = inject(TransactionService);
	private alertService = inject(AlertService);

	constructor() {
		this.filterChange$
			.pipe(debounceTime(400), takeUntilDestroyed())
			.subscribe(() => this.emitFilter());

		this.destroyRef.onDestroy(() => this.filterChange$.complete());

		// Reset filter UI when user changes (parent fetches independently)
		effect(() => {
			this.user();
			this.resetFilterState();
		});
	}

	protected recordsPreview(records?: ITransactionRecord[]): ITransactionRecord[] {
		return records?.slice(0, RECORDS_PREVIEW_LIMIT) ?? [];
	}

	protected recordsOverflow(records?: ITransactionRecord[]): number {
		return Math.max(0, (records?.length ?? 0) - RECORDS_PREVIEW_LIMIT);
	}

	protected onFilterChange(): void {
		this.filterChange$.next();
	}

	protected onSortChange(): void {
		this.filterChange$.next();
	}

	protected onResetFilter(): void {
		this.resetFilterState();
		// Emit immediately — reset is an intentional action, no debounce needed
		this.emitFilter();
	}

	protected onPopupOpened(side: 'from' | 'to'): void {
		const current = side === 'from' ? this.filterDateFrom() : this.filterDateTo();
		const fallback = current ?? new Date();
		if (side === 'from') {
			this.draftDateFrom.set(new Date(fallback));
			this.draftTimeFrom.set(new Date(fallback));
		} else {
			this.draftDateTo.set(new Date(fallback));
			this.draftTimeTo.set(new Date(fallback));
		}
	}

	protected onPopupApply(side: 'from' | 'to'): void {
		const draftDate = side === 'from' ? this.draftDateFrom() : this.draftDateTo();
		const draftTime = side === 'from' ? this.draftTimeFrom() : this.draftTimeTo();
		const baseDate = draftDate ?? new Date();
		const time = draftTime ?? new Date();
		const merged = new Date(baseDate);
		merged.setHours(time.getHours(), time.getMinutes(), 0, 0);
		if (side === 'from') this.filterDateFrom.set(merged);
		else this.filterDateTo.set(merged);
		this.filterChange$.next();
	}

	protected onPopupClear(side: 'from' | 'to'): void {
		if (side === 'from') {
			this.filterDateFrom.set(null);
			this.draftDateFrom.set(null);
			this.draftTimeFrom.set(null);
		} else {
			this.filterDateTo.set(null);
			this.draftDateTo.set(null);
			this.draftTimeTo.set(null);
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

	private resetFilterState(): void {
		this.filterText.set('');
		this.filterDateFrom.set(null);
		this.filterDateTo.set(null);
		this.draftDateFrom.set(null);
		this.draftTimeFrom.set(null);
		this.draftDateTo.set(null);
		this.draftTimeTo.set(null);
		this.filterAmountMin.set(null);
		this.filterAmountMax.set(null);
		this.filterType.set(null);
		this.sortField.set('created');
		this.sortDir.set('desc');
	}

	private emitFilter(): void {
		this.filterChange.emit({
			text: this.filterText().trim(),
			dateFrom: this.filterDateFrom() ? this.filterDateFrom()!.toISOString() : '',
			dateTo: this.filterDateTo() ? this.filterDateTo()!.toISOString() : '',
			amountMin: this.filterAmountMin(),
			amountMax: this.filterAmountMax(),
			type: this.filterType(),
			sort: `${this.sortField()} ${this.sortDir()}`,
		});
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

	protected async onAddTransaction(): Promise<void> {
		const ref = this.dialog.open(NewTransactionDialogComponent, {
			width: '720px',
			maxWidth: '95vw',
			data: { user: this.user(), placeId: this.placeId() },
		});
		const result = await firstValueFrom(ref.afterClosed());
		if (result) this.refresh.emit();
	}
}
