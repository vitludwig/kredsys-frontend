import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogRef } from '@angular/material/dialog';
import { DepositReturnDialogComponent } from './deposit-return-dialog.component';
import { SettingsService } from '../../../admin/services/settings/settings.service';

describe('DepositReturnDialogComponent', () => {
	let component: DepositReturnDialogComponent;
	let fixture: ComponentFixture<DepositReturnDialogComponent>;
	let dialogRef: jasmine.SpyObj<MatDialogRef<DepositReturnDialogComponent>>;
	let settings: jasmine.SpyObj<SettingsService>;

	beforeEach(async () => {
		dialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
		settings = jasmine.createSpyObj('SettingsService', ['getDepositItems']);
		settings.getDepositItems.and.returnValue(Promise.resolve([
			{ label: 'Kelímek', amount: 25 },
			{ label: 'Karta', amount: 100 },
		]));

		await TestBed.configureTestingModule({
			imports: [DepositReturnDialogComponent, NoopAnimationsModule],
			providers: [
				{ provide: MatDialogRef, useValue: dialogRef },
				{ provide: SettingsService, useValue: settings },
			],
		}).compileComponents();

		fixture = TestBed.createComponent(DepositReturnDialogComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
		await fixture.whenStable();
	});

	it('loads deposit items and starts with zero counts', () => {
		expect(component['items'].length).toBe(2);
		expect(component['counts']).toEqual([0, 0]);
		expect(component['total']).toBe(0);
	});

	it('total reflects per-item counts', () => {
		component['increment'](0); // Kelímek 25
		component['increment'](0); // 2× Kelímek = 50
		component['increment'](1); // + Karta 100
		expect(component['total']).toBe(150);
	});

	it('decrement does not go below zero', () => {
		component['decrement'](0);
		expect(component['counts'][0]).toBe(0);
	});

	it('confirm closes with total amount and a tracking info marker', () => {
		component['increment'](0);
		component['increment'](0);
		component['increment'](1);
		component['confirm']();
		expect(dialogRef.close).toHaveBeenCalledWith({
			amount: 150,
			info: 'Vrácení zálohy: 2× Kelímek, 1× Karta',
		});
	});

	it('confirm does nothing when nothing is selected', () => {
		component['confirm']();
		expect(dialogRef.close).not.toHaveBeenCalled();
	});
});
