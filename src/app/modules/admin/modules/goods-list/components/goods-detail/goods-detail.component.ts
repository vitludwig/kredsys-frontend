import { Component, OnInit } from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {ERoute} from '../../../../../../common/types/ERoute';
import {IGoods, IGoodsType} from '../../../../../../common/types/IGoods';
import {GoodsService} from '../../../../services/goods/goods.service';
import {ICurrency} from '../../../../../../common/types/ICurrency';
import {CurrencyService} from '../../../../services/currency/currency.service';
import {AlertService} from '../../../../../../common/services/alert/alert.service';

@Component({
	selector: 'app-goods-detail',
	templateUrl: './goods-detail.component.html',
	styleUrls: ['./goods-detail.component.scss'],
})
export class GoodsDetailComponent implements OnInit {
	public item: IGoods;
	public isLoading: boolean = true;
	public isEdit: boolean = false;


	public goodsTypes: IGoodsType[] = [];
	public currencies: ICurrency[] = [];

	constructor(
		public goodsService: GoodsService,
		protected currencyService: CurrencyService,
		protected route: ActivatedRoute,
		protected router: Router,
		protected alertService: AlertService,
	) {
	}

	public async ngOnInit(): Promise<void> {
		this.goodsTypes = await this.goodsService.getGoodsTypes();
		this.currencies = (await this.currencyService.getCurrencies()).data;

		this.isLoading = true;
		try {
			const id = Number(this.route.snapshot.paramMap.get('id'));
			if(id) {
				const item = await this.goodsService.getGoodie(id);
				this.item = Object.assign({}, item);
				this.isEdit = true;
			} else {
				this.item = Object.assign({}, this.goodsService.createNewGoodie());
				this.isEdit = false;
			}
		} catch(e) {
			this.alertService.error('Nepodařilo se načíst zboží');
			console.error(e);
		} finally {
			this.isLoading = false;
		}
	}


	public async onSubmit(): Promise<void> {
		try {
			if(this.isEdit) {
				await this.goodsService.editGoods(this.item);
			} else {
				await this.goodsService.addGoods(this.item);
			}
			this.router.navigate([ERoute.ADMIN, ERoute.ADMIN_GOODS]);
		} catch(e) {
			this.alertService.error('Chyba při zpracování zboží');
		}
	}

}
