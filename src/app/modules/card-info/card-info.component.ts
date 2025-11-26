import { Component, Input } from '@angular/core';
import { IUser } from '../../common/types/IUser';
import { ICurrencyAccount } from '../../common/types/ICurrency';
import { UsersService } from '../admin/services/users/users.service';
import { ETime } from '../../common/types/ETime';
import { environment } from '../../../environments/environment';
import { Utils } from '../../common/utils/Utils';
import { ERoute } from "../../common/types/ERoute";
import { MatDialog } from "@angular/material/dialog";
import { AuthService } from "../login/services/auth/auth.service";
import { CardInfoConfigDialogComponent } from "./components/card-info-config-dialog/card-info-config-dialog.component";
import { ICardInfoConfig } from "./types/ICardInfoConfig";
import { CardInfoConfig } from "./models/CardInfoConfig";
import { CurrencyService } from "../admin/services/currency/currency.service";
import { TransactionService } from "../admin/modules/transactions/services/transaction/transaction.service";
import { IGroup } from "../groups/types/IGroup";
import { EMPTY, map, Observable } from "rxjs";
import { GroupsService } from "../groups/services/groups.service";
import { IPublicUserInfo } from "../public/card-info-public/types/IPublicUserInfo";
import { AlertService } from "../../common/services/alert/alert.service";

@Component({
  selector: 'app-card-info',
  templateUrl: './card-info.component.html',
  styleUrls: ['./card-info.component.scss']
})
export class CardInfoComponent {
  @Input()
  public isPublic: boolean = false;

  protected user: IUser | null;
  protected userPublic: IPublicUserInfo | null;
  protected currencyAccount: ICurrencyAccount | null;
  protected isLoading: boolean = false;
  protected cardLoaded: boolean = false;
  protected walletCode: string | null = null;
  protected paymentString: string;
  protected paymentAmount: number;
  protected cardInfoConfig: ICardInfoConfig;
  protected selectedGroupId: number | null = null;
  protected userGroup$: Observable<IGroup> = EMPTY;
  protected allGroups$: Observable<IGroup[]> = this.groupsService.getGroups().pipe(
    map(response => response.data)
  );

  protected userInfo: {
    name?: string;
    memberId?: number | null;
    totalSum?: number;
  } | null = null;

  protected readonly ERoute = ERoute;

  private userId: number | null = null;
  private resetTimeout?: number;

  constructor(
    protected usersService: UsersService,
    private dialog: MatDialog,
    protected authService: AuthService,
    private currencyService: CurrencyService,
    private transactionService: TransactionService,
    private groupsService: GroupsService,
    private alertService: AlertService,
  ) {
    const config = JSON.parse(localStorage.getItem("cardInfoConfig") ?? "{}");
    this.cardInfoConfig = new CardInfoConfig(config);
  }

  public async setCardId(id: number): Promise<void> {
    try {
      this.isLoading = true;

      await this.loadUserInfo(id);

      if (!this.user && !this.userPublic) {
        return;
      }
      this.userId = this.user!.id!;

      if (this.user?.groups?.[0]) {
        this.userGroup$ = this.groupsService.getGroup(this.user.groups[0]);
        this.selectedGroupId = this.user.groups[0];
      } else {
        this.userGroup$ = EMPTY;
        this.selectedGroupId = null;
      }

      if (this.cardInfoConfig.showWalletConnection && this.currencyAccount && this.userId !== null) {
        this.walletCode = await this.getWalletCode();
      }

      if (this.cardInfoConfig.showPaymentQR) {
        this.paymentString = await this.getPaymentString();
      }
    } catch (e) {
      console.error('Cannot display user currency data: ', e);
    } finally {
      this.isLoading = false;
      this.cardLoaded = true;
    }

    this.resetTimeout = window.setTimeout(() => {
      this.reset();
    }, ETime.SECOND * 10);
  }

  private reset(): void {
    this.user = null;
    this.userPublic = null;
    this.currencyAccount = null;
    this.userId = null;
    this.userInfo = null;
    this.cardLoaded = false;

    if (this.resetTimeout) {
      clearTimeout(this.resetTimeout);
    }
  }

  private async loadUserInfo(cardId: number): Promise<void> {
    if (this.isPublic) {
      this.userId = (await this.usersService.getPublicUserIdByCardUid(cardId));
      if (this.userId === null) {
        return;
      }

      const publicToken = await this.getPublicToken(this.userId);
      this.userPublic = (await this.usersService.getPublicUserInfo(this.userId, publicToken));
      this.userInfo = {
        name: this.userPublic?.user.Name,
        memberId: +this.userPublic?.user.MemberId!,
        totalSum: this.userPublic?.user.TotalSum!
      }
    } else {
      this.user = (await this.usersService.getUserByCardUid(cardId)) ?? null;
      if (!this.user) {
        return;
      }
      this.currencyAccount = (await this.usersService.getUserCurrencyAccounts(this.user.id!))[0] ?? null;
      this.userInfo = {
        name: this.user.name,
        memberId: this.user.memberId ?? null,
        totalSum: this.currencyAccount?.currentAmount ?? null
      }
    }
  }

  protected openConfigDialog() {
    const dialog = this.dialog.open<CardInfoConfigDialogComponent, ICardInfoConfig>(CardInfoConfigDialogComponent, {
      data: this.cardInfoConfig
    });
    dialog.afterClosed().subscribe((result: ICardInfoConfig) => {
      Object.assign(this.cardInfoConfig, result);
      localStorage.setItem("cardInfoConfig", JSON.stringify(this.cardInfoConfig));
    })
  }

  private async getWalletCode(): Promise<string | null> {
    if (!this.userId) {
      return null;
    }

    if (this.isPublic) {
      return this.userId + '' + (await this.getPublicToken(this.userId));
    }
    return this.userId + '' + (await Utils.createWalletHash(this.userId + '' + environment.walletApiSecret))
  }

  private async getPaymentString() {
    if (!this.cardInfoConfig.paymentAccount) {
      return "";
    }

    const currency = await this.currencyService.getDefaultCurrency();
    let filterBy: { [key: string]: any } = {
      usersFilter: [this.userId],
    };

    const statistics = await this.transactionService.getStatistics(currency.id!, filterBy);
    this.paymentAmount = statistics.sumPrice;
    // const baParts = this.cardInfoConfig.paymentAccount.split("/");
    // if(baParts[0].length < 10) {
    //   baParts[0].padStart(10, "0")
    // }
    // const ib = iban.fromBBAN("CZ", `${baParts[1]}000000${baParts[0]}`);
    return `SPD*1.0*ACC:${this.cardInfoConfig.paymentAccount}*AM:${(this.currencyAccount?.currentAmount ?? 0) * -1}*CC:CZK*VS:${this.userId}*MSG:${this.user?.name ?? this.userPublic?.user.Name}`;
  }

  private async getPublicToken(userId: number) {
    return (await Utils.createWalletHash(userId + '' + environment.walletApiSecret));
  }

  protected async confirmGroupChange(newGroupId: number | null) {
    const userGroupId = this.user?.groups?.[0];

    if (!this.userId || userGroupId === newGroupId) {
      return;
    }

    this.isLoading = true;
    try {
      if (userGroupId) {
        await this.groupsService.removeUserFromGroup(this.userId, userGroupId);
      }

      if (newGroupId) {
        await this.groupsService.addUserToGroup(this.userId, newGroupId);
      }

      this.reset();
      this.alertService.success('Tvoje skupina byla změněna');
    } catch (e) {
      console.error("Failed to change group", e);
    } finally {
      this.isLoading = false;
    }
  }

}
