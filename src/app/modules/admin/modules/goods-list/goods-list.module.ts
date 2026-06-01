import {NgModule} from '@angular/core';
import {GoodsListComponent} from './goods-list.component';
import {GoodsDetailComponent} from './components/goods-detail/goods-detail.component';
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
import {GoodsTypeDetailComponent} from './components/goods-type-detail/goods-type-detail.component';
import {GoodsAddToPlaceDialogComponent} from './components/goods-add-to-place-dialog/goods-add-to-place-dialog.component';
import {ClickConfirmDirective} from '../../../../common/directives/click-confirm/click-confirm.directive';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';


@NgModule({
	declarations: [
		GoodsListComponent,
		GoodsDetailComponent,
		GoodsTypeDetailComponent,
		GoodsAddToPlaceDialogComponent,
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
		ClickConfirmDirective,
		MatProgressSpinnerModule,
		MatSlideToggleModule,
	],
})
export class GoodsListModule {
}
