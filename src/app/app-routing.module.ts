import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {ERoute} from './common/types/ERoute';
import {AuthGuard} from './common/utils/auth.guard';
import {PlaceGuard} from './common/utils/place.guard';

const routes: Routes = [
	{
		path: '',
		redirectTo: ERoute.SALE,
		pathMatch: 'full',
	},
	{
		path: '',
		canActivate: [AuthGuard],
		children: [
			{
				path: ERoute.SALE,
				canActivate: [PlaceGuard],
				loadChildren: () => import('./modules/sale/sale.module').then((m) => m.SaleModule),
			},
			{
				path: ERoute.ADMIN,
				loadChildren: () => import('./modules/admin/admin.module').then((m) => m.AdminModule),
			},
			{
				path: ERoute.PLACE_SELECT,
				loadChildren: () => import('./modules/place-select/place-select.module').then((m) => m.PlaceSelectModule),
			},
			{
				path: ERoute.CHECK_IN,
				loadChildren: () => import('./modules/check-in/check-in.module').then((m) => m.CheckInModule),
			},
		],
	},
	{
		path: ERoute.LOGIN,
		loadChildren: () => import('./modules/login/login.module').then((m) => m.LoginModule),
	},

];

@NgModule({
	imports: [RouterModule.forRoot(routes)],
	exports: [RouterModule],
})
export class AppRoutingModule {
}
