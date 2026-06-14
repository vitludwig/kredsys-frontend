import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { authGuard } from './auth.guard';
import { AuthService } from '../../modules/login/services/auth/auth.service';

describe('AuthGuard', () => {
	let mockRouter: jasmine.SpyObj<Router>;
	let mockAuthService: { isLogged: boolean };
	let mockRoute: ActivatedRouteSnapshot;
	let mockState: RouterStateSnapshot;

	beforeEach(() => {
		localStorage.clear();

		mockRouter = jasmine.createSpyObj('Router', ['navigate']);
		mockAuthService = { isLogged: false };

		TestBed.configureTestingModule({
			providers: [
				{ provide: Router, useValue: mockRouter },
				{ provide: AuthService, useValue: mockAuthService },
			],
		});

		mockRoute = {} as ActivatedRouteSnapshot;
		mockState = { url: '/admin/users' } as RouterStateSnapshot;
	});

	afterEach(() => {
		localStorage.clear();
	});

	function runGuard(route = mockRoute, state = mockState): boolean | ReturnType<typeof authGuard> {
		return TestBed.runInInjectionContext(() => authGuard(route, state));
	}

	it('should return true when user is logged in', () => {
		mockAuthService.isLogged = true;
		expect(runGuard()).toBeTrue();
	});

	it('should return false when user is not logged in', () => {
		mockAuthService.isLogged = false;
		expect(runGuard()).toBeFalse();
	});

	it('should navigate to /login when user is not logged in', () => {
		mockAuthService.isLogged = false;
		runGuard();
		expect(mockRouter.navigate).toHaveBeenCalledWith(['/login'], jasmine.objectContaining({ queryParams: { returnUrl: '/admin/users' } }));
	});

	it('should not navigate when user is logged in', () => {
		mockAuthService.isLogged = true;
		runGuard();
		expect(mockRouter.navigate).not.toHaveBeenCalled();
	});

	it('should pass the current URL as returnUrl query param', () => {
		mockAuthService.isLogged = false;
		const state = { url: '/sale' } as RouterStateSnapshot;
		runGuard(mockRoute, state);
		expect(mockRouter.navigate).toHaveBeenCalledWith(['/login'], { queryParams: { returnUrl: '/sale' } });
	});
});
