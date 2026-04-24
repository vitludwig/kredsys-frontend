import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { CardsService } from './cards.service';
import { ConfigService } from '../../../../common/services/config/config.service';
import { IPaginatedResponse } from '../../../../common/types/IPaginatedResponse';
import { ICard } from '../../../../common/types/ICard';
import { clearAllCaches } from '../../../../common/decorators/cache';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('CardsService', () => {
  let service: CardsService;
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
    service = TestBed.inject(CardsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getCards', () => {
    const mockResponse: IPaginatedResponse<ICard> = {
      data: [],
      count: 0,
    };

    it('should GET cards with default params', async () => {
      const promise = service.getCards();
      const req = httpMock.expectOne(r => r.url === API_URL + 'cards');
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('page')).toBe('0');
      expect(req.request.params.get('pageSize')).toBe('15');
      expect(req.request.params.get('filter')).toBe('blocked=false');
      req.flush(mockResponse);
      const result = await promise;
      expect(result.count).toBe(0);
    });

    it('should pass blocked=true in filter', async () => {
      const promise = service.getCards(0, 15, true);
      const req = httpMock.expectOne(r => r.url === API_URL + 'cards');
      expect(req.request.params.get('filter')).toBe('blocked=true');
      req.flush(mockResponse);
      await promise;
    });

    it('should pass custom page and pageSize', async () => {
      const promise = service.getCards(5, 30);
      const req = httpMock.expectOne(r => r.url === API_URL + 'cards');
      expect(req.request.params.get('page')).toBe('5');
      expect(req.request.params.get('pageSize')).toBe('30');
      req.flush(mockResponse);
      await promise;
    });

    it('should reject when server returns error', async () => {
      const promise = service.getCards();
      const req = httpMock.expectOne(r => r.url === API_URL + 'cards');
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
      await expectAsync(promise).toBeRejected();
    });
  });
});
