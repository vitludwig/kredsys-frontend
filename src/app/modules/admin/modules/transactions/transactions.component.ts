import {Component, OnInit} from '@angular/core';
import {UsersService} from '../../services/users/users.service';
import {IPlace} from '../../../../common/types/IPlace';
import {PlaceService} from '../../services/place/place/place.service';
import {ActivatedRoute} from '@angular/router';
import {TransactionService} from './services/transaction/transaction.service';
import {ITransaction} from './services/transaction/types/ITransaction';

@Component({
	selector: 'app-transactions',
	templateUrl: './transactions.component.html',
	styleUrls: ['./transactions.component.scss']
})
export class TransactionsComponent implements OnInit {
	public allTransactions: ITransaction[];
	public transactions: ITransaction[];
	public places: IPlace[];
	public selectedPlace: IPlace | null;

	constructor(
		protected transactionService: TransactionService,
		protected usersService: UsersService,
		protected placeService: PlaceService,
		protected route: ActivatedRoute,
	) {
	}

	public async ngOnInit(): Promise<void> {
		this.places = await this.placeService.getAllPlaces();
		const transactions = await this.transactionService.getTransactions();
		this.allTransactions = transactions.data;
		console.log('data: ', transactions);

		const id = Number(this.route.snapshot.paramMap.get('id'));
		if(id !== undefined) {
			this.selectedPlace = this.places.find((place) => place.id === id) ?? null;
			this.selectPlace(id);
		}
	}

	public async selectPlace(id: number): Promise<void> {
		this.transactions = this.allTransactions.filter((transaction) => transaction.placeId === id);
	}

}
