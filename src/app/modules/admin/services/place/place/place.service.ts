import {Injectable, OnDestroy, inject} from '@angular/core';
import {IPaginatedResponse} from '../../../../../common/types/IPaginatedResponse';
import {EPlaceRole, IPlace, IPlaceGoodsResponse} from '../../../../../common/types/IPlace';
import {BehaviorSubject, firstValueFrom, Observable, Subject, takeUntil} from 'rxjs';
import { HttpClient } from '@angular/common/http';
import {IGoods} from '../../../../../common/types/IGoods';
import {AuthService} from '../../../../login/services/auth/auth.service';
import {cache, invalidateCache} from '../../../../../common/decorators/cache';
import {ETime} from '../../../../../common/types/ETime';
import {ECacheTag} from '../../../../../common/types/ECacheTag';
import {ITransaction} from "../../../modules/transactions/services/transaction/types/ITransaction";
import {ConfigService} from "../../../../../common/services/config/config.service";

@Injectable({
	providedIn: 'root',
})
export class PlaceService implements OnDestroy {
  private configService: ConfigService = inject(ConfigService);
  private http: HttpClient = inject(HttpClient);
  private authService: AuthService = inject(AuthService)

	#selectedPlace: IPlace | null;
	public placeRole: EPlaceRole;
	public placeRoleSubject: BehaviorSubject<EPlaceRole | null>;
	public placeRole$: Observable<EPlaceRole | null>;

	public selectedPlaceSubject: BehaviorSubject<IPlace | null>;
	public selectedPlace$: Observable<IPlace | null>;

	public get selectedPlace(): IPlace | null {
		return this.#selectedPlace;
	}

	public set selectedPlace(value: IPlace | null) {
		this.#selectedPlace = value;
		if(value) {
			this.getPlaceRole(value.id!).then((role) => {
				this.placeRole = role;
				this.placeRoleSubject.next(role);
			})
		}
		this.selectedPlaceSubject.next(value);
		localStorage.setItem('selectedPlaceId', value?.id + '');
		localStorage.setItem('placeToken', value?.apiToken + '');
	}

	protected limit = 5;
	protected unsubscribe: Subject<void> = new Subject<void>()

	constructor() {
		this.selectedPlaceSubject = new BehaviorSubject<IPlace | null>(null);
		this.selectedPlace$ = this.selectedPlaceSubject.asObservable();

		this.placeRoleSubject = new BehaviorSubject<EPlaceRole | null>(null);
		this.placeRole$ = this.placeRoleSubject.asObservable();

		this.authService.isLogged$
			.pipe(takeUntil(this.unsubscribe))
			.subscribe(async (isLogged) => {
				const placeId = localStorage.getItem('selectedPlaceId');
				if(isLogged && placeId) {
					this.selectedPlace = await this.getPlace(Number(placeId));
				}
			})

		if(this.selectedPlace?.id) {
			this.getPlaceRole(this.selectedPlace.id).then((role) => {
				this.placeRole = role;
				this.placeRoleSubject.next(role);
			})
		}
	}

	public ngOnDestroy() {
		this.unsubscribe.next();
	}

	@cache(ETime.MINUTE * 2, [ECacheTag.PLACES])
	public async getAllPlaces(): Promise<IPlace[]> {
		const params = {
			pageSize: 999,
		};

		return (await firstValueFrom(this.http.get<IPaginatedResponse<IPlace>>(this.configService.config.apiUrl + 'places', {params: params}))).data;
	}

	@cache(ETime.MINUTE * 2, [ECacheTag.PLACE, ECacheTag.PLACES])
	public async getPlaces(search: string = '', page: number = 0, pageSize: number = this.limit): Promise<IPaginatedResponse<IPlace>> {
    let filter = "";
    if(search) {
      filter = `name#=*${search}/i`;
    }
		const params = {
			filter,
			page,
			pageSize
		};

		return firstValueFrom(this.http.get<IPaginatedResponse<IPlace>>(this.configService.config.apiUrl + 'places', {params: params}));
	}

