import {Component, Input, OnInit} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {ChargeDialogComponent} from '../../../../../modules/sale/components/charge-dialog/charge-dialog.component';
import {UserService} from '../../../../services/user/user.service';
import {MatDrawer} from '@angular/material/sidenav';
import {ActivationEnd, Router} from '@angular/router';

@Component({
	selector: 'app-top-menu',
	templateUrl: './top-menu.component.html',
	styleUrls: ['./top-menu.component.scss']
})
export class TopMenuComponent {
	public pageName: string = '';

	@Input()
	public sideMenu: MatDrawer

	constructor(
		public router: Router,
		public userService: UserService,
		protected dialog: MatDialog,
	) {
		this.router.events
			.subscribe((e) => {
				if(e instanceof ActivationEnd && e.snapshot.data.hasOwnProperty('name')) {
					this.pageName = e.snapshot.data['name'] ?? '';
				}
			})
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
