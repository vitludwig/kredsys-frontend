import {EUserRole} from '../../../../../common/types/IUser';

export interface IAuthenticationResponse {
	token: string;
	userId: number;
	placeId: number;
	roles: EUserRole[];
	permissions: string[]; // TODO: create enum by App/Services/Auth/AclMaps.cs
}
