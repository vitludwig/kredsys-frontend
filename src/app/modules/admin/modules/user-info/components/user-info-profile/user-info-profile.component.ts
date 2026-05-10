import { Component, computed, inject, input, OnInit, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';

import { IUser } from '../../../../../../common/types/IUser';
import { ERoute } from '../../../../../../common/types/ERoute';
import { IGroup } from '../../../../../groups/types/IGroup';
import { GroupsService } from '../../../../../groups/services/groups.service';
import { AlertService } from '../../../../../../common/services/alert/alert.service';

@Component({
	selector: 'app-user-info-profile',
	templateUrl: './user-info-profile.component.html',
	styleUrls: ['./user-info-profile.component.scss'],
	standalone: true,
	imports: [FormsModule, MatButtonModule, MatCardModule, MatIconModule, MatFormFieldModule, MatSelectModule],
})
export class UserInfoProfileComponent implements OnInit {
	user = input.required<IUser>();
	groups = input<IGroup[]>([]);

	refresh = output<void>();

	private router = inject(Router);
	private groupsService = inject(GroupsService);
	private alertService = inject(AlertService);

	protected allGroups = signal<IGroup[]>([]);
	protected selectedGroupId = signal<number | null>(null);
	protected saving = signal(false);

	protected availableGroups = computed(() => {
		const assignedIds = new Set(this.groups().map(g => g.id));
		return this.allGroups().filter(g => !assignedIds.has(g.id));
	});

	public ngOnInit(): void {
		void this.loadAllGroups();
	}

	private async loadAllGroups(): Promise<void> {
		const result = await firstValueFrom(this.groupsService.getGroups('', 0, 100));
		this.allGroups.set(result.data);
	}

	protected async onAddGroup(): Promise<void> {
		const groupId = this.selectedGroupId();
		const userId = this.user().id;
		if (groupId == null || userId == null) return;
		this.saving.set(true);
		try {
			await this.groupsService.addUserToGroup(userId, groupId);
			this.selectedGroupId.set(null);
			this.refresh.emit();
		} catch {
			this.alertService.error('Chyba při přidání do skupiny');
		} finally {
			this.saving.set(false);
		}
	}

	protected async onRemoveGroup(group: IGroup): Promise<void> {
		const userId = this.user().id;
		if (userId == null) return;
		this.saving.set(true);
		try {
			await this.groupsService.removeUserFromGroup(userId, group.id);
			this.refresh.emit();
		} catch {
			this.alertService.error('Chyba při odebrání ze skupiny');
		} finally {
			this.saving.set(false);
		}
	}

	protected onEditProfile(): void {
		void this.router.navigate(
			[ERoute.ADMIN, ERoute.ADMIN_USERS, this.user().id, ERoute.EDIT],
			{ queryParams: { returnUrl: `/${ERoute.ADMIN}/${ERoute.ADMIN_USER_INFO}` } },
		);
	}
}
