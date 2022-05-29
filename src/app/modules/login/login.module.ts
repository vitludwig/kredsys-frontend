import {NgModule} from '@angular/core';
import {LoginComponent} from './login.component';
import {SharedModule} from '../../shared.module';
import {MatButtonModule} from '@angular/material/button';
import {MatInputModule} from '@angular/material/input';
import {MatCardModule} from '@angular/material/card';
import {LoginRoutingModule} from './login-routing.module';
import {ReactiveFormsModule} from '@angular/forms';
import {CanAccessRoutePipe} from './services/auth/pipes/can-access-route/can-access-route.pipe';


@NgModule({
	declarations: [
		LoginComponent,
		CanAccessRoutePipe,
	],
	imports: [
		SharedModule,
		LoginRoutingModule,
		ReactiveFormsModule,
		MatCardModule,
		MatInputModule,
		MatButtonModule,
	],
	exports: [
		CanAccessRoutePipe,
	]
})
export class LoginModule {
}
