import { IsIncludedPipe } from './is-included.pipe';

describe('IsIncludedPipe', () => {
	it('create an instance', () => {
		const pipe = new IsIncludedPipe();
		expect(pipe).toBeTruthy();
	});
});
