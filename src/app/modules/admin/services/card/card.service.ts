import {Injectable} from '@angular/core';
import {IPaginatedResponse} from '../../../../common/types/IPaginatedResponse';
import {ICard} from '../../../../common/types/ICard';

@Injectable({
	providedIn: 'root',
})
export class CardService {
	protected cards: ICard[] = [];
	protected limit = 5;

	constructor() {
		this.cards = Array.from({length: 2}, (_, k) => this.createNewCard(k + 1));
	}

	public async getCards(search: string = '', page: number = 1, limit = this.limit): Promise<IPaginatedResponse<ICard>> {
		const params = {
			offset: (page - 1) * this.limit,
			limit: limit,
		};
		let data = this.cards.slice(params.offset, params.offset + params.limit);
		if(search !== '') {
			data = data.filter((item) => (item.description.toLowerCase()).includes(search.toLowerCase()) || (item.uid!.toString()).includes(search));
		}

		return {
			total: this.cards.length,
			offset: params.offset,
			limit: params.limit,
			data: data,
		};
	}

	public createNewCard(id?: number): ICard {
		return {
			uid: id,
			description: 'card desc ' + id,
			type: 'Card',
			expirationDate: '', // "2022-04-02T14:54:52.794Z"
			blocked: false,
			userId: 1, // zatim je tu objekt uzivatele, Patrik by to mel zmenit jen na id
		};
	}
}
