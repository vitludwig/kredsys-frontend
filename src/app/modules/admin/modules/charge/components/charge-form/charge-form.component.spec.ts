import {ComponentFixture, TestBed} from '@angular/core/testing';
import {ChargeFormComponent} from './charge-form.component';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import {MatDialogModule} from '@angular/material/dialog';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {clearAllCaches} from '../../../../../../common/decorators/cache';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('ChargeFormComponent', () => {
	let component: ChargeFormComponent;
	let fixture: ComponentFixture<ChargeFormComponent>;

	beforeEach(async () => {
		clearAllCaches();

		await TestBed.configureTestingModule({
			declarations: [ChargeFormComponent],
			schemas: [NO_ERRORS_SCHEMA],
			imports: [MatSnackBarModule, MatDialogModule],
			providers: [provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting()]
		}).compileComponents();

		fixture = TestBed.createComponent(ChargeFormComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
