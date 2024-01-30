import {APP_INITIALIZER, NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {AppComponent} from './app.component';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {SaleModule} from './modules/sale/sale.module';
import {AppRoutingModule} from './app-routing.module';
import {MenuModule} from './common/modules/menu/menu.module';
import {MatSidenavModule} from '@angular/material/sidenav';
import {SharedModule} from './shared.module';
import {appInitializerFactory} from './common/services/app-initializer.factory';
import {InitService} from './common/services/init/init.service';
import {MatPaginatorIntl} from '@angular/material/paginator';
import {CustomPaginatorConfiguration} from './common/providers/CustomPaginatorConfiguration';

@NgModule({
	declarations: [
		AppComponent,
	],
	imports: [
		SharedModule,
		BrowserModule,
		AppRoutingModule,
		BrowserAnimationsModule,
		MatSidenavModule,
		MenuModule,
		SaleModule,
	],
	providers: [
		{ provide: APP_INITIALIZER, useFactory: appInitializerFactory, deps: [InitService], multi: true },
		{ provide: MatPaginatorIntl, useValue: CustomPaginatorConfiguration() }
	],
	bootstrap: [AppComponent],
})
export class AppModule {
}
