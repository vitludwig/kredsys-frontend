import {APP_INITIALIZER, NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {AppComponent} from './app.component';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {SaleModule} from './modules/sale/sale.module';
import {AppRoutingModule} from './app-routing.module';
import {MenuModule} from './common/modules/menu/menu.module';
import {MatSidenavModule} from '@angular/material/sidenav';
import {SharedModule} from './shared.module';
import {appInitializerFactory} from './common/services/app-initializer.factory';
import {InitService} from './common/services/init/init.service';

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
	providers: [
		{provide: APP_INITIALIZER, useFactory: appInitializerFactory, deps: [InitService], multi: true},
	],
	bootstrap: [AppComponent],
})
export class AppModule {
}
