import {Injectable} from '@angular/core';
import {IPaginatedResponse} from '../../../../../common/types/IPaginatedResponse';
import {EPlaceRole, IPlace, IPlaceSortimentItem} from '../../../../../common/types/IPlace';

@Injectable({
	providedIn: 'root'
})
export class PlaceService {
	#selectedPlace: IPlace | null;

	public get selectedPlace(): IPlace | null {
		const placeId = localStorage.getItem('selectedPlaceId')
		if(placeId) {
			return this.places.find((place) => place.id === Number(placeId)) ?? null;
		}
		return this.#selectedPlace;
	}

	public set selectedPlace(value: IPlace | null) {
		this.#selectedPlace = value;
		localStorage.setItem('selectedPlaceId', value?.id + '');
	}

	protected places: IPlace[] = [];
	protected sortiment: IPlaceSortimentItem[] = [];
	protected limit = 5;

	constructor() {
		// Create 100 users
		this.places = Array.from({length: 2}, (_, k) => this.createNewPlace(k + 1));
	}

	public async getAllPlaces(search: string = ''): Promise<IPaginatedResponse<IPlace>> {
		return {
			total: this.places.length,
			offset: 0,
			limit: 100,
			data: this.places,
		};
	}

	public async getPlaces(search: string = '', page: number = 1, limit = this.limit): Promise<IPaginatedResponse<IPlace>> {
		const params = {
			offset: (page - 1) * this.limit,
			limit: limit,
		};
		let data = this.places.slice(params.offset, params.offset + params.limit)
		if (search !== '') {
			data = data.filter((item) => (item.name.toLowerCase()).includes(search.toLowerCase()) || (item.id!.toString()).includes(search))
		}

		return {
			total: this.places.length,
			offset: params.offset,
			limit: params.limit,
			data: data,
		};
	}

	public async getPlace(id: number): Promise<IPlace | undefined> {
		return this.places.find((place) => place.id === id);
	}

	public async editPlace(place: IPlace): Promise<void> {
		let u = this.places.find((p) => p.id === place.id);
		if (u) {
			u = place;
		}
	}

	public async addPlace(place: IPlace): Promise<void> {
		this.places.push(place);
		console.log('place added');
	}

	public createNewPlace(id?: number): IPlace {
		return {
			id: id,
			name: id ? 'New Place ' + id : '',
			role: EPlaceRole.BAR,
			goods: [],
		};
	}
}
