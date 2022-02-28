import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {ERoute} from '../../common/types/ERoute';
import {UserListComponent} from './modules/user-list/user-list.component';
import {PlaceListComponent} from './modules/place-list/place-list.component';

const routes: Routes = [
	{
		path: ERoute.ADMIN_USERS,
		component: UserListComponent,
		data: {
			name: 'Správa uživatelů'
		}
	},
	{
		path: ERoute.ADMIN_PLACES,
		component: PlaceListComponent,
		data: {
			name: 'Správa míst'
		}
	},
];

@NgModule({
	imports: [RouterModule.forChild(routes)],
	exports: [RouterModule]
})
export class AdminRoutingModule {
}
