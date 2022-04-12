export interface IGoods {
	id?: number;
	goodsTypeId: number | null;
	name: string;
	price: number | null;
	currencyId: number | null;
	placeId: number | null;
	deleted: boolean;
}

export interface IGoodsTableSource extends IGoods {
	type: string;
	currency: string;
}

export interface IGoodsType {
	id?: number;
	name: string;
	icon: string;
	deleted: boolean;
}
