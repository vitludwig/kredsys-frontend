import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../modules/login/services/auth/auth.service';
import { EUserRole } from '../types/IUser';
import { ERoute } from '../types/ERoute';

export const adminGuard: CanActivateFn = () => {
	const authService = inject(AuthService);
	const router = inject(Router);

	if (authService.user?.roles?.includes(EUserRole.ADMIN)) {
		return true;
	}

	router.navigate(['/' + ERoute.SALE]);
	return false;
};
