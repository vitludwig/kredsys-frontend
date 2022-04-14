import {Injectable, OnInit} from '@angular/core';
import {EUserRole, IUser} from '../../../../common/types/IUser';
import {HashMap} from '../../../../common/types/HashMap';

@Injectable({
	providedIn: 'root'
})
export class AuthService {
	public user: IUser | null = null;

	public get isLogged(): boolean {
		return true;
		// TODO: uncomment after login backend is available
		// return this.user !== null || !!localStorage.getItem('userId');
	}

	constructor() {
		const userId = Number(localStorage.getItem('userId')) ?? null;
		// if(userId) {
		// 	this.getUser(userId).then((user) => this.user = user);
		// }
	}

	public async getUser(id: number): Promise<void> {
		// return users[id + ''];
		return;
	}

	public async login(username: string, password: string): Promise<void> {
		// if(username === 'test' && password === 'test') {
		// 	this.user = users['2'];
		// 	localStorage.setItem('userId', '2');
		// }
		//
		// if(username === 'admin' && password === 'admin') {
		// 	this.user = users['1'];
		// 	localStorage.setItem('userId', '1');
		// }
	}

	public async logout(): Promise<void> {
		this.user = null;
		localStorage.removeItem('userId');
	}
}
