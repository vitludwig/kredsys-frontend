import { IUser } from './IUser';

// Result of GET cards/{uid}/user. The card loads even when expired (so withdraw stays possible);
// `expired` tells the UI to block payment/deposit and show a warning. Blocked cards return 404.
export interface IUserByCard {
	user: IUser;
	expired: boolean;
}
