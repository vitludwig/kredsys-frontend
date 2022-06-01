import {Component, OnInit, ViewChild} from '@angular/core';
import {EUserRole, IUser} from '../../common/types/IUser';
import {UsersService} from '../admin/services/users/users.service';
import {debounce} from '../../common/decorators/debounce';
import {TransactionService} from '../admin/modules/transactions/services/transaction/transaction.service';
import {PlaceService} from '../admin/services/place/place/place.service';
import {ICurrency} from '../../common/types/ICurrency';
import {CurrencyService} from '../admin/services/currency/currency.service';
import {AuthService} from '../login/services/auth/auth.service';
import {NgForm} from '@angular/forms';

@Component({
	selector: 'app-check-in',
	templateUrl: './check-in.component.html',
	styleUrls: ['./check-in.component.scss']
})
export class CheckInComponent implements OnInit {
	public users: IUser[] = [];
	public user: IUser | undefined;
	public newCard: number | null;
	public deposit: number | null;

	public roles: string[] = Object.values(EUserRole);

	protected defaultCurrency: ICurrency;

	@ViewChild(NgForm)
	protected userForm: NgForm;

	constructor(
		protected usersService: UsersService,
		protected transactionService: TransactionService,
		protected placeService: PlaceService,
		protected currencyService: CurrencyService,
		protected authService: AuthService,
	) {
	}

	public async ngOnInit(): Promise<void> {
		this.user = this.usersService.createNewUser();
		this.user.roles = [EUserRole.MEMBER];
		this.defaultCurrency = await this.currencyService.getDefaultCurrency();
	}

	@debounce()
	public async onUserSearch(value: string): Promise<void> {
		if(value) {
			this.users = (await this.usersService.getUsers(value, 0, 100)).data;
		}
	}

	public selectUser(user: IUser): void {
		user.roles = user.roles ?? [EUserRole.MEMBER];
		this.user = user;
	}

	public async onSubmit(): Promise<void> {
		try {
			const user = await this.usersService.addUser(this.user!);

			if(user.id && this.newCard) {
				await this.usersService.addUserCard(user.id, this.newCard);

				if(this.deposit) {
					await this.transactionService.deposit(
						user.id,
						this.placeService.selectedPlace!.id!,
						this.defaultCurrency.id!,
						[{
							creatorId: this.authService.user!.id!,
							amount: Number(this.deposit),
							text: '',
						}]
					)
				}
			}

			this.resetForm();
		} catch(e) {
			console.error('Cannot add user', e);
		}
	}

	public setCard(id: number): void {
		this.newCard = id;
	}

	public resetForm(): void {
		this.userForm.resetForm(this.usersService.createNewUser());
		this.newCard = null;
	}


}
