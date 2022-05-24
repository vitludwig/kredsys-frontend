import {NgModule} from '@angular/core';
import {AdminComponent} from './admin.component';
import {UserListModule} from './modules/user-list/user-list.module';
import {AdminRoutingModule} from './admin-routing.module';
import {PlaceListModule} from './modules/place-list/place-list.module';
import {SharedModule} from '../../shared.module';
import {GoodsListModule} from './modules/goods-list/goods-list.module';
import {CurrencyListModule} from './modules/currency-list/currency-list.module';
import {ChargeModule} from './modules/charge/charge.module';


@NgModule({
	declarations: [
		AdminComponent,
	],
	imports: [
		SharedModule,
		AdminRoutingModule,
		UserListModule,
		PlaceListModule,
		GoodsListModule,
		CurrencyListModule,
		ChargeModule,
	],
})
export class AdminModule {
}
