import {Injectable} from '@angular/core';
import {ISaleItem} from '../../types/ISaleItem';
import {IOrderItem} from '../../types/IOrderItem';
import {BehaviorSubject, Observable} from 'rxjs';
import {IUser} from '../../../../common/types/IUser';

@Injectable({
	providedIn: 'root'
})
export class OrderService {
	#balanceSubject: BehaviorSubject<number>;
	public balance$: Observable<number>;

	public total: number = 0;
	public items: IOrderItem[] = [];

	public get balance(): number {
		return this.#balanceSubject.getValue();
	}

	public set balance(value: number) {
		this.#balanceSubject.next(value);
	}

	constructor() {
		this.#balanceSubject = new BehaviorSubject<number>(0);
		this.balance$ = this.#balanceSubject.asObservable();
	}

	public editItem(item: ISaleItem, count: number): void {
		const foundItem = this.items.find((obj) => obj.item.id === item.id);
		if (foundItem) {
			foundItem.count = count;
		}

		this.refreshTotal();
	}

	public addItem(item: ISaleItem, count: number): void {
		// in case somebody call addItem instead of editItem
		const foundItemIndex = this.items.findIndex((obj) => obj.item.id === item.id);
		if (foundItemIndex > -1) {
			this.editItem(item, count);
			return;
		}

		this.items.push({
			item,
			count,
		});

		this.refreshTotal();
	}

	public removeItem(id: number): void {
		this.items = this.items.filter((item) => item.item.id !== id);
		this.refreshTotal();
	}

	protected refreshTotal(): void {
		this.total = this.items
			.map((item) => item.count * item.item.price)
			.reduce((a, b) => a + b)
	}
}
