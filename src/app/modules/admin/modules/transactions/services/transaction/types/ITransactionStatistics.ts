export interface ITransactionStatistics {
	currencyId: number;
	sumGoods: number;
	sumPrice: number;
	sumTransactions: number;
	goods: {
		goodsId: number;
		goodsName: string;
		sumGoods: number;
		sumPrice: number;
	}[];
}

export interface IStatisticsFilter {
	placesFilter: number[];
	usersFilter: number[];
	goodsFilter: number[];
	fromDate: string;
	toDate: string;
}
