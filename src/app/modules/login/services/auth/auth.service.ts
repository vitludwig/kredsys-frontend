import {inject, Injectable} from '@angular/core';
import {EUserRole, IUser} from '../../../../common/types/IUser';
import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {environment} from '../../../../../environments/environment';
import {IAuthenticationResponse} from './types/IAuthenticationResponse';
import {BehaviorSubject, firstValueFrom, Observable} from 'rxjs';
import {UsersService} from '../../../admin/services/users/users.service';
import {EPermission} from './types/EPermission';
import jwt_decode, {JwtPayload} from 'jwt-decode';
import {ConfigService} from "../../../../common/services/config/config.service";

@Injectable({
	providedIn: 'root',
})
export class AuthService {
	private configService: ConfigService = inject(ConfigService);
	protected http: HttpClient = inject(HttpClient);
	protected usersService: UsersService = inject(UsersService);

	public get user(): IUser | null {
		return this.#user;
	}

	#apiTokenPayload: JwtPayload;

	public get isDebug(): boolean {
		return localStorage.getItem('isDebug') === 'true' || environment.debug;
	}

	public set isDebug(value: boolean) {
		localStorage.setItem('isDebug', value + '');
	}

	public set user(value: IUser | null) {
		this.#user = value;
		if(value?.id) {
			localStorage.setItem('userId', value.id + '');
		} else  {
			localStorage.removeItem('userId');
		}
		this.isLoggedSubject.next(value !== null);
	}

	public get apiToken(): string {
		return localStorage.getItem('apiToken') ?? '';
	}

	private set apiToken(value: string) {
		localStorage.setItem('apiToken', value);
		this.#apiTokenPayload = jwt_decode(value);
	}

	public get isLogged(): boolean {
		return this.#user !== null || !!localStorage.getItem('userId');
	}

	protected isLoggedSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
	public isLogged$: Observable<boolean> = this.isLoggedSubject.asObservable();

	#user: IUser | null = null;

	public get apiTokenPayload(): JwtPayload {
		return this.#apiTokenPayload;
	}

	public async init(): Promise<void> {
		const userId = Number(localStorage.getItem('userId')) ?? null;
		if (userId) {
			try {
				this.user = await this.usersService.getUser(userId);
			} catch (e) {
				if (e instanceof HttpErrorResponse && e.status === 404) {
					this.logout();
				}
			}
		}
	}

	public getPermissions(): EPermission[] {
		return JSON.parse(localStorage.getItem('permissions') ?? '[]');
	}

	public async login(email: string, password: string): Promise<IAuthenticationResponse> {
		const result = await firstValueFrom(this.http.post<IAuthenticationResponse>(this.configService.config.apiUrl + 'authentication/user/email', {
			email: email,
			secret: password,
			apiToken: localStorage.getItem('placeToken') ?? undefined,
		}));

		this.apiToken = result.token + '';
		this.savePermissions(result.permissions);

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
