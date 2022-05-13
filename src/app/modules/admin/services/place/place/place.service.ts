import {Injectable} from '@angular/core';
import {IPaginatedResponse} from '../../../../../common/types/IPaginatedResponse';
import {EPlaceRole, IPlace} from '../../../../../common/types/IPlace';
import {firstValueFrom} from 'rxjs';
import {environment} from '../../../../../../environments/environment';
import {HttpClient} from '@angular/common/http';
import {IGoods} from '../../../../../common/types/IGoods';

@Injectable({
	providedIn: 'root'
})
export class PlaceService {
	#selectedPlace: IPlace | null;

	public get selectedPlace(): IPlace | null {
		return this.#selectedPlace;
	}

	public set selectedPlace(value: IPlace | null) {
		this.#selectedPlace = value;
		localStorage.setItem('selectedPlaceId', value?.id + '');
	}

	protected limit = 5;

	constructor(
		protected http: HttpClient,
	) {
		const placeId = localStorage.getItem('selectedPlaceId')
		if(placeId) {
			this.getPlace(Number(placeId)).then((place) => {
				this.#selectedPlace = place
			})
		}
	}

	public async getAllPlaces(search: string = ''): Promise<IPlace[]> {
		const params = {
			offset: 0,
			limit: 999,
		};

		return (await firstValueFrom(this.http.get<IPaginatedResponse<IPlace>>(environment.apiUrl + 'places', {params: params}))).data;
	}

	public async getPlaces(search: string = '', page: number = 1, limit = this.limit): Promise<IPaginatedResponse<IPlace>> {
		const params = {
			offset: (page - 1) * this.limit,
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

	public async editPlace(item: IPlace): Promise<IPlace> {
		return firstValueFrom(this.http.put<IPlace>(environment.apiUrl + 'places/' + item.id, item));
	}

	public async addPlace(item: IPlace): Promise<IPlace> {
		return firstValueFrom(this.http.post<IPlace>(environment.apiUrl + 'place/', item));
	}

	public async addGoods(goodsId: number, placeId: number): Promise<void> {
		return firstValueFrom(this.http.post<void>(environment.apiUrl + 'places/' + placeId + '/goods?placeId='+placeId+'&goodsId='+goodsId, {
			placeId,
			goodsId,
		}));
	}

	public createNewPlace(id?: number): IPlace {
		return {
			id: id,
			name: id ? 'New Place ' + id : '',
			type: EPlaceRole.BAR,
		};
	}
}
