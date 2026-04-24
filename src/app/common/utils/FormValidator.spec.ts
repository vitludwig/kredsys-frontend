import {FormControl, FormGroup} from '@angular/forms';
import FormValidator from './FormValidator';

describe('FormValidator', () => {

	function createFormGroup(value1: string, value2: string): FormGroup {
		return new FormGroup({
			password: new FormControl(value1),
			confirmPassword: new FormControl(value2),
		}, {validators: FormValidator.match('password', 'confirmPassword')});
	}

	it('should return null when values match', () => {
		const group = createFormGroup('abc', 'abc');
		expect(group.errors).toBeNull();
	});

	it('should return {matching: true} when values do not match', () => {
		const group = createFormGroup('abc', 'xyz');
		expect(group.errors).toEqual({matching: true});
	});

	it('should set error on checkControl when values differ', () => {
		const group = createFormGroup('abc', 'xyz');
		const confirmControl = group.get('confirmPassword');
		expect(confirmControl?.errors).toEqual({matching: true});
	});

	it('should not override existing errors on checkControl', () => {
		const group = new FormGroup({
			password: new FormControl('abc'),
			confirmPassword: new FormControl('xyz'),
		}, {validators: FormValidator.match('password', 'confirmPassword')});

		// Set a pre-existing error on confirmPassword before validation runs
		group.get('confirmPassword')?.setErrors({required: true});
		group.updateValueAndValidity();

		// The existing 'required' error should remain, validator returns null
		const errors = group.get('confirmPassword')?.errors;
		expect(errors?.['required']).toBe(true);
	});
});
