import {TestBed} from '@angular/core/testing';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {of} from 'rxjs';
import {Router} from '@angular/router';
import {AppComponent} from './app.component';
import {AuthService} from './modules/login/services/auth/auth.service';
import {PlaceService} from './modules/admin/services/place/place/place.service';
import {AlertService} from './common/services/alert/alert.service';

function setup(url: string): AppComponent {
	TestBed.resetTestingModule();
	TestBed.configureTestingModule({
		declarations: [AppComponent],
		schemas: [NO_ERRORS_SCHEMA],
		providers: [
			{ provide: Router, useValue: { url, events: of() } },
			{ provide: AuthService, useValue: { isLogged: true } },
			{ provide: PlaceService, useValue: { selectedPlace: null } },
			{ provide: AlertService, useValue: {} },
		],
	});
	// Do NOT detectChanges: keep ngOnInit/ViewChild out of this pure-getter test.
	return TestBed.createComponent(AppComponent).componentInstance;
}

describe('AppComponent', () => {
	it('should create the app', () => {
		expect(AppComponent).toBeTruthy();
	});

	it('isPublicRoute is true under /public', () => {
		expect(setup('/public/groups-statistics')['isPublicRoute']).toBeTrue();
		expect(setup('/public')['isPublicRoute']).toBeTrue();
		expect(setup('/public/card-info?x=1')['isPublicRoute']).toBeTrue();
	});

	it('isPublicRoute is false for non-public routes (incl. /public-like prefixes)', () => {
		expect(setup('/sale')['isPublicRoute']).toBeFalse();
		expect(setup('/admin/groups/statistics')['isPublicRoute']).toBeFalse();
		expect(setup('/publication')['isPublicRoute']).toBeFalse();
	});
});
