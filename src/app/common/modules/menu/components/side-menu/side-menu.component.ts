import {Component, OnInit} from '@angular/core';
import {ERoute} from '../../../../types/ERoute';
import {NavigationEnd, Router} from '@angular/router';
import {AuthService} from '../../../../../modules/login/services/auth/auth.service';

@Component({
	selector: 'app-side-menu',
	templateUrl: './side-menu.component.html',
	styleUrls: ['./side-menu.component.scss'],
})
export class SideMenuComponent implements OnInit {
	public ERoute = ERoute;
	public adminMenuOpened: boolean = false;

	constructor(
		public router: Router,
		public authService: AuthService,
	) {
	}

	public ngOnInit(): void {
		this.router.events.subscribe((event) => {
			if(event instanceof NavigationEnd) {
				this.adminMenuOpened = event.url.includes(ERoute.ADMIN);
			}
		});
	}
}
