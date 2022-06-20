import {Component, OnInit} from '@angular/core';
import {UsersService} from '../../../../services/users/users.service';
import {EUserRole, IUser} from '../../../../../../common/types/IUser';
import {ActivatedRoute, Router} from '@angular/router';
import {ERoute} from '../../../../../../common/types/ERoute';
import {MatDialog} from '@angular/material/dialog';
import {CardDetailComponent} from './components/card-detail/card-detail.component';
import {ICard} from '../../../../../../common/types/ICard';
import {CardService} from '../../../../services/card/card.service';
import {AlertService} from '../../../../../../common/services/alert/alert.service';
import {ICurrency, ICurrencyAccount} from '../../../../../../common/types/ICurrency';
import {Utils} from '../../../../../../common/utils/Utils';
import {CurrencyService} from '../../../../services/currency/currency.service';
import {HashMap} from '../../../../../../common/types/HashMap';
import {HttpErrorResponse} from '@angular/common/http';

@Component({
	selector: 'app-user-detail',
	templateUrl: './user-detail.component.html',
	styleUrls: ['./user-detail.component.scss'],
})
export class UserDetailComponent implements OnInit {
	public user: IUser | undefined;
	public accounts: ICurrencyAccount[] = [];
	public cards: ICard[] = [];
	public currencies: HashMap<ICurrency>;
	public roles: string[] = Object.values(EUserRole);

	public newCards: ICard[] = [];
	public isLoading: boolean = false;
	public isEdit: boolean = false;

	public readonly EUserRole = EUserRole;

	constructor(
		public usersService: UsersService,
		protected cardService: CardService,
		protected currencyService: CurrencyService,
		protected route: ActivatedRoute,
		protected router: Router,
		protected dialog: MatDialog,
		protected alertService: AlertService,
	) {
	}

	public async ngOnInit(): Promise<void> {
		this.isLoading = true;
		try {
			const userId = Number(this.route.snapshot.paramMap.get('id'));
			if(userId) {
				console.log('is edit');
				this.user = Object.assign({}, await this.usersService.getUser(userId));
				this.user.roles = this.user.roles ?? [];
				this.cards = (await this.usersService.getUserCards(userId)).data;
				this.accounts = await this.usersService.getUserCurrencyAccounts(userId);
				this.currencies = Utils.toHashMap<ICurrency>((await this.currencyService.getCurrencies()).data, 'id');

				this.isEdit = true;
			} else {
				console.log('is new');
				this.user = Object.assign({}, this.usersService.createNewUser());
				this.user.roles = [];
				this.isEdit = false;
			}
		} catch(e) {
			// TODO: handle
			console.error(e);
		} finally {
			this.isLoading = false;
		}
	}

	public async onSubmit(): Promise<void> {
		// TODO: pridat osetren erroru, globalne
		try {
			let userId;
			if(this.isEdit) {
				await this.usersService.editUser(this.user!);
				userId = this.user!.id;

				// TODO: send edit request only for dirty accounts to eliminae requests amount
				for(const account of this.accounts) {
					await this.currencyService.editCurrencyAccount(account.id, account);
				}
			} else {
				const user = await this.usersService.addUser(this.user!);
				userId = user.id;
			}

			if(userId) {
				for(const card of this.newCards) {
					await this.usersService.addUserCard(userId, card.uid!);
				}
			}
		} catch(e) {
			console.error('Cannot add user', e);
		}
		this.router.navigate([ERoute.ADMIN, ERoute.ADMIN_USERS]);
	}

	public openCardDetailDialog(): void {
		const newCard = {
			description: '',
			type: 'Card',
		};
		const dialog = this.dialog.open<CardDetailComponent, ICard>(CardDetailComponent, {
			width: '300px',
			minWidth: '250px',
			autoFocus: 'dialog',
			data: newCard,
		});

		dialog.afterClosed().subscribe(async (result) => {
			if(!result) {
				return;
			}

			try {
				if(this.user?.id) {
					const card = await this.usersService.addUserCard(this.user.id, result.uid, result.description);
					result.id = card.id;
				} else {
					this.newCards.push(result);
				}
				this.cards.push(result);
			} catch(e) {
				if(e instanceof HttpErrorResponse) {
					this.alertService.error(e.error.Message ?? 'Chyba při přidávání karty');
				}
			}
		});
	}

	public async deleteCard(id: number): Promise<void> {
		try {
			if(this.user?.id) {
				await this.usersService.deleteUserCard(id);
			}
			this.cards = this.cards.filter((card) => card.id !== id);
			this.newCards = this.cards;
		} catch(e) {
			if(e instanceof HttpErrorResponse) {
				this.alertService.error(e.error.Message ?? 'Nepodarilo se odstranit kartu');
			}
		}
	}

}
