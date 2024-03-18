import {Injectable} from '@angular/core';
import {EUserRole, IUser} from '../../../../common/types/IUser';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../../../../environments/environment';
import {IAuthenticationResponse} from './types/IAuthenticationResponse';
import {BehaviorSubject, firstValueFrom, Observable} from 'rxjs';
import {UsersService} from '../../../admin/services/users/users.service';
import {EPermission} from './types/EPermission';

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

	public get isDebug(): boolean {
		return localStorage.getItem('isDebug') === 'true' || environment.debug;
	}

	public set isDebug(value: boolean) {
		localStorage.setItem('isDebug', value + '');
	}

	public get isLogged(): boolean {
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

	public getPermissions(): EPermission[] {
		return JSON.parse(localStorage.getItem('permissions') ?? '[]');
	}

	public async login(email: string, password: string): Promise<IAuthenticationResponse> {
		const result = await firstValueFrom(this.http.post<IAuthenticationResponse>(environment.apiUrl + 'authentication/user/email', {
			email: email,
			secret: password,
			apiToken: localStorage.getItem('placeToken') ?? undefined,
		}));

		localStorage.setItem('userId', result.userId + '');
		localStorage.setItem('apiToken', result.token + '');
		localStorage.setItem('permissions', JSON.stringify(result.permissions));

		const user = await this.usersService.getUser(result.userId);
		user.roles = result.roles;
		this.user = user;
		return result;
	}

	private savePermissions(value: EPermission[]): void {
		localStorage.setItem('permissions', JSON.stringify(value));
	}

	public async logout(): Promise<void> {
		this.user = null;
		localStorage.removeItem('userId');
		localStorage.removeItem('apiToken');
	}

	/**
	 * Checks if logged user (not customer) has given role
	 *
	 * @param role
	 */
	public hasRole(role: EUserRole): boolean {
		return this.#user?.roles?.includes(role) ?? false;
	}
}
