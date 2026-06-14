import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {ERoute} from './common/types/ERoute';
import {authGuard} from './common/utils/auth.guard';
import {placeGuard} from './common/utils/place.guard';

const routes: Routes = [
	{
		path: '',
		redirectTo: ERoute.SALE,
		pathMatch: 'full',
	},
	{
		path: '',
		canActivate: [authGuard],
		children: [
			{
				path: ERoute.SALE,
				canActivate: [placeGuard],
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
			{
				path: ERoute.CARD_INFO,
				loadChildren: () => import('./modules/card-info/card-info.module').then((m) => m.CardInfoModule),
			},
		],
	},
	{
		path: ERoute.LOGIN,
		loadChildren: () => import('./modules/login/login.module').then((m) => m.LoginModule),
	},
	{
		path: ERoute.PUBLIC,
		loadChildren: () => import('./modules/public/public.routes')
			.then(m => m.routes)
	},
];

@NgModule({
	imports: [RouterModule.forRoot(routes)],
	exports: [RouterModule],
})
export class AppRoutingModule {
}
