import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {CheckInComponent} from './check-in.component';

const routes: Routes = [
	{
		path: '',
		component: CheckInComponent,
		data: {
			name: 'Registrace',
		},
	},
];

@NgModule({
	imports: [RouterModule.forChild(routes)],
	exports: [RouterModule],
})
export class CheckInRoutingModule {
}
