import { Component, inject, input, output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { IUser } from '../../../../../../common/types/IUser';
import { ICard } from '../../../../../../common/types/ICard';
import { UsersService } from '../../../../services/users/users.service';
import { AlertService } from '../../../../../../common/services/alert/alert.service';
import { ConfirmDialogComponent } from '../../../../../../common/components/confirm-dialog/confirm-dialog.component';
import { AssignCardDialogComponent } from '../assign-card-dialog/assign-card-dialog.component';
import { CardExpirationDialogComponent } from '../card-expiration-dialog/card-expiration-dialog.component';

@Component({
	selector: 'app-user-info-cards',
	templateUrl: './user-info-cards.component.html',
	styleUrls: ['./user-info-cards.component.scss'],
	standalone: true,
	imports: [
		MatButtonModule,
		MatIconModule,
		MatTooltipModule,
		DatePipe,
	],
})
export class UserInfoCardsComponent {
	user = input.required<IUser>();
	cards = input<ICard[]>([]);

	refresh = output<void>();

	private dialog = inject(MatDialog);
	private usersService = inject(UsersService);
	private alertService = inject(AlertService);

	// Adding is blocked while an active (non-blocked) card carries an expiration.
	public get canAddCard(): boolean {
		return !this.cards().some(c => !c.blocked && c.expirationDate != null);
	}

	// Expiration of the most recently blocked card carrying one (highest id; ICard has no blockedAt).
	public get inheritedExpiration(): string | null {
		return this.cards()
			.filter(c => c.blocked && c.expirationDate != null)
			.sort((a, b) => (b.id ?? 0) - (a.id ?? 0))[0]?.expirationDate ?? null;
	}

	public isExpired(card: ICard): boolean {
		return card.expirationDate != null && new Date(card.expirationDate).getTime() <= Date.now();
	}

	protected last4(uid: number | null | undefined): string {
		return uid == null ? '—' : String(uid).slice(-4);
	}

	protected async onAssignCard(): Promise<void> {
		const userId = this.user().id;
		if (userId == null) return;
		const ref = this.dialog.open(AssignCardDialogComponent, {
			width: '420px',
			data: { userId, expirationDate: this.inheritedExpiration },
		});
		const result = await firstValueFrom(ref.afterClosed());
		if (result) this.refresh.emit();
	}

	public async onEditExpiration(card: ICard): Promise<void> {
		const ref = this.dialog.open(CardExpirationDialogComponent, {
			width: '360px',
			data: { expirationDate: card.expirationDate ?? null },
		});
		const result = await firstValueFrom(ref.afterClosed());
		if (result === undefined) return; // cancelled
		try {
			await this.usersService.setUserCardExpiration(card, result as string | null);
			this.alertService.success('Expirace uložena');
			this.refresh.emit();
		} catch {
			this.alertService.error('Chyba při ukládání expirace');
		}
	}

	public async onBlockCard(card: ICard): Promise<void> {
		const ref = this.dialog.open(ConfirmDialogComponent, {
			data: { title: 'Zablokovat kartu', text: 'Opravdu zablokovat kartu?' },
		});
		const confirmed = await firstValueFrom(ref.afterClosed());
		if (!confirmed) return;
		try {
			await this.usersService.blockUserCard(card.id!);
			this.alertService.success('Karta zablokována');
			this.refresh.emit();
		} catch {
			this.alertService.error('Chyba při blokování karty');
		}
	}

	public async onUnblockCard(card: ICard): Promise<void> {
		try {
			await this.usersService.unblockUserCard(card.id!);
			this.alertService.success('Karta odblokována');
			this.refresh.emit();
		} catch {
			this.alertService.error('Chyba při odblokování karty');
		}
	}

	public async onDeleteCard(card: ICard): Promise<void> {
		const ref = this.dialog.open(ConfirmDialogComponent, {
			data: { title: 'Smazat kartu', text: 'Opravdu smazat kartu? Tuto akci nelze vrátit.' },
		});
		const confirmed = await firstValueFrom(ref.afterClosed());
		if (!confirmed) return;
		try {
			await this.usersService.deleteUserCard(card.id!);
			this.alertService.success('Karta smazána');
			this.refresh.emit();
		} catch (e) {
			if (e instanceof HttpErrorResponse && e.status === 400) {
				this.alertService.error('Kartu nelze smazat — je použita v transakcích');
			} else {
				this.alertService.error('Chyba při mazání karty');
			}
		}
	}
}
