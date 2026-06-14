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

	// Fresh fixture with inputs set before the first detectChanges — avoids the
	// MatPaginator ExpressionChangedAfterChecked that a second CD cycle triggers.
	it('hides deposit/withdraw totals by default', () => {
		const f = TestBed.createComponent(StatisticsTableComponent);
		f.componentInstance.data = {goods: [], currencyId: 1, sumGoods: 0, sumPrice: 0, sumDeposit: 10, sumWithdraw: 5, sumTransactions: 0} as any;
		f.detectChanges();
		expect(f.nativeElement.querySelector('[data-testid="stats-sum-deposit"]')).toBeNull();
		expect(f.nativeElement.querySelector('[data-testid="stats-sum-withdraw"]')).toBeNull();
	});

	it('shows deposit/withdraw totals when showCashFlow is true', () => {
		const f = TestBed.createComponent(StatisticsTableComponent);
		f.componentInstance.showCashFlow = true;
		f.componentInstance.data = {goods: [], currencyId: 1, sumGoods: 0, sumPrice: 0, sumDeposit: 123, sumWithdraw: 45, sumTransactions: 0} as any;
		f.detectChanges();
		const deposit = f.nativeElement.querySelector('[data-testid="stats-sum-deposit"]');
		const withdraw = f.nativeElement.querySelector('[data-testid="stats-sum-withdraw"]');
		expect(deposit?.textContent).toContain('123');
		expect(withdraw?.textContent).toContain('45');
	});
});
