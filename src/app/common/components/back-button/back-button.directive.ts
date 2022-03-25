import {Directive, HostListener} from '@angular/core';
import {Location} from '@angular/common';

@Directive({
	selector: '[backButton]'
})
export class BackButtonDirective {

	constructor(
		protected location: Location
	) {
	}

	@HostListener('click')
	public onClick(): void {
		this.location.back();
	}

}
