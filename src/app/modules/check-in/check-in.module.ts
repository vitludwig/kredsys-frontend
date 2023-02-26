import {NgModule} from '@angular/core';
import {CheckInComponent} from './check-in.component';
import {SharedModule} from '../../shared.module';
import {MatButtonModule} from '@angular/material/button';
import {MatSelectModule} from '@angular/material/select';
import {MatInputModule} from '@angular/material/input';
import {CheckInRoutingModule} from './check-in-routing.module';
import {MatListModule} from '@angular/material/list';
import {ChargeModule} from '../admin/modules/charge/charge.module';
import {ReactiveFormsModule} from '@angular/forms';
import {CardLoaderComponent} from '../../common/components/card-loader/card-loader.component';


@NgModule({
	declarations: [
		CheckInComponent,
	],
	imports: [
		SharedModule,
		CheckInRoutingModule,
		ReactiveFormsModule,
		MatButtonModule,
		MatSelectModule,
		MatInputModule,
		MatListModule,
		ChargeModule,
		CardLoaderComponent,
	]
})
export class CheckInModule {
}
