import {
	Component,
	EventEmitter,
	HostListener,
	inject,
	Input,
	OnDestroy,
	OnInit,
	Output,
	Renderer2
} from '@angular/core';
import {Subject, takeUntil} from 'rxjs';
import {CustomerService} from '../../../modules/sale/services/customer/customer.service';
import {AlertService} from '../../services/alert/alert.service';
import {MatButtonModule} from '@angular/material/button';
import {CommonModule} from '@angular/common';
import {UsersService} from '../../../modules/admin/services/users/users.service';
import {IUser} from '../../types/IUser';
import {CardsService} from '../../../modules/admin/services/cards/cards.service';
import {Utils} from '../../utils/Utils';
import {MatIconModule} from '@angular/material/icon';
import {MatTooltipModule} from '@angular/material/tooltip';
import {AuthService} from '../../../modules/login/services/auth/auth.service';

@Component({
	selector: 'app-card-loader',
	templateUrl: './card-loader.component.html',
	styleUrls: ['./card-loader.component.scss'],
	standalone: true,
	imports: [CommonModule, MatButtonModule, MatIconModule, MatTooltipModule],
})
export class CardLoaderComponent implements OnInit, OnDestroy {
	@Input()
	public showNewCardButton: boolean = true;
	protected customerService: CustomerService = inject(CustomerService);
	protected authService: AuthService = inject(AuthService);
	protected userCards: Record<string, number> = {};
	private renderer: Renderer2 = inject(Renderer2);
	private alertService: AlertService = inject(AlertService);

	@Input()
	public hidden: boolean = false;
	private usersService: UsersService = inject(UsersService);

	@Output()
	public cardIdChange: EventEmitter<number> = new EventEmitter<number>();
	private cardsService: CardsService = inject(CardsService);
	private unsubscribe: Subject<void> = new Subject();
	private keydownListener: any;
	private czechEnglishKeymap: {[key: string]: number} = {
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
	protected focused: boolean = true;
	private prevEventTime: number = 0;

	public async ngOnInit(): Promise<void> {
		this.customerService.customer$
			.pipe(takeUntil(this.unsubscribe))
			.subscribe((user) => {
				// user was logged out, listen for new id
				if(user === null) {
					this.initCardListener();
				}
			});

		if(this.authService.isDebug) {
			const users = Utils.toHashMap((await this.usersService.getUsers('', 0, 10)).data, 'id') as Record<number, IUser>;
			const cards = (await this.cardsService.getCards(0, 10)).data;

			for(const card of cards) {
				if(card.userId !== undefined && card.uid) {
					this.userCards[users[card.userId].name] = card.uid;
				}
			}
		}
	}

	public ngOnDestroy(): void {
		this.unsubscribe.next();
		this.removeKeydownListener();
	}

	public async debugLoadNewCard(): Promise<void> {
		this.cardIdChange.emit(this.generateRandomCardId());
	}

	protected loadUserCard(cardId: number): void {
		this.cardIdChange.emit(cardId);
	}

	@HostListener("window:blur")
	protected checkBlur(): void {
		this.focused = false;
	}

	@HostListener("window:focus")
	protected checkFocus(): void {
		this.focused = true;
	}

	private generateRandomCardId(): number {
		return Math.floor(Math.random() * 9000000000) + 1000000000;
	}

	private initCardListener(): void {
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
					console.error('Card id loading error: ', e);
					this.alertService.error('Nepodařilo se načíst kartu. Zkontroluj, jestli máš nastavenou CZ klávesnici.');
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
	private convertFromCzechToNumbers(id: string): number {
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

	private removeKeydownListener(): void {
		if(this.keydownListener) {
			this.keydownListener();
			this.keydownListener = undefined;
		}
	}
}
