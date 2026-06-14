import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { CardExpirationDialogComponent } from './card-expiration-dialog.component';

describe('CardExpirationDialogComponent', () => {
	let fixture: ComponentFixture<CardExpirationDialogComponent>;
	let component: CardExpirationDialogComponent;
	let dialogRef: jasmine.SpyObj<MatDialogRef<CardExpirationDialogComponent>>;

	function setup(expirationDate: string | null) {
		dialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
		TestBed.configureTestingModule({
			imports: [CardExpirationDialogComponent, NoopAnimationsModule],
			providers: [
				{ provide: MatDialogRef, useValue: dialogRef },
				{ provide: MAT_DIALOG_DATA, useValue: { expirationDate } },
			],
		});
		fixture = TestBed.createComponent(CardExpirationDialogComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	}

	it('prefills the input from an ISO date', () => {
		setup('2026-12-31T23:59:00');
		expect((component as any).value).toBe('2026-12-31T23:59');
	});

	it('starts empty when no expiration', () => {
		setup(null);
		expect((component as any).value).toBe('');
	});

	it('save returns naive ISO string with seconds', () => {
		setup(null);
		(component as any).value = '2027-01-15T10:30';
		(component as any).onSave();
		expect(dialogRef.close).toHaveBeenCalledWith('2027-01-15T10:30:00');
	});

	it('save with empty value returns null', () => {
		setup('2026-12-31T23:59:00');
		(component as any).value = '';
		(component as any).onSave();
		expect(dialogRef.close).toHaveBeenCalledWith(null);
	});

	it('clear returns null', () => {
		setup('2026-12-31T23:59:00');
		(component as any).onClear();
		expect(dialogRef.close).toHaveBeenCalledWith(null);
	});

	it('cancel returns undefined', () => {
		setup('2026-12-31T23:59:00');
		(component as any).onCancel();
		expect(dialogRef.close).toHaveBeenCalledWith(undefined);
	});
});
