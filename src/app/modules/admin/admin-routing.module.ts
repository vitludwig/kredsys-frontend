import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {ERoute} from '../../common/types/ERoute';
import {UserListComponent} from './modules/user-list/user-list.component';
import {PlaceListComponent} from './modules/place-list/place-list.component';
import {UserDetailComponent} from './modules/user-list/components/user-detail/user-detail.component';
import {PlaceDetailComponent} from './modules/place-list/components/place-detail/place-detail.component';
import {GoodsListComponent} from './modules/goods-list/goods-list.component';
import {GoodsDetailComponent} from './modules/goods-list/components/goods-detail/goods-detail.component';
import {CurrencyListComponent} from './modules/currency-list/currency-list.component';
import {CurrencyDetailComponent} from './modules/currency-list/components/currency-detail/currency-detail.component';
import {GoodsTypeDetailComponent} from './modules/goods-list/components/goods-type-detail/goods-type-detail.component';

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
		path: ERoute.ADMIN_GOODS,
		children: [
			{
				path: '',
				component: GoodsListComponent,
				data: {
					name: 'Správa zboží'
				}
			},
			{
				path: ':id/' + ERoute.EDIT,
				component: GoodsDetailComponent,
				data: {
					name: 'Upravit zboží'
				}
			},
			{
				path: ERoute.NEW,
				component: GoodsDetailComponent,
				data: {
					name: 'Přidat zboží'
				}
			},
			{
				path: ERoute.ADMIN_GOODS_TYPES,
				children: [
					{
						path: ':id/' + ERoute.EDIT,
						component: GoodsTypeDetailComponent,
						data: {
							name: 'Upravit zboží'
						}
					},
					{
						path: ERoute.NEW,
						component: GoodsTypeDetailComponent,
						data: {
							name: 'Přidat zboží'
						}
					}
				]
			}
		]
	},
	{
		path: ERoute.ADMIN_CURRENCIES,
		children: [
			{
				path: '',
				component: CurrencyListComponent,
				data: {
					name: 'Správa měn'
				}
			},
			{
				path: ':id/' + ERoute.EDIT,
				component: CurrencyDetailComponent,
				data: {
					name: 'Upravit měnu'
				}
			},
			{
				path: ERoute.NEW,
				component: CurrencyDetailComponent,
				data: {
					name: 'Přidat měnu'
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
