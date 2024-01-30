import {Component, OnInit} from '@angular/core';
import {UsersService} from '../../../../services/users/users.service';
import {EUserRole, IUser} from '../../../../../../common/types/IUser';
import {ActivatedRoute, Router} from '@angular/router';
import {ERoute} from '../../../../../../common/types/ERoute';
import {MatDialog} from '@angular/material/dialog';
import {CardDetailComponent} from './components/card-detail/card-detail.component';
import {ICard} from '../../../../../../common/types/ICard';
import {AlertService} from '../../../../../../common/services/alert/alert.service';
import {ICurrency, ICurrencyAccount} from '../../../../../../common/types/ICurrency';
import {Utils} from '../../../../../../common/utils/Utils';
import {CurrencyService} from '../../../../services/currency/currency.service';
import {HashMap} from '../../../../../../common/types/HashMap';
import {HttpErrorResponse} from '@angular/common/http';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import FormValidator from '../../../../../../common/utils/FormValidator';

@Component({
	selector: 'app-user-detail',
	templateUrl: './user-detail.component.html',
	styleUrls: ['./user-detail.component.scss'],
})
export class UserDetailComponent implements OnInit {
	protected userFormGroup: FormGroup = new FormGroup({
		memberId: new FormControl<number | null>(null, Validators.required),
		name: new FormControl<string>('', Validators.required),
		email: new FormControl<string>('', [Validators.required, Validators.email]),
		password: new FormControl<string>(''),
		passwordAgain: new FormControl<string>(''),
		role: new FormControl<EUserRole>(EUserRole.MEMBER, [Validators.required]),
	}, {
		validators: [FormValidator.match('password', 'passwordAgain')],
	});

	protected user: IUser | undefined;

	protected get userForm() {
		return this.userFormGroup.value;
	}

	public accounts: ICurrencyAccount[] = [];
	public cards: ICard[] = [];
	public currencies: HashMap<ICurrency>;
	public roles: string[] = Object.values(EUserRole);
	public passwordAgain: string;

	public newCards: ICard[] = [];
	public isLoading: boolean = false;
	public isEdit: boolean = false;

	public readonly EUserRole = EUserRole;

	constructor(
		public usersService: UsersService,
		protected currencyService: CurrencyService,
		protected route: ActivatedRoute,
		protected router: Router,
		protected dialog: MatDialog,
		protected alertService: AlertService,
	) {
	}

	public ngOnInit(): void {
		this.loadUserDetails();
	}

	protected async onSubmit(): Promise<void> {
		if(!this.userFormGroup.valid) {
			return;
		}

		// TODO: pridat osetren erroru, globalne
		try {
			let user: IUser;

			if(this.isEdit) {
				user = await this.editUser();
			} else {
				user = await this.addUser();
			}

			if(user.id) {
				await this.addCards(user.id);
			}

			this.router.navigate([ERoute.ADMIN, ERoute.ADMIN_USERS]);
		} catch(e) {
			console.error('Cannot add user', e);

			if(e instanceof HttpErrorResponse) {
				if(e.status === 409) {
					this.userFormGroup.get('memberId')?.setErrors({conflict: true});
					this.userFormGroup.get('memberId')?.markAsTouched();
				} else {
					this.alertService.error(e.error.Message);
				}
			}
		}
	}

	protected openCardDetailDialog(): void {
		const newCard = {
			description: '',
			type: 'Card',
		};
		const dialog = this.dialog.open<CardDetailComponent, ICard>(CardDetailComponent, {
			width: '350px',
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

	protected async deleteCard(id?: number): Promise<void> {
		if(!id) {
			return;
		}

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

	private async addCards(userId: number): Promise<void> {
		for(const card of this.newCards) {
			if(card.uid) {
				await this.usersService.addUserCard(userId, card.uid);
			}
		}
	}

	private async addUser(): Promise<IUser> {
		const newUser = Utils.mapValues(this.usersService.createNewUser(), this.userForm);
		const user = await this.usersService.addUser(newUser);

		if(user.id) {
			await this.usersService.editRoles(user.id, [this.userForm.role]);
		}

		return user;
	}

	private async editUser(): Promise<IUser> {
		if(!this.user || !this.user.id) {
			throw new Error('User is not defined');
		}

		const editUser = Utils.mapValues(this.user, this.userForm);

		await this.usersService.editUser(editUser);
		await this.usersService.editRoles(this.user.id,[ this.userForm.role]);

		// TODO: send edit request only for dirty accounts to eliminae requests amount
		for(const account of this.accounts) {
			await this.currencyService.editCurrencyAccount(account.id, account);
		}

		return editUser;
	}

	private async loadUserDetails(): Promise<void> {
		this.isLoading = true;

		try {
			const userId = Number(this.route.snapshot.paramMap.get('id'));
			let user;

			if(userId) {
				user = Object.assign({}, await this.usersService.getUser(userId));
				user.roles = user.roles ?? [];

				this.cards = (await this.usersService.getUserCards(userId)).data;
				this.accounts = await this.usersService.getUserCurrencyAccounts(userId);
				this.currencies = Utils.toHashMap<ICurrency>((await this.currencyService.getCurrencies()).data, 'id');

				this.isEdit = true;
			} else {
				user = Object.assign({}, this.usersService.createNewUser());
				user.roles = [];
				this.userFormGroup.get('password')?.setValidators(Validators.required);
				this.userFormGroup.get('passwordAgain')?.setValidators(Validators.required);

				this.isEdit = false;
			}

			this.userFormGroup.setValue({
				memberId: user.memberId,
				name: user.name,
				email: user.email,
				role: user.roles[0] ?? EUserRole.MEMBER,
				password: '',
				passwordAgain: '',
			});
			this.user = user;
		} catch(e) {
			this.alertService.error('Nepodařilo se načíst detail uživatele');
			console.error(e);
		} finally {
			this.isLoading = false;
		}
	}
}
