import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ChargeDialogComponent } from './charge-dialog.component';
import { SettingsService } from '../../../../modules/admin/services/settings/settings.service';

describe('ChargeDialogComponent', () => {
	let component: ChargeDialogComponent;
	let fixture: ComponentFixture<ChargeDialogComponent>;
	let mockDialogRef: jasmine.SpyObj<MatDialogRef<ChargeDialogComponent>>;
	let mockSettingsService: jasmine.SpyObj<SettingsService>;

	beforeEach(async () => {
		mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
		mockSettingsService = jasmine.createSpyObj('SettingsService', ['getChargeItems']);
		mockSettingsService.getChargeItems.and.returnValue(
			Promise.resolve([{ label: 'Kelímek', amount: 60 }])
		);

		await TestBed.configureTestingModule({
			declarations: [ChargeDialogComponent],
			schemas: [NO_ERRORS_SCHEMA],
			providers: [
				{ provide: MatDialogRef, useValue: mockDialogRef },
				{ provide: MAT_DIALOG_DATA, useValue: 0 },
				{ provide: SettingsService, useValue: mockSettingsService },
			],
		}).compileComponents();
	});

	beforeEach(async () => {
		fixture = TestBed.createComponent(ChargeDialogComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
		await fixture.whenStable();
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	it('loads charge items on init and clears loading state', () => {
		expect(mockSettingsService.getChargeItems).toHaveBeenCalled();
		expect(component['chargeItems']).toEqual([{ label: 'Kelímek', amount: 60 }]);
		expect(component['isLoading']).toBeFalse();
	});

	it('submit closes dialog with current amount', () => {
		component['amount'] = 500;
		component['submit']();
		expect(mockDialogRef.close).toHaveBeenCalledWith(500);
	});
});
