import {Injectable} from '@angular/core';
import {IPaginatedResponse} from '../../../../../common/types/IPaginatedResponse';
import {EPlaceRole, IPlace, IPlaceSortimentItem} from '../../../../../common/types/IPlace';

@Injectable({
	providedIn: 'root'
})
export class PlaceService {
	protected places: IPlace[] = [];
	protected sortiment: IPlaceSortimentItem[] = [];
	protected limit = 5;

	constructor() {
		// Create 100 users
		this.places = Array.from({length: 100}, (_, k) => this.createNewPlace(k + 1));
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
	}

	public async getSortiment(): Promise<IPlaceSortimentItem[]> {
		return this.sortiment;
	}

	public async editSortiment(data: IPlaceSortimentItem[]): Promise<void> {
		this.sortiment = Object.assign({}, data);
	}

	public async addSortimentItem(item: IPlaceSortimentItem): Promise<void> {
		this.sortiment.push(item);
	}

	public createNewPlace(id?: number): IPlace {
		return {
			id: id,
			name: id ? 'New Place ' + id : '',
			role: EPlaceRole.BAR,
		};
	}
}
