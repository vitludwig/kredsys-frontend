import { Component, OnInit } from '@angular/core';
import {IPlace} from "../../../../../../common/types/IPlace";
import {ITransaction} from "../../services/transaction/types/ITransaction";
import {TransactionService} from "../../services/transaction/transaction.service";
import {UsersService} from "../../../../services/users/users.service";
import {ActivatedRoute} from "@angular/router";

@Component({
	selector: 'app-user-transactions-list',
	templateUrl: './user-transactions-list.component.html',
	styleUrls: ['./user-transactions-list.component.scss']
})
export class UserTransactionsListComponent implements OnInit {

	public places: IPlace[];
	public selectedPlace: IPlace | null;
	public filterBy: Partial<ITransaction> = {};

	constructor(
		protected transactionService: TransactionService,
		protected usersService: UsersService,
		protected route: ActivatedRoute,
	) {
	}

	public async ngOnInit(): Promise<void> {
		// this.places = await this.placeService.getAllPlaces();
		//
		// const id = Number(this.route.snapshot.paramMap.get('id'));
		// if(id !== undefined) {
		// 	this.selectedPlace = this.places.find((place) => place.id === id) ?? null;
		// }
	}

	// public loadData = (id: number, offset: number = 0, limit: number = 15, filterBy: Partial<ITransaction>): Promise<IPaginatedResponse<ITransaction>> => {
	// 	return this.placeService.getPlaceTransactions(id, offset, limit, filterBy);
	// }
}
