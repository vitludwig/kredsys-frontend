import {Component} from '@angular/core';
import {IUser} from '../../common/types/IUser';
import {ICurrencyAccount} from '../../common/types/ICurrency';
import {UsersService} from '../admin/services/users/users.service';
import {ETime} from '../../common/types/ETime';
import {Md5} from 'ts-md5';
import {environment} from '../../../environments/environment';

@Component({
	selector: 'app-card-info',
	templateUrl: './card-info.component.html',
	styleUrls: ['./card-info.component.scss']
})
export class CardInfoComponent {
	protected user: IUser | null;
	protected currencyAccount: ICurrencyAccount | null;
	protected isLoading: boolean = false;
	protected cardLoaded: boolean = false;
	protected walletData: string;

	constructor(
		protected usersService: UsersService,
	) {
	}

	public async setCardId(id: number): Promise<void> {
		try {
			this.isLoading = true;
			this.user = (await this.usersService.getUserByCardUid(id)) ?? null;
			this.currencyAccount = (await this.usersService.getUserCurrencyAccounts(this.user.id!))[0] ?? null;

			if(this.user && this.currencyAccount) {
				this.walletData = JSON.stringify({
					userId: this.user.id,
					token: Md5.hashStr(environment.walletApiSecret + (this.user.id + '')),
				});
			}
		} catch(e) {
			console.error('Cannot display user currency data: ', e);
		} finally {
			this.isLoading = false;
			this.cardLoaded = true;
		}

		setTimeout(() => {
			this.user = null;
			this.currencyAccount = null;
			this.cardLoaded = false;
		}, ETime.SECOND * 10);
	}

}
