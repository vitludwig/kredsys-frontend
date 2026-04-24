import {ComponentFixture, TestBed} from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {CardLoaderComponent} from './card-loader.component';
import {clearAllCaches} from '../../decorators/cache';
import {AuthService} from '../../../modules/login/services/auth/auth.service';
import {BehaviorSubject} from 'rxjs';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('CardLoaderComponent', () => {
	let component: CardLoaderComponent;
	let fixture: ComponentFixture<CardLoaderComponent>;

	beforeEach(async () => {
		clearAllCaches();
		await TestBed.configureTestingModule({
    schemas: [NO_ERRORS_SCHEMA],
    imports: [CardLoaderComponent, MatSnackBarModule],
    providers: [
        { provide: AuthService, useValue: { isLogged$: new BehaviorSubject(false), isLogged: false, user: null, isDebug: false } },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
    ]
}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(CardLoaderComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
