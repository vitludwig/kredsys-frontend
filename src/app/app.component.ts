import {Component, ElementRef, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {fromEvent, map, merge, Subject, takeUntil} from 'rxjs';
import {NavigationEnd, Router} from '@angular/router';
import {MatDrawer} from '@angular/material/sidenav';
import {AuthService} from './modules/login/services/auth/auth.service';
import {PlaceService} from './modules/admin/services/place/place/place.service';
import {AlertService} from './common/services/alert/alert.service';


@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {
	@ViewChild('sideMenu')
	protected sideMenu: MatDrawer;

	@ViewChild('mainContent')
	protected mainContent: ElementRef;

	protected unsubscribe: Subject<void> = new Subject();
	protected userId: string = '';
	protected isOnline: boolean = true;
	protected showNetworkAlert: boolean = false;

	constructor(
		public authService: AuthService,
		public placeService: PlaceService,
		protected router: Router,
		protected alertService: AlertService,
	) {
	}

	public async ngOnInit(): Promise<void> {
		this.router.events
			.pipe(takeUntil(this.unsubscribe))
			.subscribe((event) => {
				if(event instanceof NavigationEnd) {
					this.sideMenu.close();
					this.mainContent.nativeElement.focus();
				}
			});

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
