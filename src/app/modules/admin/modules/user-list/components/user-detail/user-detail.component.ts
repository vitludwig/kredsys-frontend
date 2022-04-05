import {Component, OnInit} from '@angular/core';
import {UsersService} from '../../../../services/users/users.service';
import {EUserRole, IUser} from '../../../../../../common/types/IUser';
import {ActivatedRoute, Router} from '@angular/router';
import {ERoute} from '../../../../../../common/types/ERoute';
import {ICard} from '../../../card-list/types/ICard';

@Component({
	selector: 'app-user-detail',
	templateUrl: './user-detail.component.html',
	styleUrls: ['./user-detail.component.scss']
})
export class UserDetailComponent implements OnInit {
	public user: IUser | undefined;
	public cards: ICard[] = [];
	public isLoading: boolean = false;
	public isEdit: boolean = false;

	public readonly EUserRole = EUserRole;

	constructor(
		public usersService: UsersService,
		protected route: ActivatedRoute,
		protected router: Router,
	) {
	}

	public async ngOnInit(): Promise<void> {
		this.isLoading = true;
		try {
			const userId = Number(this.route.snapshot.paramMap.get('id'));
			if (userId) {
				console.log('is edit');
				this.user = Object.assign({}, await this.usersService.getUser(userId));
				this.cards = await this.usersService.getUserCards(userId);
				this.isEdit = false;
			} else {
				console.log('is new');
				this.user = Object.assign({}, this.usersService.createNewUser());
				this.isEdit = true;
			}
		} catch (e) {
			// TODO: handle
			console.error(e);
		} finally {
			this.isLoading = false
		}
	}

	public async onSubmit(): Promise<void> {
		// TODO: pridat osetren erroru, globalne
		if (this.isEdit) {
			await this.usersService.editUser(this.user!);
		} else {
			await this.usersService.addUser(this.user!);
		}
		this.router.navigate([ERoute.ADMIN, ERoute.ADMIN_USERS]);
	}

}
