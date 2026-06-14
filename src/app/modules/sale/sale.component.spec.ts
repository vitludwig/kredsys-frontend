import {ComponentFixture, TestBed} from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {SaleComponent} from './sale.component';
import {clearAllCaches} from '../../common/decorators/cache';
import {AuthService} from '../login/services/auth/auth.service';
import {BehaviorSubject} from 'rxjs';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('SaleComponent', () => {
	let component: SaleComponent;
	let fixture: ComponentFixture<SaleComponent>;

	beforeEach(async () => {
		clearAllCaches();
		await TestBed.configureTestingModule({
			declarations: [SaleComponent],
			schemas: [NO_ERRORS_SCHEMA],
			imports: [MatSnackBarModule],
			providers: [
				{ provide: AuthService, useValue: { isLogged$: new BehaviorSubject(false), isLogged: false, user: null, isDebug: false } },
				provideHttpClient(withInterceptorsFromDi()),
				provideHttpClientTesting(),
			]
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(SaleComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
