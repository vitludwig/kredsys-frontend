import { ChangeDetectorRef, Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { IUser } from '../../../../../../common/types/IUser';
import { ICurrency, ICurrencyAccount } from '../../../../../../common/types/ICurrency';
import { UsersService } from '../../../../services/users/users.service';
import { CurrencyService } from '../../../../services/currency/currency.service';
import { AlertService } from '../../../../../../common/services/alert/alert.service';
import { IChargeResult } from '../../types/IChargeResult';

@Component({
	selector: 'app-charge-form',
	templateUrl: './charge-form.component.html',
	styleUrls: ['./charge-form.component.scss'],
	standalone: false
})
export class ChargeFormComponent implements OnInit {
	private usersService = inject(UsersService);
	private currencyService = inject(CurrencyService);
	private alertService = inject(AlertService);
	private cdr = inject(ChangeDetectorRef);

	protected amount: number | null;
	protected predefinedAmounts: number[] = [500, 800, 1000, 1500, 2000];
	protected user: IUser | null;
	protected currencyAccount: ICurrencyAccount | null;

  @Input()
	public set cardId(value: number | null) {
		this.#cardId = value;
		this.setCardId(value);
	}

  public get cardId(): number | null {
  	return this.#cardId;
  }

  @Output()
  public charge: EventEmitter<IChargeResult> = new EventEmitter<IChargeResult>();

  #cardId: number | null;
  protected defaultCurrency: ICurrency;

  protected isLoading = true;

  public async ngOnInit(): Promise<void> {
  	this.defaultCurrency = await this.currencyService.getDefaultCurrency();
  	this.isLoading = false;
  	this.cdr.markForCheck();
  }

  public async setCardId(id: number | null): Promise<void> {
  	if (id === null) return;
  	this.#cardId = id;
  	try {
  		this.user = (await this.usersService.getUserByCardUid(id)).user;
  		this.currencyAccount = (await this.usersService.getUserCurrencyAccounts(this.user.id!))[0];
  	} catch (e) {
  		console.error(e);
  		this.cardId = null;
  		this.alertService.error('Uživatel s tímto čipem je blokovaný nebo čip neexistuje');
  	}
  }

  public async submit(): Promise<void> {
  	if (!this.user) return;

  	this.charge.emit({
  		amount: this.amount ?? 0,
  		user: this.user,
  		currencyId: this.currencyAccount?.currencyId ?? this.defaultCurrency.id!,
  		cardUid: this.#cardId,
  	});

  	this.user = null;
  	this.currencyAccount = null;
  	this.amount = null;
  	this.#cardId = null;
  }
}
