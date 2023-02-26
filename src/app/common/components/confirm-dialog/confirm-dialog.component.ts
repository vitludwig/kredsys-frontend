import {Component, Inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MAT_DIALOG_DATA, MatDialogModule} from '@angular/material/dialog';
import {MatButtonModule} from '@angular/material/button';
import {AutofocusDirective} from '../../directives/autofocus.directive';

@Component({
	selector: 'app-confirm-dialog',
	standalone: true,
	imports: [CommonModule, MatDialogModule, MatButtonModule, AutofocusDirective],
	templateUrl: './confirm-dialog.component.html',
	styleUrls: ['./confirm-dialog.component.scss']
})
export class ConfirmDialogComponent {

	constructor(
		@Inject(MAT_DIALOG_DATA)
		public data: { title: string; text?: string },
	) {
	}
}
