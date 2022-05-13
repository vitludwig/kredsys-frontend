import {Injectable} from '@angular/core';
import {Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot} from '@angular/router';
import {AuthService} from '../../modules/login/services/auth/auth.service';
import {ERoute} from '../types/ERoute';

@Injectable({providedIn: 'root'})
export class AuthGuard implements CanActivate {
	constructor(
		private router: Router,
		private authService: AuthService
	) {
	}

	canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
		return true;
		// TODO: uncomment after login backend is available
		// if(this.authService.isLogged) {
		// 	console.log('is logged');
		// 	return true;
		// }
		// console.log('not logged');
		// // not logged in so redirect to login page with the return url
		// this.router.navigate(['/' + ERoute.LOGIN], {queryParams: {returnUrl: state.url}});
		// return false;
	}
}