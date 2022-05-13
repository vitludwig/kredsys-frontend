import {Component, OnDestroy, OnInit, Renderer2, ViewChild} from '@angular/core';
import {Subject, takeUntil} from 'rxjs';
import {NavigationEnd, Router} from '@angular/router';
import {MatDrawer} from '@angular/material/sidenav';
import {AuthService} from './modules/login/services/auth/auth.service';
import {PlaceService} from './modules/admin/services/place/place/place.service';
import {CustomerService} from './modules/sale/services/customer/customer.service';


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
		public placeService: PlaceService,
		protected customerService: CustomerService,
		protected router: Router,
	) {
	}

	public async ngOnInit(): Promise<void> {

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
