import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { NO_ERRORS_SCHEMA } from '@angular/core';

import { UserInfoDetailComponent } from './user-info-detail.component';
import { TransactionService } from '../../../transactions/services/transaction/transaction.service';
import { UsersService } from '../../../../services/users/users.service';
import { AlertService } from '../../../../../../common/services/alert/alert.service';
import { IUser, EUserRole } from '../../../../../../common/types/IUser';
import { ICurrencyAccount } from '../../../../../../common/types/ICurrency';

const mockUser: IUser = {
  id: 1,
  name: 'Jan Novák',
  email: 'jan@example.com',
  memberId: 4821,
  roles: [EUserRole.MEMBER],
  blocked: false,
};

describe('UserInfoDetailComponent', () => {
  let component: UserInfoDetailComponent;
  let fixture: ComponentFixture<UserInfoDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        UserInfoDetailComponent,
        NoopAnimationsModule,
      ],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: MatDialog, useValue: { open: jasmine.createSpy('open') } },
        { provide: Router, useValue: { navigate: jasmine.createSpy('navigate') } },
        {
          provide: TransactionService,
          useValue: {
            deposit: jasmine.createSpy('deposit'),
            withDraw: jasmine.createSpy('withDraw'),
            storno: jasmine.createSpy('storno'),
          },
        },
        {
          provide: UsersService,
          useValue: {
            setUserBlocked: jasmine.createSpy('setUserBlocked'),
            addUserCard: jasmine.createSpy('addUserCard'),
            deleteUserCard: jasmine.createSpy('deleteUserCard'),
          },
        },
        {
          provide: AlertService,
          useValue: {
            success: jasmine.createSpy('success'),
            error: jasmine.createSpy('error'),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UserInfoDetailComponent);
    component = fixture.componentInstance;

    // Provide required input
    component.user = { ...mockUser };
    component.accountLoaded = false;
    component.currencyAccount = null;
    component.transactions = [];
    component.transactionsTotal = 0;
    component.cards = [];
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should show member ID', () => {
    component.user = { ...mockUser, memberId: 4821 };
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement.querySelector('[data-testid="member-id"]');
    expect(el).toBeTruthy();
    expect(el.textContent).toContain('4821');
  });

  it('should show no-account message when accountLoaded=true and currencyAccount=null', () => {
    component.accountLoaded = true;
    component.currencyAccount = null;
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement.querySelector('[data-testid="no-account"]');
    expect(el).toBeTruthy();
  });

  it('should show balance when currencyAccount exists', () => {
    const account: ICurrencyAccount = {
      id: 1,
      userId: 1,
      currencyId: 1,
      currentAmount: 450,
      overdraftLimit: 0,
    };
    component.accountLoaded = true;
    component.currencyAccount = account;
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement.querySelector('[data-testid="balance"]');
    expect(el).toBeTruthy();
    expect(el.textContent).toContain('450');
  });
});
