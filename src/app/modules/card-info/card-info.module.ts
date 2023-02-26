import {NgModule} from '@angular/core';
import {CardInfoComponent} from './card-info.component';
import {SharedModule} from '../../shared.module';
import {CardInfoRoutingModule} from './card-info-routing.module';
import {CardLoaderComponent} from '../../common/components/card-loader/card-loader.component';

@NgModule({
	declarations: [
		CardInfoComponent
	],
	imports: [
		SharedModule,
		CardInfoRoutingModule,
		CardLoaderComponent,
	]
})
export class CardInfoModule {
}
