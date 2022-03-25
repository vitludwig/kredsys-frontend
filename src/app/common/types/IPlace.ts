import {ESaleItemType} from '../../modules/sale/types/ESaleItemType';

export interface IPlace {
	id?: number;
	name: string;
	role: EPlaceRole;
}

export interface IPlaceSortimentItem {
	name: string;
	price: number;
	currency: unknown;
	type: ESaleItemType;
}

export enum EPlaceRole {
	INFO = 'info',
	BAR = 'bar',
	NPC = 'npc',
}
