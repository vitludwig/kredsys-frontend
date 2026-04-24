import {IsIncludedPipe} from './is-included.pipe';

describe('IsIncludedPipe', () => {
	let pipe: IsIncludedPipe<any>;

	beforeEach(() => {
		pipe = new IsIncludedPipe();
	});

	it('should return true when item is in array', () => {
		expect(pipe.transform(2, [1, 2, 3])).toBeTrue();
	});

	it('should return false when item is not in array', () => {
		expect(pipe.transform(4, [1, 2, 3])).toBeFalse();
	});

	it('should work with numbers', () => {
		expect(pipe.transform(42, [10, 20, 42, 50])).toBeTrue();
		expect(pipe.transform(99, [10, 20, 42, 50])).toBeFalse();
	});

	it('should work with strings', () => {
		const stringPipe = new IsIncludedPipe<string>();
		expect(stringPipe.transform('hello', ['hello', 'world'])).toBeTrue();
		expect(stringPipe.transform('foo', ['hello', 'world'])).toBeFalse();
	});
});
