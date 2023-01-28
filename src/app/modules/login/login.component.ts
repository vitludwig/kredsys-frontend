import {Component} from '@angular/core';
import {AbstractControl, UntypedFormControl, UntypedFormGroup, Validators} from '@angular/forms';
import {AuthService} from './services/auth/auth.service';
import {Router} from '@angular/router';
import {ERoute} from '../../common/types/ERoute';
import {AlertService} from '../../common/services/alert/alert.service';
import {HttpErrorResponse} from '@angular/common/http';

@Component({
	selector: 'app-login',
	templateUrl: './login.component.html',
	styleUrls: ['./login.component.scss'],
})
export class LoginComponent {

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

	constructor(
		protected authService: AuthService,
		protected router: Router,
		protected alertService: AlertService,
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
			// backend send information about wrong credentials as plain string
			if(e instanceof HttpErrorResponse) {
				if(e.error === 'Username or password is incorrect or user is blocked.') {
					this.showValidationErrors = true;
					this.errors.push('Špatné uživatelské jméno nebo heslo');
				}
				if([500,502,504].includes(e.status)) {
					this.errors.push('Chyba spojení se serverem');
				}
			}
		}
	}

	/**
	 * TODO: only for debugging purposes
	 *
	 * @param username
	 */
	public async loginAs(username: string): Promise<void> {
		try {
			await this.authService.login(username, 'test');
			this.router.navigate(['/' + ERoute.SALE]);
		} catch(e) {
			console.error('Debug login failed: ', e);
		}
	}

}
