import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {MatTableDataSource} from '@angular/material/table';
import {IUser} from '../../../../common/types/IUser';
import {UsersService} from '../../services/user/users.service';
import {map, merge, startWith, Subject, switchMap, takeUntil} from 'rxjs';
import {debounce} from '../../../../common/decorators/debounce';
import {ERoute} from '../../../../common/types/ERoute';
import {ActivatedRoute} from '@angular/router';
import {MatDialog} from '@angular/material/dialog';
import {UserEditComponent} from './components/user-edit/user-edit.component';
import {Animations} from '../../../../common/utils/animations';

@Component({
	selector: 'app-user-list',
	templateUrl: './user-list.component.html',
	styleUrls: ['./user-list.component.scss'],
	animations: [
		Animations.expandableTable
	],
})
export class UserListComponent implements OnInit, OnDestroy {
	public displayedColumns: string[] = ['id', 'name', 'role', 'actions'];
	public dataSource: MatTableDataSource<IUser>;
	public usersTotal: number = 0;
	public usersData: IUser[];
	public isUsersLoading: boolean = false;
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
		await this.loadUsers();

		// If the user changes the sort order, reset back to the first page.
		this.sort.sortChange
			.pipe(takeUntil(this.unsubscribe))
			.subscribe(() => (this.paginator.pageIndex = 0));

		merge(this.sort.sortChange, this.paginator.page)
			.pipe(
				startWith({}),
				switchMap(() => {
					this.isUsersLoading = true;
					return this.usersService.getUsers(
						'',
						this.paginator.pageIndex + 1,
					)
				}),
				map((data) => {
					// Flip flag to show that loading has finished.
					this.isUsersLoading = false;

					if (data === null) {
						return [];
					}

					this.usersTotal = data.total;
					return data.data;
				}),
				takeUntil(this.unsubscribe)
			)
			.subscribe((data) => {
				console.log('new data: ', data);
				this.usersData = data
			});
	}

	@debounce()
	public onSearch(value: string): void {
		this.loadUsers(value);
	}

	protected async loadUsers(search: string = '', page: number = 1): Promise<void> {
		const users = await this.usersService.getUsers(search, page);

		this.usersData = users.data;
		this.usersTotal = users.total;
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
