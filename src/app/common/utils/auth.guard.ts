import {Injectable} from '@angular/core';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import {AuthService} from '../../modules/login/services/auth/auth.service';
import {ERoute} from '../types/ERoute';

@Injectable({providedIn: 'root'})
export class AuthGuard  {
	constructor(
		private router: Router,
		private authService: AuthService,
	) {
	}

	public canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
		if(this.authService.isLogged) {
			return true;
		}

		// not logged in so redirect to login page with the return url
		this.router.navigate(['/' + ERoute.LOGIN], {queryParams: {returnUrl: state.url}});
		return false;
	}
}
