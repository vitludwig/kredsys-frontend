import {Component} from '@angular/core';
import {IUser} from '../../common/types/IUser';
import {ICurrencyAccount} from '../../common/types/ICurrency';
import {UsersService} from '../admin/services/users/users.service';
import {ETime} from '../../common/types/ETime';
import {environment} from '../../../environments/environment';
import {Utils} from '../../common/utils/Utils';
import {ERoute} from "../../common/types/ERoute";
import {MatDialog} from "@angular/material/dialog";
import {AuthService} from "../login/services/auth/auth.service";
import {CardInfoConfigDialogComponent} from "./components/card-info-config-dialog/card-info-config-dialog.component";
import {ICardInfoConfig} from "./types/ICardInfoConfig";
import {CardInfoConfig} from "./models/CardInfoConfig";
import {CurrencyService} from "../admin/services/currency/currency.service";
import {TransactionService} from "../admin/modules/transactions/services/transaction/transaction.service";

@Component({
	selector: 'app-card-info',
	templateUrl: './card-info.component.html',
	styleUrls: ['./card-info.component.scss']
})
export class CardInfoComponent {
	protected user: IUser | null;
	protected currencyAccount: ICurrencyAccount | null;
	protected isLoading: boolean = false;
	protected cardLoaded: boolean = false;
	protected walletCode: string;
	protected paymentString: string;
  protected paymentAmount: number;
  protected cardInfoConfig: ICardInfoConfig;

  protected readonly ERoute = ERoute;

	constructor(
		protected usersService: UsersService,
    private dialog: MatDialog,
    protected authService: AuthService,
    private currencyService: CurrencyService,
    private transactionService: TransactionService,
	) {
    const config = JSON.parse(localStorage.getItem("cardInfoConfig") ?? "{}");
    this.cardInfoConfig = new CardInfoConfig(config);
	}

	public async setCardId(id: number): Promise<void> {
    try {
			this.isLoading = true;
			this.user = (await this.usersService.getUserByCardUid(id)) ?? null;
			this.currencyAccount = (await this.usersService.getUserCurrencyAccounts(this.user.id!))[0] ?? null;

      if(this.cardInfoConfig.showWalletConnection) {
        if (this.user && this.currencyAccount) {
          this.walletCode = await this.getWalletCode();
        }
      }

      if(this.cardInfoConfig.showPaymentQR) {
        this.paymentString = await this.getPaymentString();
      }
		} catch(e) {
			console.error('Cannot display user currency data: ', e);
		} finally {
			this.isLoading = false;
			this.cardLoaded = true;
		}

		setTimeout(() => {
			this.user = null;
			this.currencyAccount = null;
			this.cardLoaded = false;
		}, ETime.SECOND * 10);
	}

  protected openConfigDialog() {
    const dialog = this.dialog.open<CardInfoConfigDialogComponent, ICardInfoConfig>(CardInfoConfigDialogComponent, {
      data: this.cardInfoConfig
    });
    dialog.afterClosed().subscribe((result: ICardInfoConfig) =>{
      Object.assign(this.cardInfoConfig, result);
      localStorage.setItem("cardInfoConfig", JSON.stringify(this.cardInfoConfig));
    })
  }

  private async getWalletCode() {
    return this.user?.id + '' + (await Utils.createWalletHash(this.user?.id + '' + environment.walletApiSecret))
  }

  private async getPaymentString() {
    if(!this.cardInfoConfig.paymentAccount) {
      return "";
    }

    const currency = await this.currencyService.getDefaultCurrency();
    let filterBy: { [key: string]: any } = {
      usersFilter: [this.user?.id],
    };

    const statistics = await this.transactionService.getStatistics(currency.id!, filterBy);
    this.paymentAmount = statistics.sumPrice;
    // const baParts = this.cardInfoConfig.paymentAccount.split("/");
    // if(baParts[0].length < 10) {
    //   baParts[0].padStart(10, "0")
    // }
    // const ib = iban.fromBBAN("CZ", `${baParts[1]}000000${baParts[0]}`);
    return `SPD*1.0*ACC:${this.cardInfoConfig.paymentAccount}*AM:${this.paymentAmount}*CC:CZK*VS:${this.user?.id}*MSG:${this.user?.name}`;
  }
}
