import {Component, inject, OnInit} from '@angular/core';
import {EUserRole, IUser} from '../../common/types/IUser';
import {UsersService} from '../admin/services/users/users.service';
import {debounce} from '../../common/decorators/debounce';
import {TransactionService} from '../admin/modules/transactions/services/transaction/transaction.service';
import {PlaceService} from '../admin/services/place/place/place.service';
import {ICurrency} from '../../common/types/ICurrency';
import {CurrencyService} from '../admin/services/currency/currency.service';
import {AuthService} from '../login/services/auth/auth.service';
import {AbstractControl, FormControl, UntypedFormControl, UntypedFormGroup, Validators} from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import {AlertService} from "../../common/services/alert/alert.service";
import {map, takeUntil} from "rxjs";
import {WithSubscriptionsComponent} from "../../common/components/with-subscriptions.component";
import {GroupsService} from "../groups/services/groups.service";

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

  public userForm: UntypedFormGroup = new UntypedFormGroup({
    id: new UntypedFormControl('', []),
    memberId: new UntypedFormControl('', [Validators.required]),
    name: new UntypedFormControl('', [Validators.required]),
    email: new UntypedFormControl('', [Validators.required, Validators.email]),
    deposit: new UntypedFormControl(''),
    groupId: new FormControl<number | null | undefined>(undefined),
  });
  public showValidationErrors: boolean = false;
  public errors: string[] = [];

  public users: IUser[] = [];
  public user: IUser | undefined;
  public newCard: number | null;
  public userFromList: boolean = false;
  protected search: string | null = null;
  protected searchLoading: boolean = false;

  protected groups$ = this.groupsService.getGroups().pipe(
    map((result) => result.data)
  )

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

  public async ngOnInit(): Promise<void> {
    this.user = this.createNewUser();
    this.user.roles = [EUserRole.MEMBER];
    this.userForm.patchValue(this.user);
    this.defaultCurrency = await this.currencyService.getDefaultCurrency();

    this.memberId?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        if(value && !this.userFromList) {
          this.setEmailInput(value)
        }
      });
  }

  public async searchStart(value: string): Promise<void> {
    this.searchLoading = true;
    await this.onUserSearch(value);
  }

  @debounce()
  public async onUserSearch(value: string): Promise<void> {
    if(value) {
      try {
        this.users = (await this.usersService.getUsers(value, 0, 100)).data;
      } catch(e) {
        console.error('Cannot find users', e);
        this.alertService.error("Chyba ve vyhledávání uživatelů");
        this.users = [];
      }
      finally {
        this.searchLoading = false
      }
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
      groupId: user.groups?.[0] ?? undefined,
    });
  }

  public async onSubmit(): Promise<void> {
    if(this.userForm.invalid) {
      this.showValidationErrors = true;
      return;
    }

    this.errors = [];

    if(this.userForm.get('deposit')!.value > 50000) {
      this.showValidationErrors = true;
      this.errors.push("Jde nabít maximálně 50000,-");
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
        await this.usersService.editRoles(user.id, user.roles.length === 0 ? [EUserRole.MEMBER] : user.roles);

        await this.manageUserGroups(user);

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

      this.alertService.success("Uživatel registrován!");
      this.showValidationErrors = false;
      this.resetForm();
    } catch(e) {
      // TODO: rozdělit chytaání errorů pro addUser a addUserCard, ideálně streamem
      console.error('Cannot add user', e);
      this.showValidationErrors = true;
      let msg = 'Vyskytla se neznámá chyba, obnov stránku';

      if(e instanceof HttpErrorResponse) {
        if(e.status === 409) {
          this.errors.push('Uživatel se zadaným členským id, e-mailem nebo kartou již existuje');
          return;
        }
        if(e.status === 500) {
          msg = 'Neznámá chyba, změň ID/e-mail/kartu a zkus to znovu';

          if(e.error.includes('IX_UserCards_Uid')) {
            msg = 'Tahle karta je už k někomu přiřazená';
          }
        }
      }

      this.alertService.error(msg, {duration: 0}, "Obnovit")
        .onAction()
        .pipe(
          takeUntil(this.destroy$)
        )
        .subscribe(() => {
          window.location.reload();
        });
    }
  }

  public setCard(id: number): void {
    this.newCard = id;
  }

  public resetForm(): void {
    this.userForm.reset();
    this.userForm.patchValue(this.createNewUser());
    this.newCard = null;
    this.userFromList = false;
    this.users = [];
    this.search = null;
  }

  protected setEmailInput(memberId: string): void {
    this.userForm.patchValue({
      email: memberId + '@kredsys.cz',
    });
  }

  private createNewUser(): IUser {
    const user = this.usersService.createNewUser();
    user.memberId = this.getMemberIdSequence();
    user.email = user.memberId + '@kredsys.cz';

    return user;
  }

  private getMemberIdSequence(): number {
    const lastMemberId = Number(localStorage.getItem('lastMemberId')) ?? 1;
    return Number('99999' + (lastMemberId + 1));
  }

  private async manageUserGroups(user: IUser): Promise<void> {
    // user is in group, in form was selected No Group
    const groupId = this.userForm.controls['groupId'].value
    if(groupId === null && user.groups?.length) {
      await this.groupsService.removeUserFromGroup(user.id!, user.groups[0]);
    }

    // Add user to new group
    if(groupId !== null && groupId !== undefined && !user.groups?.includes(groupId)) {
      await this.groupsService.addUserToGroup(user.id!, groupId);
    }
  }
}
