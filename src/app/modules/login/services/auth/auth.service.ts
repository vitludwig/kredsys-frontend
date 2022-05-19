import {Injectable} from '@angular/core';
import {IUser} from '../../../../common/types/IUser';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../../../../environments/environment';
import {IAuthenticationResponse} from './types/IAuthenticationResponse';
import {firstValueFrom} from 'rxjs';
import {UsersService} from '../../../admin/services/users/users.service';

@Injectable({
	providedIn: 'root'
})
export class AuthService {
	public user: IUser | null = null;

	public get isLogged(): boolean {
		return true;
		// return this.user !== null || !!localStorage.getItem('userId');
	}

	constructor(
		protected http: HttpClient,
		protected usersService: UsersService,
	) {
		const userId = Number(localStorage.getItem('userId')) ?? null;
		if(userId) {
			this.usersService.getUser(userId).then((user) => this.user = user);
		}
	}

	public async login(email: string, password: string): Promise<IAuthenticationResponse> {
		return firstValueFrom(this.http.post<IAuthenticationResponse>(environment.apiUrl + 'authentication', {
			email: email,
			password: password,
		}));
	}

	public async logout(): Promise<void> {
		this.user = null;
		localStorage.removeItem('userId');
	}
}
