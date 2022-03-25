import {Injectable, Renderer2} from '@angular/core';
import {IUser} from '../../types/IUser';
import {BehaviorSubject, Observable} from 'rxjs';

@Injectable({
	providedIn: 'root'
})
export class UserService {
	public isLogged: boolean = false;

	public get user(): IUser | null {
		return this.#userSubject.getValue();
	}

	public set user(value: IUser | null) {
		this.#userSubject.next(value);
		this.isLogged = value !== null;
	}

	public user$: Observable<IUser | null>;
	#userSubject: BehaviorSubject<IUser | null>;

	constructor() {
		this.#userSubject = new BehaviorSubject<IUser | null>(null);
		this.user$ = this.#userSubject.asObservable();
	}

	public chargeMoney(amount: number, user: IUser | null = this.user): void {
		if (!user) {
			console.error('Load user first');
			return;
		}

		user.credit += amount;
	}

	public login(userId: number): void {
		this.user = {
			id: userId,
			name: 'John doe',
			credit: 500,
		}
	}
}
