import {NgModule} from '@angular/core';
import {CurrencyListComponent} from './currency-list.component';
import {CurrencyDetailComponent} from './components/currency-detail/currency-detail.component';
import {SharedModule} from '../../../../shared.module';
import {RouterModule} from '@angular/router';
import {MatTableModule} from '@angular/material/table';
import {MatSortModule} from '@angular/material/sort';
import {MatPaginatorModule} from '@angular/material/paginator';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatSelectModule} from '@angular/material/select';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatDialogModule} from '@angular/material/dialog';


@NgModule({
	declarations: [
		CurrencyListComponent,
		CurrencyDetailComponent,
	],
	imports: [
		SharedModule,
		RouterModule,
		MatTableModule,
		MatSortModule,
		MatPaginatorModule,
		MatFormFieldModule,
		MatInputModule,
		MatSelectModule,
		MatButtonModule,
		MatIconModule,
		MatDialogModule,
	],
})
export class CurrencyListModule {
}
