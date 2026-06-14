import {Component, inject, OnInit, signal} from '@angular/core';
import {EUserRole, IUser} from '../../common/types/IUser';
import {UsersService} from '../admin/services/users/users.service';
import {debounce} from '../../common/decorators/debounce';
import {TransactionService} from '../admin/modules/transactions/services/transaction/transaction.service';
import {PlaceService} from '../admin/services/place/place/place.service';
import {ICurrency} from '../../common/types/ICurrency';
import {CurrencyService} from '../admin/services/currency/currency.service';
import {AuthService} from '../login/services/auth/auth.service';
import {HttpErrorResponse} from '@angular/common/http';
import {AlertService} from "../../common/services/alert/alert.service";
import {map, takeUntil} from "rxjs";
import {WithSubscriptionsComponent} from "../../common/components/with-subscriptions.component";
import {GroupsService} from "../groups/services/groups.service";
import {email, form, hidden, min, required} from "@angular/forms/signals";

interface IUserFormModel {
  id: number | null;
  memberId: number | null;
  name: string;
  email: string;
  deposit: number | null;
  groupId: number | null;
}

@Component({
	selector: 'app-check-in',
	templateUrl: './check-in.component.html',
	styleUrls: ['./check-in.component.scss'],
	standalone: false
})
export class CheckInComponent extends WithSubscriptionsComponent implements OnInit {
	protected readonly usersService = inject(UsersService);
	protected readonly transactionService = inject(TransactionService);
	protected readonly placeService = inject(PlaceService);
	protected readonly currencyService = inject(CurrencyService);
	protected readonly authService = inject(AuthService);
	protected readonly alertService = inject(AlertService);
	protected readonly groupsService = inject(GroupsService);

	protected readonly userFormModel = signal<IUserFormModel>({
		id: null,
		memberId: null,
		name: '',
		email: '',
		deposit: null,
		groupId: null,
	});

	public readonly userForm = form(this.userFormModel, (s) => {
		required(s.memberId, {message: 'Vyplňte členské číslo'});
		required(s.name, {message: 'Vyplňte jméno'});
		email(s.email, {message: 'Vyplňte validní e-mailovou adresu'});
		min(s.memberId, 0, {message: 'Hodnota nesmí být záporná'});
		hidden(s.id, (() => true));
	});

	public showValidationErrors = false;
	public errors: string[] = [];
	public users: IUser[] = [];
	public user: IUser | undefined;
	public newCard: number | null;
	public userFromList = false;
	private selectedUser: IUser | null = null;
	protected search: string | null = null;
	protected searchLoading = false;

	protected groups$ = this.groupsService.getGroups().pipe(
		map(result => result.data)
	);

	protected defaultCurrency: ICurrency;

	public async ngOnInit(): Promise<void> {
		this.user = this.createNewUser();
		this.user.roles = [EUserRole.MEMBER];
		this.userFormModel.update(m => ({
			...m,
			memberId: this.user!.memberId,
			name: this.user!.name ?? '',
			email: this.user!.email ?? '',
		}));
		this.defaultCurrency = await this.currencyService.getDefaultCurrency();
	}

	public async searchStart(value: string): Promise<void> {
		this.searchLoading = true;
		await this.onUserSearch(value);
	}

  @debounce()
	public async onUserSearch(value: string): Promise<void> {
		if (value) {
			try {
				this.users = (await this.usersService.getUsers(value, 0, 100)).data;
			} catch (e) {
				console.error('Cannot find users', e);
				this.alertService.error("Chyba ve vyhledávání uživatelů");
				this.users = [];
			} finally {
				this.searchLoading = false;
			}
		} else {
			this.users = [];
		}
	}

  public selectUser(user: IUser): void {
  	this.userFromList = true;
  	this.selectedUser = user;
  	this.userFormModel.set({
  		id: user.id ?? null,
  		memberId: user.memberId,
  		name: user.name,
  		email: user.email ?? '',
  		deposit: null,
  		groupId: user.groups?.[0] ?? null,
  	});
  	this.search = null;
  	this.users = [];
  }

