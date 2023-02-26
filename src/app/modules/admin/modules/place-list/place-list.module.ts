import {NgModule} from '@angular/core';
import {PlaceListComponent} from './place-list.component';
import {RouterModule} from '@angular/router';
import {MatTableModule} from '@angular/material/table';
import {MatSortModule} from '@angular/material/sort';
import {MatPaginatorModule} from '@angular/material/paginator';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {PlaceDetailComponent} from './components/place-detail/place-detail.component';
import {SharedModule} from '../../../../shared.module';
import {DragDropModule} from '@angular/cdk/drag-drop';
import {SortimentDetailComponent} from './components/place-detail/components/sortiment-detail/sortiment-detail.component';
import {MatDialogModule} from '@angular/material/dialog';
import {MatChipsModule} from '@angular/material/chips';
import {MatSelectModule} from '@angular/material/select';
import {MatAutocompleteModule} from '@angular/material/autocomplete';
import {AutofocusDirective} from '../../../../common/directives/mat-input-autofocus.directive';
import {ClickConfirmDirective} from '../../../../common/directives/click-confirm/click-confirm.directive';


@NgModule({
	declarations: [
		PlaceListComponent,
		PlaceDetailComponent,
		SortimentDetailComponent,
	],
	imports: [
		SharedModule,
		RouterModule,
		MatTableModule,
		MatSortModule,
		MatPaginatorModule,
		MatFormFieldModule,
		MatInputModule,
		MatChipsModule,
		MatSelectModule,
		MatAutocompleteModule,
		MatButtonModule,
		MatIconModule,
		MatDialogModule,
		DragDropModule,
		AutofocusDirective,
		ClickConfirmDirective,
	],
})
export class PlaceListModule {
}
