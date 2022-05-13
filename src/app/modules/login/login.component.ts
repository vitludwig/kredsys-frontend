import {Component, OnInit} from '@angular/core';
import {FormControl, FormGroup} from '@angular/forms';
import {AuthService} from './services/auth/auth.service';
import {Router} from '@angular/router';
import {ERoute} from '../../common/types/ERoute';

@Component({
	selector: 'app-login',
	templateUrl: './login.component.html',
	styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

	public loginForm: FormGroup = new FormGroup({
		username: new FormControl(''),
		password: new FormControl(''),
	});

	constructor(
		protected authService: AuthService,
		protected router: Router,
	) {
	}

	public ngOnInit(): void {
		console.log('init');
	}

	public async login(): Promise<void> {
		try {
			await this.authService.login(this.loginForm.get('username')?.value, this.loginForm.get('password')?.value);
			this.router.navigate(['/' + ERoute.SALE]);
		} catch (e) {
			console.log('login failed');
		}
	}

}
