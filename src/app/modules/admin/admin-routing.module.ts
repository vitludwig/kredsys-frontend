import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {ERoute} from '../../common/types/ERoute';
import {UserListComponent} from './modules/user-list/user-list.component';
import {PlaceListComponent} from './modules/place-list/place-list.component';
import {UserDetailComponent} from './modules/user-list/components/user-detail/user-detail.component';
import {PlaceDetailComponent} from './modules/place-list/components/place-detail/place-detail.component';
import {CardListComponent} from './modules/card-list/card-list.component';

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
	{
		path: ERoute.ADMIN_CARDS,
		children: [
			{
				path: '',
				component: CardListComponent,
				data: {
					name: 'Správa karet'
				}
			},
			// {
			// 	path: ':id/' + ERoute.EDIT,
			// 	component: CardDetailComponent,
			// 	data: {
			// 		name: 'Upravit kartu'
			// 	}
			// },
			// {
			// 	path: ERoute.NEW,
			// 	component: CardDetailComponent,
			// 	data: {
			// 		name: 'Přidat kartu'
			// 	}
			// }
		]
	},
];

@NgModule({
	imports: [RouterModule.forChild(routes)],
	exports: [RouterModule]
})
export class AdminRoutingModule {
}
