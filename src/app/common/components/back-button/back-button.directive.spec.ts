import {BackButtonDirective} from './back-button.directive';
import {Location} from '@angular/common';

describe('BackButtonDirective', () => {
	it('should create an instance', () => {
		const mockLocation = {} as Location;
		const directive = new BackButtonDirective(mockLocation);
		expect(directive).toBeTruthy();
	});
});
