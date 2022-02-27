import {Component, OnDestroy, OnInit, Renderer2, ViewChild} from '@angular/core';
import {Subject, takeUntil} from 'rxjs';
import {UserService} from './common/services/user/user.service';
import {NavigationEnd, Router} from '@angular/router';
import {MatDrawer} from '@angular/material/sidenav';


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
		protected userService: UserService,
		protected renderer: Renderer2,
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

		// this.initLoginListener();
	}

	protected initLoginListener(): void {
		this.userService.user$
			.pipe(takeUntil(this.unsubscribe))
			.subscribe((user) => {
				// user was unlogged, listen for new id
				if (user === null) {
					this.keydownListener = this.renderer.listen('document', 'keydown', (event) => {
						console.log('event: ', event);
						if (event.keyCode === 13) {
							this.removeKeydownListener();
							this.userService.login(Number(this.userId));
							console.log('user id: ', this.userId);
						} else {
							this.userId += event.key
						}
					})
				}
			})
	}

	protected removeKeydownListener(): void {
		if (this.keydownListener) {
			this.keydownListener();
			this.keydownListener = undefined;
		}
	}

	public ngOnDestroy(): void {
		this.unsubscribe.next();
		this.removeKeydownListener();
	}
}
