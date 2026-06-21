import {Routes} from "@angular/router";
import {CardInfoPublicComponent} from "./card-info-public/card-info-public.component";
import {PublicGroupsStatisticsComponent} from "./groups-statistics-public/groups-statistics-public.component";
import {ERoute} from "../../common/types/ERoute";
import {provideCharts, withDefaultRegisterables} from "ng2-charts";

export const routes: Routes = [
	{
		path: ERoute.CARD_INFO,
		component: CardInfoPublicComponent,
		data: {
			name: 'Infokartářka',
		},
	},
	{
		path: ERoute.PUBLIC_GROUP_STATISTICS,
		component: PublicGroupsStatisticsComponent,
		providers: [provideCharts(withDefaultRegisterables())],
		data: {
			name: 'Statistiky skupin',
			fullHeight: true,
		},
	},
];
