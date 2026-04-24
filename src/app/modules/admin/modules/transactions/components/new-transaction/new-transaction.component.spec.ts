import {ComponentFixture, TestBed} from '@angular/core/testing';
import {NewTransactionComponent} from './new-transaction.component';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import {MatDialogModule} from '@angular/material/dialog';
import {AuthService} from '../../../../../login/services/auth/auth.service';
import {BehaviorSubject} from 'rxjs';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {clearAllCaches} from '../../../../../../common/decorators/cache';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('NewTransactionComponent', () => {
	let component: NewTransactionComponent;
	let fixture: ComponentFixture<NewTransactionComponent>;

	beforeEach(async () => {
		clearAllCaches();

		await TestBed.configureTestingModule({
    declarations: [NewTransactionComponent],
    schemas: [NO_ERRORS_SCHEMA],
    imports: [MatSnackBarModule, MatDialogModule],
    providers: [{ provide: AuthService, useValue: { isLogged$: new BehaviorSubject(false), isLogged: false, user: null, isDebug: false } }, provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting()]
}).compileComponents();

		fixture = TestBed.createComponent(NewTransactionComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
