import {Injectable} from '@angular/core';
import {IUser} from '../../../../common/types/IUser';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../../../../environments/environment';
import {IAuthenticationResponse} from './types/IAuthenticationResponse';
import {firstValueFrom} from 'rxjs';

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
	) {
		const userId = Number(localStorage.getItem('userId')) ?? null;
		// if(userId) {
		// 	this.getUser(userId).then((user) => this.user = user);
		// }
	}

	public async getUser(id: number): Promise<void> {
		// return users[id + ''];
		return;
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
