import {Injectable, OnDestroy} from '@angular/core';
import {IPaginatedResponse} from '../../../../../common/types/IPaginatedResponse';
import {EPlaceRole, IPlace, IPlaceGoodsResponse} from '../../../../../common/types/IPlace';
import {BehaviorSubject, firstValueFrom, Observable, Subject, takeUntil} from 'rxjs';
import {environment} from '../../../../../../environments/environment';
import {HttpClient} from '@angular/common/http';
import {IGoods} from '../../../../../common/types/IGoods';
import {AuthService} from '../../../../login/services/auth/auth.service';
import {cache, invalidateCache} from '../../../../../common/decorators/cache';
import {ETime} from '../../../../../common/types/ETime';
import {ECacheTag} from '../../../../../common/types/ECacheTag';
import {ITransaction} from "../../../modules/transactions/services/transaction/types/ITransaction";

@Injectable({
	providedIn: 'root',
})
export class PlaceService implements OnDestroy {
	#selectedPlace: IPlace | null;
	public placeRole: EPlaceRole;
	public placeRoleSubject: BehaviorSubject<EPlaceRole | null>;
	public placeRole$: Observable<EPlaceRole | null>;

	public selectedPlaceSubject: BehaviorSubject<IPlace | null>;
	public selectedPlace$: Observable<IPlace | null>;

	public get selectedPlace(): IPlace | null {
		return this.#selectedPlace;
	}

	public set selectedPlace(value: IPlace | null) {
		this.#selectedPlace = value;
		if(value) {
			this.getPlaceRole(value.id!).then((role) => {
				this.placeRole = role;
				this.placeRoleSubject.next(role);
			})
		}
		this.selectedPlaceSubject.next(value);
		localStorage.setItem('selectedPlaceId', value?.id + '');
		localStorage.setItem('placeToken', value?.apiToken + '');
	}

	protected limit = 5;
	protected unsubscribe: Subject<void> = new Subject<void>()

	constructor(
		protected http: HttpClient,
		protected authService: AuthService,
	) {
		this.selectedPlaceSubject = new BehaviorSubject<IPlace | null>(null);
		this.selectedPlace$ = this.selectedPlaceSubject.asObservable();

		this.placeRoleSubject = new BehaviorSubject<EPlaceRole | null>(null);
		this.placeRole$ = this.placeRoleSubject.asObservable();

		this.authService.isLogged$
			.pipe(takeUntil(this.unsubscribe))
			.subscribe(async (isLogged) => {
				const placeId = localStorage.getItem('selectedPlaceId');
				if(isLogged && placeId) {
					this.selectedPlace = await this.getPlace(Number(placeId));
				}
			})

		if(this.selectedPlace?.id) {
			this.getPlaceRole(this.selectedPlace.id).then((role) => {
				this.placeRole = role;
				this.placeRoleSubject.next(role);
			})
		}
	}

	public ngOnDestroy() {
		this.unsubscribe.next();
	}

	@cache(ETime.MINUTE * 2, [ECacheTag.PLACES])
	public async getAllPlaces(): Promise<IPlace[]> {
		const params = {
			pageSize: 999,
		};

		return (await firstValueFrom(this.http.get<IPaginatedResponse<IPlace>>(environment.apiUrl + 'places', {params: params}))).data;
	}

	@cache(ETime.MINUTE * 2, [ECacheTag.PLACE, ECacheTag.PLACES])
	public async getPlaces(filter: string = '', page: number = 0, pageSize: number = this.limit): Promise<IPaginatedResponse<IPlace>> {
		const params = {
			filter,
			page,
			pageSize
		};

		return firstValueFrom(this.http.get<IPaginatedResponse<IPlace>>(environment.apiUrl + 'places', {params: params}));
	}

	@cache(ETime.MINUTE * 2, [ECacheTag.PLACE])
	public async getPlace(id: number): Promise<IPlace> {
		return firstValueFrom(this.http.get<IPlace>(environment.apiUrl + 'places/' + id));
	}

	public async getPlaceRole(id: number): Promise<EPlaceRole> {
		const result = await firstValueFrom(this.http.get<{ roles: EPlaceRole[]}>(environment.apiUrl + 'places/' + id + '/roles'));
		return result.roles[0];
	}

	public async getPlaceGoods(id: number): Promise<IPlaceGoodsResponse[]> {
		const params = {
			pageSize: 999,
		};
		return (await firstValueFrom(this.http.get<IPaginatedResponse<IPlaceGoodsResponse>>(environment.apiUrl + 'places/' + id + '/goods', {params: params}))).data;
	}

	@cache(ETime.MINUTE * 2, [ECacheTag.TRANSACTION, ECacheTag.TRANSACTIONS])
	public async getPlaceTransactions(id: number, page: number = 0, pageSize: number = 15, filter: string): Promise<IPaginatedResponse<ITransaction>> {
		const params = {
			filter,
			page,
			pageSize
		};

		return firstValueFrom(this.http.get<IPaginatedResponse<ITransaction>>(environment.apiUrl + 'places/' + id + '/transactions', {params: params}));
	}

	@invalidateCache([ECacheTag.PLACES, ECacheTag.PLACE])
	public async editPlace(item: IPlace): Promise<IPlace> {
		return firstValueFrom(this.http.put<IPlace>(environment.apiUrl + 'places/' + item.id, item));
	}

	@invalidateCache([ECacheTag.PLACES, ECacheTag.PLACE])
	public async editPlaceRole(itemId: number, role: EPlaceRole): Promise<{ roles: EPlaceRole[] }> {
		return firstValueFrom(this.http.put<{ roles: EPlaceRole[] }>(environment.apiUrl + 'places/' + itemId + '/roles', {
			roles: [role]
		}));
	}

	@invalidateCache([ECacheTag.PLACES, ECacheTag.PLACE])
	public async addPlace(item: IPlace): Promise<IPlace> {
		return firstValueFrom(this.http.post<IPlace>(environment.apiUrl + 'places/', item));
	}

	@invalidateCache([ECacheTag.PLACES, ECacheTag.PLACE])
	public async addGoods(goodsId: number, placeId: number): Promise<void> {
		return firstValueFrom(this.http.post<void>(environment.apiUrl + 'places/' + placeId + '/goods?placeId=' + placeId + '&goodsId=' + goodsId, {
			placeId,
			goodsId,
		}));
	}

	@invalidateCache([ECacheTag.PLACES, ECacheTag.PLACE])
	public async removeGoods(goodsId: number, placeId: number): Promise<void> {
		return firstValueFrom(this.http.delete<void>(environment.apiUrl + 'places/' + placeId + '/goods/' + goodsId));
	}

	@invalidateCache([ECacheTag.PLACES, ECacheTag.PLACE])
	public async moveGoods(placeId: number, goodsId: number, afterGoodsId: number): Promise<void> {
		const params = {
			afterGoodsId,
		};
		return firstValueFrom(this.http.patch<void>(environment.apiUrl + 'places/' + placeId + '/goods/' + goodsId, {params: params}));
	}

	public createNewPlace(id?: number, name?: string, role?: EPlaceRole): IPlace {
		return {
			id: id,
			name: name ?? '',
			type: role ?? EPlaceRole.BAR,
		};
	}
}
