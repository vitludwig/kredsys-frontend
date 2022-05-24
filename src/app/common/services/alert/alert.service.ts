import {Injectable} from '@angular/core';
import {MatSnackBar, MatSnackBarConfig} from '@angular/material/snack-bar';

@Injectable({
	providedIn: 'root',
})
export class AlertService {
	protected config: MatSnackBarConfig = {
		duration: 3000,
	};

	constructor(
		protected snackbar: MatSnackBar,
	) {
	}
	protected showMessage(message: string, config: MatSnackBarConfig): void {
		this.snackbar.open(message, '', {
			...this.config,
			...config,
		});
	}
	public success(message: string): void {
		this.showMessage(message, {
			panelClass: 'alert-success',
		});
	}

	public error(message: string): void {
		this.showMessage(message, {
			panelClass: 'alert-error',
		});
	}
}
