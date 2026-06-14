import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { SettingsService } from './settings.service';
import { environment } from '../../../../../environments/environment';

describe('SettingsService', () => {
	let service: SettingsService;
	let httpMock: HttpTestingController;
	const baseUrl = environment.apiUrl;

	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [
				SettingsService,
				provideHttpClient(withInterceptorsFromDi()),
				provideHttpClientTesting(),
			],
		});
		service = TestBed.inject(SettingsService);
		httpMock = TestBed.inject(HttpTestingController);
	});

	afterEach(() => httpMock.verify());

	describe('getChargeItems', () => {
		it('returns parsed items when setting exists', async () => {
			const promise = service.getChargeItems();
			const req = httpMock.expectOne(`${baseUrl}settings/charge_items`);
			expect(req.request.method).toBe('GET');
			req.flush({ id: 1, value: '[{"label":"Kelímek","amount":60}]' });
			const result = await promise;
			expect(result).toEqual([{ label: 'Kelímek', amount: 60 }]);
		});

		it('returns empty array on 404', async () => {
			const promise = service.getChargeItems();
			const req = httpMock.expectOne(`${baseUrl}settings/charge_items`);
			req.flush('Not found', { status: 404, statusText: 'Not Found' });
			const result = await promise;
			expect(result).toEqual([]);
		});

		it('returns empty array when value is null', async () => {
			const promise = service.getChargeItems();
			const req = httpMock.expectOne(`${baseUrl}settings/charge_items`);
			req.flush({ id: 1, value: null });
			const result = await promise;
			expect(result).toEqual([]);
		});

		it('returns empty array and logs error when value is invalid JSON', async () => {
			spyOn(console, 'error');
			const promise = service.getChargeItems();
			const req = httpMock.expectOne(`${baseUrl}settings/charge_items`);
			req.flush({ id: 1, value: 'not-json{' });
			const result = await promise;
			expect(result).toEqual([]);
			expect(console.error).toHaveBeenCalled();
		});

		it('returns empty array when value is valid JSON but not an array', async () => {
			const promise = service.getChargeItems();
			const req = httpMock.expectOne(`${baseUrl}settings/charge_items`);
			req.flush({ id: 1, value: '{"label":"foo","amount":10}' });
			const result = await promise;
			expect(result).toEqual([]);
		});

		it('filters out items with wrong shape', async () => {
			const promise = service.getChargeItems();
			const req = httpMock.expectOne(`${baseUrl}settings/charge_items`);
			req.flush({ id: 1, value: '[{"label":"ok","amount":10},{"label":42,"amount":"bad"},null]' });
			const result = await promise;
			expect(result).toEqual([{ label: 'ok', amount: 10 }]);
		});

		it('returns empty array and logs when HTTP error is non-404', async () => {
			spyOn(console, 'error');
			const promise = service.getChargeItems();
			const req = httpMock.expectOne(`${baseUrl}settings/charge_items`);
			req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
			const result = await promise;
			expect(result).toEqual([]);
			expect(console.error).toHaveBeenCalled();
		});
	});

	describe('saveChargeItems', () => {
		it('DELETEs then POSTs when setting already exists (primed by getChargeItems)', async () => {
			const getPromise = service.getChargeItems();
			httpMock.expectOne(`${baseUrl}settings/charge_items`).flush({ id: 7, value: '[]' });
			await getPromise;

			// settingId = 7, DELETE is initiated synchronously on saveChargeItems call
			const savePromise = service.saveChargeItems([{ label: 'Test', amount: 50 }]);
			const deleteReq = httpMock.expectOne(r => r.method === 'DELETE');
			expect(deleteReq.request.params.get('id')).toBe('7');
			deleteReq.flush(null);

			await Promise.resolve(); // let continuation run: settingId = 0, POST is initiated

			const postReq = httpMock.expectOne(`${baseUrl}settings`);
			expect(postReq.request.method).toBe('POST');
			expect(postReq.request.body).toEqual({
				key: 'charge_items',
				value: '[{"label":"Test","amount":50}]',
				description: 'Dynamické položky při nabíjení kreditu',
				isPublic: true,
			});
			postReq.flush({ id: 8, value: '[{"label":"Test","amount":50}]' });
			await savePromise;
		});

		it('GETs then DELETEs then POSTs when settingId is unknown and setting exists', async () => {
			// settingId starts null → GET is initiated synchronously
			const savePromise = service.saveChargeItems([{ label: 'Test', amount: 50 }]);
			const getReq = httpMock.expectOne(`${baseUrl}settings/charge_items`);
			expect(getReq.request.method).toBe('GET');
			getReq.flush({ id: 5, value: '[]' });

			await Promise.resolve(); // let continuation run: settingId = 5, DELETE is initiated

			const deleteReq = httpMock.expectOne(r => r.method === 'DELETE');
			expect(deleteReq.request.params.get('id')).toBe('5');
			deleteReq.flush(null);

			await Promise.resolve(); // let continuation run: settingId = 0, POST is initiated

			const postReq = httpMock.expectOne(`${baseUrl}settings`);
			expect(postReq.request.method).toBe('POST');
			postReq.flush({ id: 6, value: '[{"label":"Test","amount":50}]' });
			await savePromise;
		});

		it('GETs then POSTs when settingId is unknown and setting does not exist', async () => {
			const savePromise = service.saveChargeItems([{ label: 'Test', amount: 50 }]);
			const getReq = httpMock.expectOne(`${baseUrl}settings/charge_items`);
			getReq.flush('Not found', { status: 404, statusText: 'Not Found' });

			await Promise.resolve(); // let continuation run: settingId = 0, POST is initiated

			const postReq = httpMock.expectOne(`${baseUrl}settings`);
			expect(postReq.request.method).toBe('POST');
			expect(postReq.request.body).toEqual({
				key: 'charge_items',
				value: '[{"label":"Test","amount":50}]',
				description: 'Dynamické položky při nabíjení kreditu',
				isPublic: true,
			});
			postReq.flush({ id: 3, value: '[{"label":"Test","amount":50}]' });
			await savePromise;
		});

		it('POSTs directly when setting is known not to exist', async () => {
			const getPromise = service.getChargeItems();
			httpMock.expectOne(`${baseUrl}settings/charge_items`).flush(
				'Not found', { status: 404, statusText: 'Not Found' }
			);
			await getPromise; // settingId = 0

			// settingId = 0 → skip null check and skip DELETE → POST is initiated synchronously
			const savePromise = service.saveChargeItems([{ label: 'Test', amount: 50 }]);
			const postReq = httpMock.expectOne(`${baseUrl}settings`);
			expect(postReq.request.method).toBe('POST');
			postReq.flush({ id: 4, value: '[{"label":"Test","amount":50}]' });
			await savePromise;
		});

		it('proceeds to POST if DELETE returns 404 (setting deleted externally)', async () => {
			const getPromise = service.getChargeItems();
			httpMock.expectOne(`${baseUrl}settings/charge_items`).flush({ id: 9, value: '[]' });
			await getPromise; // settingId = 9

			const savePromise = service.saveChargeItems([{ label: 'Test', amount: 50 }]);
			const deleteReq = httpMock.expectOne(r => r.method === 'DELETE');
			deleteReq.flush('Not found', { status: 404, statusText: 'Not Found' });

			await Promise.resolve(); // let catch run: settingId = 0, POST is initiated

			const postReq = httpMock.expectOne(`${baseUrl}settings`);
			expect(postReq.request.method).toBe('POST');
			postReq.flush({ id: 10, value: '[{"label":"Test","amount":50}]' });
			await savePromise;
		});

		it('throws and does not swallow non-404 GET error in unknown-state path', async () => {
			const savePromise = service.saveChargeItems([{ label: 'Test', amount: 50 }]);
			httpMock.expectOne(`${baseUrl}settings/charge_items`).flush(
				'Server error', { status: 500, statusText: 'Internal Server Error' }
			);
			await expectAsync(savePromise).toBeRejected();
		});
	});
});
