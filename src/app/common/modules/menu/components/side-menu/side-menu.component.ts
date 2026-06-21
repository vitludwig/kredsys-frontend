import {Component, inject, OnDestroy, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {ERoute} from '../../../../types/ERoute';
import {NavigationEnd, Router} from '@angular/router';
import {AuthService} from '../../../../../modules/login/services/auth/auth.service';
import {EUserRole, IUser} from '../../../../types/IUser';
import {Subject, takeUntil} from 'rxjs';
import {PlaceService} from "../../../../../modules/admin/services/place/place/place.service";
import {EPlaceRole} from "../../../../types/IPlace";
import {PrintService} from "../../../../../modules/sale/services/print/print.service";
import {MatDialog} from "@angular/material/dialog";
import {EFeatureFlag} from "../../../feature-flags/types/EFeatureFlag";
import {FeatureFlagService} from "../../../feature-flags/services/feature-flag/feature-flag.service";

@Component({
	selector: 'app-side-menu',
	templateUrl: './side-menu.component.html',
	styleUrls: ['./side-menu.component.scss'],
	standalone: false
})
export class SideMenuComponent implements OnInit, OnDestroy {
	protected authService: AuthService = inject(AuthService);
	protected router: Router = inject(Router);
	protected printService: PrintService = inject(PrintService);
	private placeService: PlaceService = inject(PlaceService);
	private dialog: MatDialog = inject(MatDialog);
	private featureFlagService: FeatureFlagService = inject(FeatureFlagService);

  @ViewChild('printerManualDialog', { static: true }) printerManualDialog: TemplateRef<any>;

  protected bottomMoreMenuOpened: boolean = false;
  protected adminMenuOpened: boolean = false;
  protected groupsMenuOpened: boolean = false;
  protected adminOthersMenuOpened: boolean = false;
  protected userRoles: EUserRole[] = [];
  protected user: IUser | null = null;
  protected placeRole: EPlaceRole | null;
  protected readonly ERoute = ERoute;
  protected readonly EUserRole = EUserRole;

  private unsubscribe: Subject<void> = new Subject();

  protected readonly EFeatureFlag = EFeatureFlag;

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

  // Printer feature flag (per-device, Web Bluetooth is Chrome-only). Toggling persists the
  // flag; the template triggers reloadPage() on change so PrintService re-initialises.
  protected get printerEnabled(): boolean {
  	return this.featureFlagService.isEnabled(EFeatureFlag.PRINTER);
  }

  protected set printerEnabled(value: boolean) {
  	this.featureFlagService.setEnabled(EFeatureFlag.PRINTER, value);
  }

  protected reloadPage(): void {
  	window.location.reload();
  }

  protected openPrinterManualDialog() {
  	this.dialog.open(this.printerManualDialog, {});
  }
}
