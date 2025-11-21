import {NgModule} from '@angular/core';
import {CardInfoComponent} from './card-info.component';
import {SharedModule} from '../../shared.module';
import {CardInfoRoutingModule} from './card-info-routing.module';
import {CardLoaderComponent} from '../../common/components/card-loader/card-loader.component';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import { QRCodeModule } from 'angularx-qrcode';
import {MatButtonModule} from "@angular/material/button";
import {MatDialogModule} from "@angular/material/dialog";
import {MatIconModule} from "@angular/material/icon";
import {LoginModule} from "../login/login.module";
import {CardInfoConfigDialogComponent} from "./components/card-info-config-dialog/card-info-config-dialog.component";

@NgModule({
	declarations: [
		CardInfoComponent,
	],
    imports: [
        SharedModule,
        CardInfoRoutingModule,
        CardLoaderComponent,
        MatProgressSpinnerModule,
        QRCodeModule,
        MatButtonModule,
        MatDialogModule,
        MatIconModule,
        LoginModule,
        CardInfoConfigDialogComponent,
    ]
})
export class CardInfoModule {
}
