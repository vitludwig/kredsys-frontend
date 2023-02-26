import {NgModule} from '@angular/core';
import {CardInfoComponent} from './card-info.component';
import {SharedModule} from '../../shared.module';
import {CardInfoRoutingModule} from './card-info-routing.module';
import {CardLoaderComponent} from '../../common/components/card-loader/card-loader.component';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';

@NgModule({
	declarations: [
		CardInfoComponent
	],
	imports: [
		SharedModule,
		CardInfoRoutingModule,
		CardLoaderComponent,
		MatProgressSpinnerModule,
	]
})
export class CardInfoModule {
}
