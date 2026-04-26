import { IGoods } from '../../../src/app/common/types/IGoods';

export const goods: (IGoods & { id: number })[] = [
	{ id: 1,  goodsTypeId: 1, name: 'Pivo 0,5l',   price: 50,  currencyId: 1, placeId: 1, deleted: false },
	{ id: 2,  goodsTypeId: 1, name: 'Víno 0,2l',   price: 60,  currencyId: 1, placeId: 1, deleted: false },
	{ id: 3,  goodsTypeId: 1, name: 'Voda',        price: 25,  currencyId: 1, placeId: 1, deleted: false },
	{ id: 4,  goodsTypeId: 2, name: 'Klobása',     price: 80,  currencyId: 1, placeId: 1, deleted: false },
	{ id: 5,  goodsTypeId: 2, name: 'Hranolky',    price: 60,  currencyId: 1, placeId: 1, deleted: false },
	{ id: 6,  goodsTypeId: 1, name: 'Káva',        price: 40,  currencyId: 1, placeId: 1, deleted: false },
	{ id: 7,  goodsTypeId: 3, name: 'Tričko',      price: 350, currencyId: 1, placeId: 1, deleted: false },
	{ id: 8,  goodsTypeId: 4, name: 'Šatna',       price: 30,  currencyId: 1, placeId: 1, deleted: false },
	{ id: 9,  goodsTypeId: 1, name: 'Pivo 0,3l',   price: 35,  currencyId: 1, placeId: 2, deleted: false },
	{ id: 10, goodsTypeId: 1, name: 'Limonáda',    price: 30,  currencyId: 1, placeId: 2, deleted: false },
	{ id: 11, goodsTypeId: 2, name: 'Bagel',       price: 70,  currencyId: 1, placeId: 2, deleted: false },
	{ id: 12, goodsTypeId: 3, name: 'Náramek',     price: 100, currencyId: 1, placeId: 2, deleted: false },
];
