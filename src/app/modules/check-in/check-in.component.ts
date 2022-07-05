import {Component, OnInit} from '@angular/core';
import {EUserRole, IUser} from '../../common/types/IUser';
import {UsersService} from '../admin/services/users/users.service';
import {debounce} from '../../common/decorators/debounce';
import {TransactionService} from '../admin/modules/transactions/services/transaction/transaction.service';
import {PlaceService} from '../admin/services/place/place/place.service';
import {ICurrency} from '../../common/types/ICurrency';
import {CurrencyService} from '../admin/services/currency/currency.service';
import {AuthService} from '../login/services/auth/auth.service';
import {AbstractControl, FormControl, FormGroup, Validators} from '@angular/forms';
import {HttpErrorResponse} from '@angular/common/http';

@Component({
	selector: 'app-check-in',
	templateUrl: './check-in.component.html',
	styleUrls: ['./check-in.component.scss']
})
export class CheckInComponent implements OnInit {
	public userForm: FormGroup = new FormGroup({
		memberId: new FormControl('', [Validators.required]),
		name: new FormControl('', [Validators.required]),
		email: new FormControl('', [Validators.required, Validators.email]),
		role: new FormControl('', [Validators.required]),
		deposit: new FormControl(''),
	});
	public showValidationErrors: boolean = false;
	public errors: string[] = [];

	public users: IUser[] = [];
	public user: IUser | undefined;
	public newCard: number | null;

	public selectedRole: EUserRole = EUserRole.MEMBER;

	public get memberId(): AbstractControl | null {
		return this.userForm.get('memberId');
	}

	public get name(): AbstractControl | null {
		return this.userForm.get('name');
	}

	public get email(): AbstractControl | null {
		return this.userForm.get('email');
	}

	public get role(): AbstractControl | null {
		return this.userForm.get('role');
	}

	protected defaultCurrency: ICurrency;

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
		} else {
			this.users = [];
		}
	}

	public selectUser(user: IUser): void {
		this.userForm.patchValue({
			memberId: user.memberId,
			name: user.name,
			email: user.email,
			role: user.roles![0],
		});
	}

	public async onSubmit(): Promise<void> {
		if(this.userForm.invalid) {
			this.showValidationErrors = true;
			return;
		}

		try {
			const user = await this.usersService.addUser(this.userForm.value);

			if(user.id && this.newCard) {
				await this.usersService.addUserCard(user.id, this.newCard);
				await this.usersService.editRoles(user.id, [this.role?.value]);

				if(this.userForm.get('deposit')!.value) {
					await this.transactionService.deposit(
						user.id,
						this.placeService.selectedPlace!.id!,
						this.defaultCurrency.id!,
						[{
							creatorId: this.authService.user!.id!,
							amount: Number(this.userForm.get('deposit')!.value),
							text: '',
						}]
					)
				}
			}

			this.resetForm();
		} catch(e) {
			console.error('Cannot add user', e);
			this.showValidationErrors = true;
			if(e instanceof HttpErrorResponse) {
				if(e.status === 409) {
					this.errors.push('Uživatel se zadaným členským id, e-mailem nebo kartou již existuje');
				}
			}
		}
	}

	public setCard(id: number): void {
		this.newCard = id;
	}

	public resetForm(): void {
		this.userForm.patchValue(this.usersService.createNewUser());
		this.newCard = null;
	}


}
