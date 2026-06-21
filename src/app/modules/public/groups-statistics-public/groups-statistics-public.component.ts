import {Component, inject, signal} from '@angular/core';
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {catchError, of, switchMap, timer} from "rxjs";
import {GroupsService} from "../../groups/services/groups.service";
import {GroupsScoreboardComponent} from "../../groups/components/groups-scoreboard/groups-scoreboard.component";
import {IScoreboardGroup} from "../../groups/types/IScoreboardGroup";

@Component({
	selector: 'app-groups-statistics-public',
	imports: [GroupsScoreboardComponent],
	templateUrl: './groups-statistics-public.component.html',
})
export class PublicGroupsStatisticsComponent {
	private groupsService = inject(GroupsService);

	protected scoreboard = signal<IScoreboardGroup[] | null>(null);

	constructor() {
		timer(0, 10000).pipe(
			switchMap(() => this.groupsService.getPublicGroupStatistics().pipe(
				catchError(err => {
					console.error('Failed to load public group statistics', err);
					return of(null);
				})
			)),
			takeUntilDestroyed(),
		).subscribe(stats => {
			if (!stats || !stats.groups) {
				this.scoreboard.set(null);
				return;
			}
			this.scoreboard.set(stats.groups.map(g => ({
				id: g.id,
				name: g.name,
				color: g.color,
				total: g.points,
			})));
		});
	}
}
