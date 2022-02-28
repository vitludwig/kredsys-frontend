import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {AdminComponent} from './admin.component';
import {UserListModule} from './modules/user-list/user-list.module';
import {AdminRoutingModule} from './admin-routing.module';
import {PlaceListModule} from './modules/place-list/place-list.module';


@NgModule({
	declarations: [
		AdminComponent
	],
	imports: [
		CommonModule,
		AdminRoutingModule,
		UserListModule,
		PlaceListModule,
	]
})
export class AdminModule {
}
