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
import {ChargeComponent} from './modules/charge/charge.component';
import {TransactionsComponent} from './modules/transactions/transactions.component';
import {ChangePasswordComponent} from './modules/user-list/components/change-password/change-password.component';
import {unsavedChangesGuard} from "../../common/utils/unsaved-changes.guard";
import {placeGuard} from "../../common/utils/place.guard";

const routes: Routes = [
	{
		path: ERoute.ADMIN_USERS,
		children: [
			{
				path: '',
				component: UserListComponent,
				data: {
					name: 'Správa uživatelů',
				},
			},
			{
				path: ':id/' + ERoute.EDIT,
				component: UserDetailComponent,
				data: {
					name: 'Upravit uživatele',
				},
			},
			{
				path: ':id/' + ERoute.ADMIN_CHANGE_PASSWORD,
				component: ChangePasswordComponent,
				data: {
					name: 'Změnit heslo',
				},
			},
			{
				path: ERoute.NEW,
				component: UserDetailComponent,
				data: {
					name: 'Přidat uživatele',
				},
			},
		],
	},
	{
		path: ERoute.ADMIN_PLACES,
		children: [
			{
				path: '',
				component: PlaceListComponent,
				data: {
					name: 'Správa míst',
				},
			},
			{
				path: ':id/' + ERoute.EDIT,
				component: PlaceDetailComponent,
				data: {
					name: 'Upravit místo',
				},
        canDeactivate: [unsavedChangesGuard],
			},
			{
				path: ERoute.NEW,
				component: PlaceDetailComponent,
				data: {
					name: 'Přidat místo',
				},
        canDeactivate: [unsavedChangesGuard],
			},
		],
	},
	{
		path: ERoute.ADMIN_GOODS,
		children: [
			{
				path: '',
				component: GoodsListComponent,
				data: {
					name: 'Správa zboží',
				},
			},
			{
				path: ':id/' + ERoute.EDIT,
				component: GoodsDetailComponent,
				data: {
					name: 'Upravit zboží',
				},
			},
			{
				path: ERoute.NEW,
				component: GoodsDetailComponent,
				data: {
					name: 'Přidat zboží',
				},
			},
			{
				path: ERoute.ADMIN_GOODS_TYPES,
				children: [
					{
						path: ':id/' + ERoute.EDIT,
						component: GoodsTypeDetailComponent,
						data: {
							name: 'Upravit zboží',
						},
					},
					{
						path: ERoute.NEW,
						component: GoodsTypeDetailComponent,
						data: {
							name: 'Přidat zboží',
						},
					},
				],
			},
		],
	},
	{
		path: ERoute.ADMIN_CURRENCIES,
		children: [
			{
				path: '',
				component: CurrencyListComponent,
				data: {
					name: 'Správa měn',
				},
			},
			{
				path: ':id/' + ERoute.EDIT,
				component: CurrencyDetailComponent,
				data: {
					name: 'Upravit měnu',
				},
			},
			{
				path: ERoute.NEW,
				component: CurrencyDetailComponent,
				data: {
					name: 'Přidat měnu',
				},
			},
		],
	},
  {
    path: ERoute.ADMIN_GROUPS,
    children: [
      {
        path: '',
        loadComponent: () =>
          import('../groups/components/groups-list/groups-list.component').then(
            (m) => m.GroupsListComponent
          ),
        data: {
          name: 'Správa skupin',
        },
      },
      {
        path: ERoute.NEW,
        loadComponent: () =>
          import(
            '../groups/components/group-detail/group-detail.component'
          ).then((m) => m.GroupDetailComponent),
        data: {
          name: 'Nová skupina',
        },
      },
      {
        path: ':id/' + ERoute.EDIT,
        loadComponent: () =>
          import(
            '../groups/components/group-detail/group-detail.component'
          ).then((m) => m.GroupDetailComponent),
        data: {
          name: 'Upravit skupinu',
        },
      },
      {
        path: ERoute.ADMIN_STATISTICS,
        loadComponent: () =>
          import(
            '../groups/components/groups-statistics/groups-statistics.component'
            ).then((m) => m.GroupsStatisticsComponent),
        data: {
          name: 'Statistiky skupin',
        },
      },
    ],
  },
	{
		path: ERoute.ADMIN_TRANSACTIONS,
		children: [
			{
				path: '',
				component: TransactionsComponent,
				data: {
					name: 'Správa transakcí',
				},
			},
			{
				path: ':id',
				component: TransactionsComponent,
				data: {
					name: 'Správa transakcí',
				},
			},
		],
	},
	{
		path: ERoute.ADMIN_CHARGE,
		component: ChargeComponent,
		canActivate: [placeGuard],
		data: {
			name: 'Nabít peňauze',
		},
	},
	{
		path: ERoute.ADMIN_USER_INFO,
		loadComponent: () =>
			import('./modules/user-info/user-info.component').then(m => m.UserInfoComponent),
		canActivate: [placeGuard],
		data: { name: 'Uživatelský dashboard' },
	},
	{
		path: ERoute.ADMIN_SETTINGS,
		loadComponent: () =>
			import('./modules/settings/charge-items.component').then(
				(m) => m.ChargeItemsComponent
			),
		data: {
			name: 'Nastavení',
		},
	},

];

@NgModule({
	imports: [RouterModule.forChild(routes)],
	exports: [RouterModule],
})
export class AdminRoutingModule {
}
