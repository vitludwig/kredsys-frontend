import {ComponentFixture, TestBed} from '@angular/core/testing';
import {PlaceTransactionsListComponent} from './place-transactions-list.component';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import {MatDialogModule} from '@angular/material/dialog';
import {AuthService} from '../../../../../login/services/auth/auth.service';
import {BehaviorSubject} from 'rxjs';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {of} from 'rxjs';
import {clearAllCaches} from '../../../../../../common/decorators/cache';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('PlaceTransactionsListComponent', () => {
	let component: PlaceTransactionsListComponent;
	let fixture: ComponentFixture<PlaceTransactionsListComponent>;

	beforeEach(async () => {
		clearAllCaches();

		await TestBed.configureTestingModule({
    declarations: [PlaceTransactionsListComponent],
    schemas: [NO_ERRORS_SCHEMA],
    imports: [MatSnackBarModule, MatDialogModule],
    providers: [{ provide: AuthService, useValue: { isLogged$: new BehaviorSubject(false), isLogged: false, user: null, isDebug: false } },
        {
            provide: ActivatedRoute,
            useValue: { snapshot: { paramMap: { get: () => '1' } }, params: of({}) },
        }, provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting(),]
}).compileComponents();

		fixture = TestBed.createComponent(PlaceTransactionsListComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
