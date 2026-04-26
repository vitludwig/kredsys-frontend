import { IGoodsType } from '../../../src/app/common/types/IGoods';

export const goodsTypes: (IGoodsType & { id: number })[] = [
	{ id: 1, name: 'Nápoje',  icon: 'local_bar',     deleted: false },
	{ id: 2, name: 'Jídlo',   icon: 'restaurant',    deleted: false },
	{ id: 3, name: 'Merch',   icon: 'shopping_bag',  deleted: false },
	{ id: 4, name: 'Služby',  icon: 'room_service',  deleted: false },
];
