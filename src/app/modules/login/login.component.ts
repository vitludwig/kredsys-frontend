import {Component, inject, OnDestroy} from '@angular/core';
import {
	AbstractControl,
	FormControl,
	FormGroup,
	UntypedFormControl,
	UntypedFormGroup,
	Validators
} from '@angular/forms';
import {AuthService} from './services/auth/auth.service';
import {Router} from '@angular/router';
import {ERoute} from '../../common/types/ERoute';
import {AlertService} from '../../common/services/alert/alert.service';
import {HttpErrorResponse} from '@angular/common/http';
import {PlaceService} from '../admin/services/place/place/place.service';
import {Subject, takeUntil} from 'rxjs';

@Component({
	selector: 'app-login',
	templateUrl: './login.component.html',
	styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnDestroy {
	public loginForm: FormGroup = new FormGroup({
		username: new FormControl<string>('', [Validators.required, Validators.email]),
		password: new FormControl<string>('', [Validators.required]),
	});
	protected authService: AuthService = inject(AuthService);
	protected router: Router = inject(Router);
	protected alertService: AlertService = inject(AlertService);
	private placeService: PlaceService = inject(PlaceService);

	private unsubscribe$: Subject<void> = new Subject<void>();

	constructor() {
		if(this.authService.isLogged) {
			this.router.navigate([ERoute.SALE]);
		}
	}

	public async login(): Promise<void> {
		if(this.loginForm.invalid) {
			return;
		}

		try {
			await this.authService.login(this.loginForm.get('username')?.value, this.loginForm.get('password')?.value);
			this.router.navigate(['/' + ERoute.SALE]);
		} catch(e) {
			console.error('Login failed: ', e);

			if(e instanceof HttpErrorResponse) {
				if(e.error === 'Username or password is incorrect or user is blocked.') {
					this.alertService.error('Špatné uživatelské jméno nebo heslo');

				} else if([500,502,504].includes(e.status)) {
					this.alertService.error('Chyba spojení se serverem');
				} else if(e.status === 404 && e.error.Message.includes('Place with API token')) {
					this.showBadPlaceError();
				} else {
					this.alertService.error('Vyskytla se chyba přihlašování, kontaktuj administrátora');
				}

			} else {
				this.alertService.error('Vyskytla se chyba přihlašování, kontaktuj administrátora');
			}
		}
	}

	public ngOnDestroy(): void {
		this.unsubscribe$.next();
	}

	private showBadPlaceError(): void {
		const alert = this.alertService.error('Vybrané místo neexistuje', { duration: 10000 }, 'Smazat uložené místo');
		alert.onAction().pipe(takeUntil(this.unsubscribe$)).subscribe(() => {
			this.placeService.removeSavedPlace();
			window.location.reload();
		});
	}

}
