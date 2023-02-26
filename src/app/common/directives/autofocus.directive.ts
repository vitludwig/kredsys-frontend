import {AfterViewInit, ChangeDetectorRef, Directive, ElementRef} from '@angular/core';

/**
 * Angular cdkFocusInitial is only for trapped focus regions and native autofocus doesn't work inside most mat-form-field
 */
@Directive({
	selector: '[appAutofocus]',
	standalone: true
})
export class AutofocusDirective implements AfterViewInit {

	constructor(private elem: ElementRef, private cd: ChangeDetectorRef) {
	}

	public ngAfterViewInit(): void {
		setTimeout(() => {
			this.elem.nativeElement.focus();
			this.cd.detectChanges();
		}, 100);
	}

}
