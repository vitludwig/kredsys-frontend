import {Component, OnInit} from '@angular/core';
import {ITransaction} from "../../services/transaction/types/ITransaction";
import {IPlace} from "../../../../../../common/types/IPlace";
import {TransactionService} from "../../services/transaction/transaction.service";
import {UsersService} from "../../../../services/users/users.service";
import {PlaceService} from "../../../../services/place/place/place.service";
import {ActivatedRoute} from "@angular/router";
import {IPaginatedResponse} from "../../../../../../common/types/IPaginatedResponse";

@Component({
	selector: 'app-place-transactions-list',
	templateUrl: './place-transactions-list.component.html',
	styleUrls: ['./place-transactions-list.component.scss']
})
export class PlaceTransactionsListComponent implements OnInit {
	public places: IPlace[];
	public selectedPlace: IPlace | null;
	public filterBy: Partial<ITransaction> = {};

	constructor(
		public placeService: PlaceService,
		protected transactionService: TransactionService,
		protected usersService: UsersService,
		protected route: ActivatedRoute,
	) {
	}

	public async ngOnInit(): Promise<void> {
		this.places = await this.placeService.getAllPlaces();

		const id = Number(this.route.snapshot.paramMap.get('id'));
		if(id !== undefined) {
			this.selectedPlace = this.places.find((place) => place.id === id) ?? null;
		}
	}

	public loadData = (id: number, offset: number = 0, limit: number = 15, filterBy: Partial<ITransaction>): Promise<IPaginatedResponse<ITransaction>> => {
		return this.placeService.getPlaceTransactions(id, offset, limit, filterBy);
	}
}
