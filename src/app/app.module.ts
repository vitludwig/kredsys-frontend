import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {AppComponent} from './app.component';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {SaleModule} from './modules/sale/sale.module';
import {AppRoutingModule} from './app-routing.module';
import {MenuModule} from './common/modules/menu/menu.module';
import {MatSidenavModule} from '@angular/material/sidenav';
import {SharedModule} from './shared.module';

@NgModule({
	declarations: [
		AppComponent,
	],
	imports: [
		SharedModule,
		BrowserModule,
		AppRoutingModule,
		NoopAnimationsModule,
		MatSidenavModule,
		MenuModule,
		SaleModule,
	],
	providers: [],
	bootstrap: [AppComponent],
})
export class AppModule {
}
