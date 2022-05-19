import {NgModule} from '@angular/core';
import {ChargeComponent} from './charge.component';
import {SharedModule} from '../../../../shared.module';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatSelectModule} from '@angular/material/select';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';


@NgModule({
	declarations: [
		ChargeComponent
	],
	imports: [
		SharedModule,
		MatFormFieldModule,
		MatInputModule,
		MatButtonModule,
		MatIconModule,
	]
})
export class ChargeModule {
}
