import {ComponentFixture, TestBed} from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {Router} from '@angular/router';
import {LoginComponent} from './login.component';
import {of, BehaviorSubject} from 'rxjs';
import {clearAllCaches} from '../../common/decorators/cache';
import {AuthService} from './services/auth/auth.service';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('LoginComponent', () => {
	let component: LoginComponent;
	let fixture: ComponentFixture<LoginComponent>;

	beforeEach(async () => {
		clearAllCaches();
		await TestBed.configureTestingModule({
    declarations: [LoginComponent],
    schemas: [NO_ERRORS_SCHEMA],
    imports: [MatSnackBarModule],
    providers: [
        { provide: Router, useValue: { navigate: jasmine.createSpy('navigate'), events: of() } },
        { provide: AuthService, useValue: { isLogged$: new BehaviorSubject(false), isLogged: false, user: null, isDebug: false } },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
    ]
})
		.overrideComponent(LoginComponent, {set: {template: ''}})
		.compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(LoginComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
