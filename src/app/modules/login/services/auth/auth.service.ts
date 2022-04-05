import {Injectable} from '@angular/core';
import {EUserRole, IUser} from '../../../../common/types/IUser';

@Injectable({
	providedIn: 'root'
})
export class AuthService {
	public user: IUser | null = null;

	public get isLogged(): boolean {
		return this.user !== null || !!localStorage.getItem('isLogged');
	}

	constructor() {
	}

	public async login(username: string, password: string): Promise<void> {
		if(username === 'test' && password === 'test') {
			this.user = {
				id: 2,
				name: 'Merchant',
				role: EUserRole.MERCHANT, // basic, band, org...
			}
			localStorage.setItem('isLogged', 'true');
		}

		if(username === 'admin' && password === 'admin') {
			this.user = {
				id: 1,
				name: 'Admin',
				role: EUserRole.ADMIN, // basic, band, org...
			}
			localStorage.setItem('isLogged', 'true');
		}
	}
}
