import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UserInfoComponent } from './user-info.component';
import { UsersService } from '../../services/users/users.service';
import { PlaceService } from '../../services/place/place/place.service';
import { AlertService } from '../../../../common/services/alert/alert.service';
import { CurrencyService } from '../../services/currency/currency.service';
import { CardLoaderComponent } from '../../../../common/components/card-loader/card-loader.component';
import { BehaviorSubject } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

@Component({
	selector: 'app-card-loader',
	standalone: true,
	template: '',
})
class CardLoaderStubComponent {
  @Input() showNewCardButton = true;
  @Input() hidden = false;
  @Output() cardIdChange = new EventEmitter<number>();
}

describe('UserInfoComponent', () => {
	let component: UserInfoComponent;
	let fixture: ComponentFixture<UserInfoComponent>;

	const mockUsersService = {
		getUsers: jasmine.createSpy('getUsers').and.returnValue(Promise.resolve({ data: [], count: 0 })),
		getUserByCardUid: jasmine.createSpy('getUserByCardUid'),
		getUserCurrencyAccounts: jasmine.createSpy('getUserCurrencyAccounts').and.returnValue(Promise.resolve([])),
		getUserTransactions: jasmine.createSpy('getUserTransactions').and.returnValue(Promise.resolve({ data: [], count: 0 })),
		getUserCards: jasmine.createSpy('getUserCards').and.returnValue(Promise.resolve({ data: [], count: 0 })),
		getUser: jasmine.createSpy('getUser').and.returnValue(Promise.resolve({ id: 1, name: 'Test', email: 'test@test.cz', memberId: 1, blocked: false, roles: [] })),
	};

	const mockPlaceService = {
		selectedPlace$: new BehaviorSubject(null),
	};

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [UserInfoComponent, NoopAnimationsModule],
			providers: [
				{ provide: UsersService, useValue: mockUsersService },
				{ provide: PlaceService, useValue: mockPlaceService },
				{ provide: AlertService, useValue: { success: () => {}, error: () => {} } },
				{ provide: CurrencyService, useValue: { defaultCurrency: null } },
			],
		})
			.overrideComponent(UserInfoComponent, {
				remove: { imports: [CardLoaderComponent] },
				add: { imports: [CardLoaderStubComponent] },
			})
			.compileComponents();

		fixture = TestBed.createComponent(UserInfoComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	it('should hide detail panel when no user is selected', () => {
		const detail = fixture.nativeElement.querySelector('app-user-info-detail');
		expect(detail).toBeNull();
	});

	it('should show ✕ Zavřít button only when user is selected', () => {
		expect(fixture.nativeElement.querySelector('[data-testid="close-btn"]')).toBeNull();
	});

	it('should render close button when user is selected', () => {
		const fresh = TestBed.createComponent(UserInfoComponent);
		(fresh.componentInstance as any).selectedUser = { id: 1, name: 'Test', email: 'test@test.cz', memberId: 1, blocked: false, roles: [] };
		fresh.detectChanges();
		expect(fresh.nativeElement.querySelector('[data-testid="close-btn"]')).toBeTruthy();
	});
});
