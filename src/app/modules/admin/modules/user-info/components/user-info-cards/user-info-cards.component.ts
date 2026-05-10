import { Component, inject, input, output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { firstValueFrom } from 'rxjs';

import { IUser } from '../../../../../../common/types/IUser';
import { ICard } from '../../../../../../common/types/ICard';
import { UsersService } from '../../../../services/users/users.service';
import { AlertService } from '../../../../../../common/services/alert/alert.service';
import { ConfirmDialogComponent } from '../../../../../../common/components/confirm-dialog/confirm-dialog.component';
import { AssignCardDialogComponent } from '../assign-card-dialog/assign-card-dialog.component';

@Component({
	selector: 'app-user-info-cards',
	templateUrl: './user-info-cards.component.html',
	styleUrls: ['./user-info-cards.component.scss'],
	standalone: true,
	imports: [
		MatButtonModule,
		MatIconModule,
	],
})
export class UserInfoCardsComponent {
	user = input.required<IUser>();
	cards = input<ICard[]>([]);

	refresh = output<void>();

	private dialog = inject(MatDialog);
	private usersService = inject(UsersService);
	private alertService = inject(AlertService);

	protected last4(uid: number | null | undefined): string {
		return uid == null ? '—' : String(uid).slice(-4);
	}

	protected async onAssignCard(): Promise<void> {
		const userId = this.user().id;
		if (userId == null) return;
		const ref = this.dialog.open(AssignCardDialogComponent, {
			width: '420px',
			data: { userId },
		});
		const result = await firstValueFrom(ref.afterClosed());
		if (result) this.refresh.emit();
	}

	protected async onToggleCardBlocked(card: ICard): Promise<void> {
		const ref = this.dialog.open(ConfirmDialogComponent, {
			data: {
				title: 'Odebrat kartu',
				text: 'Opravdu odebrat kartu?',
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
}
