import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {CardInfoComponent} from './card-info.component';

const routes: Routes = [
	{
		path: '',
		component: CardInfoComponent,
		data: {
			name: 'Infokartářka',
		},
	},
];

@NgModule({
	imports: [RouterModule.forChild(routes)],
	exports: [RouterModule],
})
export class CardInfoRoutingModule {
}
