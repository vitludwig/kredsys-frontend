import {ComponentFixture, TestBed} from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {CardLoaderComponent} from './card-loader.component';
import {clearAllCaches} from '../../decorators/cache';
import {AuthService} from '../../../modules/login/services/auth/auth.service';
import {BehaviorSubject} from 'rxjs';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import {By} from '@angular/platform-browser';
import {UsersService} from '../../../modules/admin/services/users/users.service';
import {CardsService} from '../../../modules/admin/services/cards/cards.service';
import {CustomerService} from '../../../modules/sale/services/customer/customer.service';
import {IUser} from '../../types/IUser';
import {ICard, EUserCardType} from '../../types/ICard';

describe('CardLoaderComponent', () => {
	let component: CardLoaderComponent;
	let fixture: ComponentFixture<CardLoaderComponent>;

	beforeEach(async () => {
		clearAllCaches();
		await TestBed.configureTestingModule({
    schemas: [NO_ERRORS_SCHEMA],
    imports: [CardLoaderComponent, MatSnackBarModule],
    providers: [
        { provide: AuthService, useValue: { isLogged$: new BehaviorSubject(false), isLogged: false, user: null, isDebug: false } },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
    ]
}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(CardLoaderComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});

describe('CardLoaderComponent — debug mode with user-select dropdown', () => {
	let component: CardLoaderComponent;
	let fixture: ComponentFixture<CardLoaderComponent>;

	const mockUsers: IUser[] = [
		{ id: 1, name: 'Alice', email: 'alice@test.com', memberId: null, roles: [], blocked: false },
		{ id: 2, name: 'Bob',   email: 'bob@test.com',   memberId: null, roles: [], blocked: false },
		{ id: 3, name: 'Carol', email: 'carol@test.com', memberId: null, roles: [], blocked: false },
	];

	const mockCards: ICard[] = [
		{ uid: 1001, userId: 1, description: 'card1', type: EUserCardType.CARD },
		{ uid: 1002, userId: 2, description: 'card2', type: EUserCardType.CARD },
		{ uid: 1003, userId: 3, description: 'card3', type: EUserCardType.CARD },
		{ uid: 1004, userId: 1, description: 'card4', type: EUserCardType.CARD },
	];

	let mockCardsService: jasmine.SpyObj<CardsService>;
	let mockUsersService: jasmine.SpyObj<UsersService>;
	let mockCustomerService: { customer$: BehaviorSubject<any> };

	beforeEach(async () => {
		clearAllCaches();

		mockCardsService = jasmine.createSpyObj('CardsService', ['getCards']);
		mockCardsService.getCards.and.returnValue(Promise.resolve({ data: mockCards, count: mockCards.length }));

		mockUsersService = jasmine.createSpyObj('UsersService', ['getUser']);
		mockUsersService.getUser.and.callFake((id: number) => {
			const user = mockUsers.find(u => u.id === id) as IUser;
			return Promise.resolve(user);
		});

		mockCustomerService = { customer$: new BehaviorSubject(null) };

		await TestBed.configureTestingModule({
			schemas: [NO_ERRORS_SCHEMA],
			imports: [CardLoaderComponent, MatSnackBarModule],
			providers: [
				{ provide: AuthService, useValue: { isLogged$: new BehaviorSubject(true), isLogged: true, user: null, isDebug: true } },
				{ provide: CardsService, useValue: mockCardsService },
				{ provide: UsersService, useValue: mockUsersService },
				{ provide: CustomerService, useValue: mockCustomerService },
				provideHttpClient(withInterceptorsFromDi()),
				provideHttpClientTesting(),
			]
		}).compileComponents();
	});

	beforeEach(async () => {
		fixture = TestBed.createComponent(CardLoaderComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
		await fixture.whenStable();
		await fixture.whenStable();
		fixture.detectChanges();
	});

	it('should render the debug user-select dropdown', () => {
		const dropdown = fixture.debugElement.query(By.css('[data-testid="card-loader-debug-user-select"]'));
		expect(dropdown).toBeTruthy();
		expect(dropdown.nativeElement.getAttribute('aria-disabled')).not.toBe('true');
	});

	it('should emit cardIdChange when selectDebugUser is called with a valid uid', () => {
		let emittedUid: number | undefined;
		component.cardIdChange.subscribe((uid: number) => emittedUid = uid);
		(component as any).selectDebugUser(1001);
		expect(emittedUid).toBe(1001);
	});

	it('should NOT emit cardIdChange when selectDebugUser is called with null/undefined', () => {
		let emitted = false;
		component.cardIdChange.subscribe(() => emitted = true);
		(component as any).selectDebugUser(null);
		(component as any).selectDebugUser(undefined);
		expect(emitted).toBeFalse();
	});

	it('populates allUserCards with one entry per card (all users — not the first-3 limit)', () => {
		const allUserCards = (component as any).allUserCards as { name: string; uid: number }[];
		// Exactly the same set of UIDs as the mock, regardless of the
		// previous "first 3 unique users" cap.
		const uids = allUserCards.map(e => e.uid).sort((a, b) => a - b);
		expect(uids).toEqual([1001, 1002, 1003, 1004]);
		// Names alphabetised; Alice has two cards (1001, 1004) so two
		// "Alice" entries are expected.
		const names = allUserCards.map(e => e.name);
		expect(names).toEqual(['Alice', 'Alice', 'Bob', 'Carol']);
	});

	it('debugLoadNewCard reads window.__E2E_NEXT_CARD_UID__ when set', () => {
		(window as any).__E2E_NEXT_CARD_UID__ = 9_876_543_210;
		let emittedUid: number | undefined;
		component.cardIdChange.subscribe((uid: number) => emittedUid = uid);
		void component.debugLoadNewCard();
		expect(emittedUid).toBe(9_876_543_210);
		// Override is consumed (single-shot) so subsequent calls fall back to
		// the random generator.
		expect((window as any).__E2E_NEXT_CARD_UID__).toBeUndefined();
	});
});
