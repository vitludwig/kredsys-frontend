import {Component, Inject, OnInit} from '@angular/core';
import {PlaceService} from '../../../../../../services/place/place/place.service';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {ICard} from '../../../../../../../../common/types/ICard';

@Component({
  selector: 'app-card-detail',
  templateUrl: './card-detail.component.html',
  styleUrls: ['./card-detail.component.scss']
})
export class CardDetailComponent {

  constructor(
      public placeService: PlaceService,
      protected dialogRef: MatDialogRef<CardDetailComponent>,
      @Inject(MAT_DIALOG_DATA) public data: ICard
  ) {
  }

  public async onSubmit(): Promise<void> {
    console.log('submitting');
    this.dialogRef.close(this.data);
  }

}
