import {NgModule} from '@angular/core';
import {CardInfoComponent} from './card-info.component';
import {SharedModule} from '../../shared.module';
import {CardInfoRoutingModule} from './card-info-routing.module';

@NgModule({
	declarations: [
		CardInfoComponent
	],
	imports: [
		SharedModule,
		CardInfoRoutingModule,
	]
})
export class CardInfoModule {
}
