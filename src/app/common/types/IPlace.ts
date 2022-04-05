import {ESaleItemType} from '../../modules/sale/types/ESaleItemType';

export interface IPlace {
	id?: number;
	name: string;
	role: EPlaceRole;
	goods: IPlaceSortimentItem[];
}

export interface IPlaceSortimentItem {
	id?: number,
	name: string;
	price: number | null;
	currency: unknown;
	type: ESaleItemType;
}

export enum EPlaceRole {
	INFO = 'info',
	BAR = 'bar',
	NPC = 'npc',
}
