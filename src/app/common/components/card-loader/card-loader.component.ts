import {Component, EventEmitter, Input, OnDestroy, OnInit, Output, Renderer2} from '@angular/core';
import {Subject, takeUntil} from 'rxjs';
import {CustomerService} from '../../../modules/sale/services/customer/customer.service';

@Component({
	selector: 'app-card-loader',
	templateUrl: './card-loader.component.html',
	styleUrls: ['./card-loader.component.scss'],
})
export class CardLoaderComponent implements OnInit, OnDestroy {
	@Input()
	public hidden: boolean = false;

	@Output()
	public cardIdChange: EventEmitter<number> = new EventEmitter<number>();

	protected unsubscribe: Subject<void> = new Subject();
	protected keydownListener: any;
	protected czechEnglishKeymap: {[key: string]: number} = {
		'+': 1,
		'ě': 2,
		'š': 3,
		'č': 4,
		'ř': 5,
		'ž': 6,
		'ý': 7,
		'á': 8,
		'í': 9,
		'é': 0,
	};
	protected prevEventTime: number = 0;

	constructor(
		public customerService: CustomerService,
		protected renderer: Renderer2,
	) {
	}

	public ngOnInit(): void {
		this.customerService.customer$
			.pipe(takeUntil(this.unsubscribe))
			.subscribe((user) => {
				// user was logged out, listen for new id
				if(user === null) {
					this.initCardListener();
				}
			});
	}

	public ngOnDestroy(): void {
		this.unsubscribe.next();
		this.removeKeydownListener();
	}

	public async debugLoadCard(): Promise<void> {
		this.cardIdChange.emit(2866252548);
	}

	protected initCardListener(): void {
		let userId = '';

		this.keydownListener = this.renderer.listen('document', 'keydown', (event) => {
			const timeDiff = Math.abs(new Date().getTime() - this.prevEventTime) / 100; // in ms

			/**
			 * Card loader events are firing cca in 0.02ms to 0.2ms interval
			 * If this interval is bigger, it means user made keydown event himself - reset userId so user input won't be in card id we are listening to
 			 */
			if(timeDiff > 3 && this.prevEventTime !== 0) {
				userId = '';
			}

			// loading sequence is completed with Enter key (13)
			if(event.keyCode === 13 && userId.length > 0) {
				this.removeKeydownListener();

				try {
					let numberId = Number(userId);

					if(Number.isNaN(numberId)) {
						numberId = this.convertFromCzechToNumbers(userId);
					}
					this.cardIdChange.emit(numberId);
				} catch(e) {
					console.error('Token loading error: ', e);
				}
			} else if(event.key.length === 1) {
				userId += event.key;
				this.prevEventTime = new Date().getTime();
			}
		});

	}

	/**
	 * In case of czech keyboard, convert to numbers from diacritics
	 * TODO: make this generic for other languages or check keyboard layout
	 *
	 * @param id
	 * @protected
	 */
	protected convertFromCzechToNumbers(id: string): number {
		let numberId = '';
		for(const char of id) {
			if(this.czechEnglishKeymap[char] !== undefined) {
				numberId += this.czechEnglishKeymap[char] + '';
			} else {
				throw new Error('Invalid id conversion on char ' + char);
			}
		}
		return Number(numberId);
	}

	protected removeKeydownListener(): void {
		if(this.keydownListener) {
			this.keydownListener();
			this.keydownListener = undefined;
		}
	}
}
