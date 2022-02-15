import {ISaleItem} from '../../../types/ISaleItem';

export interface ISaleDialogData {
	item: ISaleItem;
	edit: boolean;
	count?: number; // in case of edit mode, pass count
}
