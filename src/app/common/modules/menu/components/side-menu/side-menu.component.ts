import {Component, OnDestroy, OnInit} from '@angular/core';
import {ERoute} from '../../../../types/ERoute';
import {NavigationEnd, Router} from '@angular/router';
import {AuthService} from '../../../../../modules/login/services/auth/auth.service';
import AllowedRoutes from '../../../../../modules/login/services/auth/types/AllowedRoutes';
import {EUserRole, IUser} from '../../../../types/IUser';
import {Subject, takeUntil} from 'rxjs';
import {PlaceService} from "../../../../../modules/admin/services/place/place/place.service";
import {EPlaceRole} from "../../../../types/IPlace";

@Component({
	selector: 'app-side-menu',
	templateUrl: './side-menu.component.html',
	styleUrls: ['./side-menu.component.scss'],
})
export class SideMenuComponent implements OnInit, OnDestroy {
	public adminMenuOpened: boolean = false;
	public userRoles: EUserRole[];
	public user: IUser;
	public placeRole: EPlaceRole | null;

	public readonly ERoute = ERoute;
	public readonly allowedRoutes = AllowedRoutes;

	protected unsubscribe: Subject<void> = new Subject();

	constructor(
		public router: Router,
		public authService: AuthService,
		public placeService: PlaceService,
	) {
	}

	public async ngOnInit(): Promise<void> {
		this.authService.isLogged$
			.pipe(takeUntil(this.unsubscribe))
			.subscribe((isLogged) => {
				if(isLogged) {
					this.user = this.authService.user!;
					this.userRoles = this.user.roles!;
				}
			})

		this.router.events.subscribe((event) => {
			if(event instanceof NavigationEnd) {
				this.adminMenuOpened = event.url.includes(ERoute.ADMIN);
			}
		});

		this.placeService.placeRole$
			.pipe(takeUntil(this.unsubscribe))
			.subscribe(async (role) => {
				this.placeRole = role;
			})
	}

	public ngOnDestroy(): void {
		this.unsubscribe.next();
	}
}