  public async onSubmit(): Promise<void> {
  	if (this.userForm().invalid()) {
  		this.showValidationErrors = true;
  		return;
  	}

  	this.errors = [];
  	const formValue = this.userFormModel();

  	if ((formValue.deposit ?? 0) > 50000) {
  		this.showValidationErrors = true;
  		this.errors.push("Jde nabít maximálně 50000,-");
  		return;
  	}

  	try {
  		let user;

  		if (this.userFromList) {
  			user = await this.usersService.editUser(this.buildUserPayload(formValue));
  		} else {
  			user = await this.usersService.addUser(this.buildUserPayload(formValue));
  			const lastMemberId = Number(localStorage.getItem('lastMemberId')) + 1;
  			localStorage.setItem('lastMemberId', lastMemberId.toString() ?? '0');
  		}

  		if (user.id && this.newCard) {
  			await this.usersService.addUserCard(user.id, this.newCard);
  			await this.usersService.editRoles(user.id, user.roles.length === 0 ? [EUserRole.MEMBER] : user.roles);
  			await this.manageUserGroups(user);

  			if (formValue.deposit) {
  				await this.transactionService.deposit(
  					user.id,
            this.placeService.selectedPlace!.id!,
            this.defaultCurrency.id!,
            [{
            	creatorId: this.authService.user!.id!,
            	amount: Number(formValue.deposit),
            	text: '',
            }]
  				);
  			}
  		}

  		this.alertService.success("Uživatel registrován!");
  		this.showValidationErrors = false;
  		this.resetForm();
  	} catch (e) {
  		// TODO: rozdělit chytaání errorů pro addUser a addUserCard, ideálně streamem
  		console.error('Cannot add user', e);
  		this.showValidationErrors = true;
  		let msg = 'Vyskytla se neznámá chyba, obnov stránku';

  		if (e instanceof HttpErrorResponse) {
  			if (e.status === 409) {
  				this.errors.push('Uživatel se zadaným členským id, e-mailem nebo čipem již existuje');
  				return;
  			}
  			if (e.status === 500) {
  				msg = 'Neznámá chyba, změň ID/e-mail/čip a zkus to znovu';
  				if (e.error.includes('IX_UserCards_Uid')) {
  					msg = 'Tenhle čip je už k někomu přiřazený';
  				}
  			}
  		}

  		this.alertService.error(msg, {duration: 0}, "Obnovit")
  			.onAction()
  			.pipe(takeUntil(this.destroy$))
  			.subscribe(() => window.location.reload());
  	}
  }

  public setCard(id: number): void {
  	this.newCard = id;
  }

  public resetForm(): void {
  	const newUser = this.createNewUser();
  	this.userFormModel.set({
  		id: null,
  		memberId: newUser.memberId,
  		name: newUser.name ?? '',
  		email: newUser.email ?? '',
  		deposit: null,
  		groupId: null,
  	});
  	this.userForm().reset();
  	this.newCard = null;
  	this.userFromList = false;
  	this.selectedUser = null;
  	this.users = [];
  	this.search = null;
  }

  private buildUserPayload(model: IUserFormModel): IUser {
  	const base = this.userFromList ? this.selectedUser : this.user;

  	return {
  		...(model.id != null ? {id: model.id} : {}),
  		memberId: model.memberId,
  		name: model.name,
  		email: model.email,
  		roles: base?.roles ?? [],
  		blocked: base?.blocked ?? false,
  		groups: base?.groups,
  	};
  }

  private createNewUser(): IUser {
  	const user = this.usersService.createNewUser();
  	user.memberId = this.getMemberIdSequence();
  	return user;
  }

  private getMemberIdSequence(): number {
  	const lastMemberId = Number(localStorage.getItem('lastMemberId')) ?? 1;
  	return Number('99999' + (lastMemberId + 1));
  }

  private async manageUserGroups(user: IUser): Promise<void> {
  	const {groupId} = this.userFormModel();
  	if (groupId === null && user.groups?.length) {
  		await this.groupsService.removeUserFromGroup(user.id!, user.groups[0]);
  	}
  	if (groupId !== null && !user.groups?.includes(groupId)) {
  		await this.groupsService.addUserToGroup(user.id!, groupId);
  	}
  }
}
