export interface IPlace {
	id: number;
	name: string;
	role: EPlaceRole;
}

export enum EPlaceRole {
	INFO = 'info',
	BAR = 'bar',
	NPC = 'npc',
}
