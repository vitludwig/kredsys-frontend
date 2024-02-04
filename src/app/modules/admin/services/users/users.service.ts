import {inject, Injectable} from '@angular/core';
import {EUserRole, IUser} from '../../../../common/types/IUser';
import {IPaginatedResponse} from '../../../../common/types/IPaginatedResponse';
import {firstValueFrom} from 'rxjs';
import {environment} from '../../../../../environments/environment';
import {HttpClient} from '@angular/common/http';
import {ICard} from '../../../../common/types/ICard';
import {ICurrencyAccount} from '../../../../common/types/ICurrency';
import {cache, invalidateCache} from '../../../../common/decorators/cache';
import {ETime} from '../../../../common/types/ETime';
import {ECacheTag} from '../../../../common/types/ECacheTag';
import {ITransaction} from "../../modules/transactions/services/transaction/types/ITransaction";
import {AuthService} from '../../../login/services/auth/auth.service';

@Injectable({
	providedIn: 'root',
})
export class UsersService {
	private http: HttpClient = inject(HttpClient);

	protected limit = 15;

	@cache(ETime.MINUTE * 2, [ECacheTag.USERS])
	public async getUsers(search: string = '', page: number = 0, pageSize = this.limit, blocked: boolean = false): Promise<IPaginatedResponse<IUser>> {
		let filter = `blocked=${blocked}`;

		if(search) {
			filter += `,name^${search}/i`;
		}
		const params = {
			filter,
			page,
			pageSize,
		};

		return firstValueFrom(this.http.get<IPaginatedResponse<IUser>>(environment.apiUrl + 'users', {params: params}));
	}

	@cache(ETime.MINUTE * 2, [ECacheTag.USER])
	public async getUser(id: number): Promise<IUser> {
		return firstValueFrom(this.http.get<IUser>(environment.apiUrl + 'users/' + id));
	}

	@invalidateCache([ECacheTag.USERS, ECacheTag.USER])
	public async editUser(user: IUser): Promise<IUser> {
		return firstValueFrom(this.http.put<IUser>(environment.apiUrl + 'users/' + user.id, user));
	}

	public async editRoles(userId: number, roles: EUserRole[]): Promise<void> {
		return firstValueFrom(this.http.put<void>(environment.apiUrl + 'users/' + userId + '/roles', {roles}));
	}

	/**
	 * Blocks user
	 * TODO: make backend to allow sending only partial data
	 *
	 * @param user
	 * @param value
	 */
	@invalidateCache([ECacheTag.USERS, ECacheTag.USER])
	public async setUserBlocked(user: IUser, value: boolean): Promise<IUser> {
		user.blocked = value;
		return firstValueFrom(this.http.put<IUser>(environment.apiUrl + 'users/' + user.id, user));
	}

	/**
	 * Unblocks user
	 * TODO: make backend to allow sending only partial data
	 *
	 * @param user
	 */
	@invalidateCache([ECacheTag.USERS, ECacheTag.USER])
	public async unblockUser(user: IUser): Promise<IUser> {
		user.blocked = false;
		return firstValueFrom(this.http.put<IUser>(environment.apiUrl + 'users/' + user.id, user));
	}

	@invalidateCache([ECacheTag.USERS, ECacheTag.USER])
	public async addUser(user: IUser): Promise<IUser> {
		return firstValueFrom(this.http.post<IUser>(environment.apiUrl + 'users', user));
	}

	@cache(ETime.MINUTE * 2, [ECacheTag.USER_CARDS])
	public async getUserCards(id: number): Promise<IPaginatedResponse<ICard>> {
		const params = {
			pageSize: 999,
		};

		return firstValueFrom(this.http.get<IPaginatedResponse<ICard>>(environment.apiUrl + 'users/' + id + '/cards', {params: params}));
	}

	@cache(ETime.MINUTE * 2, [ECacheTag.TRANSACTION, ECacheTag.TRANSACTIONS])
	public async getUserTransactions(id: number, page: number = 0, pageSize: number = 15, filter: string = '', orderBy: string = ''): Promise<IPaginatedResponse<ITransaction>> {
		const params = {
			filter,
			page,
			pageSize,
			orderBy,
		};

		return firstValueFrom(this.http.get<IPaginatedResponse<ITransaction>>(environment.apiUrl + 'users/' + id + '/transactions', {params: params}));
	}

	public async getUserByCardUid(uid: number): Promise<IUser> {
		return firstValueFrom(this.http.get<IUser>(environment.apiUrl + 'cards/' + uid + '/user'));
	}

	public async getUserCurrencyAccounts(userId: number): Promise<ICurrencyAccount[]> {
		const params = {
			pageSize: 999,
		};

		return (await firstValueFrom(this.http.get<IPaginatedResponse<ICurrencyAccount>>(environment.apiUrl + 'users/' + userId + '/accounts', {params: params}))).data;
	}

	@invalidateCache([ECacheTag.USER_CARDS])
	public async addUserCard(userId: number, cardUid: number, description: string = '', type: string = 'Card'): Promise<ICard> {
		return firstValueFrom(this.http.post<ICard>(environment.apiUrl + 'users/' + userId + '/card', {
			uid: cardUid,
			type: type,
			description: description,
			expirationDate: null,
		}));
	}

	@invalidateCache([ECacheTag.USER_CARDS])
	public deleteUserCard(id: number): Promise<void> {
		return firstValueFrom(this.http.delete<void>(environment.apiUrl + 'cards/' + id));
	}

	public changePassword(userId: number, oldPassword: string, newPassword: string): Promise<void> {
		return firstValueFrom(this.http.put<void>(environment.apiUrl + `users/${userId}/changepassword`, {
			oldPassword,
			newPassword,
		}));
	}

	public createNewUser(): IUser {
		return {
			name: '',
			email: '',
			memberId: null,
			blocked: false,
			roles: [],
		};
	}
}
