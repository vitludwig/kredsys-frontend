import {FilterSaleItemsPipe} from './filter-sale-items.pipe';
import {ISaleItem} from '../../../types/ISaleItem';

describe('FilterSaleItemsPipe', () => {
	let pipe: FilterSaleItemsPipe;

	const items: ISaleItem[] = [
		{id: 1, name: 'Beer', price: 50, icon: 'beer', type: 1},
		{id: 2, name: 'Wine', price: 80, icon: 'wine', type: 2},
		{id: 3, name: 'Juice', price: 30, icon: 'juice', type: 1},
		{id: 4, name: 'Water', price: 20, icon: 'water', type: 3},
	];

	beforeEach(() => {
		pipe = new FilterSaleItemsPipe();
	});

	it('should return all items when filters is empty array', () => {
		const result = pipe.transform(items, []);
		expect(result.length).toBe(4);
		expect(result).toEqual(items);
	});

	it('should filter items by type', () => {
		const result = pipe.transform(items, [1]);
		expect(result.length).toBe(2);
		expect(result.map((i) => i.id)).toEqual([1, 3]);
	});

	it('should return empty array when no items match', () => {
		const result = pipe.transform(items, [99]);
		expect(result.length).toBe(0);
	});

	it('should handle items with null type', () => {
		const itemsWithNull: ISaleItem[] = [
			...items,
			{id: 5, name: 'Mystery', price: 10, icon: 'question', type: null},
		];
		const result = pipe.transform(itemsWithNull, [1]);
		expect(result.length).toBe(2);
		expect(result.every((i) => i.type === 1)).toBeTrue();
	});
});
