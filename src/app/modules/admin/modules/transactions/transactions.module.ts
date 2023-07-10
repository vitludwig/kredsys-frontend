import {NgModule} from '@angular/core';
import {TransactionsListComponent} from './components/transactions-list/transactions-list.component';
import {TransactionsComponent} from './transactions.component';
import {SharedModule} from '../../../../shared.module';
import {MatTableModule} from '@angular/material/table';
import {MatSelectModule} from '@angular/material/select';
import {MatInputModule} from '@angular/material/input';
import {MatSortModule} from '@angular/material/sort';
import {MatPaginatorModule} from '@angular/material/paginator';
import {NgChartsModule} from 'ng2-charts';
import {MatTabsModule} from '@angular/material/tabs';
import {PlaceTransactionsListComponent} from './components/place-transactions-list/place-transactions-list.component';
import {UserTransactionsListComponent} from './components/user-transactions-list/user-transactions-list.component';
import {MatAutocompleteModule} from "@angular/material/autocomplete";
import {ReactiveFormsModule} from "@angular/forms";
import {MatButtonModule} from "@angular/material/button";
import {NewTransactionComponent} from "./components/new-transaction/new-transaction.component";
import {ClickConfirmDirective} from '../../../../common/directives/click-confirm/click-confirm.directive';
import {AutofocusDirective} from '../../../../common/directives/autofocus.directive';
import {MatIconModule} from '@angular/material/icon';
import {StatisticsTableComponent} from './components/statistics-table/statistics-table.component';

@NgModule({
	declarations: [
		TransactionsListComponent,
		TransactionsComponent,
		PlaceTransactionsListComponent,
		UserTransactionsListComponent,
		NewTransactionComponent,
		StatisticsTableComponent,
	],
	imports: [
		SharedModule,
		MatTableModule,
		MatSelectModule,
		MatInputModule,
		MatSortModule,
		MatPaginatorModule,
		NgChartsModule,
		MatTabsModule,
		MatAutocompleteModule,
		ReactiveFormsModule,
		MatButtonModule,
		ClickConfirmDirective,
		AutofocusDirective,
		MatIconModule,
	],
})
export class TransactionsModule {
}
