import {Component, OnDestroy, OnInit, Renderer2} from '@angular/core';
import {UserService} from '../../common/services/user/user.service';
import {Subject, takeUntil} from 'rxjs';

@Component({
	selector: 'app-sale',
	templateUrl: './sale.component.html',
	styleUrls: ['./sale.component.scss']
})
export class SaleComponent implements OnInit {


	constructor() {
	}

	public ngOnInit(): void {

	}

}
