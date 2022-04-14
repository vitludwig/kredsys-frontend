
export interface IPlace {
	id?: number;
	name: string;
	type: EPlaceRole;
}

export enum EPlaceRole {
	INFO = 'info',
	BAR = 'bar',
	NPC = 'npc',
}
