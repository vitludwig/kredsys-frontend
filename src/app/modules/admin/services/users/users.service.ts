import {Injectable} from '@angular/core';
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

@Injectable({
	providedIn: 'root',
})
export class UsersService {
	protected users: IUser[];
	protected limit = 15;

	constructor(
		protected http: HttpClient,
	) {

	}

	@cache(ETime.MINUTE * 2, [ECacheTag.USERS])
	public async getUsers(search: string = '', offset: number = 0, limit = this.limit, blocked: boolean = false): Promise<IPaginatedResponse<IUser>> {
		const params = {
			offset: offset,
			limit: limit,
			blocked: blocked, // TODO: create filtering of blocked users in grid
			name: search,
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
			offset: 0,
			limit: 999,
		};

		return firstValueFrom(this.http.get<IPaginatedResponse<ICard>>(environment.apiUrl + 'users/' + id + '/cards', {params: params}));
	}

	@cache(ETime.MINUTE * 2, [ECacheTag.TRANSACTION, ECacheTag.TRANSACTIONS])
	public async getUserTransactions(id: number, offset: number = 0, limit: number = 15, filterBy?: Partial<ITransaction>): Promise<IPaginatedResponse<ITransaction>> {
		const params = {
			offset: offset,
			limit: limit,
			...filterBy,
		};

		return firstValueFrom(this.http.get<IPaginatedResponse<ITransaction>>(environment.apiUrl + 'users/' + id + '/transactions', {params: params}));
	}

	public async getUserByCardUid(uid: number): Promise<IUser> {
		return firstValueFrom(this.http.get<IUser>(environment.apiUrl + 'cards/' + uid + '/user'));
	}

	public async getUserCurrencyAccounts(userId: number): Promise<ICurrencyAccount[]> {
		const params = {
			offset: 0,
			limit: 999,
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

	public createNewUser(id?: number): IUser {
		return {
			name: '',
			email: '',
			memberId: null,
			blocked: false,
		};
	}
}
