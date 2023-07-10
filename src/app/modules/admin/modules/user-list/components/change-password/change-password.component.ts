import {Component} from '@angular/core';
import {UsersService} from '../../../../services/users/users.service';
import {AlertService} from '../../../../../../common/services/alert/alert.service';
import {ActivatedRoute} from '@angular/router';
import {Location} from '@angular/common';

@Component({
	selector: 'app-change-password',
	templateUrl: './change-password.component.html',
	styleUrls: ['./change-password.component.scss']
})
export class ChangePasswordComponent {
	protected oldPassword: string;
	protected newPassword: string;

	private userId: number;

	constructor(
		protected route: ActivatedRoute,
		private usersService: UsersService,
		private alertService: AlertService,
		private location: Location,
	) {
		this.userId = Number(this.route.snapshot.paramMap.get('id'));
	}

	public async onSubmit(): Promise<void> {
		try {
			await this.usersService.changePassword(this.userId, this.oldPassword, this.newPassword);
			this.location.back();
		} catch(e) {
			console.error(e);
			this.alertService.error('Nelze změnit heslo');
		}
	}

}
