import {ITransactionStatistics} from "../../admin/modules/transactions/services/transaction/types/ITransactionStatistics";
import {IGroup} from "./IGroup";

export interface IGroupStatistics {
  sumGoods: number;
  sumPrice: number;
  groupsStatistics: IGroupStatisticsItem[];
}

export interface IGroupStatisticsItem {
  group: IGroup;
  statistics: ITransactionStatistics;
}


