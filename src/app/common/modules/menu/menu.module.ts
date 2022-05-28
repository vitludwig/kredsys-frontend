import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {TopMenuComponent} from './components/top-menu/top-menu.component';
import {SideMenuComponent} from './components/side-menu/side-menu.component';
import {MatSidenavModule} from '@angular/material/sidenav';
import {MatListModule} from '@angular/material/list';
import {RouterModule} from '@angular/router';
import {SharedModule} from '../../../shared.module';

@NgModule({
	declarations: [
		TopMenuComponent,
		SideMenuComponent,
	],
	imports: [
		CommonModule,
		RouterModule,
		MatToolbarModule,
		MatSidenavModule,
		MatButtonModule,
		MatIconModule,
		MatListModule,
		SharedModule,
	],
	exports: [
		TopMenuComponent,
		SideMenuComponent,
	],
})
export class MenuModule {
}
