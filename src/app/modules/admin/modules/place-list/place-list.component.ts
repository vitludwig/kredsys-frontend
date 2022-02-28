import {Component, OnInit, ViewChild} from '@angular/core';
import {MatTableDataSource} from '@angular/material/table';
import {IUser} from '../../../../common/types/IUser';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {map, merge, startWith, Subject, switchMap, takeUntil} from 'rxjs';
import {ActivatedRoute} from '@angular/router';
import {UsersService} from '../../services/user/users.service';
import {MatDialog} from '@angular/material/dialog';
import {debounce} from '../../../../common/decorators/debounce';
import {UserEditComponent} from '../user-list/components/user-edit/user-edit.component';
import {ERoute} from 'src/app/common/types/ERoute';
import {Animations} from '../../../../common/utils/animations';

@Component({
	selector: 'app-place-list',
	templateUrl: './place-list.component.html',
	styleUrls: ['./place-list.component.scss'],
	animations: [
		Animations.expandableTable
	],
})
export class PlaceListComponent implements OnInit {
	public displayedColumns: string[] = ['name', 'role', 'actions'];
	public dataSource: MatTableDataSource<IUser>;
	public placesTotal: number = 0;
	public placesData: IUser[];
	public isPlacesLoading: boolean = false;
	public expandedRow: IUser | null;

	@ViewChild(MatPaginator)
	public paginator: MatPaginator;

	@ViewChild(MatSort)
	public sort: MatSort;

	public readonly ERoute = ERoute;

	protected unsubscribe: Subject<void> = new Subject<void>();

	constructor(
		public route: ActivatedRoute,
		protected usersService: UsersService,
		protected dialog: MatDialog
	) {

	}

	public async ngOnInit(): Promise<void> {
		await this.loadPlaces();

		// If the user changes the sort order, reset back to the first page.
		this.sort.sortChange
			.pipe(takeUntil(this.unsubscribe))
			.subscribe(() => (this.paginator.pageIndex = 0));

		merge(this.sort.sortChange, this.paginator.page)
			.pipe(
				startWith({}),
				switchMap(() => {
					this.isPlacesLoading = true;
					return this.usersService.getUsers(
						'',
						this.paginator.pageIndex + 1,
					)
				}),
				map((data) => {
					// Flip flag to show that loading has finished.
					this.isPlacesLoading = false;

					if (data === null) {
						return [];
					}

					this.placesTotal = data.total;
					return data.data;
				}),
				takeUntil(this.unsubscribe)
			)
			.subscribe((data) => {
				console.log('new data: ', data);
				this.placesData = data
			});
	}

	@debounce()
	public onSearch(value: string): void {
		this.loadPlaces(value);
	}

	protected async loadPlaces(search: string = '', page: number = 1): Promise<void> {
		const users = await this.usersService.getUsers(search, page);

		this.placesData = users.data;
		this.placesTotal = users.total;
	}

	public applyFilter(event: Event): void {
		const filterValue = (event.target as HTMLInputElement).value;
		this.dataSource.filter = filterValue.trim().toLowerCase();

		if (this.dataSource.paginator) {
			this.dataSource.paginator.firstPage();
		}
	}

	public openUserEditDialog(data: IUser): void {
		this.dialog.open<UserEditComponent, IUser>(UserEditComponent, {
			width: '300px',
			minWidth: '250px',
			autoFocus: 'dialog',
			data: Object.assign({}, data),
		});
	}

	public ngOnDestroy(): void {
		this.unsubscribe.next();
	}

}
