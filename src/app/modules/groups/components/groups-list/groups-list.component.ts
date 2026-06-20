import {Component, inject, signal, WritableSignal} from '@angular/core';

import {MatTableModule} from '@angular/material/table';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {GroupsService} from '../../services/groups.service';
import {RouterLink} from '@angular/router';
import {ERoute} from 'src/app/common/types/ERoute';
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatInputModule} from "@angular/material/input";
import {IGroup} from "../../types/IGroup";
import {ClickConfirmDirective} from "../../../../common/directives/click-confirm/click-confirm.directive";
import { HttpErrorResponse } from "@angular/common/http";
import {AlertService} from "../../../../common/services/alert/alert.service";
import {FormControl, ReactiveFormsModule} from "@angular/forms";
import {
	BehaviorSubject,
	catchError,
	combineLatest,
	debounceTime,
	distinctUntilChanged,
	EMPTY,
	mergeMap,
	of,
	startWith,
	Subject,
	switchMap,
	tap
} from "rxjs";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";

@Component({
	selector: 'app-groups-list',
	templateUrl: './groups-list.component.html',
	styleUrls: ['./groups-list.component.scss'],
	imports: [
		MatTableModule,
		MatButtonModule,
		MatIconModule,
		MatFormFieldModule,
		MatInputModule,
		RouterLink,
		ClickConfirmDirective,
		ReactiveFormsModule
	]
})
export class GroupsListComponent {
	private groupsService = inject(GroupsService);
	private alertService = inject(AlertService);

	protected groups: WritableSignal<IGroup[]> = signal([]);
	protected groupsTotal: WritableSignal<number> = signal(0);
	protected displayedColumns: string[] = ['name', 'memberCount', 'actions'];

	protected searchControl = new FormControl<string>('', {nonNullable: true});
	private refresh$ = new BehaviorSubject<void>(void 0);
	private removeGroup$ = new Subject<number>();

	protected ERoute = ERoute;

	constructor() {
		combineLatest([
			this.searchControl.valueChanges.pipe(
				startWith(''),
				debounceTime(300),
				distinctUntilChanged(),
			),
			this.refresh$,
		]).pipe(
			switchMap(([search]) => this.groupsService.getGroups(search).pipe(
				catchError((e) => {
					console.error('Cannot load groups', e);
					this.alertService.error('Nepodařilo se načíst skupiny');
					return of({data: [], count: 0});
				})
			)),
			takeUntilDestroyed(),
		).subscribe((data) => {
			this.groups.set(data.data);
			this.groupsTotal.set(data.count);
		});

		this.removeGroup$.pipe(
			mergeMap((id) => this.groupsService.removeGroup(id).pipe(
				tap(() => this.refresh$.next()),
				catchError((e) => {
					console.error('Cannot remove group', e);
					if (e instanceof HttpErrorResponse && e.error.Message) {
						this.alertService.error(e.error.Message);
					} else {
						this.alertService.error('Nepodařilo se odstranit skupinu');
					}
					return EMPTY;
				})
			)),
			takeUntilDestroyed(),
		).subscribe();
	}

	protected removeGroup(id: number): void {
		this.removeGroup$.next(id);
	}
}
