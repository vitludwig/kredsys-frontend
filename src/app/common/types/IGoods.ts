export interface IGoods {
	id?: number;
	goodsTypeId: number | null;
	name: string;
	price: number | null;
	currencyId: number | null;
	placeId: number | null; // owner: null = global, set = scoped/local to that place
	deleted: boolean;
	placeIds?: number[]; // ids of places this goods is added to (sortiment)
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
