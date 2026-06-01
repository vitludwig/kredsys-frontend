import {Component, inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {IPlace} from '../../../../../../common/types/IPlace';

@Component({
	selector: 'app-goods-add-to-place-dialog',
	templateUrl: './goods-add-to-place-dialog.component.html',
	standalone: false,
})
export class GoodsAddToPlaceDialogComponent {
	protected data: { places: IPlace[] } = inject(MAT_DIALOG_DATA);
	private dialogRef: MatDialogRef<GoodsAddToPlaceDialogComponent, number | null> = inject(MatDialogRef);

	protected selectedPlaceId: number | null = null;

	protected confirm(): void {
		this.dialogRef.close(this.selectedPlaceId);
	}
}
