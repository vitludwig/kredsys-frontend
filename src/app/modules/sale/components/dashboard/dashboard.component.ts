import {Component, EventEmitter, Input, Output} from '@angular/core';
import {CdkDragDrop, moveItemInArray} from '@angular/cdk/drag-drop';
import {OrderService} from '../../services/order/order.service';
import {IPlace} from '../../../../common/types/IPlace';
import {PlaceService} from '../../../admin/services/place/place/place.service';
import {IGoodsType} from '../../../../common/types/IGoods';
import {ISaleItem} from '../../types/ISaleItem';
import {GoodsService} from '../../../admin/services/goods/goods.service';
import {Utils} from '../../../../common/utils/Utils';
import {CustomerService} from '../../services/customer/customer.service';
import {AlertService} from '../../../../common/services/alert/alert.service';
import {AuthService} from '../../../login/services/auth/auth.service';
import {EUserRole} from '../../../../common/types/IUser';

@Component({
	selector: 'app-dashboard',
	templateUrl: './dashboard.component.html',
	styleUrls: ['./dashboard.component.scss'],
	standalone: false
})
export class DashboardComponent {

	public get place(): IPlace {
		return this.#place;
	}

	@Input()
	public set place(value: IPlace | null) {
		if(value && JSON.stringify(value) !== JSON.stringify(this.#place)) {
			this.#place = value;
			this.loadItems();
		}
	}

	#place: IPlace;
	public items: ISaleItem[] = [];
	@Input() public reorderMode = false;
	@Output() public reorderModeChange = new EventEmitter<boolean>();
	public isSaving = false;

	public itemTypes: Record<number, {name: string; id: number}> = {};
	public filter: number[] = [];

	public get canReorder(): boolean {
		return this.authService.hasRole(EUserRole.ADMIN) || this.authService.hasRole(EUserRole.POWER_SALESMAN);
	}

	constructor(
		protected orderService: OrderService,
		protected placeService: PlaceService,
		protected goodsService: GoodsService,
		protected customerService: CustomerService,
		protected alertService: AlertService,
		protected authService: AuthService,
	) {}

	protected loadItems = async (): Promise<void> => {
		if (this.reorderMode) {
			this.reorderMode = false;
			this.reorderModeChange.emit(false);
		}
		try {
			this.items = [];
			const placeGoods = await this.placeService.getPlaceGoods(this.place.id!);
			const goodsTypes = Utils.toHashMap<IGoodsType>(await this.goodsService.getGoodsTypes(), 'id');

			for(const entry of placeGoods) {
				const item = entry.goods;
				this.items.push({
					id: item.id!,
					name: item.name,
					price: item.price!,
					icon: goodsTypes[item.goodsTypeId!]?.icon ?? 'category',
					type: item.goodsTypeId,
				});

				if(!this.itemTypes[item.goodsTypeId!]) {
					this.itemTypes[item.goodsTypeId!] = {
						id: item.goodsTypeId!,
						name: goodsTypes[item.goodsTypeId!]?.name,
					}
				}
			}
		} catch(e) {
			console.error('Cannot load place goods: ', e);
			this.alertService.error('Nepodařilo se načíst zboží');
		}
	}

	public addItem(item: ISaleItem): void {
		if(this.reorderMode) return;
		if(this.customerService.isLogged) {
			this.orderService.addItem(item);
		}
	}

	public toggleReorderMode(): void {
		const next = !this.reorderMode;
		this.reorderMode = next;
		this.reorderModeChange.emit(next);
		if(next) {
			this.filter = [];
		}
	}

	public async onDrop(event: CdkDragDrop<ISaleItem[]>): Promise<void> {
		if(event.previousIndex === event.currentIndex) return;

		const prevItems = [...this.items];
		moveItemInArray(this.items, event.previousIndex, event.currentIndex);

		this.isSaving = true;
		try {
			await this.placeService.moveGoods(this.place.id!, this.items.map(i => i.id));
		} catch(e) {
			this.items = prevItems;
			this.alertService.error('Nepodařilo se uložit pořadí');
		} finally {
			this.isSaving = false;
		}
	}
}
