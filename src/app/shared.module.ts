import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {BackButtonDirective} from './common/components/back-button/back-button.directive';


@NgModule({
	declarations: [
		BackButtonDirective,
	],
	imports: [
		CommonModule
	],
	exports: [
		CommonModule,
		BackButtonDirective,
	]
})
export class SharedModule {
}
