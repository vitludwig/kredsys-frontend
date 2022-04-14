import {Component, Input, OnInit} from '@angular/core';
import {SaleService} from '../../services/sale/sale.service';
import {OrderService} from '../../services/order/order.service';
import {IPlace} from '../../../../common/types/IPlace';
import {PlaceService} from '../../../admin/services/place/place/place.service';
import {IGoods, IGoodsType} from '../../../../common/types/IGoods';
import {ISaleItem} from '../../types/ISaleItem';
import {GoodsService} from '../../../admin/services/goods/goods.service';
import {Utils} from '../../../../common/utils/Utils';

@Component({
	selector: 'app-dashboard',
	templateUrl: './dashboard.component.html',
	styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
	#place: IPlace;

	public get place(): IPlace {
		return this.#place;
	}

	@Input()
	public set place(value: IPlace) {
		this.#place = value;
		this.loadItems();
	}

	public items: ISaleItem[] = [];

	constructor(
		protected saleService: SaleService,
		protected orderService: OrderService,
		protected placeService: PlaceService,
		protected goodsService: GoodsService,
	) {
	}

	public ngOnInit(): void {

	}

	protected async loadItems(): Promise<void> {
		try {
			const goods = await this.placeService.getPlaceGoods(this.place.id!);
			const goodsTypes = Utils.toHashMap<IGoodsType>(await this.goodsService.getGoodsTypes(), 'id');

			for(const item of goods) {
				this.items.push({
					id: item.id!,
					name: item.name,
					price: item.price!,
					icon: goodsTypes[item.goodsTypeId!].icon ?? 'other',
				})
			}
		} catch(e) {
			console.error('Cannot load place goods: ', e);
		}
	}

	public openAddDialog(item: ISaleItem): void {
		this.saleService.openSaleDialog({
			item: item,
			edit: false,
		})
	}
}
