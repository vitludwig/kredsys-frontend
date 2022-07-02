import {NgModule} from '@angular/core';
import { CommonModule } from '@angular/common';
import {InputAutocompleteComponent} from "./input-autocomplete.component";
import {MatInputModule} from "@angular/material/input";
import {MatAutocompleteModule} from "@angular/material/autocomplete";
import {ReactiveFormsModule} from "@angular/forms";
import {MatButtonModule} from "@angular/material/button";

@NgModule({
	declarations: [
		InputAutocompleteComponent
	],
	imports: [
		CommonModule,
		MatAutocompleteModule,
		ReactiveFormsModule,
		MatButtonModule,
		MatInputModule
	],
	exports: [
		InputAutocompleteComponent
	]
})
export class InputAutocompleteModule { }
