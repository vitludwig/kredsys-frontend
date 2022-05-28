import {Injectable} from '@angular/core';
import {IUser} from '../../../../common/types/IUser';
import {IPaginatedResponse} from '../../../../common/types/IPaginatedResponse';
import {firstValueFrom} from 'rxjs';
import {environment} from '../../../../../environments/environment';
import {HttpClient} from '@angular/common/http';
import {ICard} from '../../../../common/types/ICard';
import {ICurrencyAccount} from '../../../../common/types/ICurrency';
import {cache, invalidateCache} from '../../../../common/decorators/cache';
import {ETime} from '../../../../common/types/ETime';
import {ECacheTag} from '../../../../common/types/ECacheTag';

@Injectable({
	providedIn: 'root',
})
export class UsersService {
	protected users: IUser[];
	protected limit = 5;

	constructor(
		protected http: HttpClient,
	) {

	}

	@cache(ETime.DAY, [ECacheTag.USERS])
	public async getUsers(search: string = '', page: number = 1, limit = this.limit): Promise<IPaginatedResponse<IUser>> {
		const params = {
			offset: (page - 1) * this.limit,
			limit: limit,
			blocked: false, // TODO: create filtering of blocked users in grid
		};

		return firstValueFrom(this.http.get<IPaginatedResponse<IUser>>(environment.apiUrl + 'users', {params: params}));
	}

	@cache(ETime.DAY, [ECacheTag.USER])
	public async getUser(id: number): Promise<IUser> {
		return firstValueFrom(this.http.get<IUser>(environment.apiUrl + 'users/' + id));
	}

	@invalidateCache([ECacheTag.USERS, ECacheTag.USER])
	public async editUser(user: IUser): Promise<IUser> {
		return firstValueFrom(this.http.put<IUser>(environment.apiUrl + 'users/' + user.id, user));
	}

	/**
	 * Blocks user
	 * TODO: make backend to allow sending only partial data
	 *
	 * @param user
	 */
	@invalidateCache([ECacheTag.USERS, ECacheTag.USER])
	public async blockUser(user: IUser): Promise<IUser> {
		user.blocked = true;
		return firstValueFrom(this.http.put<IUser>(environment.apiUrl + 'users/' + user.id, user));
	}

	@invalidateCache([ECacheTag.USERS, ECacheTag.USER])
	public async addUser(user: IUser): Promise<IUser> {
		return firstValueFrom(this.http.post<IUser>(environment.apiUrl + 'users', user));
	}

	@cache(ETime.DAY, [ECacheTag.USER_CARDS])
	public async getUserCards(id: number): Promise<IPaginatedResponse<ICard>> {
		const params = {
			offset: 0,
			limit: 999,
		};

		return firstValueFrom(this.http.get<IPaginatedResponse<ICard>>(environment.apiUrl + 'users/' + id + '/cards', {params: params}));
	}

	public async getUserByCardUid(uid: number): Promise<IUser> {
		return firstValueFrom(this.http.get<IUser>(environment.apiUrl + 'cards/' + uid + '/user'));
	}

	@cache(ETime.DAY, [ECacheTag.USER])
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
			expirationDate: '2023-04-13T17:54:35.542Z',
		}));
	}

	@invalidateCache([ECacheTag.USER_CARDS])
	public deleteUserCard(id: number): Promise<void> {
		return firstValueFrom(this.http.delete<void>(environment.apiUrl + 'cards/' + id));
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
