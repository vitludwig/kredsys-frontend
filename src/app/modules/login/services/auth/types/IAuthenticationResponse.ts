import {EUserRole} from '../../../../../common/types/IUser';
import {EPermission} from './EPermission';

export interface IAuthenticationResponse {
	token: string;
	userId: number;
	placeId: number;
	roles: EUserRole[];
	permissions: EPermission[]; // TODO: create enum by App/Services/Auth/AclMaps.cs
}
