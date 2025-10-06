import {AfterViewInit, inject, Injectable} from '@angular/core';
import {WebBluetoothReceiptPrinter} from "../../../printer/models/WebBluetoothReceiptPrinter";
import {SavedPrinterNotFound} from "../../../printer/exceptions/SavedPrinterNotFound";
import {AlertService} from "../../../../common/services/alert/alert.service";
import {ISaleItem} from "../../types/ISaleItem";
import {IOrderItem} from "../../types/IOrderItem";
import {StringUtils} from "../../../../common/utils/StringUtils";
declare var ReceiptPrinterEncoder: any;
// declare var WebBluetoothReceiptPrinter: any;

@Injectable({
  providedIn: 'root'
})
export class PrintService {
  private readonly alertService = inject(AlertService);

  private receiptPrinter: WebBluetoothReceiptPrinter;
  private encoder: any;
  private printerLanguage: any;
  private lastUsedDevice: any;

  constructor() {
    this.receiptPrinter = new WebBluetoothReceiptPrinter();

    this.receiptPrinter.addEventListener('connected', (device: any) => {
      console.log(`Connected to ${device.name} (#${device.id})`);
      console.log(device);
      this.printerLanguage = device.language;

      /* Store device for reconnecting */
      this.lastUsedDevice = device;
      localStorage.setItem('lastUsedDevice', JSON.stringify(device));

      this.encoder = new ReceiptPrinterEncoder({
        language:  this.printerLanguage,
        codepageMapping: 'mpt'
      });
      this.alertService.success("Tiskárna připojena");
    });

    this.tryReconnectLast();
  }

  public async connect() {
    await this.receiptPrinter.connect();
  }

  public async disconnect() {
    await this.receiptPrinter.disconnect();
    localStorage.removeItem('lastUsedDevice');
  }

  public printReceipt(receipt: IOrderItem[], customerName: string) {
    const now = new Date().toLocaleTimeString('cs-CZ', {
      hour: '2-digit',
      minute: '2-digit'
    });

    const data = this.encoder
      .codepage('auto')
      .newline()
      .line('--------------------------------')
      .line(`Pro: ${StringUtils.removeAccents(customerName)}`)
      .line(now)
      .line('--------------------------------')
      .newline()

    for(const item of receipt) {
      data.text(`${item.count}x  ${StringUtils.removeAccents(item.item.name)}`);
      data.newline();
    }

    data.newline();

    this.receiptPrinter.print(data.encode());
  }

  public async testPrint() {
    // const image = document.getElementById('testimg');

    let data = this.encoder
      .codepage('auto')
      .text(StringUtils.removeAccents('Příliš žluťoučký kůň úpěl ďábelské ódy'))
      // .newline()
      // .image(image, 320, 320)
      .encode();

    this.receiptPrinter.print(data);
  }

  private async tryReconnectLast() {
    const last = localStorage.getItem('lastUsedDevice');
    if(last) {
      this.lastUsedDevice = JSON.parse(last);
      if (this.lastUsedDevice) {
        try {
          await this.receiptPrinter.reconnect(this.lastUsedDevice);
        } catch(e) {
          if(e instanceof SavedPrinterNotFound) {
            this.alertService.error("Uložená tiskárna nenalezena. Připojte ji znovu");
          }
          this.alertService.error("Neznámá chyba tiskárny. Připojte ji znovu");
          console.error('Printer reconnect error: ', e);
          localStorage.removeItem('lastUsedDevice');
        }
      }
    }
  }

  public isConnected() {
    return this.receiptPrinter.isConnected();
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
