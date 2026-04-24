import {ComponentFixture, TestBed} from '@angular/core/testing';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {Router} from '@angular/router';
import {PlaceSelectComponent} from './place-select.component';
import {of, BehaviorSubject} from 'rxjs';
import {clearAllCaches} from '../../common/decorators/cache';
import {AuthService} from '../login/services/auth/auth.service';
import {MatSnackBarModule} from '@angular/material/snack-bar';

describe('PlaceSelectComponent', () => {
	let component: PlaceSelectComponent;
	let fixture: ComponentFixture<PlaceSelectComponent>;

	beforeEach(async () => {
		clearAllCaches();
		await TestBed.configureTestingModule({
			declarations: [PlaceSelectComponent],
			imports: [HttpClientTestingModule, MatSnackBarModule],
			providers: [
				{provide: Router, useValue: {navigate: jasmine.createSpy('navigate'), events: of()}},
				{provide: AuthService, useValue: {isLogged$: new BehaviorSubject(false), isLogged: false, user: null, isDebug: false}},
			],
			schemas: [NO_ERRORS_SCHEMA],
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(PlaceSelectComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
