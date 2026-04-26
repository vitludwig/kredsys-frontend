import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { firstValueFrom } from 'rxjs';

import { IUser } from '../../../../../../common/types/IUser';
import { ICurrencyAccount } from '../../../../../../common/types/ICurrency';
import { ICard } from '../../../../../../common/types/ICard';
import { ITransaction } from '../../../transactions/services/transaction/types/ITransaction';
import { ETransactionType } from '../../../transactions/services/transaction/types/ETransactionType';
import { TransactionService } from '../../../transactions/services/transaction/transaction.service';
import { UsersService } from '../../../../services/users/users.service';
import { AlertService } from '../../../../../../common/services/alert/alert.service';
import { ConfirmDialogComponent } from '../../../../../../common/components/confirm-dialog/confirm-dialog.component';
import { ERoute } from '../../../../../../common/types/ERoute';
import { ChargeDialogComponent } from '../charge-dialog/charge-dialog.component';
import { DischargeDialogComponent } from '../discharge-dialog/discharge-dialog.component';
import { AssignCardDialogComponent } from '../assign-card-dialog/assign-card-dialog.component';

@Component({
  selector: 'app-user-info-detail',
  templateUrl: './user-info-detail.component.html',
  styleUrls: ['./user-info-detail.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
})
export class UserInfoDetailComponent {
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

  protected readonly String = String;

  private dialog = inject(MatDialog);
  private router = inject(Router);
  private transactionService = inject(TransactionService);
  private usersService = inject(UsersService);
  private alertService = inject(AlertService);

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
    if (!this.currencyAccount) return;

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
    void this.router.navigate([ERoute.ADMIN, ERoute.ADMIN_USERS, this.user.id, ERoute.EDIT]);
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
    const action = this.user.blocked ? 'Odblokovat uživatele' : 'Zablokovat uživatele';
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { title: action },
    });
    const confirmed = await firstValueFrom(ref.afterClosed());
    if (!confirmed) return;

    try {
      await this.usersService.setUserBlocked(this.user, !this.user.blocked);
      this.alertService.success(this.user.blocked ? 'Uživatel odblokován' : 'Uživatel zablokován');
      this.refresh.emit();
    } catch {
      this.alertService.error('Chyba při změně stavu uživatele');
    }
  }
}
