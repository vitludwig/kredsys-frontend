import {EUserRole} from '../../../../../common/types/IUser';

export interface IAuthenticationResponse {
	token: string;
	userId: number;
	placeId: number;
	roles: EUserRole[];
}
