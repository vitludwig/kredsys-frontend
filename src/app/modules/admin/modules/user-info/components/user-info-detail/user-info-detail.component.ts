import { Component, EventEmitter, Input, Output } from '@angular/core';
import { IUser } from '../../../../../../common/types/IUser';
import { ICurrencyAccount } from '../../../../../../common/types/ICurrency';
import { ICard } from '../../../../../../common/types/ICard';
import { ITransaction } from '../../../transactions/services/transaction/types/ITransaction';

@Component({
  selector: 'app-user-info-detail',
  template: '',
  standalone: true,
  imports: [],
})
export class UserInfoDetailComponent {
  @Input() user!: IUser;
  @Input() currencyAccount: ICurrencyAccount | null = null;
  @Input() accountLoaded = false;
  @Input() transactions: ITransaction[] = [];
  @Input() transactionsTotal = 0;
  @Input() cards: ICard[] = [];
  @Input() placeId: number | null = null;
  @Input() defaultCurrencyId: number | null = null;
  @Output() refresh = new EventEmitter<void>();
  @Output() loadMoreTransactions = new EventEmitter<void>();
}
