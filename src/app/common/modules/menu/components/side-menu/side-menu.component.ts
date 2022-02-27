import {Component, OnInit} from '@angular/core';
import {ERoute} from '../../../../types/ERoute';
import {NavigationEnd, Router} from '@angular/router';

@Component({
	selector: 'app-side-menu',
	templateUrl: './side-menu.component.html',
	styleUrls: ['./side-menu.component.scss']
})
export class SideMenuComponent implements OnInit {
	public ERoute = ERoute;
	public adminMenuOpened: boolean = false;

	constructor(
		public router: Router
	) {
	}

	public ngOnInit(): void {
		this.router.events.subscribe((event) => {
			if (event instanceof NavigationEnd) {
				this.adminMenuOpened = event.url.includes(ERoute.ADMIN);
			}
		})
	}
}
