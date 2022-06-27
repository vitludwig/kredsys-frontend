import {Injectable, OnDestroy} from '@angular/core';
import {IPaginatedResponse} from '../../../../../common/types/IPaginatedResponse';
import {EPlaceRole, IPlace} from '../../../../../common/types/IPlace';
import {firstValueFrom, Subject, takeUntil} from 'rxjs';
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

	public get selectedPlace(): IPlace | null {
		return this.#selectedPlace;
	}

	public set selectedPlace(value: IPlace | null) {
		this.#selectedPlace = value;
		localStorage.setItem('selectedPlaceId', value?.id + '');
		localStorage.setItem('placeToken', value?.apiToken + '');
	}

	protected limit = 5;
	protected unsubscribe: Subject<void> = new Subject<void>()

	constructor(
		protected http: HttpClient,
		protected authService: AuthService,
	) {
		this.authService.isLogged$
			.pipe(takeUntil(this.unsubscribe))
			.subscribe(async (isLogged) => {
				const placeId = localStorage.getItem('selectedPlaceId');
				if(isLogged && placeId) {
					this.#selectedPlace = await this.getPlace(Number(placeId));
				}
			})
	}

	public ngOnDestroy() {
		this.unsubscribe.next();
	}

	@cache(ETime.HOUR, [ECacheTag.PLACES])
	public async getAllPlaces(search: string = ''): Promise<IPlace[]> {
		const params = {
			offset: 0,
			limit: 999,
		};

		return (await firstValueFrom(this.http.get<IPaginatedResponse<IPlace>>(environment.apiUrl + 'places', {params: params}))).data;
	}

	@cache(ETime.HOUR, [ECacheTag.PLACE])
	public async getPlaces(search: string = '', offset: number = 0, limit = this.limit): Promise<IPaginatedResponse<IPlace>> {
		const params = {
			offset: offset,
			limit: limit,
		};

		return firstValueFrom(this.http.get<IPaginatedResponse<IPlace>>(environment.apiUrl + 'places', {params: params}));
	}

	public async getPlace(id: number): Promise<IPlace> {
		return firstValueFrom(this.http.get<IPlace>(environment.apiUrl + 'places/' + id));
	}

	public async getPlaceGoods(id: number): Promise<IGoods[]> {
		const params = {
			offset: 0,
			limit: 999,
		};
		return (await firstValueFrom(this.http.get<IPaginatedResponse<IGoods>>(environment.apiUrl + 'places/' + id + '/goods', {params: params}))).data;
	}

	@cache(ETime.HOUR, [ECacheTag.TRANSACTION, ECacheTag.TRANSACTIONS])
	public async getPlaceTransactions(id: number, offset: number = 0, limit: number = 15, filterBy: Partial<ITransaction>): Promise<IPaginatedResponse<ITransaction>> {
		const params = {
			offset: offset,
			limit: limit,
			...filterBy,
		};

		return firstValueFrom(this.http.get<IPaginatedResponse<ITransaction>>(environment.apiUrl + 'places/' + id + '/transactions', {params: params}));
	}

	@invalidateCache([ECacheTag.PLACES, ECacheTag.PLACE])
	public async editPlace(item: IPlace): Promise<IPlace> {
		return firstValueFrom(this.http.put<IPlace>(environment.apiUrl + 'places/' + item.id, item));
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

	public createNewPlace(id?: number): IPlace {
		return {
			id: id,
			name: id ? 'New Place ' + id : '',
			type: EPlaceRole.BAR,
		};
	}
}
