import { fakeAsync, tick, TestBed } from '@angular/core/testing';
import { CustomerService } from './customer.service';
import { OrderService } from '../order/order.service';
import { TransactionService } from '../../../admin/modules/transactions/services/transaction/transaction.service';
import { CurrencyService } from '../../../admin/services/currency/currency.service';
import { UsersService } from '../../../admin/services/users/users.service';
import { AuthService } from '../../../login/services/auth/auth.service';
import { EUserRole, IUser } from '../../../../common/types/IUser';
import { ICurrencyAccount } from '../../../../common/types/ICurrency';
import { EPlaceRole, IPlace } from '../../../../common/types/IPlace';
import { take } from 'rxjs/operators';

describe('CustomerService', () => {
	let service: CustomerService;
	let orderServiceSpy: jasmine.SpyObj<OrderService>;
	let transactionServiceSpy: jasmine.SpyObj<TransactionService>;
	let currencyServiceSpy: jasmine.SpyObj<CurrencyService>;
	let usersServiceSpy: jasmine.SpyObj<UsersService>;
	let authServiceSpy: jasmine.SpyObj<AuthService>;

	const mockUser: IUser = {
		id: 1, name: 'Jan Novak', email: 'jan@test.com',
		memberId: 100, roles: [EUserRole.MEMBER], blocked: false,
	};

	const mockAccount: ICurrencyAccount = {
		id: 1, userId: 1, overdraftLimit: 100, currentAmount: 500, currencyId: 1,
	};

	const mockPlace: IPlace = { id: 1, name: 'Bar', type: EPlaceRole.BAR };

	beforeEach(() => {
		localStorage.clear();

		orderServiceSpy = jasmine.createSpyObj('OrderService', ['clearOrder'], {
			balance: 0,
		});
		let balanceValue = 0;
		Object.defineProperty(orderServiceSpy, 'balance', {
			get: () => balanceValue,
			set: (v: number) => { balanceValue = v; },
		});

		transactionServiceSpy = jasmine.createSpyObj('TransactionService', ['deposit', 'withDraw', 'storno']);
		transactionServiceSpy.deposit.and.returnValue(Promise.resolve({} as any));
		transactionServiceSpy.withDraw.and.returnValue(Promise.resolve({} as any));
		transactionServiceSpy.storno.and.returnValue(Promise.resolve({} as any));

		currencyServiceSpy = jasmine.createSpyObj('CurrencyService', ['getDefaultCurrency']);
		currencyServiceSpy.getDefaultCurrency.and.returnValue(Promise.resolve({ id: 1, name: 'CZK', code: 'CZK', symbol: 'Kc', minRechargeAmountWarn: 0, maxRechargeAmountWarn: 0, blocked: false }));

		usersServiceSpy = jasmine.createSpyObj('UsersService', ['getUserCurrencyAccounts']);
		usersServiceSpy.getUserCurrencyAccounts.and.returnValue(Promise.resolve([mockAccount]));

		authServiceSpy = jasmine.createSpyObj('AuthService', ['hasRole'], {
			user: { id: 99 },
		});

		TestBed.configureTestingModule({
			providers: [
				CustomerService,
				{ provide: OrderService, useValue: orderServiceSpy },
				{ provide: TransactionService, useValue: transactionServiceSpy },
				{ provide: CurrencyService, useValue: currencyServiceSpy },
				{ provide: UsersService, useValue: usersServiceSpy },
				{ provide: AuthService, useValue: authServiceSpy },
			],
		});
		service = TestBed.inject(CustomerService);
	});

	afterEach(() => {
		localStorage.clear();
	});

	it('should be created', () => {
		expect(service).toBeTruthy();
	});

	it('should start with no customer', () => {
		expect(service.customer).toBeNull();
		expect(service.isLogged).toBeFalse();
	});

	it('setting customer should load currency account and clear order', fakeAsync(() => {
		service.customer = mockUser;
		tick();

		expect(usersServiceSpy.getUserCurrencyAccounts).toHaveBeenCalledWith(1);
		expect(orderServiceSpy.clearOrder).toHaveBeenCalled();
		expect(service.isLogged).toBeTrue();
	}));

	it('setting customer should set currencyAccount from loaded accounts', fakeAsync(() => {
		service.customer = mockUser;
		tick();

		expect(service.currencyAccount).toEqual(mockAccount);
	}));

	it('setting customer should update orderService.balance', fakeAsync(() => {
		service.customer = mockUser;
		tick();

		expect(orderServiceSpy.balance).toBe(500);
	}));

	it('currencyAccountLoading should start false', () => {
		expect(service.currencyAccountLoading).toBeFalse();
	});

	it('currencyAccountLoading should be true while loading and false once resolved', fakeAsync(() => {
		let resolveAccounts!: (accounts: ICurrencyAccount[]) => void;
		usersServiceSpy.getUserCurrencyAccounts.and.returnValue(
			new Promise<ICurrencyAccount[]>((resolve) => { resolveAccounts = resolve; }),
		);

		service.customer = mockUser;
		// synchronous part of loadCurrencyAccount already ran — loading, account not yet available
		expect(service.currencyAccountLoading).toBeTrue();
		expect(service.currencyAccount).toBeNull();

		resolveAccounts([mockAccount]);
		tick();

		expect(service.currencyAccountLoading).toBeFalse();
		expect(service.currencyAccount).toEqual(mockAccount);
	}));

	it('currencyAccountLoading should be false after load even when user has no account', fakeAsync(() => {
		usersServiceSpy.getUserCurrencyAccounts.and.returnValue(Promise.resolve([]));

		service.customer = mockUser;
		tick();

		expect(service.currencyAccountLoading).toBeFalse();
		expect(service.currencyAccount).toBeFalsy();
	}));

	it('logout should reset currencyAccountLoading', fakeAsync(() => {
		service.customer = mockUser;
		tick();

		service.logout();
		tick();

		expect(service.currencyAccountLoading).toBeFalse();
	}));

	it('customer$ should emit when customer changes', fakeAsync(() => {
		let emittedCustomer: any = undefined;
		service.customer$.pipe(take(2)).subscribe((customer) => {
			emittedCustomer = customer;
		});

		service.customer = mockUser;
		tick();

		expect(emittedCustomer).toBeTruthy();
		expect(emittedCustomer.id).toBe(1);
	}));

	it('customer$ should shorten name for non-admin user', fakeAsync(() => {
		authServiceSpy.hasRole.and.returnValue(false);

		let emittedName: string | undefined;
		service.customer$.pipe(take(2)).subscribe((customer) => {
			if (customer) {
				emittedName = customer.name;
			}
		});

		service.customer = mockUser;
		tick();

		expect(emittedName).toBe('Jan N.');
	}));

	it('customer$ should show full name for admin user', fakeAsync(() => {
		authServiceSpy.hasRole.and.returnValue(true);

		let emittedName: string | undefined;
		service.customer$.pipe(take(2)).subscribe((customer) => {
			if (customer) {
				emittedName = customer.name;
			}
		});

		service.customer = mockUser;
		tick();

		expect(emittedName).toBe('Jan Novak');
	}));

	it('customer$ should handle single-word names for non-admin', fakeAsync(() => {
		authServiceSpy.hasRole.and.returnValue(false);

		let emittedName: string | undefined;
		service.customer$.pipe(take(2)).subscribe((customer) => {
			if (customer) {
				emittedName = customer.name;
			}
		});

		service.customer = { ...mockUser, name: 'Madonna' };
		tick();

		expect(emittedName).toBe('Madonna');
	}));

	it('logout should clear customer and currency account', fakeAsync(() => {
		service.customer = mockUser;
		tick();

		service.logout();
		tick();

		expect(service.customer).toBeNull();
		expect(service.currencyAccount).toBeNull();
	}));

	it('chargeMoney should call transactionService.deposit with correct args', fakeAsync(() => {
		service.customer = mockUser;
		tick();

		service.chargeMoney(500, mockPlace);
		tick();

		expect(transactionServiceSpy.deposit).toHaveBeenCalledWith(
			1, 1, 1,
			[{ creatorId: -1, amount: 500, text: '' }],
			null,
		);
	}));

	it('chargeMoney should reload currency account after deposit', fakeAsync(() => {
		service.customer = mockUser;
		tick();

		usersServiceSpy.getUserCurrencyAccounts.calls.reset();
		service.chargeMoney(500, mockPlace);
		tick();

		expect(usersServiceSpy.getUserCurrencyAccounts).toHaveBeenCalledWith(1);
	}));

	it('chargeMoney should propagate error when deposit fails', fakeAsync(() => {
		service.customer = mockUser;
		tick();

		transactionServiceSpy.deposit.and.returnValue(Promise.reject(new Error('deposit failed')));

		let caughtError: Error | undefined;
		service.chargeMoney(500, mockPlace).catch((e) => { caughtError = e; });
		tick();

		expect(caughtError).toBeDefined();
		expect(caughtError!.message).toBe('deposit failed');
	}));

	it('dischargeMoney should call transactionService.withDraw with full balance', fakeAsync(() => {
		service.customer = mockUser;
		tick();

		service.dischargeMoney(mockPlace);
		tick();

		expect(transactionServiceSpy.withDraw).toHaveBeenCalledWith(
			1, 1, 1,
			[{ creatorId: 99, amount: 500, text: 'Vybití peněz' }],
			null,
		);
	}));

	it('dischargeMoney should propagate error when withDraw fails', fakeAsync(() => {
		service.customer = mockUser;
		tick();

		transactionServiceSpy.withDraw.and.returnValue(Promise.reject(new Error('withdraw failed')));

		let caughtError: Error | undefined;
		service.dischargeMoney(mockPlace).catch((e) => { caughtError = e; });
		tick();

		expect(caughtError).toBeDefined();
		expect(caughtError!.message).toBe('withdraw failed');
	}));

	it('stornoLastTransaction should call transactionService.storno', fakeAsync(() => {
		service.customer = mockUser;
		tick();

		service.stornoLastTransaction(42);
		tick();

		expect(transactionServiceSpy.storno).toHaveBeenCalledWith(42);
	}));

	it('stornoLastTransaction should reload currency account after storno', fakeAsync(() => {
		service.customer = mockUser;
		tick();

		usersServiceSpy.getUserCurrencyAccounts.calls.reset();
		service.stornoLastTransaction(42);
		tick();

		expect(usersServiceSpy.getUserCurrencyAccounts).toHaveBeenCalledWith(1);
	}));

	it('stornoLastTransaction should propagate error when storno fails', fakeAsync(() => {
		service.customer = mockUser;
		tick();

		transactionServiceSpy.storno.and.returnValue(Promise.reject(new Error('storno failed')));

		let caughtError: Error | undefined;
		service.stornoLastTransaction(42).catch((e) => { caughtError = e; });
		tick();

		expect(caughtError).toBeDefined();
		expect(caughtError!.message).toBe('storno failed');
	}));

	it('chargeMoney without customer set should throw', fakeAsync(() => {
		let caughtError: any;
		service.chargeMoney(500, mockPlace).catch((e) => { caughtError = e; });
		tick();

		expect(caughtError).toBeDefined();
	}));
});
