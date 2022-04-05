import {Component, OnDestroy, OnInit, Renderer2, ViewChild} from '@angular/core';
import {Subject, takeUntil} from 'rxjs';
import {UserService} from './common/services/user/user.service';
import {NavigationEnd, Router} from '@angular/router';
import {MatDrawer} from '@angular/material/sidenav';
import {AuthService} from './modules/login/services/auth/auth.service';


@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
	@ViewChild('sideMenu')
	protected sideMenu: MatDrawer;

	protected unsubscribe: Subject<void> = new Subject();
	protected keydownListener: any;
	protected userId: string = '';

	constructor(
		public authService: AuthService,
		protected userService: UserService,
		protected router: Router,
	) {
	}

	public ngOnInit(): void {
		this.router.events
			.pipe(takeUntil(this.unsubscribe))
			.subscribe((event) => {
			if (event instanceof NavigationEnd) {
				this.sideMenu.close();
			}
		});
	}


	public ngOnDestroy(): void {
		this.unsubscribe.next();
	}
}
