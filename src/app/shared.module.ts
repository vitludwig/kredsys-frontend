import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {BackButtonDirective} from './common/components/back-button/back-button.directive';
import {FormsModule} from '@angular/forms';
import { CardLoaderComponent } from './common/components/card-loader/card-loader.component';


@NgModule({
	declarations: [
		BackButtonDirective,
		CardLoaderComponent,
	],
	imports: [
		CommonModule,
		FormsModule,
	],
	exports: [
		CommonModule,
		FormsModule,
		BackButtonDirective,
		CardLoaderComponent,
	]
})
export class SharedModule {
}
