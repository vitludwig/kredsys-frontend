import {Component, OnInit} from '@angular/core';
import {EUserRole, IUser} from '../../common/types/IUser';
import {UsersService} from '../admin/services/users/users.service';
import {debounce} from '../../common/decorators/debounce';
import {TransactionService} from '../admin/modules/transactions/services/transaction/transaction.service';
import {PlaceService} from '../admin/services/place/place/place.service';
import {ICurrency} from '../../common/types/ICurrency';
import {CurrencyService} from '../admin/services/currency/currency.service';
import {AuthService} from '../login/services/auth/auth.service';
import {AbstractControl, UntypedFormControl, UntypedFormGroup, Validators} from '@angular/forms';
import {HttpErrorResponse} from '@angular/common/http';

@Component({
	selector: 'app-check-in',
	templateUrl: './check-in.component.html',
	styleUrls: ['./check-in.component.scss']
})
export class CheckInComponent implements OnInit {
	public userForm: UntypedFormGroup = new UntypedFormGroup({
		id: new UntypedFormControl('', []),
		memberId: new UntypedFormControl('', [Validators.required]),
		name: new UntypedFormControl('', [Validators.required]),
		email: new UntypedFormControl('', [Validators.required, Validators.email]),
		deposit: new UntypedFormControl(''),
	});
	public showValidationErrors: boolean = false;
	public errors: string[] = [];

	public users: IUser[] = [];
	public user: IUser | undefined;
	public newCard: number | null;
	public userFromList: boolean = false;

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
		this.user = this.createNewUser();
		this.user.roles = [EUserRole.MEMBER];
		this.userForm.patchValue(this.user);
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
		this.userFromList = true;
		this.userForm.patchValue({
			id: user.id,
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

		if(this.userForm.get('deposit')!.value > 50000) {
			this.showValidationErrors = true;
			this.errors.push("Takhle velkou částku nejde nabít");
			return;
		}

		try {
			let user;

			if(this.userFromList) {
				user = await this.usersService.editUser(this.userForm.value);
			} else {
				user = await this.usersService.addUser(this.userForm.value);
				const lastMemberId = Number(localStorage.getItem('lastMemberId')) + 1;
				localStorage.setItem('lastMemberId', lastMemberId.toString() ?? '0');
			}

			if(user.id && this.newCard) {
				await this.usersService.addUserCard(user.id, this.newCard);
				await this.usersService.editRoles(user.id, [EUserRole.MEMBER]);

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
		this.userForm.patchValue(this.createNewUser());
		this.newCard = null;
		this.userFromList = false;
	}

	private createNewUser(): IUser {
		const user = this.usersService.createNewUser();
		user.memberId = this.getMemberIdSequence();
		user.email = user.memberId + '@cybertown.cz';

		return user;
	}
	private getMemberIdSequence(): number {
		const lastMemberId = Number(localStorage.getItem('lastMemberId')) ?? 1;
		return Number('99999' + (lastMemberId + 1));
	}

}
