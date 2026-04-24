import {ComponentFixture, TestBed} from '@angular/core/testing';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import {CardInfoConfigDialogComponent} from './card-info-config-dialog.component';

describe('CardInfoConfigDialogComponent', () => {
	let component: CardInfoConfigDialogComponent;
	let fixture: ComponentFixture<CardInfoConfigDialogComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [CardInfoConfigDialogComponent],
			providers: [
				{provide: MatDialogRef, useValue: {close: jasmine.createSpy('close')}},
				{provide: MAT_DIALOG_DATA, useValue: {}},
			],
			schemas: [NO_ERRORS_SCHEMA],
		}).compileComponents();

		fixture = TestBed.createComponent(CardInfoConfigDialogComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
