import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlaceTransactionsListComponent } from './place-transactions-list.component';

describe('PlaceTransactionsListComponent', () => {
	let component: PlaceTransactionsListComponent;
	let fixture: ComponentFixture<PlaceTransactionsListComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [ PlaceTransactionsListComponent ]
		})
			.compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(PlaceTransactionsListComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
