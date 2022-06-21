import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {MatTableDataSource} from '@angular/material/table';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {map, merge, startWith, Subject, switchMap, takeUntil} from 'rxjs';
import {ActivatedRoute} from '@angular/router';
import {debounce} from '../../../../common/decorators/debounce';
import {ERoute} from 'src/app/common/types/ERoute';
import {PlaceService} from '../../services/place/place/place.service';
import {IPlace} from '../../../../common/types/IPlace';

@Component({
	selector: 'app-place-list',
	templateUrl: './place-list.component.html',
	styleUrls: ['./place-list.component.scss'],
})
export class PlaceListComponent implements OnInit, OnDestroy {
	public displayedColumns: string[] = ['name', 'role', 'actions'];
	public dataSource: MatTableDataSource<IPlace>;
	public placesTotal: number = 0;
	public placesData: IPlace[];
	public isPlacesLoading: boolean = false;
	public expandedRow: IPlace | null;

	@ViewChild(MatPaginator)
	public paginator: MatPaginator;

	@ViewChild(MatSort)
	public sort: MatSort;

	public readonly ERoute = ERoute;

	protected unsubscribe: Subject<void> = new Subject<void>();

	constructor(
		public route: ActivatedRoute,
		protected placeService: PlaceService,
	) {

	}

	public async ngOnInit(): Promise<void> {
		await this.loadPlaces();

		// If the user changes the sort order, reset back to the first page.
		this.sort.sortChange
			.pipe(takeUntil(this.unsubscribe))
			.subscribe(() => (this.paginator.pageIndex = 0));

		merge(this.sort.sortChange, this.paginator.page, this.paginator.pageSize)
			.pipe(
				startWith({}),
				switchMap(() => {
					this.isPlacesLoading = true;
					const offset = this.paginator.pageIndex * this.paginator.pageSize;

					return this.placeService.getPlaces(
						'',
						offset >= 0 ? offset : 0,
						this.paginator.pageSize
					);
				}),
				map((data) => {
					// Flip flag to show that loading has finished.
					this.isPlacesLoading = false;

					if(data === null) {
						return [];
					}

					this.placesTotal = data.total;
					return data.data;
				}),
				takeUntil(this.unsubscribe),
			)
			.subscribe((data) => {
				console.log('new data: ', data);
				this.placesData = data;
			});
	}

	@debounce()
	public onSearch(value: string): void {
		this.loadPlaces(value);
	}

	protected async loadPlaces(search: string = '', offset?: number, limit?: number): Promise<void> {
		const users = await this.placeService.getPlaces(search, offset, limit);

		this.placesData = users.data;
		this.placesTotal = users.total;
	}

	public applyFilter(event: Event): void {
		const filterValue = (event.target as HTMLInputElement).value;
		this.dataSource.filter = filterValue.trim().toLowerCase();

		if(this.dataSource.paginator) {
			this.dataSource.paginator.firstPage();
		}
	}

	public ngOnDestroy(): void {
		this.unsubscribe.next();
	}

}
