import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {ERoute} from '../../common/types/ERoute';
import {LoginComponent} from './login.component';

const routes: Routes = [
	{
		path: ERoute.LOGIN_SIGN_IN,
		component: LoginComponent,
		data: {
			name: 'Přihlášení'
		}
	},
	{
		path: '**',
		redirectTo: ERoute.LOGIN_SIGN_IN,
		pathMatch: 'full'
	},
];

@NgModule({
	imports: [RouterModule.forChild(routes)],
	exports: [RouterModule]
})
export class LoginRoutingModule {
}
