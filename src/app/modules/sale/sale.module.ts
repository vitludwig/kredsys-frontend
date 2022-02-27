import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {SaleItemComponent} from './components/dashboard/components/sale-item/sale-item.component';
import {SaleSummaryComponent} from './components/sale-summary/sale-summary.component';
import {DashboardComponent} from './components/dashboard/dashboard.component';
import {SaleComponent} from './sale.component';
import {MatSidenavModule} from '@angular/material/sidenav';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatCardModule} from '@angular/material/card';
import {MatRippleModule} from '@angular/material/core';
import {SaleDialogComponent} from './components/sale-dialog/sale-dialog.component';
import {MatDialogModule} from '@angular/material/dialog';
import {ChargeDialogComponent} from './components/charge-dialog/charge-dialog.component';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {FormsModule} from '@angular/forms';
import {SaleRoutingModule} from './sale-routing.module';


@NgModule({
	declarations: [
		SaleComponent,
		SaleItemComponent,
		SaleSummaryComponent,
		DashboardComponent,
		SaleDialogComponent,
		ChargeDialogComponent,
	],
	exports: [
		SaleComponent
	],
	imports: [
		CommonModule,
		SaleRoutingModule,
		FormsModule,
		MatSidenavModule,
		MatButtonModule,
		MatIconModule,
		MatCardModule,
		MatRippleModule,
		MatDialogModule,
		MatFormFieldModule,
		MatInputModule,
	]
})
export class SaleModule {
}
