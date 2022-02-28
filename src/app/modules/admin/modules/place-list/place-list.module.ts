import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlaceListComponent } from './place-list.component';
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
import {MatDialogModule} from '@angular/material/dialog';



@NgModule({
  declarations: [
    PlaceListComponent
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
  ]
})
export class PlaceListModule { }
