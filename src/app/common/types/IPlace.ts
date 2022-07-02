
export interface IPlace {
	id?: number;
	name: string;
	type: EPlaceRole;
	apiToken?: string;
}

export enum EPlaceRole {
	BAR = 'Bar',
	USER_INFO = 'UserInfo',
	REGISTRATION = 'Registration',
	INFO_POINT = 'AdminPoint'
}
