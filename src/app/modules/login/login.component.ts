import {Component, OnDestroy} from '@angular/core';
import {AbstractControl, UntypedFormControl, UntypedFormGroup, Validators} from '@angular/forms';
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
	public loginForm: UntypedFormGroup = new UntypedFormGroup({
		username: new UntypedFormControl('', [Validators.required, Validators.email]),
		password: new UntypedFormControl('', [Validators.required]),
	});

	public showValidationErrors: boolean = false;
	public errors: string[] = [];

	public get username(): AbstractControl | null {
		return this.loginForm.get('username');
	}

	public get password(): AbstractControl | null {
		return this.loginForm.get('password');
	}

	private unsubscribe$: Subject<void> = new Subject<void>();

	constructor(
		protected authService: AuthService,
		protected router: Router,
		protected alertService: AlertService,
		private placeService: PlaceService,
	) {
		if(this.authService.isLogged) {
			this.router.navigate([ERoute.SALE]);
		}
	}

	public async login(): Promise<void> {
		this.errors = [];
		if(this.loginForm.invalid) {
			this.showValidationErrors = true;
			return;
		}

		try {
			await this.authService.login(this.loginForm.get('username')?.value, this.loginForm.get('password')?.value);
			this.router.navigate(['/' + ERoute.SALE]);
		} catch(e) {
			console.error('Login failed: ', e);

			if(e instanceof HttpErrorResponse) {
				if(e.error === 'Username or password is incorrect or user is blocked.') {
					this.showValidationErrors = true;
					this.errors.push('Špatné uživatelské jméno nebo heslo');

				} else if([500,502,504].includes(e.status)) {
					this.errors.push('Chyba spojení se serverem');
				} else if(e.status === 404 && e.error.Message.includes('Place with API token')) {
					this.showBadPlaceError();
				} else {
					this.errors.push('Vyskytla se chyba přihlašování, kontaktuj administrátora');
				}

			} else {
				this.errors.push('Vyskytla se chyba přihlašování, kontaktuj administrátora');
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
