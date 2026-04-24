import {ComponentFixture, TestBed} from '@angular/core/testing';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import {DischargeDialogComponent} from './discharge-dialog.component';
import {of} from 'rxjs';

describe('DischargeDialogComponent', () => {
	let component: DischargeDialogComponent;
	let fixture: ComponentFixture<DischargeDialogComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [DischargeDialogComponent],
			providers: [
				{provide: MatDialogRef, useValue: {close: jasmine.createSpy('close')}},
				{provide: MAT_DIALOG_DATA, useValue: {user: of(null), currencyAccount: {currentAmount: 0}}},
			],
			schemas: [NO_ERRORS_SCHEMA],
		}).compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(DischargeDialogComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
