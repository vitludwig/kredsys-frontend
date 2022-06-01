import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {BackButtonDirective} from './common/components/back-button/back-button.directive';
import {FormsModule} from '@angular/forms';
import { CardLoaderComponent } from './common/components/card-loader/card-loader.component';
import {HTTP_INTERCEPTORS, HttpClientModule} from '@angular/common/http';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import {AuthInterceptor} from './common/interceptors/auth/auth.interceptor';

@NgModule({
	declarations: [
		BackButtonDirective,
		CardLoaderComponent,
	],
	imports: [
		CommonModule,
		FormsModule,
		HttpClientModule,
		MatSnackBarModule,
	],
	exports: [
		CommonModule,
		FormsModule,
		BackButtonDirective,
		CardLoaderComponent,
		HttpClientModule,
		MatSnackBarModule,
	],
	providers: [
		{provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true},
	],
})
export class SharedModule {
}
