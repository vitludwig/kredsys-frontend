import {Pipe, PipeTransform} from '@angular/core';
import {ISaleItem} from '../../../types/ISaleItem';

@Pipe({
	name: 'filterSaleItems',
	standalone: true
})
export class FilterSaleItemsPipe implements PipeTransform {

	public transform(value: ISaleItem[], filters: number[]): ISaleItem[] {
		if(filters.length === 0) {
			return value;
		}

		return value.filter((item) => filters.includes(item.type!));
	}

}
