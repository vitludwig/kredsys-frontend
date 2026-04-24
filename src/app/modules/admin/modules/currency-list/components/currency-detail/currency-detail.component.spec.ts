import {ComponentFixture, TestBed} from '@angular/core/testing';
import {CurrencyDetailComponent} from './currency-detail.component';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import {MatDialogModule} from '@angular/material/dialog';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {of} from 'rxjs';
import {clearAllCaches} from '../../../../../../common/decorators/cache';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('CurrencyDetailComponent', () => {
	let component: CurrencyDetailComponent;
	let fixture: ComponentFixture<CurrencyDetailComponent>;

	beforeEach(async () => {
		clearAllCaches();

		await TestBed.configureTestingModule({
    declarations: [CurrencyDetailComponent],
    schemas: [NO_ERRORS_SCHEMA],
    imports: [MatSnackBarModule, MatDialogModule],
    providers: [
        {
            provide: ActivatedRoute,
            useValue: { snapshot: { paramMap: { get: () => '1' } }, params: of({}) },
        },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
    ]
}).compileComponents();

		fixture = TestBed.createComponent(CurrencyDetailComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
