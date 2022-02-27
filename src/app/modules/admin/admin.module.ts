import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {AdminComponent} from './admin.component';
import {UserListModule} from './modules/user-list/user-list.module';
import {SaleListModule} from './modules/sale-list/sale-list.module';
import {MatTableModule} from '@angular/material/table';
import {AdminRoutingModule} from './admin-routing.module';


@NgModule({
	declarations: [
		AdminComponent
	],
	imports: [
		CommonModule,
		AdminRoutingModule,
		UserListModule,
		SaleListModule
	]
})
export class AdminModule {
}
