import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {MatTableDataSource} from '@angular/material/table';
import {IUser} from '../../../../common/types/IUser';
import {UsersService} from '../../services/users/users.service';
import {map, merge, startWith, Subject, switchMap, takeUntil} from 'rxjs';
import {debounce} from '../../../../common/decorators/debounce';
import {ERoute} from '../../../../common/types/ERoute';
import {ActivatedRoute} from '@angular/router';
import {MatDialog} from '@angular/material/dialog';
import {UserDetailComponent} from './components/user-detail/user-detail.component';
import {Animations} from '../../../../common/utils/animations';
import {AlertService} from '../../../../common/services/alert/alert.service';

@Component({
	selector: 'app-user-list',
	templateUrl: './user-list.component.html',
	styleUrls: ['./user-list.component.scss'],
	animations: [
		Animations.expandableTable,
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
		protected dialog: MatDialog,
		protected alertService: AlertService,
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
					const offset = (this.paginator.pageIndex - 1) * 10
					return this.usersService.getUsers(
						'',
						offset >= 0 ? offset : 0,
						10
					);
				}),
				map((data) => {
					// Flip flag to show that loading has finished.
					this.isUsersLoading = false;

					if(data === null) {
						return [];
					}

					this.usersTotal = data.total;
					return data.data;
				}),
				takeUntil(this.unsubscribe),
			)
			.subscribe((data) => {
				console.log('new data: ', data);
				this.usersData = data;
			});
	}

	@debounce()
	public onSearch(value: string): void {
		this.loadUsers(value);
	}

	public async blockUser(user: IUser): Promise<void> {
		try {
			await this.usersService.blockUser(user);
			await this.loadUsers();
			this.alertService.success('Uživatel zablokován');
		} catch(e) {
			console.error('Cannot block user', e);
			this.alertService.error('Nepodařilo se zablokovat uživatele');
		}
	}

	public applyFilter(event: Event): void {
		const filterValue = (event.target as HTMLInputElement).value;
		this.dataSource.filter = filterValue.trim().toLowerCase();

		if(this.dataSource.paginator) {
			this.dataSource.paginator.firstPage();
		}
	}

	public openUserEditDialog(data: IUser): void {
		this.dialog.open<UserDetailComponent, IUser>(UserDetailComponent, {
			width: '300px',
			minWidth: '250px',
			autoFocus: 'dialog',
			data: Object.assign({}, data),
		});
	}

	protected async loadUsers(search: string = '', offset?: number, limit?: number): Promise<void> {
		const users = await this.usersService.getUsers(search, offset, limit);
		const data = users.data = users.data.filter((user) => !user.blocked);

		this.usersData = data;
		this.usersTotal = users.total;
	}

	public ngOnDestroy(): void {
		this.unsubscribe.next();
	}
}
