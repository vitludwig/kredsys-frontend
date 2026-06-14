import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { UsersService } from './users.service';
import { ConfigService } from '../../../../common/services/config/config.service';
import { EUserRole, IUser } from '../../../../common/types/IUser';
import { IPaginatedResponse } from '../../../../common/types/IPaginatedResponse';
import { ICard, EUserCardType } from '../../../../common/types/ICard';
import { ICurrencyAccount } from '../../../../common/types/ICurrency';
import { ITransaction } from '../../modules/transactions/services/transaction/types/ITransaction';
import { clearAllCaches } from '../../../../common/decorators/cache';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('UsersService', () => {
	let service: UsersService;
	let httpMock: HttpTestingController;
	const API_URL = '/api/v1.1/';
	const mockConfig = { config: { apiUrl: API_URL } };

	beforeEach(() => {
		clearAllCaches();
		localStorage.clear();
		TestBed.configureTestingModule({
			imports: [],
			providers: [
				{ provide: ConfigService, useValue: mockConfig },
				provideHttpClient(withInterceptorsFromDi()),
				provideHttpClientTesting(),
			]
		});
		service = TestBed.inject(UsersService);
		httpMock = TestBed.inject(HttpTestingController);
	});

	afterEach(() => {
		httpMock.verify();
		localStorage.clear();
	});

	it('should be created', () => {
		expect(service).toBeTruthy();
	});

	describe('getUsers', () => {
		const mockResponse: IPaginatedResponse<IUser> = {
			data: [{ id: 1, name: 'Alice', email: 'alice@test.com', memberId: 100, roles: [EUserRole.MEMBER], blocked: false }],
			count: 1,
		};

		it('should GET users with default params', async () => {
			const promise = service.getUsers();
			const req = httpMock.expectOne(r => r.url === API_URL + 'users');
			expect(req.request.method).toBe('GET');
			expect(req.request.params.get('filter')).toBe('blocked=false');
			expect(req.request.params.get('page')).toBe('0');
			expect(req.request.params.get('includeBlocked')).toBe('false');
			req.flush(mockResponse);
			const result = await promise;
			expect(result.data.length).toBe(1);
			expect(result.data[0].name).toBe('Alice');
		});

		it('should add search to filter when provided', async () => {
			const promise = service.getUsers('john');
			const req = httpMock.expectOne(r => r.url === API_URL + 'users');
			expect(req.request.params.get('filter')).toBe('blocked=false,name#=*john/i | memberId ^ john');
			req.flush(mockResponse);
			await promise;
		});

		it('should pass blocked=true when requested', async () => {
			const promise = service.getUsers('', 0, 15, true);
			const req = httpMock.expectOne(r => r.url === API_URL + 'users');
			expect(req.request.params.get('filter')).toBe('blocked=true');
			expect(req.request.params.get('includeBlocked')).toBe('true');
			req.flush(mockResponse);
			await promise;
		});

		it('should pass custom page and pageSize', async () => {
			const promise = service.getUsers('', 2, 25);
			const req = httpMock.expectOne(r => r.url === API_URL + 'users');
			expect(req.request.params.get('page')).toBe('2');
			expect(req.request.params.get('pageSize')).toBe('25');
			req.flush(mockResponse);
			await promise;
		});
	});

	describe('getUser', () => {
		it('should GET user by id', async () => {
			const mockUser: IUser = { id: 5, name: 'Bob', email: 'bob@test.com', memberId: 200, roles: [EUserRole.ADMIN], blocked: false };
			const promise = service.getUser(5);
			const req = httpMock.expectOne(API_URL + 'users/5');
			expect(req.request.method).toBe('GET');
			req.flush(mockUser);
			const result = await promise;
			expect(result.name).toBe('Bob');
			expect(result.id).toBe(5);
		});

		it('should reject when server returns 404', async () => {
			const promise = service.getUser(9999);
			const req = httpMock.expectOne(API_URL + 'users/9999');
			req.flush('Not Found', { status: 404, statusText: 'Not Found' });
			await expectAsync(promise).toBeRejected();
		});
	});

	describe('editUser', () => {
		it('should PUT user data', async () => {
			const user: IUser = { id: 3, name: 'Carol', email: 'carol@test.com', memberId: 300, roles: [EUserRole.WORKER], blocked: false };
			const promise = service.editUser(user);
			const req = httpMock.expectOne(API_URL + 'users/3');
			expect(req.request.method).toBe('PUT');
			expect(req.request.body).toEqual(user);
			req.flush(user);
			const result = await promise;
			expect(result.name).toBe('Carol');
		});
	});

	describe('editRoles', () => {
		it('should PUT roles for a user', async () => {
			const roles = [EUserRole.ADMIN, EUserRole.MEMBER];
			const promise = service.editRoles(7, roles);
			const req = httpMock.expectOne(API_URL + 'users/7/roles');
			expect(req.request.method).toBe('PUT');
			expect(req.request.body).toEqual({ roles });
			req.flush(null);
			await promise;
		});
	});

	describe('setUserBlocked', () => {
		it('should set blocked=true and PUT the user', async () => {
			const user: IUser = { id: 4, name: 'Dave', email: 'dave@test.com', memberId: 400, roles: [], blocked: false };
			const promise = service.setUserBlocked(user, true);
			const req = httpMock.expectOne(API_URL + 'users/4');
			expect(req.request.method).toBe('PUT');
			expect(req.request.body.blocked).toBe(true);
			req.flush({ ...user, blocked: true });
			const result = await promise;
			expect(result.blocked).toBe(true);
		});

		it('should set blocked=false and PUT the user', async () => {
			const user: IUser = { id: 14, name: 'Dave2', email: 'dave2@test.com', memberId: 401, roles: [], blocked: true };
			const promise = service.setUserBlocked(user, false);
			const req = httpMock.expectOne(API_URL + 'users/14');
			expect(req.request.body.blocked).toBe(false);
			req.flush({ ...user, blocked: false });
			await promise;
		});
	});

	describe('unblockUser', () => {
		it('should set blocked=false and PUT the user', async () => {
			const user: IUser = { id: 15, name: 'Blocked User', email: 'blocked@test.com', memberId: 410, roles: [], blocked: true };
			const promise = service.unblockUser(user);
			const req = httpMock.expectOne(API_URL + 'users/15');
			expect(req.request.method).toBe('PUT');
			expect(req.request.body.blocked).toBe(false);
			req.flush({ ...user, blocked: false });
			const result = await promise;
			expect(result.blocked).toBe(false);
		});
	});

	describe('addUser', () => {
		it('should POST new user', async () => {
			const user: IUser = { name: 'Eve', email: 'eve@test.com', memberId: 500, roles: [EUserRole.MEMBER], blocked: false };
			const promise = service.addUser(user);
			const req = httpMock.expectOne(API_URL + 'users');
			expect(req.request.method).toBe('POST');
			expect(req.request.body).toEqual(user);
			req.flush({ ...user, id: 10 });
			const result = await promise;
			expect(result.id).toBe(10);
		});

		it('should reject when server returns 409 conflict', async () => {
			const user: IUser = { name: 'Dupe', email: 'dupe@test.com', memberId: 501, roles: [], blocked: false };
			const promise = service.addUser(user);
			const req = httpMock.expectOne(API_URL + 'users');
			req.flush('Conflict', { status: 409, statusText: 'Conflict' });
			await expectAsync(promise).toBeRejected();
		});
	});

	describe('getUserCards', () => {
		it('should GET user cards with pageSize=999 and exclude blocked by default', async () => {
			const mockResponse: IPaginatedResponse<ICard> = { data: [], count: 0 };
			const promise = service.getUserCards(6);
			const req = httpMock.expectOne(r => r.url === API_URL + 'users/6/cards');
			expect(req.request.method).toBe('GET');
			expect(req.request.params.get('pageSize')).toBe('999');
			expect(req.request.params.get('includeBlocked')).toBe('false');
			req.flush(mockResponse);
			const result = await promise;
			expect(result.count).toBe(0);
		});

		it('should request blocked cards when includeBlocked is true', async () => {
			const mockResponse: IPaginatedResponse<ICard> = { data: [], count: 0 };
			const promise = service.getUserCards(6, true);
			const req = httpMock.expectOne(r => r.url === API_URL + 'users/6/cards');
			expect(req.request.params.get('includeBlocked')).toBe('true');
			req.flush(mockResponse);
			await promise;
		});
	});

	describe('getUserTransactions', () => {
		it('should GET user transactions with default params', async () => {
			const mockResponse: IPaginatedResponse<ITransaction> = { data: [], count: 0 };
			const promise = service.getUserTransactions(20);
			const req = httpMock.expectOne(r => r.url === API_URL + 'users/20/transactions');
			expect(req.request.method).toBe('GET');
			expect(req.request.params.get('page')).toBe('0');
			expect(req.request.params.get('pageSize')).toBe('15');
			req.flush(mockResponse);
			const result = await promise;
			expect(result.data).toEqual([]);
		});

		it('should pass custom page, pageSize, filter and orderBy', async () => {
			const mockResponse: IPaginatedResponse<ITransaction> = { data: [], count: 0 };
			const promise = service.getUserTransactions(21, 2, 50, 'type=Payment', 'created desc');
			const req = httpMock.expectOne(r => r.url === API_URL + 'users/21/transactions');
			expect(req.request.params.get('page')).toBe('2');
			expect(req.request.params.get('pageSize')).toBe('50');
			expect(req.request.params.get('filter')).toBe('type=Payment');
			expect(req.request.params.get('orderBy')).toBe('created desc');
			req.flush(mockResponse);
			await promise;
		});
	});

	describe('getUserByCardUid', () => {
		it('should GET user by card uid and return user + expired flag', async () => {
			const mockUser: IUser = { id: 8, name: 'Frank', email: 'frank@test.com', memberId: 600, roles: [], blocked: false };
			const promise = service.getUserByCardUid(12345);
			const req = httpMock.expectOne(API_URL + 'cards/12345/user');
			expect(req.request.method).toBe('GET');
			req.flush({ user: mockUser, expired: true });
			const result = await promise;
			expect(result.user.name).toBe('Frank');
			expect(result.expired).toBe(true);
		});
	});

	describe('getPublicUserIdByCardUid', () => {
		it('should GET public user id and return userId', async () => {
			const promise = service.getPublicUserIdByCardUid(55555);
			const req = httpMock.expectOne('/kredsys-api/userIdByCard/55555');
			expect(req.request.method).toBe('GET');
			req.flush({ userId: 42 });
			const result = await promise;
			expect(result).toBe(42);
		});

		it('should return null when userId is null', async () => {
			const promise = service.getPublicUserIdByCardUid(55556);
			const req = httpMock.expectOne('/kredsys-api/userIdByCard/55556');
			req.flush({ userId: null });
			const result = await promise;
			expect(result).toBeNull();
		});
	});

	describe('getPublicUserInfo', () => {
		it('should GET public user info', async () => {
			const mockInfo = { name: 'Public User', balance: 100 };
			const promise = service.getPublicUserInfo(42, 'abc-token');
			const req = httpMock.expectOne('/kredsys-api/userInfo/42/abc-token');
			expect(req.request.method).toBe('GET');
			req.flush(mockInfo);
			const result = await promise;
			expect(result).toEqual(mockInfo as any);
		});

		it('should return null when response is empty object', async () => {
			const promise = service.getPublicUserInfo(43, 'def-token');
			const req = httpMock.expectOne('/kredsys-api/userInfo/43/def-token');
			req.flush({});
			const result = await promise;
			expect(result).toBeNull();
		});
	});

	describe('getUserCurrencyAccounts', () => {
		it('should GET accounts and return .data', async () => {
			const accounts: ICurrencyAccount[] = [
				{ id: 1, userId: 9, overdraftLimit: 0, currentAmount: 100, currencyId: 1 },
			];
			const mockResponse: IPaginatedResponse<ICurrencyAccount> = { data: accounts, count: 1 };
			const promise = service.getUserCurrencyAccounts(9);
			const req = httpMock.expectOne(r => r.url === API_URL + 'users/9/accounts');
			expect(req.request.method).toBe('GET');
			expect(req.request.params.get('pageSize')).toBe('999');
			req.flush(mockResponse);
			const result = await promise;
			expect(result).toEqual(accounts);
			expect(result.length).toBe(1);
		});
	});

	describe('addUserCard', () => {
		it('should POST card with default type, description and null expiration', async () => {
			const promise = service.addUserCard(11, 99999);
			const req = httpMock.expectOne(API_URL + 'users/11/card');
			expect(req.request.method).toBe('POST');
			expect(req.request.body).toEqual({
				uid: 99999,
				type: 'Card',
				description: '',
				expirationDate: null,
			});
			req.flush({ id: 1, uid: 99999 });
			await promise;
		});

		it('should POST card with custom description and expiration', async () => {
			const promise = service.addUserCard(12, 88888, 'My card', EUserCardType.CARD, '2026-12-31T23:59:00');
			const req = httpMock.expectOne(API_URL + 'users/12/card');
			expect(req.request.body.description).toBe('My card');
			expect(req.request.body.expirationDate).toBe('2026-12-31T23:59:00');
			req.flush({ id: 2, uid: 88888 });
			await promise;
		});
	});

	describe('setUserCardExpiration', () => {
		it('should PUT cards/{id} resending type and description', async () => {
			const card: ICard = { id: 7, uid: 555, description: 'Main', type: EUserCardType.CARD, blocked: false };
			const promise = service.setUserCardExpiration(card, '2026-12-31T23:59:00');
			const req = httpMock.expectOne(API_URL + 'cards/7');
			expect(req.request.method).toBe('PUT');
			expect(req.request.body).toEqual({
				type: 'Card',
				description: 'Main',
				expirationDate: '2026-12-31T23:59:00',
			});
			req.flush({ ...card, expirationDate: '2026-12-31T23:59:00' });
			await promise;
		});

		it('should send empty description when card has none, and allow clearing expiration', async () => {
			const card: ICard = { id: 8, uid: 556, description: '', type: EUserCardType.CARD };
			const promise = service.setUserCardExpiration(card, null);
			const req = httpMock.expectOne(API_URL + 'cards/8');
			expect(req.request.body.expirationDate).toBeNull();
			expect(req.request.body.description).toBe('');
			expect(req.request.body.type).toBe('Card');
			req.flush({ ...card, expirationDate: null });
			await promise;
		});
	});

	describe('deleteUserCard', () => {
		it('should DELETE card by id', async () => {
			const promise = service.deleteUserCard(42);
			const req = httpMock.expectOne(API_URL + 'cards/42');
			expect(req.request.method).toBe('DELETE');
			req.flush(null);
			await promise;
		});
	});

	describe('blockUserCard / unblockUserCard', () => {
		it('should PUT cards/{id}/block', async () => {
			const promise = service.blockUserCard(42);
			const req = httpMock.expectOne(API_URL + 'cards/42/block');
			expect(req.request.method).toBe('PUT');
			expect(req.request.body).toBeNull();
			req.flush(null);
			await promise;
		});

		it('should PUT cards/{id}/unblock', async () => {
			const promise = service.unblockUserCard(42);
			const req = httpMock.expectOne(API_URL + 'cards/42/unblock');
			expect(req.request.method).toBe('PUT');
			req.flush(null);
			await promise;
		});
	});

	describe('changePassword', () => {
		it('should PUT password change', async () => {
			const promise = service.changePassword(5, 'oldPass', 'newPass');
			const req = httpMock.expectOne(API_URL + 'users/5/changepassword');
			expect(req.request.method).toBe('PUT');
			expect(req.request.body).toEqual({ oldPassword: 'oldPass', newPassword: 'newPass' });
			req.flush(null);
			await promise;
		});
	});

	describe('createNewUser', () => {
		it('should return an empty user template', () => {
			const user = service.createNewUser();
			expect(user.name).toBe('');
			expect(user.email).toBe('');
			expect(user.memberId).toBeNull();
			expect(user.blocked).toBe(false);
			expect(user.roles).toEqual([]);
			expect(user.password).toBe('');
		});
	});
});
