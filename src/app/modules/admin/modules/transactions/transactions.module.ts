import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {TransactionListComponent} from './components/transaction-list/transaction-list.component';
import {TransactionsComponent} from './transactions.component';
import {SharedModule} from '../../../../shared.module';
import {MatTableModule} from '@angular/material/table';
import {MatSelectModule} from '@angular/material/select';
import {MatInputModule} from '@angular/material/input';
import {MatSortModule} from '@angular/material/sort';
import {MatPaginatorModule} from '@angular/material/paginator';

@NgModule({
	declarations: [
		TransactionListComponent,
		TransactionsComponent
	],
	imports: [
		SharedModule,
		MatTableModule,
		MatSelectModule,
		MatInputModule,
		MatSortModule,
		MatPaginatorModule,
	]
})
export class TransactionsModule {
}
