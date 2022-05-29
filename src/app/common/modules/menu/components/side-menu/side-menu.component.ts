import {Component, OnDestroy, OnInit} from '@angular/core';
import {ERoute} from '../../../../types/ERoute';
import {NavigationEnd, Router} from '@angular/router';
import {AuthService} from '../../../../../modules/login/services/auth/auth.service';
import AllowedRoutes from '../../../../../modules/login/services/auth/types/AllowedRoutes';
import {UsersService} from '../../../../../modules/admin/services/users/users.service';
import {EUserRole} from '../../../../types/IUser';
import {Subject, takeUntil} from 'rxjs';

@Component({
	selector: 'app-side-menu',
	templateUrl: './side-menu.component.html',
	styleUrls: ['./side-menu.component.scss'],
})
export class SideMenuComponent implements OnInit, OnDestroy {
	public adminMenuOpened: boolean = false;
	public userRoles: EUserRole[];

	public readonly ERoute = ERoute;
	public readonly allowedRoutes = AllowedRoutes;


	protected unsubscribe: Subject<void> = new Subject();

	constructor(
		public router: Router,
		public authService: AuthService,
	) {
	}

	public async ngOnInit(): Promise<void> {
		this.authService.isLogged$
			.pipe(takeUntil(this.unsubscribe))
			.subscribe((isLogged) => {
				if(isLogged) {
					this.userRoles = this.authService.user!.roles!;
				}
			})

		this.router.events.subscribe((event) => {
			if(event instanceof NavigationEnd) {
				this.adminMenuOpened = event.url.includes(ERoute.ADMIN);
			}
		});
	}

	public ngOnDestroy(): void {
		this.unsubscribe.next();
	}
}
