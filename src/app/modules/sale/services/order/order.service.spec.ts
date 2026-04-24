import { TestBed } from '@angular/core/testing';
import { OrderService } from './order.service';
import { ISaleItem } from '../../types/ISaleItem';
import { Subscription } from 'rxjs';
import { take } from 'rxjs/operators';

describe('OrderService', () => {
	let service: OrderService;
	let subscriptions: Subscription[];

	const mockItem: ISaleItem = { id: 1, name: 'Beer', price: 50, icon: 'beer', type: 1 };
	const mockItem2: ISaleItem = { id: 2, name: 'Wine', price: 80, icon: 'wine', type: 2 };

	beforeEach(() => {
		TestBed.configureTestingModule({});
		service = TestBed.inject(OrderService);
		subscriptions = [];
	});

	afterEach(() => {
		subscriptions.forEach((s) => s.unsubscribe());
	});

	it('should be created', () => {
		expect(service).toBeTruthy();
	});

	describe('addItem', () => {
		it('should add a new item with count 1', () => {
			service.addItem(mockItem);

			expect(service.items.length).toBe(1);
			expect(service.items[0].item).toBe(mockItem);
			expect(service.items[0].count).toBe(1);
		});

		it('should increment count for an existing item', () => {
			service.addItem(mockItem);
			service.addItem(mockItem);

			expect(service.items.length).toBe(1);
			expect(service.items[0].count).toBe(2);
		});
	});

	describe('editItem', () => {
		it('should change the count of an existing item', () => {
			service.addItem(mockItem);
			service.editItem(mockItem, 5);

			expect(service.items[0].count).toBe(5);
			expect(service.total).toBe(250);
		});

		it('should be a no-op when item does not exist', () => {
			service.addItem(mockItem);
			const nonExistentItem: ISaleItem = { id: 999, name: 'Ghost', price: 0, icon: 'ghost', type: 1 };

			service.editItem(nonExistentItem, 10);

			expect(service.items.length).toBe(1);
			expect(service.items[0].count).toBe(1);
			expect(service.total).toBe(50);
		});
	});

	describe('removeItem', () => {
		it('should remove an item by id', () => {
			service.addItem(mockItem);
			service.addItem(mockItem2);
			service.removeItem(1);

			expect(service.items.length).toBe(1);
			expect(service.items[0].item.id).toBe(2);
		});

		it('should be a no-op when removing non-existent id', () => {
			service.addItem(mockItem);
			service.removeItem(999);

			expect(service.items.length).toBe(1);
			expect(service.items[0].item).toBe(mockItem);
			expect(service.total).toBe(50);
		});
	});

	describe('clearOrder', () => {
		it('should reset items and total', () => {
			service.addItem(mockItem);
			service.addItem(mockItem2);
			service.clearOrder();

			expect(service.items).toEqual([]);
			expect(service.total).toBe(0);
		});
	});

	describe('refreshTotal', () => {
		it('should calculate the sum of count * price for all items', () => {
			service.addItem(mockItem);
			service.addItem(mockItem2);
			service.addItem(mockItem); // mockItem count = 2

			expect(service.total).toBe(2 * 50 + 80);
		});

		it('should return 0 for empty items', () => {
			service.refreshTotal();
			expect(service.total).toBe(0);
		});
	});

	describe('balance', () => {
		it('should get and set balance via BehaviorSubject', () => {
			expect(service.balance).toBe(0);

			service.balance = 100;
			expect(service.balance).toBe(100);
		});

		it('should emit balance changes on balance$', () => {
			const emitted: number[] = [];
			const sub = service.balance$.pipe(take(2)).subscribe((val) => {
				emitted.push(val);
			});
			subscriptions.push(sub);

			service.balance = 42;

			expect(emitted).toEqual([0, 42]);
		});
	});

	describe('orderChange$', () => {
		it('should emit updated items when addItem is called', () => {
			const emissions: any[] = [];
			const sub = service.orderChange$.pipe(take(2)).subscribe((items) => {
				emissions.push([...items]);
			});
			subscriptions.push(sub);

			service.addItem(mockItem);

			expect(emissions.length).toBe(2);
			expect(emissions[1].length).toBe(1);
			expect(emissions[1][0].item).toBe(mockItem);
		});

		it('should emit updated items when removeItem is called', () => {
			service.addItem(mockItem);

			const emissions: any[] = [];
			const sub = service.orderChange$.pipe(take(2)).subscribe((items) => {
				emissions.push([...items]);
			});
			subscriptions.push(sub);

			service.removeItem(mockItem.id);

			expect(emissions.length).toBe(2);
			expect(emissions[1].length).toBe(0);
		});

		it('should emit updated items when clearOrder is called', () => {
			service.addItem(mockItem);

			const emissions: any[] = [];
			const sub = service.orderChange$.pipe(take(2)).subscribe((items) => {
				emissions.push([...items]);
			});
			subscriptions.push(sub);

			service.clearOrder();

			expect(emissions.length).toBe(2);
			expect(emissions[1]).toEqual([]);
		});
	});
});
