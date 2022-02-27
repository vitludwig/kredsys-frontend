import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {ERoute} from '../../common/types/ERoute';
import {UserListComponent} from './modules/user-list/user-list.component';
import {SaleListComponent} from './modules/sale-list/sale-list.component';

const routes: Routes = [
	{path: ERoute.ADMIN_USERS, component: UserListComponent},
	{path: ERoute.ADMIN_SALES, component: SaleListComponent},
];

@NgModule({
	imports: [RouterModule.forChild(routes)],
	exports: [RouterModule]
})
export class AdminRoutingModule {
}
