import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StornoDialogComponent } from './storno-dialog.component';

describe('StornoDialogComponent', () => {
	let component: StornoDialogComponent;
	let fixture: ComponentFixture<StornoDialogComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [ StornoDialogComponent ]
		})
			.compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(StornoDialogComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
