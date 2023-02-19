import {Component, Input} from '@angular/core';
import {SaleService} from '../../services/sale/sale.service';
import {OrderService} from '../../services/order/order.service';
import {IPlace} from '../../../../common/types/IPlace';
import {PlaceService} from '../../../admin/services/place/place/place.service';
import {IGoodsType} from '../../../../common/types/IGoods';
import {ISaleItem} from '../../types/ISaleItem';
import {GoodsService} from '../../../admin/services/goods/goods.service';
import {Utils} from '../../../../common/utils/Utils';
import {CustomerService} from '../../services/customer/customer.service';
import {AlertService} from '../../../../common/services/alert/alert.service';

@Component({
	selector: 'app-dashboard',
	templateUrl: './dashboard.component.html',
	styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent {

	public get place(): IPlace {
		return this.#place;
	}

	@Input()
	public set place(value: IPlace) {
		if(value && JSON.stringify(value) !== JSON.stringify(this.#place)) {
			this.#place = value;
			this.loadItems();
		}
	}

	#place: IPlace;
	public items: ISaleItem[] = [];

	constructor(
		protected saleService: SaleService,
		protected orderService: OrderService,
		protected placeService: PlaceService,
		protected goodsService: GoodsService,
		protected customerService: CustomerService,
		protected alertService: AlertService,
	) {

	}

	protected loadItems = async (): Promise<void> => {
		try {
			this.items = [];
			const goods = await this.placeService.getPlaceGoods(this.place.id!);
			const goodsTypes = Utils.toHashMap<IGoodsType>(await this.goodsService.getGoodsTypes(), 'id');

			for(const item of goods) {
				this.items.push({
					id: item.id!,
					name: item.name,
					price: item.price!,
					icon: goodsTypes[item.goodsTypeId!].icon ?? 'other',
				});
			}
		} catch(e) {
			console.error('Cannot load place goods: ', e);
			this.alertService.error('Nepodařilo se načíst zboží');
		}
	}

	public addItem(item: ISaleItem): void {
		if(this.customerService.isLogged) {
			this.orderService.addItem(item);
		}
	}
}
