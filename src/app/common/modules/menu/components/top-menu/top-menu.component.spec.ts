import {ComponentFixture, TestBed} from '@angular/core/testing';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {TopMenuComponent} from './top-menu.component';
import {of, BehaviorSubject} from 'rxjs';
import {clearAllCaches} from '../../../../decorators/cache';
import {AuthService} from '../../../../../modules/login/services/auth/auth.service';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import {MatDialogModule} from '@angular/material/dialog';

describe('TopMenuComponent', () => {
	let component: TopMenuComponent;
	let fixture: ComponentFixture<TopMenuComponent>;

	beforeEach(async () => {
		clearAllCaches();
		await TestBed.configureTestingModule({
			declarations: [TopMenuComponent],
			imports: [HttpClientTestingModule, MatSnackBarModule, MatDialogModule],
			providers: [
				{provide: Router, useValue: {navigate: jasmine.createSpy('navigate'), events: of()}},
				{provide: ActivatedRoute, useValue: {snapshot: {paramMap: {get: () => '1'}}, params: of({}), queryParams: of({})}},
				{provide: AuthService, useValue: {isLogged$: new BehaviorSubject(false), isLogged: false, user: null, isDebug: false}},
			],
			schemas: [NO_ERRORS_SCHEMA],
		})
		.overrideComponent(TopMenuComponent, {set: {template: ''}})
		.compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(TopMenuComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
