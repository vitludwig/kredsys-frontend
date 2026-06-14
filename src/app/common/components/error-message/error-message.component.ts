import {Component, input} from '@angular/core';
import {NgControl} from '@angular/forms';
import {TErrorMessages} from './types/TErrorMessages';

@Component({
	selector: 'app-error-message',
	imports: [
	],
	templateUrl: './error-message.component.html',
	styleUrl: './error-message.component.scss'
})
export class ErrorMessageComponent {
	public control = input.required<NgControl>();
	public errorMessages = input<Partial<TErrorMessages>, Partial<TErrorMessages>>({}, {transform: (value) => {
		return {
			required: 'Povinné pole',
			email: 'E-mail musí být ve formátu \'neco@neco.neco\'',
			minlength: 'Nesplněn minimální počet znaků',
			matching: 'Hesla se neshodují',
			conflict: 'Uživatel se zadaným členským id nebo e-mailem nebo čipem již existuje',
			...value,
		}
	}});
}
