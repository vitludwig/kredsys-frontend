import {ESaleItemType} from './ESaleItemType';
import {IPlaceSortimentItem} from '../../../common/types/IPlace';

export interface ISaleItem extends IPlaceSortimentItem {
	image?: string; // only for frontend use? for now
}
