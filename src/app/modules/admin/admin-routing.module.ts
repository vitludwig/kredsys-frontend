import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {ERoute} from '../../common/types/ERoute';
import {UserListComponent} from './modules/user-list/user-list.component';
import {PlaceListComponent} from './modules/place-list/place-list.component';
import {UserDetailComponent} from './modules/user-list/components/user-detail/user-detail.component';
import {PlaceDetailComponent} from './modules/place-list/components/place-detail/place-detail.component';

const routes: Routes = [
	{
		path: ERoute.ADMIN_USERS,
		children: [
			{
				path: '',
				component: UserListComponent,
				data: {
					name: 'Správa uživatelů'
				}
			},
			{
				path: ':id/' + ERoute.EDIT,
				component: UserDetailComponent,
				data: {
					name: 'Upravit uživatele'
				}
			},
			{
				path: ERoute.NEW,
				component: UserDetailComponent,
				data: {
					name: 'Přidat uživatele'
				}
			}
		]
	},
	{
		path: ERoute.ADMIN_PLACES,
		children: [
			{
				path: '',
				component: PlaceListComponent,
				data: {
					name: 'Správa míst'
				}
			},
			{
				path: ':id/' + ERoute.EDIT,
				component: PlaceDetailComponent,
				data: {
					name: 'Upravit místo'
				}
			},
			{
				path: ERoute.NEW,
				component: PlaceDetailComponent,
				data: {
					name: 'Přidat místo'
				}
			}
		]
	},
];

@NgModule({
	imports: [RouterModule.forChild(routes)],
	exports: [RouterModule]
})
export class AdminRoutingModule {
}
