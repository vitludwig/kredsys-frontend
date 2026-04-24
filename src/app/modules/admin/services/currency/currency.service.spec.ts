import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { CurrencyService } from './currency.service';
import { ConfigService } from '../../../../common/services/config/config.service';
import { ICurrency, ICurrencyAccount } from '../../../../common/types/ICurrency';
import { IPaginatedResponse } from '../../../../common/types/IPaginatedResponse';
import { clearAllCaches } from '../../../../common/decorators/cache';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('CurrencyService', () => {
  let service: CurrencyService;
  let httpMock: HttpTestingController;
  const API_URL = '/api/v1.1/';
  const mockConfig = { config: { apiUrl: API_URL } };

  beforeEach(() => {
    clearAllCaches();
    localStorage.clear();
    TestBed.configureTestingModule({
    imports: [],
    providers: [
        { provide: ConfigService, useValue: mockConfig },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
    ]
});
    service = TestBed.inject(CurrencyService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getCurrencies', () => {
    const mockResponse: IPaginatedResponse<ICurrency> = {
      data: [{ id: 1, name: 'Kredit', code: 'KRD', symbol: 'K', minRechargeAmountWarn: 0, maxRechargeAmountWarn: 1000, blocked: false }],
      count: 1,
    };

    it('should GET currencies with default params', async () => {
      const promise = service.getCurrencies();
      const req = httpMock.expectOne(r => r.url === API_URL + 'currencies');
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('page')).toBe('0');
      expect(req.request.params.get('filter')).toBe('');
      req.flush(mockResponse);
      const result = await promise;
      expect(result.data[0].name).toBe('Kredit');
    });

    it('should add search to filter', async () => {
      const promise = service.getCurrencies('kred');
      const req = httpMock.expectOne(r => r.url === API_URL + 'currencies');
      expect(req.request.params.get('filter')).toBe('name#=*kred/i');
      req.flush(mockResponse);
      await promise;
    });

    it('should pass custom page and pageSize', async () => {
      const promise = service.getCurrencies('', 2, 20);
      const req = httpMock.expectOne(r => r.url === API_URL + 'currencies');
      expect(req.request.params.get('page')).toBe('2');
      expect(req.request.params.get('pageSize')).toBe('20');
      req.flush(mockResponse);
      await promise;
    });
  });

  describe('getDefaultCurrency', () => {
    it('should return the first currency from getCurrencies', async () => {
      const mockCurrency: ICurrency = { id: 1, name: 'Kredit', code: 'KRD', symbol: 'K', minRechargeAmountWarn: 0, maxRechargeAmountWarn: 1000, blocked: false };
      const mockResponse: IPaginatedResponse<ICurrency> = { data: [mockCurrency], count: 1 };

      const promise = service.getDefaultCurrency();
      // getDefaultCurrency calls getCurrencies internally, which makes an HTTP request
      const req = httpMock.expectOne(r => r.url === API_URL + 'currencies');
      req.flush(mockResponse);
      const result = await promise;
      expect(result).toEqual(mockCurrency);
    });

    it('should fail when currency list is empty', async () => {
      const mockResponse: IPaginatedResponse<ICurrency> = { data: [], count: 0 };

      const promise = service.getDefaultCurrency();
      const req = httpMock.expectOne(r => r.url === API_URL + 'currencies');
      req.flush(mockResponse);
      const result = await promise;
      expect(result).toBeUndefined();
    });
  });

  describe('getDefaultCurrency$', () => {
    it('should return an Observable that emits the default currency', (done) => {
      const mockCurrency: ICurrency = { id: 2, name: 'Token', code: 'TKN', symbol: 'T', minRechargeAmountWarn: 0, maxRechargeAmountWarn: 500, blocked: false };
      const mockResponse: IPaginatedResponse<ICurrency> = { data: [mockCurrency], count: 1 };

      service.getDefaultCurrency$().subscribe({
        next: (result) => {
          expect(result).toEqual(mockCurrency);
          done();
        },
        error: (e: any) => done.fail(e),
      });

      const req = httpMock.expectOne(r => r.url === API_URL + 'currencies');
      req.flush(mockResponse);
    });
  });

  describe('getCurrency', () => {
    it('should GET currency by id', async () => {
      const currency: ICurrency = { id: 3, name: 'Token', code: 'TKN', symbol: 'T', minRechargeAmountWarn: 10, maxRechargeAmountWarn: 500, blocked: false };
      const promise = service.getCurrency(3);
      const req = httpMock.expectOne(API_URL + 'currencies/3');
      expect(req.request.method).toBe('GET');
      req.flush(currency);
      const result = await promise;
      expect(result.name).toBe('Token');
    });
  });

  describe('editCurrency', () => {
    it('should PUT currency data', async () => {
      const currency: ICurrency = { id: 4, name: 'Updated', code: 'UPD', symbol: 'U', minRechargeAmountWarn: 0, maxRechargeAmountWarn: 0, blocked: false };
      const promise = service.editCurrency(currency);
      const req = httpMock.expectOne(API_URL + 'currencies/4');
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(currency);
      req.flush(currency);
      const result = await promise;
      expect(result.name).toBe('Updated');
    });
  });

  describe('addCurrency', () => {
    it('should POST new currency', async () => {
      const currency: ICurrency = { name: 'NewCoin', code: 'NC', symbol: 'N', minRechargeAmountWarn: 0, maxRechargeAmountWarn: 0, blocked: false };
      const promise = service.addCurrency(currency);
      const req = httpMock.expectOne(API_URL + 'currencies');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(currency);
      req.flush({ ...currency, id: 10 });
      const result = await promise;
      expect(result.id).toBe(10);
    });
  });

  describe('getCurrencyAccount', () => {
    it('should GET currency account by id', async () => {
      const account: ICurrencyAccount = { id: 5, userId: 1, overdraftLimit: 100, currentAmount: 250, currencyId: 1 };
      const promise = service.getCurrencyAccount(5);
      const req = httpMock.expectOne(API_URL + 'currencyaccounts/5');
      expect(req.request.method).toBe('GET');
      req.flush(account);
      const result = await promise;
      expect(result.currentAmount).toBe(250);
      expect(result.overdraftLimit).toBe(100);
    });
  });

  describe('editCurrencyAccount', () => {
    it('should PUT currency account with overdraftLimit', async () => {
      const data: ICurrencyAccount = { id: 6, userId: 1, overdraftLimit: 200, currentAmount: 250, currencyId: 1 };
      const promise = service.editCurrencyAccount(6, data);
      const req = httpMock.expectOne(API_URL + 'currencyaccounts/6');
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ overdraftLimit: 200 });
      req.flush(data);
      const result = await promise;
      expect(result.overdraftLimit).toBe(200);
    });
  });

  describe('createNewCurrency', () => {
    it('should return an empty currency object', () => {
      const currency = service.createNewCurrency();
      expect(currency.name).toBe('');
      expect(currency.code).toBe('');
      expect(currency.symbol).toBe('');
      expect(currency.minRechargeAmountWarn).toBe(0);
      expect(currency.maxRechargeAmountWarn).toBe(0);
      expect(currency.blocked).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should reject when getCurrency returns 404', async () => {
      const promise = service.getCurrency(9999);
      const req = httpMock.expectOne(API_URL + 'currencies/9999');
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });
      await expectAsync(promise).toBeRejected();
    });
  });
});
