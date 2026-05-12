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
      req.flush({ value: '[{"label":"Kelímek","amount":60}]' });
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
      req.flush({ value: null });
      const result = await promise;
      expect(result).toEqual([]);
    });

    it('returns empty array and logs error when value is invalid JSON', async () => {
      spyOn(console, 'error');
      const promise = service.getChargeItems();
      const req = httpMock.expectOne(`${baseUrl}settings/charge_items`);
      req.flush({ value: 'not-json{' });
      const result = await promise;
      expect(result).toEqual([]);
      expect(console.error).toHaveBeenCalled();
    });

    it('returns empty array when value is valid JSON but not an array', async () => {
      const promise = service.getChargeItems();
      const req = httpMock.expectOne(`${baseUrl}settings/charge_items`);
      req.flush({ value: '{"label":"foo","amount":10}' });
      const result = await promise;
      expect(result).toEqual([]);
    });

    it('filters out items with wrong shape', async () => {
      const promise = service.getChargeItems();
      const req = httpMock.expectOne(`${baseUrl}settings/charge_items`);
      req.flush({ value: '[{"label":"ok","amount":10},{"label":42,"amount":"bad"},null]' });
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
    it('PUTs when setting already exists', async () => {
      const getPromise = service.getChargeItems();
      const getReq = httpMock.expectOne(`${baseUrl}settings/charge_items`);
      getReq.flush({ value: '[]' });
      await getPromise;

      const savePromise = service.saveChargeItems([{ label: 'Test', amount: 50 }]);
      const putReq = httpMock.expectOne(`${baseUrl}settings/charge_items`);
      expect(putReq.request.method).toBe('PUT');
      expect(putReq.request.body).toEqual({ value: '[{"label":"Test","amount":50}]' });
      putReq.flush({});
      await savePromise;
    });

    it('resets settingExists to null when PUT returns 404 (stale cache)', async () => {
      const getPromise = service.getChargeItems();
      httpMock.expectOne(`${baseUrl}settings/charge_items`).flush({ value: '[]' });
      await getPromise;

      // PUT fails with 404 (setting was deleted externally)
      const savePromise = service.saveChargeItems([{ label: 'Test', amount: 50 }]);
      httpMock.expectOne(`${baseUrl}settings/charge_items`).flush(
        'Not found', { status: 404, statusText: 'Not Found' }
      );
      await expectAsync(savePromise).toBeRejected();

      // Next save should re-detect (issue GET again, not go straight to PUT)
      const retryPromise = service.saveChargeItems([{ label: 'Test', amount: 50 }]);
      const retryGetReq = httpMock.expectOne(`${baseUrl}settings/charge_items`);
      expect(retryGetReq.request.method).toBe('GET');
      retryGetReq.flush({ value: 'Not found' }, { status: 404, statusText: 'Not Found' });
      const postReq = httpMock.expectOne(`${baseUrl}settings`);
      expect(postReq.request.method).toBe('POST');
      postReq.flush({});
      await retryPromise;
    });

    it('GETs then PUTs when settingExists is unknown and setting exists', async () => {
      const savePromise = service.saveChargeItems([{ label: 'Test', amount: 50 }]);
      const getReq = httpMock.expectOne(`${baseUrl}settings/charge_items`);
      expect(getReq.request.method).toBe('GET');
      getReq.flush({ value: '[]' });
      const putReq = httpMock.expectOne(`${baseUrl}settings/charge_items`);
      expect(putReq.request.method).toBe('PUT');
      expect(putReq.request.body).toEqual({ value: '[{"label":"Test","amount":50}]' });
      putReq.flush({});
      await savePromise;
    });

    it('POSTs to create when setting does not exist', async () => {
      const savePromise = service.saveChargeItems([{ label: 'Test', amount: 50 }]);
      const getReq = httpMock.expectOne(`${baseUrl}settings/charge_items`);
      getReq.flush('Not found', { status: 404, statusText: 'Not Found' });
      const postReq = httpMock.expectOne(`${baseUrl}settings`);
      expect(postReq.request.method).toBe('POST');
      expect(postReq.request.body).toEqual({
        key: 'charge_items',
        value: '[{"label":"Test","amount":50}]',
        description: 'Dynamické položky při nabíjení kreditu',
        isPublic: true,
      });
      postReq.flush({});
      await savePromise;
    });

    it('throws and does not swallow non-404 GET error in null-state path', async () => {
      const savePromise = service.saveChargeItems([{ label: 'Test', amount: 50 }]);
      const getReq = httpMock.expectOne(`${baseUrl}settings/charge_items`);
      getReq.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
      await expectAsync(savePromise).toBeRejected();
    });
  });
});
