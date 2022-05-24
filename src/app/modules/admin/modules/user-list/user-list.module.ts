import {NgModule} from '@angular/core';
import {UserListComponent} from './user-list.component';
import {MatTableModule} from '@angular/material/table';
import {MatSortModule} from '@angular/material/sort';
import {MatPaginatorModule} from '@angular/material/paginator';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {UserDetailComponent} from './components/user-detail/user-detail.component';
import {RouterModule} from '@angular/router';
import {MatDialogModule} from '@angular/material/dialog';
import {MatSelectModule} from '@angular/material/select';
import {MatListModule} from '@angular/material/list';
import {SharedModule} from '../../../../shared.module';
import {CardDetailComponent} from './components/user-detail/components/card-detail/card-detail.component';


@NgModule({
	declarations: [
		UserListComponent,
		UserDetailComponent,
		CardDetailComponent,
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
		MatListModule,
	],
	exports: [
		UserListComponent,
		UserDetailComponent,
	],
})
export class UserListModule {
}