	@cache(ETime.MINUTE * 2, [ECacheTag.PLACE])
	public async getPlace(id: number): Promise<IPlace> {
		return firstValueFrom(this.http.get<IPlace>(this.configService.config.apiUrl + 'places/' + id));
	}

	public async getPlaceRole(id: number): Promise<EPlaceRole> {
		const result = await firstValueFrom(this.http.get<{ roles: EPlaceRole[]}>(this.configService.config.apiUrl + 'places/' + id + '/roles'));
		return result.roles[0];
	}

	public async getPlaceGoods(id: number): Promise<IPlaceGoodsResponse[]> {
		const params = {
			pageSize: 999,
		};
		return (await firstValueFrom(this.http.get<IPaginatedResponse<IPlaceGoodsResponse>>(this.configService.config.apiUrl + 'places/' + id + '/goods', {params: params}))).data;
	}

	@cache(ETime.MINUTE * 2, [ECacheTag.TRANSACTION, ECacheTag.TRANSACTIONS])
	public async getPlaceTransactions(id: number, page: number = 0, pageSize: number = 15, filter: string): Promise<IPaginatedResponse<ITransaction>> {
		const params = {
			filter,
			page,
			pageSize
		};

		return firstValueFrom(this.http.get<IPaginatedResponse<ITransaction>>(this.configService.config.apiUrl + 'places/' + id + '/transactions', {params: params}));
	}

	@invalidateCache([ECacheTag.PLACES, ECacheTag.PLACE])
	public async editPlace(item: IPlace): Promise<IPlace> {
		return firstValueFrom(this.http.put<IPlace>(this.configService.config.apiUrl + 'places/' + item.id, item));
	}

	@invalidateCache([ECacheTag.PLACES, ECacheTag.PLACE])
	public deletePlace(id: number): Promise<void> {
		return firstValueFrom(this.http.delete<void>(`${this.configService.config.apiUrl}places/${id}`));
	}

	@invalidateCache([ECacheTag.PLACES, ECacheTag.PLACE])
	public async editPlaceRole(itemId: number, role: EPlaceRole): Promise<{ roles: EPlaceRole[] }> {
		return firstValueFrom(this.http.put<{ roles: EPlaceRole[] }>(this.configService.config.apiUrl + 'places/' + itemId + '/roles', {
			roles: [role]
		}));
	}

	@invalidateCache([ECacheTag.PLACES, ECacheTag.PLACE])
	public async addPlace(item: IPlace): Promise<IPlace> {
		return firstValueFrom(this.http.post<IPlace>(this.configService.config.apiUrl + 'places/', item));
	}

	@invalidateCache([ECacheTag.PLACES, ECacheTag.PLACE])
	public async addGoods(goodsId: number, placeId: number): Promise<void> {
		return firstValueFrom(this.http.post<void>(this.configService.config.apiUrl + 'places/' + placeId + '/goods?placeId=' + placeId + '&goodsId=' + goodsId, {
			placeId,
			goodsId,
		}));
	}

	@invalidateCache([ECacheTag.PLACES, ECacheTag.PLACE])
	public async removeGoods(goodsId: number, placeId: number): Promise<void> {
		return firstValueFrom(this.http.delete<void>(this.configService.config.apiUrl + 'places/' + placeId + '/goods/' + goodsId));
	}

	@invalidateCache([ECacheTag.PLACES, ECacheTag.PLACE])
	public async moveGoods(placeId: number, goods: IGoods[]): Promise<void> {
		return firstValueFrom(this.http.patch<void>(this.configService.config.apiUrl + 'places/' + placeId + '/goods/move', goods));
	}

	public createNewPlace(id?: number, name?: string, role?: EPlaceRole): IPlace {
		return {
			id: id,
			name: name ?? '',
			type: role ?? EPlaceRole.BAR,
		};
	}

	public removeSavedPlace(): void {
		localStorage.removeItem('placeToken');
		localStorage.removeItem('selectedPlaceId');
	}
}
