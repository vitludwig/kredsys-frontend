import {Pipe, PipeTransform} from '@angular/core';
import {filter, map, Observable} from 'rxjs';
import {ActivationEnd, Event} from '@angular/router';

@Pipe({
	name: 'pageName',
	standalone: true
})
export class PageNamePipe implements PipeTransform {
	public transform(events: Observable<Event>): Observable<string> {
		return events.pipe(
			filter((e): e is ActivationEnd => e instanceof ActivationEnd && e.snapshot.data.hasOwnProperty('name')),
			map((e) => {
				return e.snapshot.data['name'] ?? '';
			})
		);
	}

}
