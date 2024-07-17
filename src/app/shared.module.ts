import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {BackButtonDirective} from './common/components/back-button/back-button.directive';
import {FormsModule} from '@angular/forms';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import {InputAutocompleteModule} from "./common/components/input-autocomplete/input-autocomplete.module";

@NgModule({
	declarations: [
		BackButtonDirective,
	],
	imports: [
		CommonModule,
		FormsModule,
		MatSnackBarModule,
		InputAutocompleteModule,
	],
	exports: [
		CommonModule,
		FormsModule,
		BackButtonDirective,
		MatSnackBarModule,
		InputAutocompleteModule,
	]
})
export class SharedModule {
}
