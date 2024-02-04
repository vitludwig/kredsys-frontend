import {Component, inject, Input, OnDestroy, OnInit} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {ChargeDialogComponent} from '../../../../../modules/sale/components/charge-dialog/charge-dialog.component';
import {MatDrawer} from '@angular/material/sidenav';
import {Router} from '@angular/router';
import {CustomerService} from '../../../../../modules/sale/services/customer/customer.service';
import {IPlace} from '../../../../types/IPlace';
import {ICurrencyAccount} from '../../../../types/ICurrency';
import {Observable, Subject, takeUntil} from 'rxjs';
import {EUserRole, IUser} from '../../../../types/IUser';
import {AuthService} from '../../../../../modules/login/services/auth/auth.service';
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
	protected router: Router = inject(Router);
	protected customerService: CustomerService = inject(CustomerService);
	private dialog: MatDialog = inject(MatDialog);
	private authService: AuthService = inject(AuthService);
	private alertService: AlertService = inject(AlertService);

	protected canChargeMoney: boolean = false;
	protected amountLoading: boolean = false;

	@Input()
	public sideMenu: MatDrawer;

	@Input()
	public place: IPlace | null;

	private unsubscribe$: Subject<void> = new Subject();

	public async ngOnInit(): Promise<void> {
		this.authService.isLogged$
			.pipe(takeUntil(this.unsubscribe$))
			.subscribe((isLogged) => {
				if(isLogged) {
					// TODO: fix this properly with permission list
					this.canChargeMoney = this.authService.user!.roles!.includes(EUserRole.POWER_SALESMAN) || this.authService.user!.roles!.includes(EUserRole.ADMIN);
				}
			});
	}

	public ngOnDestroy() {
		this.unsubscribe$.next();
	}

	protected openChargeDialog(): void {
		const dialogRef = this.dialog.open<ChargeDialogComponent, number>(ChargeDialogComponent, {
			width: '300px',
			minWidth: '250px',
			autoFocus: 'dialog',
			data: 0,
		});

		dialogRef.afterClosed().subscribe((amount) => {
			if(amount !== undefined) {
				this.chargeMoney(amount)
			}
		});
	}

	protected openDischargeDialog(): void {
		const dialogRef = this.dialog.open<DischargeDialogComponent, { user: Observable<IUser | null>; currencyAccount: ICurrencyAccount }>(
			DischargeDialogComponent, {
				width: '350px',
				minWidth: '250px',
				autoFocus: 'dialog',
				data: {
					user: this.customerService.customer$,
					currencyAccount: this.customerService.currencyAccount!,
				},
			});

		dialogRef.afterClosed()
			.pipe(takeUntil(this.unsubscribe$))
			.subscribe(async (result) => {
				if(result) {
					this.dischargeMoney();
				}
			}
		);
	}

	protected openStornoDialog(): void {
		const dialogRef = this.dialog.open<StornoDialogComponent, {user: Observable<IUser | null>}>(StornoDialogComponent, {
			width: '400px',
			minWidth: '250px',
			autoFocus: 'dialog',
			data: {
				user: this.customerService.customer$
			},
		});

		dialogRef.afterClosed()
			.pipe(takeUntil(this.unsubscribe$))
			.subscribe((transactionId) => {
				this.stornoLastTransaction(transactionId);
			}
		);
	}

	private async chargeMoney(amount: number): Promise<void> {
		if(!this.place) {
			return;
		}

		try {
			this.amountLoading = true;
			await this.customerService.chargeMoney(amount, this.place)

			this.alertService.success('Peníze nabity');
		} catch(e) {
			console.error('Cannot deposit money: ', e);
			this.alertService.error('Nepodařilo se nabít peníze');
		} finally {
			this.amountLoading = false;
		}
	}

	private async dischargeMoney(): Promise<void> {
		if(this.customerService.currencyAccount!.currentAmount <= 0 || !this.place) {
			return;
		}

		try {
			this.amountLoading = true;
			await this.customerService.dischargeMoney(this.place)

			this.alertService.success('Peníze vybity');
		} catch(e) {
			console.error('Cannot discharge money: ', e);
			this.alertService.error('Nepodařilo se vybít peníze');
		} finally {
			this.amountLoading = false;
		}
	}

	private async stornoLastTransaction(transactionId: number): Promise<void> {
		if(!Number.isInteger(transactionId)) {
			return;
		}

		try {
			this.amountLoading = true;
			await this.customerService.stornoLastTransaction(transactionId);

			this.alertService.success('Transakce storována');
		} catch(e) {
			console.error('Cannot storno transaction: ', e);
			this.alertService.error('Transakce se nepodařila storovat');
		} finally {
			this.amountLoading = false;
		}
	}
}
