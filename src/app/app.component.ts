import {Component, ElementRef, inject, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {fromEvent, map, merge, Subject, takeUntil} from 'rxjs';
import {ActivatedRoute, ActivationEnd, NavigationEnd, Router} from '@angular/router';
import {MatDrawer} from '@angular/material/sidenav';
import {AuthService} from './modules/login/services/auth/auth.service';
import {PlaceService} from './modules/admin/services/place/place/place.service';
import {AlertService} from './common/services/alert/alert.service';
import {ERoute} from './common/types/ERoute';


@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {
	public authService: AuthService = inject(AuthService);
	public placeService: PlaceService = inject(PlaceService);
	protected router: Router = inject(Router);
	protected alertService: AlertService = inject(AlertService);

	@ViewChild('sideMenu')
	protected sideMenu: MatDrawer;

	@ViewChild('mainContent')
	protected mainContent: ElementRef;

	protected unsubscribe: Subject<void> = new Subject();
	protected userId: string = '';
	protected isOnline: boolean = true;
	protected showNetworkAlert: boolean = false;
	protected fullPageHeight: boolean = false;

	public async ngOnInit(): Promise<void> {
		this.router.events
			.pipe(takeUntil(this.unsubscribe))
			.subscribe((event) => {
				if(event instanceof NavigationEnd) {
					this.sideMenu.close();
					this.mainContent.nativeElement.focus();
				}
				if(event instanceof ActivationEnd) {
					this.fullPageHeight = [ERoute.LOGIN_SIGN_IN, ERoute.LOGIN].includes(event.snapshot.routeConfig?.path as ERoute);
				}
			});

		this.initNetworkStatusCheck();
	}

	protected initNetworkStatusCheck(): void {
		merge(
			fromEvent(window, 'online'),
			fromEvent(window, 'offline'),
		).pipe(
			takeUntil(this.unsubscribe),
			map(() => navigator.onLine),
		).subscribe((newStatus) => {
			this.showNetworkAlert = false;

			if(!this.isOnline && newStatus) {
				this.alertService.success('Připojení k internetu je zpět!');
			}
			if(this.isOnline && !newStatus) {
				this.showNetworkAlert = true;
			}

			this.isOnline = newStatus;
		});
	}


	public ngOnDestroy(): void {
		this.unsubscribe.next();
	}
}
