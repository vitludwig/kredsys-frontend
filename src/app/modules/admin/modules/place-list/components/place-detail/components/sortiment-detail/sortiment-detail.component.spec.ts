import {ComponentFixture, TestBed} from '@angular/core/testing';
import {SortimentDetailComponent} from './sortiment-detail.component';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import {MatDialogModule} from '@angular/material/dialog';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import {clearAllCaches} from '../../../../../../../../common/decorators/cache';

describe('SortimentDetailComponent', () => {
	let component: SortimentDetailComponent;
	let fixture: ComponentFixture<SortimentDetailComponent>;

	beforeEach(async () => {
		clearAllCaches();

		await TestBed.configureTestingModule({
			imports: [HttpClientTestingModule, MatSnackBarModule, MatDialogModule],
			declarations: [SortimentDetailComponent],
			providers: [
				{provide: MatDialogRef, useValue: {}},
				{provide: MAT_DIALOG_DATA, useValue: {existingItems: []}},
			],
			schemas: [NO_ERRORS_SCHEMA],
		}).compileComponents();

		fixture = TestBed.createComponent(SortimentDetailComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
