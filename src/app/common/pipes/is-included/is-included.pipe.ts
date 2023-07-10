import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
	name: 'isIncluded',
	standalone: true,
})
export class IsIncludedPipe<T> implements PipeTransform {
	
	public transform(item: T, array: T[]): boolean {
		return array.includes(item);
	}
	
}
