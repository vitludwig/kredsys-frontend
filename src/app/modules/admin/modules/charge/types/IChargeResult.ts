import {IUser} from '../../../../../common/types/IUser';
import {ICurrencyAccount} from '../../../../../common/types/ICurrency';

export interface IChargeResult {
	amount: number;
	user: IUser;
	currencyId?: number;
}
