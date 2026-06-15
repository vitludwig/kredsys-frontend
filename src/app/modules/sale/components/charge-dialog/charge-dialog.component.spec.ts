import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ChargeDialogComponent } from './charge-dialog.component';

describe('ChargeDialogComponent', () => {
	let component: ChargeDialogComponent;
	let fixture: ComponentFixture<ChargeDialogComponent>;
	let mockDialogRef: jasmine.SpyObj<MatDialogRef<ChargeDialogComponent>>;

	beforeEach(async () => {
		mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);

		await TestBed.configureTestingModule({
			declarations: [ChargeDialogComponent],
			schemas: [NO_ERRORS_SCHEMA],
			providers: [
				{ provide: MatDialogRef, useValue: mockDialogRef },
				{ provide: MAT_DIALOG_DATA, useValue: 0 },
			],
		}).compileComponents();

		fixture = TestBed.createComponent(ChargeDialogComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	it('submit closes dialog with current amount', () => {
		component['amount'] = 500;
		component['submit']();
		expect(mockDialogRef.close).toHaveBeenCalledWith(500);
	});
});
