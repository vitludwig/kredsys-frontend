import {inject} from '@angular/core';
import {Router, ActivatedRouteSnapshot, RouterStateSnapshot, CanActivateFn} from '@angular/router';
import {AuthService} from '../../modules/login/services/auth/auth.service';
import {ERoute} from '../types/ERoute';

export const authGuard: CanActivateFn = (next: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
	const authService = inject(AuthService);
	const router = inject(Router);

	if(authService.isLogged) {
		return true;
	}

	// not logged in so redirect to login page with the return url
	router.navigate(['/' + ERoute.LOGIN], {queryParams: {returnUrl: state.url}});
	return false;
}
