import {ComponentFixture, TestBed} from '@angular/core/testing';

import {TransactionsListComponent} from './transactions-list.component';

describe('TransactionListComponent', () => {
	let component: TransactionsListComponent;
	let fixture: ComponentFixture<TransactionsListComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [TransactionsListComponent]
		})
			.compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(TransactionsListComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
