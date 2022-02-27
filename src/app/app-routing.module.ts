import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {SaleComponent} from './modules/sale/sale.component';
import {ERoute} from './common/types/ERoute';

const routes: Routes = [
	{
		path: ERoute.SALE,
		loadChildren: () => import('./modules/sale/sale.module').then((m) => m.SaleModule)
	},
	{
		path: ERoute.ADMIN,
		loadChildren: () => import('./modules/admin/admin.module').then((m) => m.AdminModule)
	},
	{path: '', component: SaleComponent}
];

@NgModule({
	imports: [RouterModule.forRoot(routes)],
	exports: [RouterModule]
})
export class AppRoutingModule {
}
