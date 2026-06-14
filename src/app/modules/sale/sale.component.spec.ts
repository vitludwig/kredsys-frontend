import {ComponentFixture, TestBed} from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {SaleComponent} from './sale.component';
import {clearAllCaches} from '../../common/decorators/cache';
import {AuthService} from '../login/services/auth/auth.service';
import {BehaviorSubject} from 'rxjs';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import {CustomerService} from './services/customer/customer.service';

describe('SaleComponent', () => {
	let component: SaleComponent;
	let fixture: ComponentFixture<SaleComponent>;
	let customerServiceSpy: jasmine.SpyObj<CustomerService>;

	beforeEach(async () => {
		clearAllCaches();
		customerServiceSpy = jasmine.createSpyObj('CustomerService', ['logout']);
		await TestBed.configureTestingModule({
			declarations: [SaleComponent],
			schemas: [NO_ERRORS_SCHEMA],
			imports: [MatSnackBarModule],
			providers: [
				{ provide: AuthService, useValue: { isLogged$: new BehaviorSubject(false), isLogged: false, user: null, isDebug: false } },
				{ provide: CustomerService, useValue: customerServiceSpy },
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

	it('logs the card customer out when leaving /sale (component destroyed)', () => {
		fixture.destroy();
		expect(customerServiceSpy.logout).toHaveBeenCalled();
	});
});
