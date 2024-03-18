import {Component, computed, input, Input, OnInit} from '@angular/core';
import {JsonPipe, NgIf} from '@angular/common';
import {NgControl} from '@angular/forms';
import {TErrorMessages} from './types/TErrorMessages';
import {MatInput} from '@angular/material/input';

@Component({
  selector: 'app-error-message',
  standalone: true,
	imports: [
		NgIf,
		JsonPipe
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
			conflict: 'Uživatel se zadaným členským id nebo e-mailem nebo kartou již existuje',
			...value,
		}
	}});
}
