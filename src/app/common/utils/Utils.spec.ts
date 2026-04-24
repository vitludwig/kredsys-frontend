import {Utils} from './Utils';

describe('Utils', () => {

	describe('toHashMap', () => {
		it('should create an indexed object from array', () => {
			const data = [
				{id: '1', name: 'Alice'},
				{id: '2', name: 'Bob'},
			];
			const result = Utils.toHashMap(data, 'id');

			expect(result['1']).toEqual({id: '1', name: 'Alice'});
			expect(result['2']).toEqual({id: '2', name: 'Bob'});
		});

		it('should skip items where indexBy property is falsy', () => {
			const data = [
				{id: '1', name: 'Alice'},
				{id: '', name: 'NoId'},
				{id: null, name: 'NullId'},
			];
			const result = Utils.toHashMap(data, 'id');

			expect(Object.keys(result).length).toBe(1);
			expect(result['1']).toEqual({id: '1', name: 'Alice'});
		});

		it('should return empty object for empty array', () => {
			const result = Utils.toHashMap([], 'id');
			expect(result).toEqual({});
		});
	});

	describe('mapValues', () => {
		it('should copy matching properties from source to target', () => {
			const target = {name: '', age: 0};
			const source = {name: 'Alice', age: 30};
			const result = Utils.mapValues(target, source);

			expect(result.name).toBe('Alice');
			expect(result.age).toBe(30);
		});

		it('should not add extra properties from source', () => {
			const target = {name: ''} as any;
			const source = {name: 'Alice', extra: 'value'} as any;
			const result = Utils.mapValues(target, source);

			expect(result.name).toBe('Alice');
			expect((result as any).extra).toBeUndefined();
		});
	});

	describe('getContrastColor', () => {
		it('should return black for bright colors (#FFFFFF)', () => {
			expect(Utils.getContrastColor('#FFFFFF')).toBe('black');
		});

		it('should return white for dark colors (#000000)', () => {
			expect(Utils.getContrastColor('#000000')).toBe('white');
		});

		it('should return white for invalid input', () => {
			expect(Utils.getContrastColor('')).toBe('white');
			expect(Utils.getContrastColor('invalid')).toBe('white');
		});
	});
});
