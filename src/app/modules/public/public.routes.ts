import {Routes} from "@angular/router";
import {CardInfoPublicComponent} from "./card-info-public/card-info-public.component";
import {ERoute} from "../../common/types/ERoute";

export const routes: Routes = [
  {
    path: ERoute.CARD_INFO,
    component: CardInfoPublicComponent,
    data: {
      name: 'Infokartářka',
    },
  },
];
