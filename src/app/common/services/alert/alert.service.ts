import {Injectable} from '@angular/core';
import {MatSnackBar, MatSnackBarConfig, MatSnackBarRef, TextOnlySnackBar} from '@angular/material/snack-bar';

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
	public success(message: string, config?: MatSnackBarConfig, action: string = ''): MatSnackBarRef<TextOnlySnackBar> {
		return this.showMessage(message, {
			...config,
			panelClass: 'mdc-snackbar--success',
		}, action);
	}

	public error(message: string, config?: MatSnackBarConfig, action: string = ''): MatSnackBarRef<TextOnlySnackBar> {
		return this.showMessage(message, {
			...config,
			panelClass: 'mdc-snackbar--danger',
			...config,
		}, action);
	}

	protected showMessage(message: string, config: MatSnackBarConfig, action: string = ''): MatSnackBarRef<TextOnlySnackBar> {
		return this.snackbar.open(message, action, {
			...this.config,
			...config,
		});
	}
}
