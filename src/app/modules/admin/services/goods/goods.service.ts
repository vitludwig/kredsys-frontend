import {Injectable} from '@angular/core';
import {IPaginatedResponse} from '../../../../common/types/IPaginatedResponse';
import {IGoods, IGoodsType} from '../../../../common/types/IGoods';
import {HttpClient} from '@angular/common/http';
import {firstValueFrom} from 'rxjs';
import {environment} from '../../../../../environments/environment';
import {cache, invalidateCache} from '../../../../common/decorators/cache';
import {ETime} from '../../../../common/types/ETime';
import {ECacheTag} from '../../../../common/types/ECacheTag';

@Injectable({
	providedIn: 'root',
})
export class GoodsService {
	protected goods: IGoods[] = [];
	protected limit = 5;

	constructor(
		protected http: HttpClient,
	) {
	}

	// TODO: this is not good, think of better solution
	@cache(ETime.MINUTE * 2, [ECacheTag.GOODS])
	public async getAllGoods(): Promise<IGoods[]> {
		const params = {
			pageSize: 999,
		};

		return (await firstValueFrom(this.http.get<IPaginatedResponse<IGoods>>(environment.apiUrl + 'goods', {params: params}))).data;
	}

	@cache(ETime.MINUTE * 2, [ECacheTag.GOODS])
	public async getGoods(filter: string = '', page: number = 0, pageSize = this.limit): Promise<IPaginatedResponse<IGoods>> {
		[filter, 'deleted=false'].join(',');
		const params = {
			filter,
			page,
			pageSize,
			deleted: false,
		};

		const result = await firstValueFrom(this.http.get<IPaginatedResponse<IGoods>>(environment.apiUrl + 'goods', {params: params}));
		this.goods = result.data; // TODO: remove after backend has endpoint for one item by id
		return result;
	}

	@cache(ETime.MINUTE * 2, [ECacheTag.GOODIE])
	public async getGoodie(id: number): Promise<IGoods> {
		// TODO: remove after backend has endpoint for one item by id
		// return this.goods.find((item) => item.id === id)!;
		return firstValueFrom(this.http.get<IGoods>(environment.apiUrl + 'goods/' + id));
	}

	public async getGoodsTypes(): Promise<IGoodsType[]> {
		const params = {
			pageSize: 999, // we dont need to paginate goods types for now
		};
		return (await firstValueFrom(this.http.get<IPaginatedResponse<IGoodsType>>(environment.apiUrl + 'goodstypes', {params: params}))).data;
	}

	public async getGoodsType(id: number): Promise<IGoodsType> {
		return firstValueFrom(this.http.get<IGoodsType>(environment.apiUrl + 'goodstypes/' + id));
	}

	@invalidateCache([ECacheTag.GOODS, ECacheTag.GOODIE])
	public async editGoods(item: IGoods): Promise<IGoods> {
		return firstValueFrom(this.http.put<IGoods>(environment.apiUrl + 'goods/' + item.id, item));
	}

	@invalidateCache([ECacheTag.GOODS, ECacheTag.GOODIE])
	public async addGoods(item: IGoods): Promise<IGoods> {
		return firstValueFrom(this.http.post<IGoods>(environment.apiUrl + 'goods', item));
	}

	@invalidateCache([ECacheTag.GOODS, ECacheTag.GOODIE])
	public async editGoodsType(item: IGoodsType): Promise<IGoodsType> {
		return firstValueFrom(this.http.put<IGoodsType>(environment.apiUrl + 'goodstypes/' + item.id, item));
	}

	@invalidateCache([ECacheTag.GOODS, ECacheTag.GOODIE])
	public async addGoodsType(item: IGoodsType): Promise<IGoodsType> {
		return firstValueFrom(this.http.post<IGoodsType>(environment.apiUrl + 'goodstypes', item));
	}

	@invalidateCache([ECacheTag.GOODS, ECacheTag.GOODIE])
	public async removeGoodsType(id: number): Promise<void> {
		return firstValueFrom(this.http.delete<void>(environment.apiUrl + 'goodstypes/' + id));
	}

	@invalidateCache([ECacheTag.GOODS, ECacheTag.GOODIE])
	public async removeGoods(id: number): Promise<void> {
		return firstValueFrom(this.http.delete<void>(environment.apiUrl + 'goods/' + id));
	}

	public createNewGoodie(): IGoods {
		return {
			goodsTypeId: null,
			name: '',
			price: null,
			currencyId: null,
			placeId: null,
			deleted: false,
		};
	}
	public createNewGoodieType(): IGoodsType {
		return {
			name: '',
			icon: '',
			deleted: false,
		};
	}
}
