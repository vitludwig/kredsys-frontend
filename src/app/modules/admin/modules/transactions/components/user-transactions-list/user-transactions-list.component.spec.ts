import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserTransactionsListComponent } from './user-transactions-list.component';

describe('UserTransactionsListComponent', () => {
	let component: UserTransactionsListComponent;
	let fixture: ComponentFixture<UserTransactionsListComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [ UserTransactionsListComponent ]
		})
			.compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(UserTransactionsListComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
