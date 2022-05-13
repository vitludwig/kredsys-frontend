import { Component, OnInit } from '@angular/core';
import {IGoods, IGoodsType} from '../../../../../../common/types/IGoods';
import {ICurrency} from '../../../../../../common/types/ICurrency';
import {GoodsService} from '../../../../services/goods/goods.service';
import {CurrencyService} from '../../../../services/currency/currency.service';
import {ActivatedRoute, Router} from '@angular/router';
import {ERoute} from '../../../../../../common/types/ERoute';

@Component({
  selector: 'app-goods-type-detail',
  templateUrl: './goods-type-detail.component.html',
  styleUrls: ['./goods-type-detail.component.scss']
})
export class GoodsTypeDetailComponent implements OnInit {

  public item: IGoodsType;
  public isLoading: boolean = true;
  public isEdit: boolean = false;

  constructor(
      public goodsService: GoodsService,
      protected route: ActivatedRoute,
      protected router: Router,
  ) {
  }

  public async ngOnInit(): Promise<void> {
    this.isLoading = true;

    try {
      const id = Number(this.route.snapshot.paramMap.get('id'));
      if (id) {
        const item = await this.goodsService.getGoodsType(id);
        this.item = Object.assign({}, item);
        this.isEdit = true;
      } else {
        this.item = Object.assign({}, this.goodsService.createNewGoodieType());
        this.isEdit = false;
      }
    } catch (e) {
      // TODO: handle
      console.error(e);
    } finally {
      this.isLoading = false
    }
  }

  public async onSubmit(): Promise<void> {
    // TODO: pridat osetren erroru, globalne
    if (this.isEdit) {
      await this.goodsService.editGoodsType(this.item);
    } else {
      await this.goodsService.addGoodsType(this.item);
    }
    this.router.navigate([ERoute.ADMIN, ERoute.ADMIN_GOODS]);
  }

}
