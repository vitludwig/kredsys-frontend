import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { GoodsService } from './goods.service';
import { ConfigService } from '../../../../common/services/config/config.service';
import { IGoods, IGoodsType } from '../../../../common/types/IGoods';
import { IPaginatedResponse } from '../../../../common/types/IPaginatedResponse';
import { clearAllCaches } from '../../../../common/decorators/cache';

describe('GoodsService', () => {
  let service: GoodsService;
  let httpMock: HttpTestingController;
  const API_URL = '/api/v1.1/';
  const mockConfig = { config: { apiUrl: API_URL } };

  beforeEach(() => {
    clearAllCaches();
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        { provide: ConfigService, useValue: mockConfig },
      ],
    });
    service = TestBed.inject(GoodsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getAllGoods', () => {
    it('should GET all goods with pageSize=999 and return .data', async () => {
      const goods: IGoods[] = [
        { id: 1, goodsTypeId: 1, name: 'Beer', price: 50, currencyId: 1, placeId: 1, deleted: false },
      ];
      const mockResponse: IPaginatedResponse<IGoods> = { data: goods, count: 1 };
      const promise = service.getAllGoods();
      const req = httpMock.expectOne(r => r.url === API_URL + 'goods');
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('pageSize')).toBe('999');
      req.flush(mockResponse);
      const result = await promise;
      expect(result).toEqual(goods);
      expect(result.length).toBe(1);
    });
  });

  describe('getGoods', () => {
    const mockResponse: IPaginatedResponse<IGoods> = {
      data: [{ id: 1, goodsTypeId: 1, name: 'Wine', price: 80, currencyId: 1, placeId: 1, deleted: false }],
      count: 1,
    };

    it('should GET goods with default params and filter=deleted=false', async () => {
      const promise = service.getGoods();
      const req = httpMock.expectOne(r => r.url === API_URL + 'goods');
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('filter')).toBe('deleted=false');
      expect(req.request.params.get('page')).toBe('0');
      expect(req.request.params.get('deleted')).toBe('false');
      req.flush(mockResponse);
      const result = await promise;
      expect(result.data[0].name).toBe('Wine');
    });

    it('should add search to filter', async () => {
      const promise = service.getGoods('beer');
      const req = httpMock.expectOne(r => r.url === API_URL + 'goods');
      expect(req.request.params.get('filter')).toBe('deleted=false,name#=*beer/i');
      req.flush(mockResponse);
      await promise;
    });

    it('should pass custom page and pageSize', async () => {
      const promise = service.getGoods('', 3, 20);
      const req = httpMock.expectOne(r => r.url === API_URL + 'goods');
      expect(req.request.params.get('page')).toBe('3');
      expect(req.request.params.get('pageSize')).toBe('20');
      req.flush(mockResponse);
      await promise;
    });
  });

  describe('getGoodie', () => {
    it('should GET a single goods item by id', async () => {
      const item: IGoods = { id: 5, goodsTypeId: 2, name: 'Juice', price: 30, currencyId: 1, placeId: 1, deleted: false };
      const promise = service.getGoodie(5);
      const req = httpMock.expectOne(API_URL + 'goods/5');
      expect(req.request.method).toBe('GET');
      req.flush(item);
      const result = await promise;
      expect(result.name).toBe('Juice');
    });
  });

  describe('getGoodsTypes', () => {
    it('should GET goods types with pageSize=999 and return .data', async () => {
      const types: IGoodsType[] = [
        { id: 1, name: 'Drinks', icon: 'glass', deleted: false },
        { id: 2, name: 'Food', icon: 'utensils', deleted: false },
      ];
      const mockResponse: IPaginatedResponse<IGoodsType> = { data: types, count: 2 };
      const promise = service.getGoodsTypes();
      const req = httpMock.expectOne(r => r.url === API_URL + 'goodstypes');
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('pageSize')).toBe('999');
      req.flush(mockResponse);
      const result = await promise;
      expect(result).toEqual(types);
      expect(result.length).toBe(2);
    });
  });

  describe('getGoodsType', () => {
    it('should GET a single goods type by id', async () => {
      const type: IGoodsType = { id: 3, name: 'Snacks', icon: 'cookie', deleted: false };
      const promise = service.getGoodsType(3);
      const req = httpMock.expectOne(API_URL + 'goodstypes/3');
      expect(req.request.method).toBe('GET');
      req.flush(type);
      const result = await promise;
      expect(result.name).toBe('Snacks');
    });
  });

  describe('editGoods', () => {
    it('should PUT goods item', async () => {
      const item: IGoods = { id: 10, goodsTypeId: 1, name: 'Updated Beer', price: 55, currencyId: 1, placeId: 1, deleted: false };
      const promise = service.editGoods(item);
      const req = httpMock.expectOne(API_URL + 'goods/10');
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(item);
      req.flush(item);
      const result = await promise;
      expect(result.name).toBe('Updated Beer');
    });
  });

  describe('addGoods', () => {
    it('should POST new goods item', async () => {
      const item: IGoods = { goodsTypeId: 1, name: 'New Item', price: 40, currencyId: 1, placeId: 1, deleted: false };
      const promise = service.addGoods(item);
      const req = httpMock.expectOne(API_URL + 'goods');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(item);
      req.flush({ ...item, id: 20 });
      const result = await promise;
      expect(result.id).toBe(20);
    });
  });

  describe('editGoodsType', () => {
    it('should PUT goods type', async () => {
      const type: IGoodsType = { id: 5, name: 'Updated Drinks', icon: 'wine', deleted: false };
      const promise = service.editGoodsType(type);
      const req = httpMock.expectOne(API_URL + 'goodstypes/5');
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(type);
      req.flush(type);
      const result = await promise;
      expect(result.name).toBe('Updated Drinks');
    });
  });

  describe('addGoodsType', () => {
    it('should POST new goods type', async () => {
      const type: IGoodsType = { name: 'Desserts', icon: 'cake', deleted: false };
      const promise = service.addGoodsType(type);
      const req = httpMock.expectOne(API_URL + 'goodstypes');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(type);
      req.flush({ ...type, id: 7 });
      const result = await promise;
      expect(result.id).toBe(7);
    });
  });

  describe('removeGoodsType', () => {
    it('should DELETE goods type by id', async () => {
      const promise = service.removeGoodsType(4);
      const req = httpMock.expectOne(API_URL + 'goodstypes/4');
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
      await promise;
    });
  });

  describe('removeGoods', () => {
    it('should DELETE goods by id', async () => {
      const promise = service.removeGoods(8);
      const req = httpMock.expectOne(API_URL + 'goods/8');
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
      await promise;
    });
  });

  describe('createNewGoodie', () => {
    it('should return an empty goods object', () => {
      const item = service.createNewGoodie();
      expect(item.name).toBe('');
      expect(item.goodsTypeId).toBeNull();
      expect(item.price).toBeNull();
      expect(item.currencyId).toBeNull();
      expect(item.placeId).toBeNull();
      expect(item.deleted).toBe(false);
    });
  });

  describe('createNewGoodieType', () => {
    it('should return an empty goods type object', () => {
      const type = service.createNewGoodieType();
      expect(type.name).toBe('');
      expect(type.icon).toBe('');
      expect(type.deleted).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should reject when getGoodie returns 404', async () => {
      const promise = service.getGoodie(9999);
      const req = httpMock.expectOne(API_URL + 'goods/9999');
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });
      await expectAsync(promise).toBeRejected();
    });
  });
});
