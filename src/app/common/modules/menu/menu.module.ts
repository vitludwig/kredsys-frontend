import {NgModule} from '@angular/core';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {TopMenuComponent} from './components/top-menu/top-menu.component';
import {SideMenuComponent} from './components/side-menu/side-menu.component';
import {MatSidenavModule} from '@angular/material/sidenav';
import {MatListModule} from '@angular/material/list';
import {RouterModule} from '@angular/router';
import {SharedModule} from '../../../shared.module';
import {LoginModule} from '../../../modules/login/login.module';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';

@NgModule({
	declarations: [
		TopMenuComponent,
		SideMenuComponent,
	],
	imports: [
		SharedModule,
		RouterModule,
		MatToolbarModule,
		MatSidenavModule,
		MatButtonModule,
		MatIconModule,
		MatListModule,
		MatTooltipModule,
		SharedModule,
		LoginModule,
		MatProgressSpinnerModule,
	],
	exports: [
		TopMenuComponent,
		SideMenuComponent,
	],
})
export class MenuModule {
}
