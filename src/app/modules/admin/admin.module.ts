import {NgModule} from '@angular/core';
import {AdminComponent} from './admin.component';
import {UserListModule} from './modules/user-list/user-list.module';
import {AdminRoutingModule} from './admin-routing.module';
import {PlaceListModule} from './modules/place-list/place-list.module';
import {SharedModule} from '../../shared.module';


@NgModule({
	declarations: [
		AdminComponent,
	],
	imports: [
		SharedModule,
		AdminRoutingModule,
		UserListModule,
		PlaceListModule,
	]
})
export class AdminModule {
}
