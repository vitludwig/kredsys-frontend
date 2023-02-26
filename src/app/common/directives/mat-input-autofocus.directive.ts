import {AfterViewInit, Directive, ElementRef, OnInit} from '@angular/core';
import {MatInput} from '@angular/material/input';

/**
 * Angular cdkFocusInitial is buggy and native autofocus doesn't work inside most mat-form-field
 */
@Directive({
	selector: '[appAutofocus]',
	standalone: true
})
export class AutofocusDirective implements AfterViewInit {

	constructor(private elem: ElementRef) {
	}

	public ngAfterViewInit(): void {
		this.elem.nativeElement.focus();
	}

}
