import {NgModule} from '@angular/core';
import {PlaceSelectComponent} from './place-select.component';
import {SharedModule} from '../../shared.module';
import {PlaceSelectRoutingModule} from './place-select-routing.module';
import {MatCardModule} from '@angular/material/card';
import {MatButtonModule} from '@angular/material/button';
import {MatSelectModule} from '@angular/material/select';


@NgModule({
	declarations: [
		PlaceSelectComponent,
	],
	exports: [
		PlaceSelectComponent,
	],
	imports: [
		SharedModule,
		PlaceSelectRoutingModule,
		MatCardModule,
		MatSelectModule,
		MatButtonModule,
	]
})
export class PlaceSelectModule {
}
