import {Component, Input, OnInit} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {ChargeDialogComponent} from '../../../../../modules/sale/components/charge-dialog/charge-dialog.component';
import {UserService} from '../../../../services/user/user.service';
import {MatDrawer} from '@angular/material/sidenav';

@Component({
	selector: 'app-top-menu',
	templateUrl: './top-menu.component.html',
	styleUrls: ['./top-menu.component.scss']
})
export class TopMenuComponent implements OnInit {
	@Input('side-menu')
	public sideMenu: MatDrawer

	constructor(
		public userService: UserService,
		protected dialog: MatDialog,
	) {
	}

	public ngOnInit(): void {
	}

	public openChargeDialog(): void {
		this.dialog.open(ChargeDialogComponent, {
			width: '300px',
			minWidth: '250px',
			autoFocus: 'dialog',
			data: {},
		});

		// dialogRef.afterClosed().subscribe(result => {
		// 	console.log(`Dialog result: ${result}`);
		// });
	}

}
