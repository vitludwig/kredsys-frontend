import {ComponentFixture, TestBed} from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import {StornoDialogComponent} from './storno-dialog.component';
import {of, BehaviorSubject} from 'rxjs';
import {clearAllCaches} from '../../../../common/decorators/cache';
import {AuthService} from '../../../login/services/auth/auth.service';
import {PlaceService} from '../../../admin/services/place/place/place.service';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('StornoDialogComponent', () => {
	let component: StornoDialogComponent;
	let fixture: ComponentFixture<StornoDialogComponent>;

	beforeEach(async () => {
		clearAllCaches();
		await TestBed.configureTestingModule({
			declarations: [StornoDialogComponent],
			schemas: [NO_ERRORS_SCHEMA],
			imports: [MatSnackBarModule],
			providers: [
				{ provide: MatDialogRef, useValue: { close: jasmine.createSpy('close') } },
				{ provide: MAT_DIALOG_DATA, useValue: { user: of(null) } },
				{ provide: AuthService, useValue: { isLogged$: new BehaviorSubject(false), isLogged: false, user: null, isDebug: false } },
				{ provide: PlaceService, useValue: { selectedPlace: { id: 1, name: 'Test Place' } } },
				provideHttpClient(withInterceptorsFromDi()),
				provideHttpClientTesting(),
			]
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(StornoDialogComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
