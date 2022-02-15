import {ESaleItemType} from './ESaleItemType';

export interface ISaleItem {
	id: number;
	name: string;
	price: number;
	type: ESaleItemType;
	image?: string; // only for frontend use? for now
}
