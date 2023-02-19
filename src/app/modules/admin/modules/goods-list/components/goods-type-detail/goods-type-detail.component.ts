import {Component, OnInit} from '@angular/core';
import {IGoodsType} from '../../../../../../common/types/IGoods';
import {GoodsService} from '../../../../services/goods/goods.service';
import {ActivatedRoute, Router} from '@angular/router';
import {ERoute} from '../../../../../../common/types/ERoute';
import {AlertService} from '../../../../../../common/services/alert/alert.service';

@Component({
	selector: 'app-goods-type-detail',
	templateUrl: './goods-type-detail.component.html',
	styleUrls: ['./goods-type-detail.component.scss'],
})
export class GoodsTypeDetailComponent implements OnInit {

	public item: IGoodsType;
	public isLoading: boolean = true;
	public isEdit: boolean = false;

	constructor(
		public goodsService: GoodsService,
		protected route: ActivatedRoute,
		protected router: Router,
		protected alertService: AlertService,
	) {
	}

	public async ngOnInit(): Promise<void> {
		this.isLoading = true;

		try {
			const id = Number(this.route.snapshot.paramMap.get('id'));
			if(id) {
				const item = await this.goodsService.getGoodsType(id);
				this.item = Object.assign({}, item);
				this.isEdit = true;
			} else {
				this.item = Object.assign({}, this.goodsService.createNewGoodieType());
				this.isEdit = false;
			}
		} catch(e) {
			this.alertService.error('Nepodařilo se načíst typy zboží');
			console.error(e);
		} finally {
			this.isLoading = false;
		}
	}

	public async onSubmit(): Promise<void> {
		try {
			if(this.isEdit) {
				await this.goodsService.editGoodsType(this.item);
			} else {
				await this.goodsService.addGoodsType(this.item);
			}
			this.router.navigate([ERoute.ADMIN, ERoute.ADMIN_GOODS]);
		} catch(e) {
			this.alertService.error('Chyba při zpracování typu zboží');
		}
	}

}
