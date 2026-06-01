import {Component, inject, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {MatTableDataSource} from '@angular/material/table';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {map, merge, startWith, Subject, switchMap, takeUntil} from 'rxjs';
import {debounce} from '../../../../common/decorators/debounce';
import {ERoute} from 'src/app/common/types/ERoute';
import {PlaceService} from '../../services/place/place/place.service';
import {IPlace} from '../../../../common/types/IPlace';
import {AuthService} from '../../../login/services/auth/auth.service';
import {EUserRole} from '../../../../common/types/IUser';

@Component({
    selector: 'app-place-list',
    templateUrl: './place-list.component.html',
    styleUrls: ['./place-list.component.scss'],
    standalone: false
})
export class PlaceListComponent implements OnInit, OnDestroy {
	public displayedColumns: string[] = ['name', 'actions'];
	public dataSource: MatTableDataSource<IPlace>;
	public placesTotal: number = 0;
	public placesData: IPlace[];
	public isPlacesLoading: boolean = false;

	@ViewChild(MatPaginator)
	public paginator: MatPaginator;

	@ViewChild(MatSort)
	public sort: MatSort;

	public readonly ERoute = ERoute;

	protected unsubscribe: Subject<void> = new Subject<void>();

	private placeService: PlaceService = inject(PlaceService);
	private authService: AuthService = inject(AuthService);

	// Non-admins (e.g. PowerSalesman) may only see/manage the place they have selected.
	private get restrictedToOwnPlace(): boolean {
		return !this.authService.hasRole(EUserRole.ADMIN);
	}

	public async ngOnInit(): Promise<void> {
		await this.loadPlaces();

		if(this.restrictedToOwnPlace) {
			// Only the selected place is shown — skip the paginated all-places stream.
			return;
		}

		merge(this.paginator.page, this.paginator.pageSize)
			.pipe(
				startWith({}),
				switchMap(() => {
					this.isPlacesLoading = true;

					return this.placeService.getPlaces(
						'',
						this.paginator.pageIndex + 1,
						this.paginator.pageSize
					);
				}),
				map((data) => {
					// Flip flag to show that loading has finished.
					this.isPlacesLoading = false;

					if(data === null) {
						return [];
					}

					this.placesTotal = data.count;
					return data.data;
				}),
				takeUntil(this.unsubscribe),
			)
			.subscribe((data) => {
				this.placesData = data;
			});
	}

	@debounce()
	public onSearch(value: string): void {
		this.loadPlaces(value);
	}

	protected async loadPlaces(filter: string = '', page?: number, pageSize?: number): Promise<void> {
		if(this.restrictedToOwnPlace) {
			const place = this.placeService.selectedPlace;
			this.placesData = place ? [place] : [];
			this.placesTotal = this.placesData.length;
			return;
		}

		const users = await this.placeService.getPlaces(filter, page, pageSize);

		this.placesData = users.data;
		this.placesTotal = users.count;
	}

	protected async deletePlace(id: number): Promise<void> {
		await this.placeService.deletePlace(id);
		await this.loadPlaces();
	}

	public ngOnDestroy(): void {
		this.unsubscribe.next();
	}

}
