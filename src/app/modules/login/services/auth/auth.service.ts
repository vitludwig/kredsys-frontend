import {Injectable} from '@angular/core';
import {IUser} from '../../../../common/types/IUser';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../../../../environments/environment';
import {IAuthenticationResponse} from './types/IAuthenticationResponse';
import {BehaviorSubject, firstValueFrom, Observable} from 'rxjs';
import {UsersService} from '../../../admin/services/users/users.service';

@Injectable({
	providedIn: 'root',
})
export class AuthService {
	public get user(): IUser | null {
		return this.#user;
	}

	public set user(value: IUser | null) {
		this.#user = value;
		this.isLoggedSubject.next(value !== null);
	}

	public get isLogged(): boolean {
		// return true;
		return this.#user !== null || !!localStorage.getItem('userId');
	}
	public isLogged$: Observable<boolean>

	protected isLoggedSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

	#user: IUser | null = null;

	constructor(
		protected http: HttpClient,
		protected usersService: UsersService,
	) {
		this.isLogged$ = this.isLoggedSubject.asObservable();
		const userId = Number(localStorage.getItem('userId')) ?? null;
		if(userId) {
			this.usersService.getUser(userId).then((user) => this.user = user);
		}
	}

	public async login(email: string, password: string): Promise<IAuthenticationResponse> {
		const result = await firstValueFrom(this.http.post<IAuthenticationResponse>(environment.apiUrl + 'authentication/user/email', {
			email: email,
			secret: password,
			apiToken: localStorage.getItem('placeToken') ?? undefined,
		}));

		localStorage.setItem('userId', result.userId + '');
		localStorage.setItem('apiToken', result.token + '');
		const user = await this.usersService.getUser(result.userId);
		user.roles = result.roles;
		this.user = user;
		return result;
	}

	public async logout(): Promise<void> {
		this.user = null;
		localStorage.removeItem('userId');
		localStorage.removeItem('apiToken');
	}
}
