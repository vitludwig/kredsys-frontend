import {StringUtils} from './StringUtils';

describe('StringUtils', () => {

	describe('removeAccents', () => {
		it('should remove Czech diacritics', () => {
			expect(StringUtils.removeAccents('č')).toBe('c');
			expect(StringUtils.removeAccents('ř')).toBe('r');
			expect(StringUtils.removeAccents('ž')).toBe('z');
			expect(StringUtils.removeAccents('š')).toBe('s');
			expect(StringUtils.removeAccents('ě')).toBe('e');
			expect(StringUtils.removeAccents('ů')).toBe('u');
			expect(StringUtils.removeAccents('ď')).toBe('d');
			expect(StringUtils.removeAccents('ť')).toBe('t');
			expect(StringUtils.removeAccents('ň')).toBe('n');
		});

		it('should handle a full Czech sentence', () => {
			const input = 'Příliš žluťoučký kůň úpěl ďábelské ódy.';
			const expected = 'Prilis zlutoucky kun upel dabelske ody.';
			expect(StringUtils.removeAccents(input)).toBe(expected);
		});

		it('should return empty string for null', () => {
			expect(StringUtils.removeAccents(null)).toBe('');
		});

		it('should return empty string for undefined', () => {
			expect(StringUtils.removeAccents(undefined)).toBe('');
		});

		it('should return empty string for empty string', () => {
			expect(StringUtils.removeAccents('')).toBe('');
		});

		it('should preserve strings without accents', () => {
			expect(StringUtils.removeAccents('hello world')).toBe('hello world');
		});
	});
});
