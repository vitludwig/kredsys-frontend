import {NgModule} from '@angular/core';
import {ChargeComponent} from './charge.component';
import {SharedModule} from '../../../../shared.module';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {ChargeFormComponent} from './components/charge-form/charge-form.component';
import {CardLoaderComponent} from '../../../../common/components/card-loader/card-loader.component';


@NgModule({
	declarations: [
		ChargeComponent,
		ChargeFormComponent,
	],
	imports: [
		SharedModule,
		MatFormFieldModule,
		MatInputModule,
		MatButtonModule,
		MatIconModule,
		CardLoaderComponent,
	],
	exports: [
		ChargeFormComponent
	]
})
export class ChargeModule {
}
