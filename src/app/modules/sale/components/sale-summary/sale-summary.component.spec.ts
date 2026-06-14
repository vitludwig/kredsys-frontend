import {ComponentFixture, TestBed} from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {SaleSummaryComponent} from './sale-summary.component';
import {clearAllCaches} from '../../../../common/decorators/cache';
import {AuthService} from '../../../login/services/auth/auth.service';
import {BehaviorSubject} from 'rxjs';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import {PrintService} from '../../services/print/print.service';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('SaleSummaryComponent', () => {
	let component: SaleSummaryComponent;
	let fixture: ComponentFixture<SaleSummaryComponent>;

	beforeEach(async () => {
		clearAllCaches();
		await TestBed.configureTestingModule({
			declarations: [SaleSummaryComponent],
			schemas: [NO_ERRORS_SCHEMA],
			imports: [MatSnackBarModule],
			providers: [
				{ provide: AuthService, useValue: { isLogged$: new BehaviorSubject(false), isLogged: false, user: null, isDebug: false } },
				{ provide: PrintService, useValue: { printReceipt: jasmine.createSpy('printReceipt') } },
				provideHttpClient(withInterceptorsFromDi()),
				provideHttpClientTesting(),
			]
		})
			.overrideComponent(SaleSummaryComponent, {set: {template: ''}})
			.compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(SaleSummaryComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
