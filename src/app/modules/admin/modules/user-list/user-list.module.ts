import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {UserListComponent} from './user-list.component';
import {MatTableModule} from '@angular/material/table';
import {MatSortModule} from '@angular/material/sort';
import {MatPaginatorModule} from '@angular/material/paginator';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {UserEditComponent} from './components/user-edit/user-edit.component';
import {RouterModule} from '@angular/router';
import {MatDialogModule} from '@angular/material/dialog';
import {FormsModule} from '@angular/forms';
import {MatSelectModule} from '@angular/material/select';


@NgModule({
	declarations: [
		UserListComponent,
		UserEditComponent
	],
	imports: [
		CommonModule,
		RouterModule,
		FormsModule,
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
	exports: [
		UserListComponent,
		UserEditComponent,
	]
})
export class UserListModule {
}
