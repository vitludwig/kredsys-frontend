import {ComponentFixture, TestBed} from '@angular/core/testing';
import {TransactionsListComponent} from './transactions-list.component';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import {MatDialogModule} from '@angular/material/dialog';
import {AuthService} from '../../../../../login/services/auth/auth.service';
import {BehaviorSubject} from 'rxjs';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {clearAllCaches} from '../../../../../../common/decorators/cache';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('TransactionsListComponent', () => {
	let component: TransactionsListComponent;
	let fixture: ComponentFixture<TransactionsListComponent>;

	beforeEach(async () => {
		clearAllCaches();

		await TestBed.configureTestingModule({
    declarations: [TransactionsListComponent],
    schemas: [NO_ERRORS_SCHEMA],
    imports: [MatSnackBarModule, MatDialogModule],
    providers: [{ provide: AuthService, useValue: { isLogged$: new BehaviorSubject(false), isLogged: false, user: null, isDebug: false } }, provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting()]
}).compileComponents();

		fixture = TestBed.createComponent(TransactionsListComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
