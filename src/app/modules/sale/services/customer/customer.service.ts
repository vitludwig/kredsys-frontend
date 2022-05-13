import {Injectable, Renderer2} from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs';
import {IUser} from '../../../../common/types/IUser';

@Injectable({
	providedIn: 'root'
})
export class CustomerService {
	#customerSubject: BehaviorSubject<IUser | null>;
	public customer$: Observable<IUser | null>;

	public isLogged: boolean = false;

	public get customer(): IUser | null {
		return this.#customerSubject.getValue();
	}

	public set customer(value: IUser | null) {
		this.#customerSubject.next(value);
		this.isLogged = value !== null;
	}

	constructor() {
		this.#customerSubject = new BehaviorSubject<IUser | null>(null);
		this.customer$ = this.#customerSubject.asObservable();
	}

	public logout(): void {
		this.customer = null;
	}
}