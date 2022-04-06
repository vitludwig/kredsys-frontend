import {Component, EventEmitter, Input, OnDestroy, OnInit, Output, Renderer2} from '@angular/core';
import {Subject, takeUntil} from 'rxjs';
import {UserService} from '../../services/user/user.service';

@Component({
	selector: 'app-card-loader',
	templateUrl: './card-loader.component.html',
	styleUrls: ['./card-loader.component.scss']
})
export class CardLoaderComponent implements OnInit, OnDestroy {
	@Input()
	public hidden: boolean = false;

	@Output()
	public cardId: EventEmitter<string> = new EventEmitter<string>();

	protected unsubscribe: Subject<void> = new Subject();
	protected keydownListener: any;

	constructor(
		public userService: UserService,
		protected renderer: Renderer2,
	) {
	}

	public ngOnInit(): void {
		this.userService.user$
			.pipe(takeUntil(this.unsubscribe))
			.subscribe((user) => {
				// user was logged out, listen for new id
				if(user === null) {
					this.initCardListener();
				}
			})
	}

	protected initCardListener(): void {
		let userId = '';

		this.keydownListener = this.renderer.listen('document', 'keydown', (event) => {
			// loading sequence is completed with Enter key (13)
			if(event.keyCode === 13) {
				this.removeKeydownListener();
				// this.userService.loadUser(Number(this.userId));
				this.cardId.emit(userId);
				console.log('user id: ', this.cardId);
			} else {
				userId += event.key
			}
		})

	}

	protected removeKeydownListener(): void {
		if(this.keydownListener) {
			this.keydownListener();
			this.keydownListener = undefined;
		}
	}

	public ngOnDestroy(): void {
		this.unsubscribe.next();
		this.removeKeydownListener();
	}

}
