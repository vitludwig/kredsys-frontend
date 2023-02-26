import {Directive, ElementRef, OnInit} from '@angular/core';

/**
 * Angular cdkFocusInitial is buggy and native autofocus doesn't work inside most mat-form-field
 */
@Directive({
	selector: '[appAutofocus]',
	standalone: true
})
export class AutofocusDirective implements OnInit {

	constructor(private elem: ElementRef) {
	}

	public ngOnInit(): void {
		setTimeout(() => this.elem.nativeElement.focus());
	}

}
