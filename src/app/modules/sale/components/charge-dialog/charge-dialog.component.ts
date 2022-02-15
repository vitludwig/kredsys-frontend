import {Component, OnInit} from '@angular/core';
import {UserService} from '../../../../common/services/user/user.service';

@Component({
	selector: 'app-charge-dialog',
	templateUrl: './charge-dialog.component.html',
	styleUrls: ['./charge-dialog.component.scss']
})
export class ChargeDialogComponent implements OnInit {
	public amount: number;
	public predefinedAmounts: number[] = [500, 800, 1000, 1500, 2000]

	constructor(
		protected userService: UserService,
	) {
	}

	public ngOnInit(): void {
	}

	public chargeMoney(): void {
		this.userService.chargeMoney(this.amount);
	}

}
