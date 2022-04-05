import {Injectable, Renderer2} from '@angular/core';
import {IUser} from '../../types/IUser';
import {BehaviorSubject, Observable} from 'rxjs';

@Injectable({
	providedIn: 'root'
})
export class UserService {
	#userSubject: BehaviorSubject<IUser | null>;
	public user$: Observable<IUser | null>;

	public isLogged: boolean = false;

	public get user(): IUser | null {
		return this.#userSubject.getValue();
	}

	public set user(value: IUser | null) {
		this.#userSubject.next(value);
		this.isLogged = value !== null;
	}

	constructor() {
		this.#userSubject = new BehaviorSubject<IUser | null>(null);
		this.user$ = this.#userSubject.asObservable();
	}

	public chargeMoney(amount: number, user: IUser | null = this.user): void {
		if (!user) {
			console.error('Load user first');
			return;
		}
		user.credit = user.credit ?? 0;
		user.credit += amount;
	}

	public loadUser(userId: string): void {
		this.user = {
			id: Number(userId),
			name: 'John doe',
			credit: 500,
		}
	}

	public logout(): void {
		this.user = null;
	}
}
