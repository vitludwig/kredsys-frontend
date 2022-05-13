import {NgModule} from '@angular/core';
import {LoginComponent} from './login.component';
import {SharedModule} from '../../shared.module';
import {MatButtonModule} from '@angular/material/button';
import {MatInputModule} from '@angular/material/input';
import {MatCardModule} from '@angular/material/card';
import {LoginRoutingModule} from './login-routing.module';
import {ReactiveFormsModule} from '@angular/forms';


@NgModule({
	declarations: [
		LoginComponent,
	],
	imports: [
		SharedModule,
		LoginRoutingModule,
		ReactiveFormsModule,
		MatCardModule,
		MatInputModule,
		MatButtonModule,
	]
})
export class LoginModule {
}
