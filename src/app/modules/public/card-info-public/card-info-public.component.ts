import {Component, } from '@angular/core';
import {LoginModule} from "../../login/login.module";
import {MatButtonModule} from "@angular/material/button";
import {MatIconModule} from "@angular/material/icon";
import {MatProgressSpinnerModule} from "@angular/material/progress-spinner";
import {QRCodeModule} from "angularx-qrcode";

import {CardInfoModule} from "../../card-info/card-info.module";

@Component({
  selector: 'app-card-info-public',
  standalone: true,
  imports: [
    LoginModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    QRCodeModule,
    CardInfoModule
  ],
  templateUrl: './card-info-public.component.html',
  styleUrl: './card-info-public.component.scss'
})
export class CardInfoPublicComponent {
  // protected usersService: UsersService = inject(UsersService);
  // protected authService: AuthService = inject(AuthService);
  //
  // protected userId: number | null;
  // protected userCardInfo: IPublicUserInfo | null;
  // protected isLoading: boolean = false;
  // protected cardLoaded: boolean = false;
  // protected walletCode: string;
  //
  // public ngOnInit() {
  //   const config = JSON.parse(localStorage.getItem("cardInfoConfig") ?? "{}");
  //   this.cardInfoConfig = new CardInfoConfig(config);
  // }
  //
  // public async setCardId(id: number): Promise<void> {
  //   try {
  //     this.isLoading = true;
  //     this.userId = (await this.usersService.getPublicUserIdByCardUid(id));
  //
  //     if(this.userId) {
  //       this.walletCode = await this.getWalletCode();
  //       const publicToken = await this.getPublicToken();
  //       this.userCardInfo = (await this.usersService.getPublicUserInfo(this.userId, publicToken));
  //     }
  //   } catch(e) {
  //     console.error('Cannot display user currency data: ', e);
  //   } finally {
  //     this.isLoading = false;
  //     this.cardLoaded = true;
  //   }
  //
  //   setTimeout(() => {
  //     this.userCardInfo = null;
  //     this.userId = null;
  //     this.cardLoaded = false;
  //   }, ETime.SECOND * 10);
  // }
  //
  // private async getWalletCode() {
  //   return this.userId + '' + (await this.getPublicToken());
  // }
  //
  // private async getPublicToken() {
  //   return (await Utils.createWalletHash(this.userId + '' + environment.walletApiSecret));
  // }
  //
  // protected readonly ERoute = ERoute;
  // protected readonly userGroup$ = EMPTY;
}
