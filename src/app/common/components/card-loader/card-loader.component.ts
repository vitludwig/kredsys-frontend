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
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatSelectModule} from '@angular/material/select';
import {FormsModule} from '@angular/forms';
import {AuthService} from '../../../modules/login/services/auth/auth.service';

@Component({
	selector: 'app-card-loader',
	templateUrl: './card-loader.component.html',
	styleUrls: ['./card-loader.component.scss'],
	imports: [CommonModule, MatButtonModule, MatIconModule, MatTooltipModule,
		MatFormFieldModule, MatSelectModule, FormsModule]
})
export class CardLoaderComponent implements OnInit, OnDestroy {
	@Input()
	public showNewCardButton: boolean = true;
	protected customerService: CustomerService = inject(CustomerService);
	protected authService: AuthService = inject(AuthService);
	protected userCards: Record<string, number> = {};
	protected allUserCards: { name: string; uid: number }[] = [];
	private renderer: Renderer2 = inject(Renderer2);
	private alertService: AlertService = inject(AlertService);

	@Input()
	public hidden: boolean = false;

	/**
   * When true, a card that is already assigned to a user is rejected (not emitted) and an inline error is shown.
   */
	@Input()
	public requireUnassigned: boolean = false;

	protected cardTakenError: boolean = false;
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
		'Ě': 2,
		'Š': 3,
		'Č': 4,
		'Ř': 5,
		'Ž': 6,
		'Ý': 7,
		'Á': 8,
		'Í': 9,
		'É': 0,
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
			const cards = (await this.cardsService.getCards(0, 100)).data
				.filter(c => c.uid !== undefined && c.userId !== undefined);

			const allUniqueUserIds = [...new Set(cards.map(c => c.userId!))];
			const users = Utils.toHashMap(
				await Promise.all(allUniqueUserIds.map(id => this.usersService.getUser(id))),
				'id'
			) as Record<number, IUser>;

			const firstThreeIds = allUniqueUserIds.slice(0, 3);
			for(const card of cards) {
				if(card.userId !== undefined && card.uid && users[card.userId] && firstThreeIds.includes(card.userId)) {
					this.userCards[users[card.userId].name] = card.uid;
				}
			}

			this.allUserCards = cards
				.filter(c => users[c.userId!])
				.map(c => ({ name: users[c.userId!].name, uid: c.uid! }))
				.sort((a, b) => a.name.localeCompare(b.name));
		}
	}

	public selectDebugUser(uid: number | null | undefined): void {
		if (uid == null) return;
		void this.emitCard(uid);
	}

	// Funnel for the keyboard/NFC scan path: emits, and re-arms the listener if the card was rejected.
	private async handleScannedCard(uid: number): Promise<void> {
		const emitted = await this.emitCard(uid);
		if(!emitted) {
			// Card already assigned — re-arm the listener so another card can be scanned.
			this.initCardListener();
		}
	}

	private async emitCard(uid: number): Promise<boolean> {
		this.cardTakenError = false;

		if(this.requireUnassigned) {
			try {
				if(await this.usersService.isCardAssigned(uid)) {
					this.cardTakenError = true;
					return false;
				}
			} catch(e) {
				// Fail-open: the backend unique index remains the final guard.
				console.error('Card availability check failed', e);
			}
		}

		this.cardIdChange.emit(uid);
		return true;
	}

	public ngOnDestroy(): void {
		this.unsubscribe.next();
		this.removeKeydownListener();
	}

	public async debugLoadNewCard(): Promise<void> {
		// E2E hook: tests can pin the next UID by setting `window.__E2E_NEXT_CARD_UID__`
		// before clicking the button. Avoids the broken Math.random override that
		// only worked for one call and didn't survive page reloads.
		const e2eUid = (typeof window !== 'undefined')
			? (window as unknown as { __E2E_NEXT_CARD_UID__?: number }).__E2E_NEXT_CARD_UID__
			: undefined;
		if (typeof e2eUid === 'number' && Number.isFinite(e2eUid)) {
			delete (window as unknown as { __E2E_NEXT_CARD_UID__?: number }).__E2E_NEXT_CARD_UID__;
			await this.emitCard(e2eUid);
			return;
		}
		await this.emitCard(this.generateRandomCardId());
	}

	protected loadUserCard(cardId: number): void {
		void this.emitCard(cardId);
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
				// The scan terminator must not leak into the UI: a focused button (e.g. a dialog's
				// close "X") or a form would otherwise be activated/submitted by this Enter.
				event.preventDefault();
				this.removeKeydownListener();

				try {
					let numberId = Number(userId);

					if(Number.isNaN(numberId)) {
						numberId = this.convertFromCzechToNumbers(userId);
					}

					void this.handleScannedCard(numberId);
				} catch(e) {
					console.error('Card id loading error: ', e);
					this.alertService.error('Nepodařilo se načíst čip. Zkontroluj, jestli máš nastavenou CZ klávesnici.');
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
