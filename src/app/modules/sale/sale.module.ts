import {NgModule} from '@angular/core';
import {SaleItemComponent} from './components/dashboard/components/sale-item/sale-item.component';
import {SaleSummaryComponent} from './components/sale-summary/sale-summary.component';
import {DashboardComponent} from './components/dashboard/dashboard.component';
import {SaleComponent} from './sale.component';
import {MatSidenavModule} from '@angular/material/sidenav';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatCardModule} from '@angular/material/card';
import {MatRippleModule} from '@angular/material/core';
import {MatDialogModule} from '@angular/material/dialog';
import {ChargeDialogComponent} from './components/charge-dialog/charge-dialog.component';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {SaleRoutingModule} from './sale-routing.module';
import {SharedModule} from '../../shared.module';
import {StornoDialogComponent} from "./components/storno-dialog/storno-dialog.component";
import {MatListModule} from "@angular/material/list";
import {MatDividerModule} from "@angular/material/divider";
import {DischargeDialogComponent} from './components/discharge-dialog/discharge-dialog.component';
import {CardLoaderComponent} from '../../common/components/card-loader/card-loader.component';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';


@NgModule({
	declarations: [
		SaleComponent,
		SaleItemComponent,
		SaleSummaryComponent,
		DashboardComponent,
		ChargeDialogComponent,
		StornoDialogComponent,
		DischargeDialogComponent,
	],
	exports: [
		SaleComponent,
	],
	imports: [
		SharedModule,
		SaleRoutingModule,
		MatSidenavModule,
		MatButtonModule,
		MatIconModule,
		MatCardModule,
		MatRippleModule,
		MatDialogModule,
		MatFormFieldModule,
		MatInputModule,
		MatListModule,
		MatDividerModule,
		CardLoaderComponent,
		MatProgressSpinnerModule,
	],
})
export class SaleModule {
}
