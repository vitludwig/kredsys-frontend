import {ComponentFixture, TestBed} from '@angular/core/testing';
import {PlaceListComponent} from './place-list.component';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import {MatDialogModule} from '@angular/material/dialog';
import {AuthService} from '../../../login/services/auth/auth.service';
import {BehaviorSubject} from 'rxjs';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {clearAllCaches} from '../../../../common/decorators/cache';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('PlaceListComponent', () => {
	let component: PlaceListComponent;
	let fixture: ComponentFixture<PlaceListComponent>;

	beforeEach(async () => {
		clearAllCaches();

		await TestBed.configureTestingModule({
    declarations: [PlaceListComponent],
    schemas: [NO_ERRORS_SCHEMA],
    imports: [MatSnackBarModule, MatDialogModule],
    providers: [{ provide: AuthService, useValue: { isLogged$: new BehaviorSubject(false), isLogged: false, user: null, isDebug: false } }, provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting()]
}).compileComponents();

		fixture = TestBed.createComponent(PlaceListComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
