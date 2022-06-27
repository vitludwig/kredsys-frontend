import { Component, OnInit } from '@angular/core';
import {IPlace} from "../../../../../../common/types/IPlace";
import {ITransaction} from "../../services/transaction/types/ITransaction";
import {TransactionService} from "../../services/transaction/transaction.service";
import {UsersService} from "../../../../services/users/users.service";
import {ActivatedRoute} from "@angular/router";
import {IPaginatedResponse} from "../../../../../../common/types/IPaginatedResponse";
import {IUser} from "../../../../../../common/types/IUser";
import {debounceTime, distinctUntilChanged, Observable, startWith, switchMap} from "rxjs";
import {FormControl} from "@angular/forms";

@Component({
	selector: 'app-user-transactions-list',
	templateUrl: './user-transactions-list.component.html',
	styleUrls: ['./user-transactions-list.component.scss']
})
export class UserTransactionsListComponent implements OnInit {

	public selectedUser: FormControl = new FormControl('');
	public filterBy: Partial<ITransaction> = {};
	public filteredOptions: Observable<any>;
	

	constructor(
		protected transactionService: TransactionService,
		protected usersService: UsersService,
		protected route: ActivatedRoute,
	) {
	}

	public async ngOnInit(): Promise<void> {
		this.filteredOptions = this.selectedUser.valueChanges
			.pipe(
				startWith(''),
				debounceTime(400),
				distinctUntilChanged(),
				switchMap((value) => {
					return this.filter(value || '');
				})
			);
	// this.places = await this.placeService.getAllPlaces();
		//
		// const id = Number(this.route.snapshot.paramMap.get('id'));
		// if(id !== undefined) {
		// 	this.selectedPlace = this.places.find((place) => place.id === id) ?? null;
		// }
	}

	// filter and return the values
	public filter(value: string): Promise<any[]> {
	// call the service which makes the http-request
		return this.getUsers(value);
	}

	protected async getUsers(search: string): Promise<IUser[]> {
		return (await this.usersService.getUsers(search)).data;
	}

	public loadData = (id: number, offset: number = 0, limit: number = 15, filterBy: Partial<ITransaction>): Promise<IPaginatedResponse<ITransaction>> => {
		return this.usersService.getUserTransactions(id, offset, limit, filterBy);
	}
}
