import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogRef } from '@angular/material/dialog';
import { ChargeDialogComponent } from './charge-dialog.component';
import { SettingsService } from '../../../../services/settings/settings.service';

describe('user-info ChargeDialogComponent', () => {
	let component: ChargeDialogComponent;
	let fixture: ComponentFixture<ChargeDialogComponent>;
	let mockSettingsService: jasmine.SpyObj<SettingsService>;

	beforeEach(async () => {
		mockSettingsService = jasmine.createSpyObj('SettingsService', ['getChargeItems']);
		mockSettingsService.getChargeItems.and.returnValue(
			Promise.resolve([{ label: 'Kelímek', amount: 60 }])
		);

		await TestBed.configureTestingModule({
			imports: [ChargeDialogComponent, NoopAnimationsModule],
			providers: [
				{ provide: MatDialogRef, useValue: { close: jasmine.createSpy('close') } },
				{ provide: SettingsService, useValue: mockSettingsService },
			],
		}).compileComponents();

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
		const dialogRef = TestBed.inject(MatDialogRef) as jasmine.SpyObj<MatDialogRef<ChargeDialogComponent>>;
		component['amount'] = 500;
		component['submit']();
		expect(dialogRef.close).toHaveBeenCalledWith(500);
	});

	it('predefinedAmounts matches the shared static list', () => {
		expect(component['predefinedAmounts']).toEqual([500, 800, 1000, 1500, 2000]);
	});
});
