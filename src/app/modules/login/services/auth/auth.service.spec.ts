import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { ConfigService } from '../../../../common/services/config/config.service';
import { UsersService } from '../../../admin/services/users/users.service';
import { EUserRole, IUser } from '../../../../common/types/IUser';
import { clearAllCaches } from '../../../../common/decorators/cache';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

function createMockJwt(exp: number = Math.round(Date.now() / 1000) + 3600): string {
	const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
	const payload = btoa(JSON.stringify({ exp, sub: '1' }));
	return `${header}.${payload}.signature`;
}

describe('AuthService', () => {
	let service: AuthService;
	let httpMock: HttpTestingController;
	let usersServiceSpy: jasmine.SpyObj<UsersService>;

	const mockConfig = { config: { apiUrl: '/api/v1.1/' } };
	const mockUser: IUser = {
		id: 1, name: 'Test User', email: 'test@test.com',
		memberId: 100, roles: [EUserRole.ADMIN], blocked: false,
	};

	beforeEach(() => {
		localStorage.clear();
		clearAllCaches();

		usersServiceSpy = jasmine.createSpyObj('UsersService', ['getUser']);
		usersServiceSpy.getUser.and.returnValue(Promise.resolve(mockUser));

		TestBed.configureTestingModule({
			imports: [],
			providers: [
				{ provide: ConfigService, useValue: mockConfig },
				{ provide: UsersService, useValue: usersServiceSpy },
				provideHttpClient(withInterceptorsFromDi()),
				provideHttpClientTesting(),
			]
		});
		service = TestBed.inject(AuthService);
		httpMock = TestBed.inject(HttpTestingController);
	});

	afterEach(() => {
		httpMock.verify();
		localStorage.clear();
	});

	it('should be created', () => {
		expect(service).toBeTruthy();
	});

	it('isLogged should return false when no user and no localStorage', () => {
		expect(service.isLogged).toBeFalse();
	});

	it('isLogged should return true when userId in localStorage', () => {
		localStorage.setItem('userId', '1');
		expect(service.isLogged).toBeTrue();
	});

	it('user setter should update isLogged$ observable', (done) => {
		service.init().then(() => {
			service.isLogged$.subscribe((val) => {
				if (val) {
					expect(val).toBeTrue();
					done();
				}
			});
			service.user = mockUser;
		});
	});

	it('init should set isLogged$ observable', async () => {
		await service.init();
		expect(service.isLogged$).toBeDefined();
	});

	it('init should emit false on isLogged$ when no user loaded', async () => {
		await service.init();

		let lastValue: boolean | undefined;
		service.isLogged$.subscribe((val) => { lastValue = val; });

		expect(lastValue).toBeFalse();
	});

	it('init should NOT call getUser when no userId in localStorage', async () => {
		await service.init();
		expect(usersServiceSpy.getUser).not.toHaveBeenCalled();
	});

	it('init should NOT call getUser when userId is invalid (NaN)', async () => {
		localStorage.setItem('userId', 'not-a-number');
		await service.init();
		// Number('not-a-number') is NaN, which is falsy, so getUser should not be called
		expect(usersServiceSpy.getUser).not.toHaveBeenCalled();
	});

	it('init should load user from localStorage', async () => {
		localStorage.setItem('userId', '1');
		await service.init();
		expect(usersServiceSpy.getUser).toHaveBeenCalledWith(1);
		expect(service.user).toEqual(mockUser);
	});

	it('login should POST credentials and store token', async () => {
		const mockToken = createMockJwt();
		const authResponse = {
			userId: 1, token: mockToken,
			placeId: 1, roles: [EUserRole.ADMIN],
			permissions: ['read', 'write'],
		};

		const promise = service.login('test@test.com', 'password123');

		const req = httpMock.expectOne('/api/v1.1/authentication/user/email');
		expect(req.request.method).toBe('POST');
		expect(req.request.body.email).toBe('test@test.com');
		expect(req.request.body.secret).toBe('password123');
		req.flush(authResponse);

		const result = await promise;
		expect(result.token).toBe(mockToken);
		expect(localStorage.getItem('userId')).toBe('1');
		expect(localStorage.getItem('apiToken')).toBe(mockToken);
		expect(JSON.parse(localStorage.getItem('permissions')!)).toEqual(['read', 'write']);
	});

	it('login should include placeToken from localStorage if present', async () => {
		localStorage.setItem('placeToken', 'place-tok');

		const authResponse = {
			userId: 1, token: createMockJwt(), placeId: 1,
			roles: [] as EUserRole[], permissions: [] as string[],
		};

		const promise = service.login('a@b.com', 'pass');

		const req = httpMock.expectOne('/api/v1.1/authentication/user/email');
		expect(req.request.body.apiToken).toBe('place-tok');
		req.flush(authResponse);

		await promise;
	});

	it('logout should clear user and localStorage', async () => {
		localStorage.setItem('userId', '1');
		localStorage.setItem('apiToken', 'tok');

		await service.logout();

		expect(service.user).toBeNull();
		expect(localStorage.getItem('userId')).toBeNull();
		expect(localStorage.getItem('apiToken')).toBeNull();
	});

	it('hasRole should return true when user has role', () => {
		service.user = { ...mockUser, roles: [EUserRole.ADMIN, EUserRole.WORKER] };
		expect(service.hasRole(EUserRole.ADMIN)).toBeTrue();
		expect(service.hasRole(EUserRole.WORKER)).toBeTrue();
	});

	it('hasRole should return false when user does not have role', () => {
		service.user = { ...mockUser, roles: [EUserRole.MEMBER] };
		expect(service.hasRole(EUserRole.ADMIN)).toBeFalse();
	});

	it('hasRole should return false when no user', () => {
		expect(service.hasRole(EUserRole.ADMIN)).toBeFalse();
	});

	it('getPermissions should return parsed permissions from localStorage', () => {
		localStorage.setItem('permissions', JSON.stringify(['read', 'write']));
		expect(service.getPermissions()).toEqual(['read', 'write'] as any);
	});

	it('getPermissions should return empty array when no permissions', () => {
		expect(service.getPermissions()).toEqual([]);
	});

	it('isDebug getter should return true when localStorage isDebug=true', () => {
		localStorage.setItem('isDebug', 'true');
		expect(service.isDebug).toBeTrue();
	});

	it('isDebug setter should persist to localStorage', () => {
		service.isDebug = true;
		expect(localStorage.getItem('isDebug')).toBe('true');
	});
});
