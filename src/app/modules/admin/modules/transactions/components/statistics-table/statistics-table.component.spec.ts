import {ComponentFixture, TestBed} from '@angular/core/testing';
import {StatisticsTableComponent} from './statistics-table.component';
import {NO_ERRORS_SCHEMA} from '@angular/core';

describe('StatisticsTableComponent', () => {
	let component: StatisticsTableComponent;
	let fixture: ComponentFixture<StatisticsTableComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			declarations: [StatisticsTableComponent],
			schemas: [NO_ERRORS_SCHEMA],
		}).compileComponents();

		fixture = TestBed.createComponent(StatisticsTableComponent);
		component = fixture.componentInstance;
		// Provide required @Input data before detectChanges triggers ngOnInit
		component.data = {goods: [], currencyId: 1, sumGoods: 0, sumPrice: 0, sumTransactions: 0} as any;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
