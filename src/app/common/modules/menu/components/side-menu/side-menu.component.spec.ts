import {ComponentFixture, TestBed} from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {Router} from '@angular/router';
import {SideMenuComponent} from './side-menu.component';
import {of, BehaviorSubject} from 'rxjs';
import {clearAllCaches} from '../../../../decorators/cache';
import {AuthService} from '../../../../../modules/login/services/auth/auth.service';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import {MatDialogModule} from '@angular/material/dialog';
import {PrintService} from '../../../../../modules/sale/services/print/print.service';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import {FeatureFlagService} from '../../../feature-flags/services/feature-flag/feature-flag.service';
import {EFeatureFlag} from '../../../feature-flags/types/EFeatureFlag';

describe('SideMenuComponent', () => {
	let component: SideMenuComponent;
	let fixture: ComponentFixture<SideMenuComponent>;
	let featureFlagService: { isEnabled: jasmine.Spy; setEnabled: jasmine.Spy };

	beforeEach(async () => {
		clearAllCaches();
		featureFlagService = {
			isEnabled: jasmine.createSpy('isEnabled').and.returnValue(false),
			setEnabled: jasmine.createSpy('setEnabled'),
		};
		await TestBed.configureTestingModule({
			declarations: [SideMenuComponent],
			schemas: [NO_ERRORS_SCHEMA],
			imports: [MatSnackBarModule, MatDialogModule],
			providers: [
				{ provide: Router, useValue: { navigate: jasmine.createSpy('navigate'), events: of() } },
				{ provide: AuthService, useValue: { isLogged$: new BehaviorSubject(false), isLogged: false, user: null, isDebug: false } },
				{ provide: PrintService, useValue: { printReceipt: jasmine.createSpy('printReceipt') } },
				{ provide: FeatureFlagService, useValue: featureFlagService },
				provideHttpClient(withInterceptorsFromDi()),
				provideHttpClientTesting(),
			]
		})
			.overrideComponent(SideMenuComponent, {set: {template: ''}})
			.compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(SideMenuComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	it('printerEnabled reflects the FeatureFlagService PRINTER state', () => {
		featureFlagService.isEnabled.and.returnValue(true);
		expect(component['printerEnabled']).toBeTrue();
		expect(featureFlagService.isEnabled).toHaveBeenCalledWith(EFeatureFlag.PRINTER);
	});

	it('setting printerEnabled persists the flag via FeatureFlagService', () => {
		component['printerEnabled'] = true;
		expect(featureFlagService.setEnabled).toHaveBeenCalledWith(EFeatureFlag.PRINTER, true);
	});
});
