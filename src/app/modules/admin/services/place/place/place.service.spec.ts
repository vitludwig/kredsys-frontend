import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { PlaceService } from './place.service';
import { ConfigService } from '../../../../../common/services/config/config.service';
import { AuthService } from '../../../../login/services/auth/auth.service';
import { EPlaceRole, IPlace } from '../../../../../common/types/IPlace';
import { IPaginatedResponse } from '../../../../../common/types/IPaginatedResponse';
import { BehaviorSubject } from 'rxjs';
import { clearAllCaches, cacheTags } from '../../../../../common/decorators/cache';
import { ECacheTag } from '../../../../../common/types/ECacheTag';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('PlaceService', () => {
	let service: PlaceService;
	let httpMock: HttpTestingController;
	let isLoggedSubject: BehaviorSubject<boolean>;
	const API_URL = '/api/v1.1/';
	const mockConfig = { config: { apiUrl: API_URL } };

	beforeEach(() => {
		clearAllCaches();
		localStorage.clear();
		isLoggedSubject = new BehaviorSubject<boolean>(false);
		const mockAuthService = {
			isLogged$: isLoggedSubject.asObservable(),
		};

		TestBed.configureTestingModule({
			imports: [],
			providers: [
				PlaceService,
				{ provide: ConfigService, useValue: mockConfig },
				{ provide: AuthService, useValue: mockAuthService },
				provideHttpClient(withInterceptorsFromDi()),
				provideHttpClientTesting(),
			]
		});
		service = TestBed.inject(PlaceService);
		httpMock = TestBed.inject(HttpTestingController);
	});

	afterEach(() => {
		httpMock.verify();
		localStorage.clear();
	});

	it('should be created', () => {
		expect(service).toBeTruthy();
	});

	it('getAllPlaces should GET /api/v1.1/places with pageSize=999 and return data', async () => {
		const mockPlaces: IPlace[] = [
			{ id: 1, name: 'Bar 1', type: EPlaceRole.BAR },
			{ id: 2, name: 'Info', type: EPlaceRole.INFO_POINT },
		];

		const promise = service.getAllPlaces();
		const req = httpMock.expectOne((r) => r.url === API_URL + 'places' && r.params.get('pageSize') === '999');
		expect(req.request.method).toBe('GET');
		req.flush({ data: mockPlaces, total: 2 });

		const result = await promise;
		expect(result).toEqual(mockPlaces);
	});

	it('getPlaces should GET with search filter', async () => {
		const promise = service.getPlaces('bar', 0, 5);
		const req = httpMock.expectOne((r) => r.url === API_URL + 'places' && r.params.get('filter') === 'name#=*bar/i');
		expect(req.request.method).toBe('GET');
		req.flush({ data: [], total: 0 });

		const result = await promise;
		expect(result).toEqual({ data: [], total: 0 } as any);
	});

	it('getPlace should GET /api/v1.1/places/{id}', async () => {
		const mockPlace: IPlace = { id: 1, name: 'Bar 1', type: EPlaceRole.BAR };

		const promise = service.getPlace(1);
		const req = httpMock.expectOne(API_URL + 'places/1');
		expect(req.request.method).toBe('GET');
		req.flush(mockPlace);

		const result = await promise;
		expect(result).toEqual(mockPlace);
	});

	it('getPlaceRole should GET roles and return first role', async () => {
		const promise = service.getPlaceRole(2);
		const req = httpMock.expectOne(API_URL + 'places/2/roles');
		expect(req.request.method).toBe('GET');
		req.flush({ roles: [EPlaceRole.BAR, EPlaceRole.INFO_POINT] });

		const result = await promise;
		expect(result).toBe(EPlaceRole.BAR);
	});

	it('getPlaceGoods should GET /api/v1.1/places/{id}/goods and return data', async () => {
		const mockGoods = [{ position: 0, goods: { id: 1, name: 'Beer' } }];

		const promise = service.getPlaceGoods(3);
		const req = httpMock.expectOne((r) => r.url === API_URL + 'places/3/goods' && r.params.get('pageSize') === '999');
		expect(req.request.method).toBe('GET');
		req.flush({ data: mockGoods, total: 1 });

		const result = await promise;
		expect(result).toEqual(mockGoods as any);
	});

	it('getPlaceTransactions should GET transactions for a place', async () => {
		const mockResponse: IPaginatedResponse<any> = { data: [], count: 0 };
		const promise = service.getPlaceTransactions(4, 0, 15, 'type=Payment');
		const req = httpMock.expectOne(r => r.url === API_URL + 'places/4/transactions');
		expect(req.request.method).toBe('GET');
		expect(req.request.params.get('page')).toBe('0');
		expect(req.request.params.get('pageSize')).toBe('15');
		expect(req.request.params.get('filter')).toBe('type=Payment');
		req.flush(mockResponse);

		const result = await promise;
		expect(result.data).toEqual([]);
	});

	it('editPlace should PUT /api/v1.1/places/{id}', async () => {
		const place: IPlace = { id: 5, name: 'Updated Bar', type: EPlaceRole.BAR };

		const promise = service.editPlace(place);
		const req = httpMock.expectOne(API_URL + 'places/5');
		expect(req.request.method).toBe('PUT');
		expect(req.request.body).toEqual(place);
		req.flush(place);

		const result = await promise;
		expect(result).toEqual(place);
	});

	it('deletePlace should DELETE /api/v1.1/places/{id}', async () => {
		const promise = service.deletePlace(6);
		const req = httpMock.expectOne(API_URL + 'places/6');
		expect(req.request.method).toBe('DELETE');
		req.flush(null);

		await promise;
	});

	it('editPlaceRole should PUT roles', async () => {
		const promise = service.editPlaceRole(7, EPlaceRole.USER_INFO);
		const req = httpMock.expectOne(API_URL + 'places/7/roles');
		expect(req.request.method).toBe('PUT');
		expect(req.request.body).toEqual({ roles: [EPlaceRole.USER_INFO] });
		req.flush({ roles: [EPlaceRole.USER_INFO] });

		const result = await promise;
		expect(result.roles).toEqual([EPlaceRole.USER_INFO]);
	});

	it('addPlace should POST /api/v1.1/places/', async () => {
		const place: IPlace = { name: 'New Place', type: EPlaceRole.REGISTRATION };

		const promise = service.addPlace(place);
		const req = httpMock.expectOne(API_URL + 'places/');
		expect(req.request.method).toBe('POST');
		expect(req.request.body).toEqual(place);
		req.flush({ ...place, id: 8 });

		const result = await promise;
		expect(result.id).toBe(8);
	});

	it('addGoods should POST goods to place', async () => {
		const promise = service.addGoods(10, 9);
		const req = httpMock.expectOne(API_URL + 'places/9/goods?placeId=9&goodsId=10');
		expect(req.request.method).toBe('POST');
		req.flush(null);

		await promise;
	});

	it('removeGoods should DELETE goods from place', async () => {
		const promise = service.removeGoods(10, 11);
		const req = httpMock.expectOne(API_URL + 'places/11/goods/10');
		expect(req.request.method).toBe('DELETE');
		req.flush(null);

		await promise;
	});

	it('moveGoods should PATCH goods order with ID array', async () => {
		const promise = service.moveGoods(12, [1, 3, 2]);
		const req = httpMock.expectOne(API_URL + 'places/12/goods/move');
		expect(req.request.method).toBe('PATCH');
		expect(req.request.body).toEqual([1, 3, 2]);
		req.flush(null);

		await promise;
	});

	// The goods list (incl. each item's place chips/placeIds) is cached under
	// ECacheTag.GOODS. Adding/removing/moving a goods-place association must
	// invalidate that cache, otherwise the chips show stale data after navigating
	// away and back within the cache window.
	it('addGoods should invalidate the GOODS cache', async () => {
		expect(cacheTags[ECacheTag.GOODS]).toBeUndefined();

		const promise = service.addGoods(10, 9);
		const req = httpMock.expectOne(API_URL + 'places/9/goods?placeId=9&goodsId=10');
		req.flush(null);
		await promise;

		expect(cacheTags[ECacheTag.GOODS]).toBeDefined();
	});

	it('removeGoods should invalidate the GOODS cache', async () => {
		expect(cacheTags[ECacheTag.GOODS]).toBeUndefined();

		const promise = service.removeGoods(10, 11);
		const req = httpMock.expectOne(API_URL + 'places/11/goods/10');
		req.flush(null);
		await promise;

		expect(cacheTags[ECacheTag.GOODS]).toBeDefined();
	});

	it('moveGoods should invalidate the GOODS cache', async () => {
		expect(cacheTags[ECacheTag.GOODS]).toBeUndefined();

		const promise = service.moveGoods(12, [1, 3, 2]);
		const req = httpMock.expectOne(API_URL + 'places/12/goods/move');
		req.flush(null);
		await promise;

		expect(cacheTags[ECacheTag.GOODS]).toBeDefined();
	});

	it('createNewPlace should return empty place template', () => {
		const place = service.createNewPlace();
		expect(place.name).toBe('');
		expect(place.type).toBe(EPlaceRole.BAR);
	});

	it('createNewPlace should use provided values', () => {
		const place = service.createNewPlace(5, 'Test', EPlaceRole.INFO_POINT);
		expect(place.id).toBe(5);
		expect(place.name).toBe('Test');
		expect(place.type).toBe(EPlaceRole.INFO_POINT);
	});

	it('removeSavedPlace should clear localStorage', () => {
		localStorage.setItem('placeToken', 'test');
		localStorage.setItem('selectedPlaceId', '1');

		service.removeSavedPlace();

		expect(localStorage.getItem('placeToken')).toBeNull();
		expect(localStorage.getItem('selectedPlaceId')).toBeNull();
	});

	it('selectedPlace setter should update localStorage', () => {
		const place: IPlace = { id: 13, name: 'Bar', type: EPlaceRole.BAR, apiToken: 'tok123' };

		service.selectedPlace = place;

		// flush the role request triggered by setter
		const req = httpMock.expectOne(API_URL + 'places/13/roles');
		req.flush({ roles: [EPlaceRole.BAR] });

		expect(localStorage.getItem('selectedPlaceId')).toBe('13');
		expect(localStorage.getItem('placeToken')).toBe('tok123');
		expect(service.selectedPlace).toEqual(place);
	});

	it('placeRole$ should emit correct value after setting selectedPlace', (done) => {
		const place: IPlace = { id: 14, name: 'Info Point', type: EPlaceRole.INFO_POINT, apiToken: 'tok456' };

		// Skip initial null emission, listen for the role value
		let emissions = 0;
		service.placeRole$.subscribe((role) => {
			emissions++;
			if (emissions === 2) {
				expect(role).toBe(EPlaceRole.USER_INFO);
				done();
			}
		});

		service.selectedPlace = place;

		const req = httpMock.expectOne(API_URL + 'places/14/roles');
		req.flush({ roles: [EPlaceRole.USER_INFO] });
	});

	it('should reject when server returns error on getPlace', async () => {
		const promise = service.getPlace(9999);
		const req = httpMock.expectOne(API_URL + 'places/9999');
		req.flush('Not Found', { status: 404, statusText: 'Not Found' });
		await expectAsync(promise).toBeRejected();
	});
});
