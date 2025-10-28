import {effect, inject, Injectable, Signal} from '@angular/core';
import {WebBluetoothReceiptPrinter} from "../../../printer/models/WebBluetoothReceiptPrinter";
import {SavedPrinterNotFound} from "../../../printer/exceptions/SavedPrinterNotFound";
import {AlertService} from "../../../../common/services/alert/alert.service";
import {IOrderItem} from "../../types/IOrderItem";
import {StringUtils} from "../../../../common/utils/StringUtils";
import {FeatureFlagService} from "../../../../common/modules/feature-flags/services/feature-flag/feature-flag.service";
import {EFeatureFlag} from "../../../../common/modules/feature-flags/types/EFeatureFlag";

declare var ReceiptPrinterEncoder: any;

@Injectable({
  providedIn: 'root'
})
export class PrintService {
  private readonly alertService = inject(AlertService);
  private readonly featureFlagService = inject(FeatureFlagService);

  public connectInProgress: Signal<boolean>;
  public canPrint: boolean = false;

  private receiptPrinter?: WebBluetoothReceiptPrinter;
  private encoder?: any;
  private printerLanguage?: any;
  private lastUsedDevice?: any;
  private logo?: HTMLImageElement;

  constructor() {
    if(this.featureFlagService.isEnabled(EFeatureFlag.PRINTER)) {
      this.initPrinter();
    }
  }

  private initPrinter(): void {
    this.loadLogo();
    this.receiptPrinter = new WebBluetoothReceiptPrinter();

    this.connectInProgress = this.receiptPrinter.connectInProgress;

    effect(() => {
      console.log('Connecting printer', this.connectInProgress());
    });

    this.receiptPrinter.addEventListener('connected', (device: any) => {
      console.log(`Connected to ${device.name} (#${device.id})`);
      console.log(device);
      this.printerLanguage = device.language;

      /* Store device for reconnecting */
      this.lastUsedDevice = device;
      localStorage.setItem('lastUsedDevice', JSON.stringify(device));

      this.encoder = new ReceiptPrinterEncoder({
        language: this.printerLanguage,
        codepageMapping: 'mpt'
      });
      this.alertService.success("Tiskárna připojena");
      this.canPrint = true;
    });

    this.tryReconnectLast();
  }

  public async connect(): Promise<void> {
    if(!this.receiptPrinter) {
      console.error('Printer not initialized');
      return;
    }

    await this.receiptPrinter.connect();
  }

  public async disconnect(): Promise<void> {
    if(!this.receiptPrinter) {
      console.error('Printer not initialized');
      return;
    }

    await this.receiptPrinter.disconnect();
    localStorage.removeItem('lastUsedDevice');
  }

  public printReceipt(receipt: IOrderItem[], customerName: string): void {
    if(!this.receiptPrinter || !this.encoder) {
      console.error('Printer not initialized');
      return;
    }

    const now = new Date().toLocaleTimeString('cs-CZ', {
      hour: '2-digit',
      minute: '2-digit'
    });

    const data = this.encoder
      .codepage('auto')
      .align('center')
      .image(this.logo, 128, 128)
      .align('left')
      .line('--------------------------------')
      .line(`Pro: ${StringUtils.removeAccents(customerName)}`)
      .line(now)
      .line('--------------------------------')
      .newline()

    for (const item of receipt) {
      data.text(`${item.count}x  ${StringUtils.removeAccents(item.item.name)}`);
      data.newline();
    }

    data.newline();
    data.newline();

    this.receiptPrinter.print(data.encode());
  }

  public testPrint(): void {
    if(!this.receiptPrinter) {
      console.error('Printer not initialized');
      return;
    }

    this.printReceipt([{item: {id: -1, name: 'Pivíčko', icon: '', type: 1, price: 1}, count: 1}], 'Uživatel 1');
  }

  private async tryReconnectLast(): Promise<void> {
    if(!this.receiptPrinter) {
      console.error('Printer not initialized');
      return;
    }

    const last = localStorage.getItem('lastUsedDevice');
    if (last) {
      this.lastUsedDevice = JSON.parse(last);
      if (this.lastUsedDevice) {
        try {
          await this.receiptPrinter.reconnect(this.lastUsedDevice);
        } catch (e) {
          if (e instanceof SavedPrinterNotFound) {
            this.alertService.error("Uložená tiskárna nenalezena. Připojte ji znovu");
          }
          this.alertService.error("Neznámá chyba tiskárny. Připojte ji znovu");
          console.error('Printer reconnect error: ', e);
          localStorage.removeItem('lastUsedDevice');
        }
      }
    }
  }

  public isConnected(): boolean {
    return this.receiptPrinter?.isConnected() ?? false;
  }

  private loadLogo(): void {
    this.logo = new Image();
    this.logo.src = '/assets/images/print-logo.png'
  }
}

//
// MPT-2
// {
//   filters: [
//     {
//       name: 		'MPT-II',
//       services: 	[ '000018f0-0000-1000-8000-00805f9b34fb' ]
//     }
//   ],
//
//     functions: {
//   'print':		{
//     service: 		'000018f0-0000-1000-8000-00805f9b34fb',
//       characteristic:	'00002af1-0000-1000-8000-00805f9b34fb'
//   },
//
//   'status':		{
//     service: 		'000018f0-0000-1000-8000-00805f9b34fb',
//       characteristic:	'00002af0-0000-1000-8000-00805f9b34fb'
//   }
// },
//
//   language:			'esc-pos',
//     codepageMapping:	'mpt'
// },
