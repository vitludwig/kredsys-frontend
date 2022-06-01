import {NgModule} from '@angular/core';
import {PlaceListComponent} from './place-list.component';
import {RouterModule} from '@angular/router';
import {FormsModule} from '@angular/forms';
import {MatTableModule} from '@angular/material/table';
import {MatSortModule} from '@angular/material/sort';
import {MatPaginatorModule} from '@angular/material/paginator';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatSelectModule} from '@angular/material/select';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {PlaceDetailComponent} from './components/place-detail/place-detail.component';
import {SharedModule} from '../../../../shared.module';
import {DragDropModule} from '@angular/cdk/drag-drop';
import {SortimentDetailComponent} from './components/place-detail/components/sortiment-detail/sortiment-detail.component';
import {MatDialogModule} from '@angular/material/dialog';


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
		MatSelectModule,
		MatButtonModule,
		MatIconModule,
		MatDialogModule,
		DragDropModule,
	],
})
export class PlaceListModule {
}
