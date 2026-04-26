import { IPlace, EPlaceRole } from '../../../src/app/common/types/IPlace';

export const places: (IPlace & { id: number })[] = [
	{ id: 1, name: 'Hlavní bar',     type: EPlaceRole.BAR,          apiToken: 'token-bar-1' },
	{ id: 2, name: 'Vedlejší bar',   type: EPlaceRole.BAR,          apiToken: 'token-bar-2' },
	{ id: 3, name: 'Registrace',     type: EPlaceRole.REGISTRATION, apiToken: 'token-reg-1' },
];

export const place1 = places[0];
export const place2 = places[1];
export const placeRegistration = places[2];
