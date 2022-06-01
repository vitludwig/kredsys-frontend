
export interface IPlace {
	id?: number;
	name: string;
	type: EPlaceRole;
	apiToken?: string;
}

export enum EPlaceRole {
	INFO = 'Info',
	BAR = 'Bar',
	NPC = 'Npc',
}
