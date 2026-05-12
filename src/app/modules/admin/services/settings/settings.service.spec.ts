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
  });

  describe('saveChargeItems', () => {
    it('PUTs when setting already exists', async () => {
      // First getChargeItems to prime existence
      const getPromise = service.getChargeItems();
      const getReq = httpMock.expectOne(`${baseUrl}settings/charge_items`);
      getReq.flush({ value: '[]' });
      await getPromise;

      const savePromise = service.saveChargeItems([{ label: 'Test', amount: 50 }]);
      const putReq = httpMock.expectOne(`${baseUrl}settings/charge_items`);
      expect(putReq.request.method).toBe('PUT');
      expect(putReq.request.body).toEqual({ value: '[{"label":"Test","amount":50}]' });
      putReq.flush({ value: '[{"label":"Test","amount":50}]' });
      await savePromise;
    });

    it('POSTs to create when setting does not exist', async () => {
      const savePromise = service.saveChargeItems([{ label: 'Test', amount: 50 }]);
      // GET to check existence — returns 404
      const getReq = httpMock.expectOne(`${baseUrl}settings/charge_items`);
      getReq.flush('Not found', { status: 404, statusText: 'Not Found' });
      // POST to create
      const postReq = httpMock.expectOne(`${baseUrl}settings`);
      expect(postReq.request.method).toBe('POST');
      expect(postReq.request.body).toEqual({
        key: 'charge_items',
        value: '[{"label":"Test","amount":50}]',
        description: 'Dynamické položky při nabíjení kreditu',
        isPublic: true,
      });
      postReq.flush({ value: '[{"label":"Test","amount":50}]' });
      await savePromise;
    });
  });
});
