import {Component, OnInit} from '@angular/core';
import {ICurrency} from '../../../../../../common/types/ICurrency';
import {CurrencyService} from '../../../../services/currency/currency.service';
import {ActivatedRoute, Router} from '@angular/router';
import {ERoute} from '../../../../../../common/types/ERoute';
import {AlertService} from '../../../../../../common/services/alert/alert.service';

@Component({
	selector: 'app-currency-detail',
	templateUrl: './currency-detail.component.html',
	styleUrls: ['./currency-detail.component.scss'],
})
export class CurrencyDetailComponent implements OnInit {
	public item: ICurrency;
	public isLoading: boolean = true;
	public isEdit: boolean = false;

	constructor(
		protected currencyService: CurrencyService,
		protected route: ActivatedRoute,
		protected router: Router,
		protected alertService: AlertService,
	) {
	}

	public async ngOnInit(): Promise<void> {
		this.isLoading = true;

		try {
			const id = Number(this.route.snapshot.paramMap.get('id'));
			if(id) {
				const item = await this.currencyService.getCurrency(id);
				this.item = Object.assign({}, item);
				this.isEdit = true;
			} else {
				this.item = Object.assign({}, this.currencyService.createNewCurrency());
				this.isEdit = false;
			}
		} catch(e) {
			this.alertService.error('Nepodařilo se načíst měnu');
			console.error(e);
		} finally {
			this.isLoading = false;
		}
	}


	public async onSubmit(): Promise<void> {
		try {
			if(this.isEdit) {
				await this.currencyService.editCurrency(this.item);
			} else {
				await this.currencyService.addCurrency(this.item);
			}
			this.router.navigate([ERoute.ADMIN, ERoute.ADMIN_CURRENCIES]);
		} catch(e) {
			this.alertService.error('Chyba při zpracování měny');
		}
	}

}
