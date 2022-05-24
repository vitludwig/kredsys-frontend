import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {PlaceSelectComponent} from './place-select.component';

const routes: Routes = [
	{
		path: '',
		component: PlaceSelectComponent,
		data: {
			name: 'Výběr místa',
		},
	},
];

@NgModule({
	imports: [RouterModule.forChild(routes)],
	exports: [RouterModule],
})
export class PlaceSelectRoutingModule {
}
