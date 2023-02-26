import {Component} from '@angular/core';
import {IUser} from '../../common/types/IUser';
import {ICurrencyAccount} from '../../common/types/ICurrency';
import {UsersService} from '../admin/services/users/users.service';
import {ETime} from '../../common/types/ETime';

@Component({
	selector: 'app-card-info',
	templateUrl: './card-info.component.html',
	styleUrls: ['./card-info.component.scss']
})
export class CardInfoComponent {
	protected user: IUser | null;
	protected currencyAccount: ICurrencyAccount | null;
	protected isLoading: boolean = false;

	constructor(
		protected usersService: UsersService,
	) {
	}

	public async setCardId(id: number): Promise<void> {
		try {
			this.isLoading = true;
			this.user = await this.usersService.getUserByCardUid(id);
			this.currencyAccount = (await this.usersService.getUserCurrencyAccounts(this.user.id!))[0];
		} catch(e) {
			console.error('Cannot display user currency data: ', e);
		} finally {
			this.isLoading = false;
		}

		setTimeout(() => {
			this.user = null;
			this.currencyAccount = null;
		}, ETime.SECOND * 5);
	}

}
