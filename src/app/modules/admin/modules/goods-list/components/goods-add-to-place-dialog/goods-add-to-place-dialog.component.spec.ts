import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { By } from '@angular/platform-browser';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { GoodsAddToPlaceDialogComponent } from './goods-add-to-place-dialog.component';

describe('GoodsAddToPlaceDialogComponent', () => {
	let fixture: ComponentFixture<GoodsAddToPlaceDialogComponent>;
	let dialogRefSpy: jasmine.SpyObj<MatDialogRef<GoodsAddToPlaceDialogComponent>>;

	beforeEach(async () => {
		dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

		await TestBed.configureTestingModule({
			declarations: [GoodsAddToPlaceDialogComponent],
			imports: [MatDialogModule],
			schemas: [NO_ERRORS_SCHEMA],
			providers: [
				{ provide: MatDialogRef, useValue: dialogRefSpy },
				{ provide: MAT_DIALOG_DATA, useValue: { places: [{ id: 1, name: 'Bar 1' }] } },
			],
		}).compileComponents();

		fixture = TestBed.createComponent(GoodsAddToPlaceDialogComponent);
		fixture.detectChanges();
	});

	function buttonByText(text: string): HTMLButtonElement {
		return fixture.debugElement.queryAll(By.css('button'))
			.map(d => d.nativeElement as HTMLButtonElement)
			.find(b => b.textContent?.trim() === text)!;
	}

	it('Cancel button closes the dialog with null (not an empty string)', () => {
		buttonByText('Zrušit').click();

		expect(dialogRefSpy.close).toHaveBeenCalledWith(null);
	});
});
