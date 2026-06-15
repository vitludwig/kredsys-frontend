import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogRef } from '@angular/material/dialog';
import { ChargeDialogComponent } from './charge-dialog.component';

describe('user-info ChargeDialogComponent', () => {
	let component: ChargeDialogComponent;
	let fixture: ComponentFixture<ChargeDialogComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [ChargeDialogComponent, NoopAnimationsModule],
			providers: [
				{ provide: MatDialogRef, useValue: { close: jasmine.createSpy('close') } },
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
		const dialogRef = TestBed.inject(MatDialogRef) as jasmine.SpyObj<MatDialogRef<ChargeDialogComponent>>;
		component['amount'] = 500;
		component['submit']();
		expect(dialogRef.close).toHaveBeenCalledWith(500);
	});

	it('predefinedAmounts matches the shared static list', () => {
		expect(component['predefinedAmounts']).toEqual([500, 800, 1000, 1500, 2000]);
	});
});
