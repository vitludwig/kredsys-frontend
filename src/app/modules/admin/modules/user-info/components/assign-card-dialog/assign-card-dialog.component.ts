import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-user-info-assign-card-dialog',
  template: '',
  standalone: true,
  imports: [FormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule],
})
export class AssignCardDialogComponent {
  protected data: { userId: number } = inject(MAT_DIALOG_DATA);
  protected dialogRef = inject(MatDialogRef<AssignCardDialogComponent>);
}
