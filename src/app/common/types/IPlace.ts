
export interface IPlace {
	id?: number;
	name: string;
	type: EPlaceRole;
}

export enum EPlaceRole {
	INFO = 'Info',
	BAR = 'Bar',
	NPC = 'Npc',
}
