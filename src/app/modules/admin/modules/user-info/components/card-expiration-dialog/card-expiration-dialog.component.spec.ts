import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { CardExpirationDialogComponent } from './card-expiration-dialog.component';

describe('CardExpirationDialogComponent', () => {
	let fixture: ComponentFixture<CardExpirationDialogComponent>;
	let component: CardExpirationDialogComponent;
	let dialogRef: jasmine.SpyObj<MatDialogRef<CardExpirationDialogComponent>>;

	function setup(expirationDate: string | null, cascadeWarning = false) {
		dialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
		TestBed.configureTestingModule({
			imports: [CardExpirationDialogComponent, NoopAnimationsModule],
			providers: [
				{ provide: MatDialogRef, useValue: dialogRef },
				{ provide: MAT_DIALOG_DATA, useValue: { expirationDate, cascadeWarning } },
			],
		});
		fixture = TestBed.createComponent(CardExpirationDialogComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	}

	it('prefills the value from a stored ISO date', () => {
		setup('2026-12-31T23:59:00');
		const v = (component as any).value as Date;
		expect(v instanceof Date).toBeTrue();
		expect(v.getFullYear()).toBe(2026);
		expect(v.getMonth()).toBe(11);
		expect(v.getDate()).toBe(31);
		expect(v.getHours()).toBe(23);
		expect(v.getMinutes()).toBe(59);
	});

	it('starts as null when no expiration', () => {
		setup(null);
		expect((component as any).value).toBeNull();
	});

	it('saves the local wall-clock as a zone-less UTC instant that round-trips on read', () => {
		setup(null);
		// local wall-clock 2027-01-15 10:30
		(component as any).value = new Date(2027, 0, 15, 10, 30, 0);
		(component as any).onSave();
		const saved = dialogRef.close.calls.mostRecent().args[0] as string;
		// zone-less (no trailing Z) so it persists into a `timestamp without time zone` column
		expect(saved).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/);
		// utcDateInterceptor re-tags it as UTC on the way back; re-reading must yield the original wall-clock
		const reread = (component as any).toDate(`${saved}Z`) as Date;
		expect(reread.getFullYear()).toBe(2027);
		expect(reread.getMonth()).toBe(0);
		expect(reread.getDate()).toBe(15);
		expect(reread.getHours()).toBe(10);
		expect(reread.getMinutes()).toBe(30);
	});

	it('save with empty value returns null', () => {
		setup('2026-12-31T23:59:00');
		(component as any).value = null;
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

	it('shows the cascade warning and ticket title in cascade mode', () => {
		setup('2026-12-31T23:59:00', true);
		const el: HTMLElement = fixture.nativeElement;
		expect(el.querySelector('[data-testid="cascade-warning"]')).not.toBeNull();
		expect(el.querySelector('h2')?.textContent).toContain('Expirace vstupenky');
		// Saving stays available in cascade mode.
		expect(el.querySelector('[data-testid="expiration-save"]')).not.toBeNull();
	});

	it('hides the cascade warning and uses the card title by default', () => {
		setup('2026-12-31T23:59:00');
		const el: HTMLElement = fixture.nativeElement;
		expect(el.querySelector('[data-testid="cascade-warning"]')).toBeNull();
		expect(el.querySelector('h2')?.textContent).toContain('Expirace čipu');
	});

	it('keeps the chosen time when the date is changed afterwards', () => {
		setup(null);
		// user sets a time first -> value holds that wall-clock time
		(component as any).value = new Date(2027, 0, 15, 14, 30, 0);
		// user then picks a different day; the datepicker emits that day at midnight
		(component as any).onDateChange(new Date(2027, 1, 20, 0, 0, 0));
		const v = (component as any).value as Date;
		expect(v.getFullYear()).toBe(2027);
		expect(v.getMonth()).toBe(1);
		expect(v.getDate()).toBe(20);
		expect(v.getHours()).toBe(14);
		expect(v.getMinutes()).toBe(30);
	});

	it('onDateChange defaults to midnight when no time was set yet', () => {
		setup(null);
		(component as any).onDateChange(new Date(2027, 0, 15, 0, 0, 0));
		const v = (component as any).value as Date;
		expect(v.getHours()).toBe(0);
		expect(v.getMinutes()).toBe(0);
	});

	it('onDateChange with null clears the value', () => {
		setup('2026-12-31T23:59:00');
		(component as any).onDateChange(null);
		expect((component as any).value).toBeNull();
	});
});
