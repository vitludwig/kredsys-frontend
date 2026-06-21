export interface IPublicGroupStatisticsItem {
	id: number;
	name: string;
	color: string;
	points: number;
}

export interface IPublicGroupStatistics {
	sumPrice: number;
	groups: IPublicGroupStatisticsItem[];
}
