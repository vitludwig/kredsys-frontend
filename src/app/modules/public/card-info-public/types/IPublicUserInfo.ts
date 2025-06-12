export interface IPublicUserInfo {
  transactions: {
    AmountSum: string;
    Created: string;
    Id: number
    Name: string;
  };
  user: {
    BuySum: string
    DepositSum: string;
    Email: string;
    MemberId: string;
    Name: string;
    TotalSum: number | null;
    WithdrawSum: number | null;
  };
}
