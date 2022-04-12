import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {BackButtonDirective} from './common/components/back-button/back-button.directive';
import {FormsModule} from '@angular/forms';
import { CardLoaderComponent } from './common/components/card-loader/card-loader.component';
import {HttpClientModule} from '@angular/common/http';


@NgModule({
	declarations: [
		BackButtonDirective,
		CardLoaderComponent,
	],
	imports: [
		CommonModule,
		FormsModule,
		HttpClientModule,
	],
	exports: [
		CommonModule,
		FormsModule,
		BackButtonDirective,
		CardLoaderComponent,
		HttpClientModule,
	]
})
export class SharedModule {
}
