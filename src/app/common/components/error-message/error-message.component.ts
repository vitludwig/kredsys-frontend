import {Component, Input, OnInit} from '@angular/core';
import {NgIf} from '@angular/common';
import {NgControl} from '@angular/forms';
import {TErrorMessages} from './types/TErrorMessages';

@Component({
  selector: 'app-error-message',
  standalone: true,
	imports: [
		NgIf
	],
  templateUrl: './error-message.component.html',
  styleUrl: './error-message.component.scss'
})
export class ErrorMessageComponent implements OnInit {
	@Input({required: true})
	public control: NgControl;

	@Input()
	public errorMessages: Partial<TErrorMessages> = {};

	public ngOnInit(): void {
		this.errorMessages = {
			required: 'Povinné pole',
			email: 'E-mail musí být ve formátu \'neco@neco.neco\'',
			minlength: `Minimální délka je ${this.control.errors?.['minlength']?.['requiredLength']}`,
			matching: 'Hesla se neshodují',
			conflict: 'Uživatel se zadaným členským id nebo e-mailem nebo kartou již existuje',
			...this.errorMessages
		}
	}
}
