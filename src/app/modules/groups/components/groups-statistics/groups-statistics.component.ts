import {Component, inject, signal} from '@angular/core';
import {GroupsService} from "../../services/groups.service";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {catchError, of, switchMap, timer} from "rxjs";
import {CurrencyService} from "../../../admin/services/currency/currency.service";
import {AlertService} from "../../../../common/services/alert/alert.service";
import {GroupsScoreboardComponent} from "../groups-scoreboard/groups-scoreboard.component";
import {IScoreboardGroup} from "../../types/IScoreboardGroup";

@Component({
	selector: 'app-groups-statistics',
	imports: [GroupsScoreboardComponent],
	templateUrl: './groups-statistics.component.html',
	styleUrl: './groups-statistics.component.scss'
})
export class GroupsStatisticsComponent {
	private groupsService = inject(GroupsService);
	private currencyService = inject(CurrencyService);
	private alertService = inject(AlertService);

	protected scoreboard = signal<IScoreboardGroup[] | null>(null);

	constructor() {
		this.currencyService.getDefaultCurrency$().pipe(
			switchMap(currency => {
				if (!currency || !currency.id) {
					return of(null);
				}
				const currencyId = currency.id;
				return timer(0, 10000).pipe(
					switchMap(() => this.groupsService.getGroupStatistics(currencyId).pipe(
						catchError(err => {
							console.error('Failed to load group statistics', err);
							this.alertService.error('Chyba při načítání statistik');
							return of(null);
						})
					))
				);
			}),
			takeUntilDestroyed(),
		).subscribe(stats => {
			if (!stats || !stats.groupsStatistics) {
				this.scoreboard.set(null);
				return;
			}
			this.scoreboard.set(stats.groupsStatistics.map(g => ({
				id: g.group.id,
				name: g.group.name,
				color: g.group.color,
				total: g.statistics.goods.reduce((sum, item) => sum + item.sumPrice, 0),
			})));
		});
	}
}
