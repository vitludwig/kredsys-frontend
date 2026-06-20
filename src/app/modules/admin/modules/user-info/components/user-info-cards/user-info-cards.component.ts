import { Component, inject, input, output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { IUser } from '../../../../../../common/types/IUser';
import { ICard, EUserCardType } from '../../../../../../common/types/ICard';
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

	// Physical access cards (the ticket is rendered in its own "Vstupenka" section, not the chip list).
	public get physicalCards(): ICard[] {
		return this.cards().filter(c => c.type !== EUserCardType.TICKET);
	}

	// The user's governing ticket: their non-blocked Type=Ticket card. When several exist, the one with
	// the latest expiration wins (a ticket carrying an expiration is preferred). Mirrors the backend rule.
	public get activeTicket(): ICard | null {
		return this.cards()
			.filter(c => c.type === EUserCardType.TICKET && !c.blocked)
			.sort((a, b) => this.expTime(b.expirationDate) - this.expTime(a.expirationDate))[0] ?? null;
	}

	// True when a governing ticket carries an expiration — then the backend owns every card's expiration
	// and the per-chip expiration edit is disabled on the frontend.
	public get hasTicketExpiration(): boolean {
		return this.activeTicket?.expirationDate != null;
	}

	// Adding is blocked while an active (non-blocked) card carries an expiration — unless a ticket governs
	// expirations, in which case multiple cards are allowed (the ticket, not this rule, sets expiration).
	public get canAddCard(): boolean {
		if (this.activeTicket) return true;
		return !this.physicalCards.some(c => !c.blocked && c.expirationDate != null);
	}

	// Expiration of the most recently blocked card carrying one (highest id; ICard has no blockedAt).
	// Tickets never participate — they govern expiration through the dedicated ticket flow.
	public get inheritedExpiration(): string | null {
		return this.cards()
			.filter(c => c.type !== EUserCardType.TICKET && c.blocked && c.expirationDate != null)
			.sort((a, b) => (b.id ?? 0) - (a.id ?? 0))[0]?.expirationDate ?? null;
	}

	private expTime(date: string | null | undefined): number {
		return date == null ? -Infinity : new Date(date).getTime();
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
		// When a ticket governs the user, the backend sets the new card's expiration from it — send none.
		const expirationDate = this.activeTicket ? null : this.inheritedExpiration;
		// autoFocus:false keeps focus off the close "X" button so a card scan's terminating Enter
		// can't accidentally activate it and close the dialog mid-error.
		const ref = this.dialog.open(AssignCardDialogComponent, {
			width: '420px',
			autoFocus: false,
			data: { userId, expirationDate },
		});
		const result = await firstValueFrom(ref.afterClosed());
		if (result) this.refresh.emit();
	}

	public async onEditTicketExpiration(): Promise<void> {
		const ticket = this.activeTicket;
		if (ticket == null) return;
		const ref = this.dialog.open(CardExpirationDialogComponent, {
			width: '360px',
			data: { expirationDate: ticket.expirationDate ?? null, cascadeWarning: true },
		});
		const result = await firstValueFrom(ref.afterClosed());
		if (result === undefined) return; // cancelled
		try {
			// Backend cascades the new ticket expiration to every card; refresh reloads the new values.
			await this.usersService.setUserCardExpiration(ticket, result as string | null);
			this.alertService.success('Expirace vstupenky uložena');
			this.refresh.emit();
		} catch {
			this.alertService.error('Chyba při ukládání expirace');
		}
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
			data: { title: 'Zablokovat čip', text: 'Opravdu zablokovat čip?' },
		});
		const confirmed = await firstValueFrom(ref.afterClosed());
		if (!confirmed) return;
		try {
			await this.usersService.blockUserCard(card.id!);
			this.alertService.success('Čip zablokován');
			this.refresh.emit();
		} catch {
			this.alertService.error('Chyba při blokování čipu');
		}
	}

	public async onUnblockCard(card: ICard): Promise<void> {
		try {
			await this.usersService.unblockUserCard(card.id!);
			this.alertService.success('Čip odblokován');
			this.refresh.emit();
		} catch {
			this.alertService.error('Chyba při odblokování čipu');
		}
	}

	public async onDeleteCard(card: ICard): Promise<void> {
		const ref = this.dialog.open(ConfirmDialogComponent, {
			data: { title: 'Smazat čip', text: 'Opravdu smazat čip? Tuto akci nelze vrátit.' },
		});
		const confirmed = await firstValueFrom(ref.afterClosed());
		if (!confirmed) return;
		try {
			await this.usersService.deleteUserCard(card.id!);
			this.alertService.success('Čip smazán');
			this.refresh.emit();
		} catch (e) {
			if (e instanceof HttpErrorResponse && e.status === 400) {
				this.alertService.error('Čip nelze smazat — je použit v transakcích');
			} else {
				this.alertService.error('Chyba při mazání čipu');
			}
		}
	}
}
