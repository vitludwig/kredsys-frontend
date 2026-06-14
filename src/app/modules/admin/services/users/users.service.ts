import {inject, Injectable} from '@angular/core';
import {EUserRole, IUser} from '../../../../common/types/IUser';
import {IPaginatedResponse} from '../../../../common/types/IPaginatedResponse';
import {firstValueFrom, map} from 'rxjs';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import {ICard, EUserCardType} from '../../../../common/types/ICard';
import {IUserByCard} from '../../../../common/types/IUserByCard';
import {ICurrencyAccount} from '../../../../common/types/ICurrency';
import {cache, invalidateCache} from '../../../../common/decorators/cache';
import {ETime} from '../../../../common/types/ETime';
import {ECacheTag} from '../../../../common/types/ECacheTag';
import {ITransactionResponse} from "../../modules/transactions/services/transaction/types/ITransaction";
import {IPublicUserInfo} from "../../../public/card-info-public/types/IPublicUserInfo";
import {ConfigService} from "../../../../common/services/config/config.service";

@Injectable({
	providedIn: 'root',
})
export class UsersService {
	private http: HttpClient = inject(HttpClient);
	private configService: ConfigService = inject(ConfigService);

	protected limit = 15;

	@cache(ETime.MINUTE * 2, [ECacheTag.USERS])
	public async getUsers(search: string = '', page: number = 0, pageSize = this.limit, blocked: boolean = false): Promise<IPaginatedResponse<IUser>> {
		let filter = `blocked=${blocked}`;

		if(search) {
			filter += `,name#=*${search}/i | memberId ^ ${search}`;
		}
		const params = {
			filter,
			page,
			pageSize,
			includeBlocked: blocked,
		};

		return firstValueFrom(this.http.get<IPaginatedResponse<IUser>>(this.configService.config.apiUrl + 'users', {params: params}));
	}

	@cache(ETime.MINUTE * 2, [ECacheTag.USER])
	public async getUser(id: number): Promise<IUser> {
		return firstValueFrom(this.http.get<IUser>(this.configService.config.apiUrl + 'users/' + id));
	}

	@invalidateCache([ECacheTag.USERS, ECacheTag.USER])
	public async editUser(user: IUser): Promise<IUser> {
		return firstValueFrom(this.http.put<IUser>(this.configService.config.apiUrl + 'users/' + user.id, user));
	}

	public async editRoles(userId: number, roles: EUserRole[]): Promise<void> {
		return firstValueFrom(this.http.put<void>(this.configService.config.apiUrl + 'users/' + userId + '/roles', {roles}));
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
		return firstValueFrom(this.http.put<IUser>(this.configService.config.apiUrl + 'users/' + user.id, user));
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
		return firstValueFrom(this.http.put<IUser>(this.configService.config.apiUrl + 'users/' + user.id, user));
	}

	@invalidateCache([ECacheTag.USERS, ECacheTag.USER])
	public async addUser(user: IUser): Promise<IUser> {
		if(user.email === '') {
			user.email = null;
		}
		return firstValueFrom(this.http.post<IUser>(this.configService.config.apiUrl + 'users', user));
	}

	@cache(ETime.MINUTE * 2, [ECacheTag.USER_CARDS])
	public async getUserCards(id: number, includeBlocked: boolean = false): Promise<IPaginatedResponse<ICard>> {
		const params = {
			pageSize: 999,
			includeBlocked,
		};

		return firstValueFrom(this.http.get<IPaginatedResponse<ICard>>(this.configService.config.apiUrl + 'users/' + id + '/cards', {params: params}));
	}

	@cache(ETime.MINUTE * 2, [ECacheTag.TRANSACTION, ECacheTag.TRANSACTIONS])
	public async getUserTransactions(id: number, page: number = 0, pageSize: number = 15, filter: string = '', orderBy: string = ''): Promise<IPaginatedResponse<ITransactionResponse>> {
		const params = {
			filter,
			page,
			pageSize,
			orderBy,
		};

		return firstValueFrom(this.http.get<IPaginatedResponse<ITransactionResponse>>(this.configService.config.apiUrl + 'users/' + id + '/transactions', {params: params}));
	}

	public async getUserByCardUid(uid: number): Promise<IUserByCard> {
		return firstValueFrom(this.http.get<IUserByCard>(this.configService.config.apiUrl + 'cards/' + uid + '/user'));
	}

	public async getPublicUserIdByCardUid(uid: number): Promise<number | null> {
		return firstValueFrom(this.http.get<{userId: number | null}>('/kredsys-api/userIdByCard/' + uid).pipe(
			map((result) => result.userId ?? null)
		));
	}

	// Check whether a card UID is already assigned to a user. Uses the authed /api/v1.1 endpoint
	// (the public userIdByCard route is not proxied in all environments). 404 = free, 200 = assigned.
	public async isCardAssigned(uid: number): Promise<boolean> {
		try {
			await this.getUserByCardUid(uid);
			return true;
		} catch(e) {
			if(e instanceof HttpErrorResponse && e.status === 404) {
				return false;
			}
			throw e;
		}
	}

	public async getPublicUserInfo(userId: number, token: string): Promise<IPublicUserInfo | null> {
		return firstValueFrom(this.http.get<IPublicUserInfo>(`/kredsys-api/userInfo/${userId}/${token}`).pipe(
			map((result) => Object.keys(result).length === 0 ? null : result)
		));
	}

	public async getUserCurrencyAccounts(userId: number): Promise<ICurrencyAccount[]> {
		const params = {
			pageSize: 999,
		};

		return (await firstValueFrom(this.http.get<IPaginatedResponse<ICurrencyAccount>>(this.configService.config.apiUrl + 'users/' + userId + '/accounts', {params: params}))).data;
	}

	@invalidateCache([ECacheTag.USER_CARDS])
	public async addUserCard(userId: number, cardUid: number, description: string = '', type: EUserCardType = EUserCardType.CARD, expirationDate: string | null = null): Promise<ICard> {
		return firstValueFrom(this.http.post<ICard>(this.configService.config.apiUrl + 'users/' + userId + '/card', {
			uid: cardUid,
			type: type,
			description: description,
			expirationDate: expirationDate,
		}));
	}

	@invalidateCache([ECacheTag.USER_CARDS])
	public async setUserCardExpiration(card: ICard, expirationDate: string | null): Promise<ICard> {
		return firstValueFrom(this.http.put<ICard>(this.configService.config.apiUrl + 'cards/' + card.id, {
			type: card.type,
			description: card.description ?? '',
			expirationDate: expirationDate,
		}));
	}

	@invalidateCache([ECacheTag.USER_CARDS])
	public blockUserCard(id: number): Promise<void> {
		return firstValueFrom(this.http.put<void>(this.configService.config.apiUrl + 'cards/' + id + '/block', null));
	}

	@invalidateCache([ECacheTag.USER_CARDS])
	public unblockUserCard(id: number): Promise<void> {
		return firstValueFrom(this.http.put<void>(this.configService.config.apiUrl + 'cards/' + id + '/unblock', null));
	}

	@invalidateCache([ECacheTag.USER_CARDS])
	public deleteUserCard(id: number): Promise<void> {
		return firstValueFrom(this.http.delete<void>(this.configService.config.apiUrl + 'cards/' + id));
	}

	public changePassword(userId: number, oldPassword: string, newPassword: string): Promise<void> {
		return firstValueFrom(this.http.put<void>(this.configService.config.apiUrl + `users/${userId}/changepassword`, {
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
			password: '',
		};
	}
}
