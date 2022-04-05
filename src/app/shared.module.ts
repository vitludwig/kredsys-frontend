import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {BackButtonDirective} from './common/components/back-button/back-button.directive';
import {FormsModule} from '@angular/forms';


@NgModule({
	declarations: [
		BackButtonDirective,
	],
	imports: [
		CommonModule,
		FormsModule,
	],
	exports: [
		CommonModule,
		FormsModule,
		BackButtonDirective,
	]
})
export class SharedModule {
}
