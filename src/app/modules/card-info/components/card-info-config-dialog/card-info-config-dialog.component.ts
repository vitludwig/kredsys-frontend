import {Component, inject, ViewChild} from '@angular/core';
import {AutofocusDirective} from "../../../../common/directives/autofocus.directive";
import {MatButtonModule} from "@angular/material/button";
import {MAT_DIALOG_DATA, MatDialogModule, MatDialogRef} from "@angular/material/dialog";
import {ICardInfoConfig} from "../../types/ICardInfoConfig";
import {MatIconModule} from "@angular/material/icon";
import {MatAutocompleteModule} from "@angular/material/autocomplete";
import {MatChipsModule} from "@angular/material/chips";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatOptionModule} from "@angular/material/core";
import {MatButtonToggleModule} from "@angular/material/button-toggle";
import {FormsModule, NgForm} from "@angular/forms";
import {MatSlideToggleModule} from "@angular/material/slide-toggle";
import {MatInputModule} from "@angular/material/input";

@Component({
	selector: 'app-card-info-config-dialog',
	imports: [
		AutofocusDirective,
		MatButtonModule,
		MatDialogModule,
		MatIconModule,
		MatAutocompleteModule,
		MatChipsModule,
		MatFormFieldModule,
		MatOptionModule,
		MatButtonToggleModule,
		FormsModule,
		MatSlideToggleModule,
		MatInputModule,
	],
	templateUrl: './card-info-config-dialog.component.html',
	styleUrl: './card-info-config-dialog.component.scss'
})
export class CardInfoConfigDialogComponent {
	protected dialogRef = inject(MatDialogRef<CardInfoConfigDialogComponent>)
	protected config: ICardInfoConfig = inject(MAT_DIALOG_DATA);

  @ViewChild('configForm')
	protected form: NgForm;

  public submit(): void {
  	if(!this.form.invalid) {
  		this.dialogRef.close(this.config);
  	}
  }
}
