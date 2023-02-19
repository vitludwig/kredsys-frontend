import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {ChargeDialogComponent} from '../../../../../modules/sale/components/charge-dialog/charge-dialog.component';
import {MatDrawer} from '@angular/material/sidenav';
import {ActivationEnd, Router} from '@angular/router';
import {CustomerService} from '../../../../../modules/sale/services/customer/customer.service';
import {IPlace} from '../../../../types/IPlace';
import {ICurrency, ICurrencyAccount} from '../../../../types/ICurrency';
import {CurrencyService} from '../../../../../modules/admin/services/currency/currency.service';
import {Subject, takeUntil} from 'rxjs';
import {EUserRole, IUser} from '../../../../types/IUser';
import {UsersService} from '../../../../../modules/admin/services/users/users.service';
import {OrderService} from '../../../../../modules/sale/services/order/order.service';
import {AuthService} from '../../../../../modules/login/services/auth/auth.service';
import {
	TransactionService
} from '../../../../../modules/admin/modules/transactions/services/transaction/transaction.service';
import {
	ITransactionRecordDeposit
} from '../../../../../modules/admin/modules/transactions/services/transaction/types/ITransaction';
import {StornoDialogComponent} from "../../../../../modules/sale/components/storno-dialog/storno-dialog.component";
import {AlertService} from "../../../../services/alert/alert.service";
import {
	DischargeDialogComponent
} from "../../../../../modules/sale/components/discharge-dialog/discharge-dialog.component";

@Component({
	selector: 'app-top-menu',
	templateUrl: './top-menu.component.html',
	styleUrls: ['./top-menu.component.scss'],
})
export class TopMenuComponent implements OnInit, OnDestroy {
	public pageName: string = '';
	public customer: IUser | null;
	public currencyAccount: ICurrencyAccount | null; // TODO: this is here onl temporary until we can create CurrencyAccount
	public canChargeMoney: boolean = false;

	protected defaultCurrency: ICurrency;

	@Input()
	public sideMenu: MatDrawer;

	@Input()
	public place: IPlace;

	protected unsubscribe: Subject<void> = new Subject();

	constructor(
		public router: Router,
		public customerService: CustomerService,
		public usersService: UsersService,
		protected transactionService: TransactionService,
		protected currencyService: CurrencyService,
		protected orderService: OrderService,
		protected dialog: MatDialog,
		protected authService: AuthService,
		protected alertService: AlertService,
	) {
		this.router.events
			.subscribe((e) => {
				if(e instanceof ActivationEnd && e.snapshot.data.hasOwnProperty('name')) {
					this.pageName = e.snapshot.data['name'] ?? '';
				}
			});
	}

	public async ngOnInit(): Promise<void> {
		this.customerService.customer$
			.pipe(takeUntil(this.unsubscribe))
			.subscribe(async (customer) => {
				this.customer = customer;
				if(customer) {
					this.loadCurrencyAccount(customer.id!);
				} else {
					this.currencyAccount = null;
				}
			});

		this.orderService.balance$
			.pipe(takeUntil(this.unsubscribe))
			.subscribe((amount) => {
				if(this.currencyAccount) {
					this.currencyAccount.currentAmount = amount;
				}
			});

		this.defaultCurrency = await this.currencyService.getDefaultCurrency();
		this.authService.isLogged$
			.pipe(takeUntil(this.unsubscribe))
			.subscribe((isLogged) => {
				if(isLogged) {
					// TODO: fix this properly with permission list
					this.canChargeMoney = this.authService.user!.roles!.includes(EUserRole.POWER_SALESMAN) || this.authService.user!.roles!.includes(EUserRole.ADMIN);
				}
			});
	}

	protected async loadCurrencyAccount(userId: number): Promise<void> {
		this.currencyAccount = (await this.usersService.getUserCurrencyAccounts(userId))[0];
		this.orderService.balance = this.currencyAccount?.currentAmount;
	}

	public openChargeDialog(): void {
		const dialogRef = this.dialog.open<ChargeDialogComponent, number>(ChargeDialogComponent, {
			width: '300px',
			minWidth: '250px',
			autoFocus: 'dialog',
			data: 0,
		});

		dialogRef.afterClosed().subscribe(async (result) => {
			const records: ITransactionRecordDeposit[] = [{
				creatorId: -1,
				amount: result,
				text: '',
			}];
			try {

				const result = await this.transactionService.deposit(
					this.customer!.id!,
					this.place.id!,
					this.currencyAccount?.currencyId ?? this.defaultCurrency.id!,
					records,
				);
				await this.loadCurrencyAccount(this.customer!.id!);
				this.customerService.propagateRefreshCustomer();

				if(this.currencyAccount) {
					this.currencyAccount.currentAmount += result.amount;
				}
				this.alertService.error('Peníze nabity');
			} catch(e) {
				console.error('Cannot deposit money: ', e);
				this.alertService.error('Nepodařilo se nabít peníze');
			}
		});
	}

	public openDischargeDialog(): void {
		const dialogRef = this.dialog.open<DischargeDialogComponent, { user: IUser; currencyAccount: ICurrencyAccount }>(
			DischargeDialogComponent, {
				width: '350px',
				minWidth: '250px',
				autoFocus: 'dialog',
				data: {
					user: this.customer!,
					currencyAccount: this.currencyAccount!,
				},
			});

		dialogRef.afterClosed().subscribe(async (result) => {
			if(!result || this.currencyAccount!.currentAmount <= 0) {
				return;
			}
			const records: ITransactionRecordDeposit[] = [{
				creatorId: this.authService.user!.id,
				amount: this.currencyAccount!.currentAmount,
				text: 'Vybití peněz',
			}];
			try {

				await this.transactionService.withDraw(
					this.customer!.id!,
					this.place.id!,
					this.currencyAccount?.currencyId ?? this.defaultCurrency.id!,
					records,
				);
				await this.loadCurrencyAccount(this.customer!.id!);
				this.customerService.propagateRefreshCustomer();

				if(this.currencyAccount) {
					this.currencyAccount.currentAmount = 0;
				}
				this.alertService.success('Peníze vybity');
			} catch(e) {
				console.error('Cannot discharge money: ', e);
				this.alertService.error('Nepodřilo se vybít peníze');
			}
		});
	}

	public openStornoDialog(): void {
		const dialogRef = this.dialog.open<StornoDialogComponent, number>(StornoDialogComponent, {
			width: '300px',
			minWidth: '250px',
			autoFocus: 'dialog',
			data: this.customer?.id,
		});

		dialogRef.afterClosed().subscribe(async (result) => {
			if(result === undefined) {
				return;
			}

			try {
				await this.transactionService.storno(result);
				this.alertService.success('Transakce storována');
				this.customerService.logout();
			} catch(e) {
				console.error('Cannot storno transaction: ', e);
				this.alertService.error('Transakce se nepodařila storovat');
			}
		});
	}

	public ngOnDestroy() {
		this.unsubscribe.next();
	}
}
