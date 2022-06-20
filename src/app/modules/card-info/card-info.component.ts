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
	public user: IUser | null;
	public currencyAccount: ICurrencyAccount | null;

	constructor(
		protected usersService: UsersService,
	) {
	}

	public async setCardId(id: number): Promise<void> {
		this.user = await this.usersService.getUserByCardUid(id);
		this.currencyAccount = (await this.usersService.getUserCurrencyAccounts(this.user.id!))[0];
		setTimeout(() => {
			this.user = null;
			this.currencyAccount = null;
		}, ETime.SECOND * 10);
	}

}
