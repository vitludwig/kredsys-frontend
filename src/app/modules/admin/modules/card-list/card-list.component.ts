import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {MatTableDataSource} from '@angular/material/table';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {map, merge, startWith, Subject, switchMap, takeUntil} from 'rxjs';
import {ActivatedRoute} from '@angular/router';
import {debounce} from '../../../../common/decorators/debounce';
import {ICard} from './types/ICard';
import { ERoute } from 'src/app/common/types/ERoute';
import {CardService} from '../../services/card/card.service';

@Component({
	selector: 'app-card-list',
	templateUrl: './card-list.component.html',
	styleUrls: ['./card-list.component.scss']
})
export class CardListComponent implements OnInit, OnDestroy {
	public displayedColumns: string[] = ['description', 'type', 'userId', 'actions'];
	public dataSource: MatTableDataSource<ICard>;
	public cardsTotal: number = 0;
	public cardsData: ICard[];
	public isLoading: boolean = false;
	public expandedRow: ICard | null;

	@ViewChild(MatPaginator)
	public paginator: MatPaginator;

	@ViewChild(MatSort)
	public sort: MatSort;

	public readonly ERoute = ERoute;

	protected unsubscribe: Subject<void> = new Subject<void>();

	constructor(
		public route: ActivatedRoute,
		protected cardService: CardService,
	) {

	}

	public async ngOnInit(): Promise<void> {
		await this.loadCards();

		// If the user changes the sort order, reset back to the first page.
		this.sort.sortChange
			.pipe(takeUntil(this.unsubscribe))
			.subscribe(() => (this.paginator.pageIndex = 0));

		merge(this.sort.sortChange, this.paginator.page)
			.pipe(
				startWith({}),
				switchMap(() => {
					this.isLoading = true;
					return this.cardService.getCards(
						'',
						this.paginator.pageIndex + 1,
					)
				}),
				map((data) => {
					// Flip flag to show that loading has finished.
					this.isLoading = false;

					if (data === null) {
						return [];
					}

					this.cardsTotal = data.total;
					return data.data;
				}),
				takeUntil(this.unsubscribe)
			)
			.subscribe((data) => {
				console.log('new data: ', data);
				this.cardsData = data
			});
	}

	@debounce()
	public onSearch(value: string): void {
		this.loadCards(value);
	}

	protected async loadCards(search: string = '', page: number = 1): Promise<void> {
		const users = await this.cardService.getCards(search, page);

		this.cardsData = users.data;
		this.cardsTotal = users.total;
	}

	public applyFilter(event: Event): void {
		const filterValue = (event.target as HTMLInputElement).value;
		this.dataSource.filter = filterValue.trim().toLowerCase();

		if (this.dataSource.paginator) {
			this.dataSource.paginator.firstPage();
		}
	}

	public ngOnDestroy(): void {
		this.unsubscribe.next();
	}

}
