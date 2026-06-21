
import {inject, Injectable} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {firstValueFrom, Observable} from 'rxjs';
import {IPaginatedResponse} from "../../../common/types/IPaginatedResponse";
import {ConfigService} from "../../../common/services/config/config.service";
import {IGroup, IGroupCreate} from "../types/IGroup";
import {IGroupStatistics} from "../types/IGroupStatistics";
import {IPublicGroupStatistics} from "../types/IPublicGroupStatistics";
import {invalidateCache} from "../../../common/decorators/cache";
import {ECacheTag} from "../../../common/types/ECacheTag";

@Injectable({
	providedIn: 'root',
})
export class GroupsService {
	private http: HttpClient = inject(HttpClient);
	private configService = inject(ConfigService);
	private apiUrl = `${this.configService.config.apiUrl}groups`; // Replace with your actual API URL

	public getGroups(search: string = '', page: number = 0, pageSize: number = 10): Observable<IPaginatedResponse<IGroup>> {
		let filter = "";
		if(search) {
			filter = `name#=*${search}/i`;
		}
		const params = {
			filter,
			page,
			pageSize
		};

		return this.http.get<IPaginatedResponse<IGroup>>(this.apiUrl, {params: params});
	}

	public getGroup(id: number): Observable<IGroup> {
		return this.http.get<IGroup>(`${this.apiUrl}/${id}`);
	}

	public createGroup(group: IGroupCreate): Observable<IGroup> {
		return this.http.post<IGroup>(this.apiUrl, group);
	}

	public updateGroup(id: number, group: any): Observable<IGroup> {
		return this.http.put<IGroup>(`${this.apiUrl}/${id}`, group);
	}

	public removeGroup(id: number): Observable<void> {
		return this.http.delete<void>(`${this.apiUrl}/${id}`);
	}

	public getGroupStatistics(currencyId: number): Observable<IGroupStatistics> {
		return this.http.get<IGroupStatistics>(`${this.configService.config.apiUrl}statistics/${currencyId}/groups-statistics`);
	}

	public getPublicGroupStatistics(): Observable<IPublicGroupStatistics> {
		return this.http.get<IPublicGroupStatistics>(`${this.configService.config.apiUrl}public/groups-statistics`);
	}

  @invalidateCache([ECacheTag.USER, ECacheTag.USERS])
	public addUserToGroup(userId: number, groupId: number): Promise<unknown> {
		return firstValueFrom(this.http.post(`${this.apiUrl}/${groupId}/users/${userId}`, {}));
	}

  @invalidateCache([ECacheTag.USER, ECacheTag.USERS])
  public removeUserFromGroup(userId: number, groupId: number): Promise<unknown> {
  	return firstValueFrom(this.http.delete(`${this.apiUrl}/${groupId}/users/${userId}`));
  }
}
