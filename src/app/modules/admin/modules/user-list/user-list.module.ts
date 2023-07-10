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
import {MatCheckboxModule} from "@angular/material/checkbox";
import {CardLoaderComponent} from '../../../../common/components/card-loader/card-loader.component';
import {AutofocusDirective} from '../../../../common/directives/autofocus.directive';
import {ClickConfirmDirective} from '../../../../common/directives/click-confirm/click-confirm.directive';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {ChangePasswordComponent} from './components/change-password/change-password.component';


@NgModule({
	declarations: [
		UserListComponent,
		UserDetailComponent,
		CardDetailComponent,
		ChangePasswordComponent,
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
		MatCheckboxModule,
		CardLoaderComponent,
		AutofocusDirective,
		ClickConfirmDirective,
		MatProgressSpinnerModule,
	],
	exports: [
		UserListComponent,
		UserDetailComponent,
	],
})
export class UserListModule {
}
