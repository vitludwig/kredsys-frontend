import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TransactionService } from './transaction.service';
import { ConfigService } from '../../../../../../common/services/config/config.service';
import { ETransactionType } from './types/ETransactionType';
import { ITransactionResponse, ITransactionRecordPayment, ITransactionRecordDeposit, ITransactionRecordWithdraw } from './types/ITransaction';
import { IPaginatedResponse } from '../../../../../../common/types/IPaginatedResponse';
import { clearAllCaches } from '../../../../../../common/decorators/cache';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('TransactionService', () => {
	let service: TransactionService;
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
		service = TestBed.inject(TransactionService);
		httpMock = TestBed.inject(HttpTestingController);
	});

	afterEach(() => {
		httpMock.verify();
		localStorage.clear();
	});

	it('should be created', () => {
		expect(service).toBeTruthy();
	});

	describe('getTransactionDetail', () => {
		const mockTransaction: ITransactionResponse = {
			id: 1, info: '', userId: 10, type: ETransactionType.PAYMENT, placeId: 2,
			created: '2024-01-01', amount: 50, currencyId: 1, cancellation: false,
			userName: 'Alice', placeName: 'Bar', records: [],
		};

		it('should GET transaction by id', async () => {
			const promise = service.getTransactionDetail(1);
			const req = httpMock.expectOne(r => r.url === API_URL + 'transactions/1');
			expect(req.request.method).toBe('GET');
			req.flush(mockTransaction);
			const result = await promise;
			expect(result.id).toBe(1);
			expect(result.userName).toBe('Alice');
		});

		it('should pass type param when provided', async () => {
			const promise = service.getTransactionDetail(2, ETransactionType.DEPOSIT);
			const req = httpMock.expectOne(r => r.url === API_URL + 'transactions/2');
			expect(req.request.params.get('type')).toBe('Deposit');
			req.flush(mockTransaction);
			await promise;
		});

		it('should not pass type param when omitted', async () => {
			const promise = service.getTransactionDetail(3);
			const req = httpMock.expectOne(r => r.url === API_URL + 'transactions/3');
			expect(req.request.params.has('type')).toBe(false);
			req.flush(mockTransaction);
			await promise;
		});
	});

	describe('getTransactions', () => {
		it('should GET transactions with default params', async () => {
			const mockResponse: IPaginatedResponse<any> = { data: [], count: 0 };
			const promise = service.getTransactions();
			const req = httpMock.expectOne(r => r.url === API_URL + 'transactions');
			expect(req.request.method).toBe('GET');
			expect(req.request.params.get('page')).toBe('1');
			expect(req.request.params.get('pageSize')).toBe('15');
			req.flush(mockResponse);
			await promise;
		});

		it('should pass custom page, pageSize, filter and orderBy', async () => {
			const mockResponse: IPaginatedResponse<any> = { data: [], count: 0 };
			const promise = service.getTransactions(3, 50, 'type=Payment', 'created desc');
			const req = httpMock.expectOne(r => r.url === API_URL + 'transactions');
			expect(req.request.params.get('page')).toBe('3');
			expect(req.request.params.get('pageSize')).toBe('50');
			expect(req.request.params.get('filter')).toBe('type=Payment');
			expect(req.request.params.get('orderBy')).toBe('created desc');
			req.flush(mockResponse);
			await promise;
		});
	});

	describe('getStatistics', () => {
		it('should GET statistics with ignoreCancellation=true', async () => {
			const mockStats = { currencyId: 1, sumGoods: 10, sumPrice: 500, sumTransactions: 5, goods: [] as any[] };
			const promise = service.getStatistics(1);
			const req = httpMock.expectOne(r => r.url === API_URL + 'statistics/1/goods');
			expect(req.request.method).toBe('GET');
			expect(req.request.params.get('ignoreCancellation')).toBe('true');
			req.flush(mockStats);
			const result = await promise;
			expect(result.sumPrice).toBe(500);
		});

		it('should merge filterBy params', async () => {
			const mockStats = { currencyId: 1, sumGoods: 0, sumPrice: 0, sumTransactions: 0, goods: [] as any[] };
			const promise = service.getStatistics(2, { fromDate: '2024-01-01', toDate: '2024-12-31' });
			const req = httpMock.expectOne(r => r.url === API_URL + 'statistics/2/goods');
			expect(req.request.params.get('fromDate')).toBe('2024-01-01');
			expect(req.request.params.get('toDate')).toBe('2024-12-31');
			expect(req.request.params.get('ignoreCancellation')).toBe('true');
			req.flush(mockStats);
			await promise;
		});
	});

	describe('getExcelStatistics', () => {
		it('should GET excel statistics as blob', async () => {
			const mockBlob = new Blob(['test'], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
			const promise = service.getExcelStatistics(1);
			const req = httpMock.expectOne(r => r.url === API_URL + 'statistics/1/statistics-all-download');
			expect(req.request.method).toBe('GET');
			expect(req.request.responseType).toBe('blob');
			req.flush(mockBlob);
			const result = await promise;
			expect(result).toBeTruthy();
		});
	});

	describe('pay', () => {
		it('should POST payment transaction', async () => {
			const records: ITransactionRecordPayment[] = [{ goodsId: 1, multiplier: 2 }];
			const mockResponse: ITransactionResponse = {
				id: 100, info: '', userId: 5, type: ETransactionType.PAYMENT, placeId: 3,
				created: '2024-01-01', amount: 120, currencyId: 1, cancellation: false,
				userName: 'Bob', placeName: 'Cafe', records: [],
			};
			const promise = service.pay(5, 3, records);
			const req = httpMock.expectOne(API_URL + 'transactions/payment');
			expect(req.request.method).toBe('POST');
			expect(req.request.body).toEqual({ info: '', userId: 5, placeId: 3, records, cardUid: null });
			req.flush(mockResponse);
			const result = await promise;
			expect(result.id).toBe(100);
		});

		it('should reject when server returns 400', async () => {
			const records: ITransactionRecordPayment[] = [{ goodsId: 1, multiplier: 1 }];
			const promise = service.pay(5, 3, records);
			const req = httpMock.expectOne(API_URL + 'transactions/payment');
			req.flush('Bad Request', { status: 400, statusText: 'Bad Request' });
			await expectAsync(promise).toBeRejected();
		});
	});

	describe('deposit', () => {
		it('should POST deposit transaction', async () => {
			const records: ITransactionRecordDeposit[] = [{ text: 'Top up', amount: 200 }];
			const mockResponse: ITransactionResponse = {
				id: 101, info: '', userId: 6, type: ETransactionType.DEPOSIT, placeId: 4,
				created: '2024-01-01', amount: 200, currencyId: 1, cancellation: false,
				userName: 'Bob', placeName: 'Cafe', records: [],
			};
			const promise = service.deposit(6, 4, 1, records);
			const req = httpMock.expectOne(API_URL + 'transactions/deposit');
			expect(req.request.method).toBe('POST');
			expect(req.request.body).toEqual({ info: '', userId: 6, placeId: 4, records, currencyId: 1, cardUid: null });
			req.flush(mockResponse);
			const result = await promise;
			expect(result.amount).toBe(200);
		});
	});

	describe('withDraw', () => {
		it('should POST withdraw transaction', async () => {
			const records: ITransactionRecordWithdraw[] = [{ text: 'Withdraw', amount: 100 }];
			const mockResponse: ITransactionResponse = {
				id: 102, info: '', userId: 7, type: ETransactionType.WITHDRAW, placeId: 5,
				created: '2024-01-01', amount: 100, currencyId: 1, cancellation: false,
				userName: 'Bob', placeName: 'Cafe', records: [],
			};
			const promise = service.withDraw(7, 5, 1, records);
			const req = httpMock.expectOne(API_URL + 'transactions/withDraw');
			expect(req.request.method).toBe('POST');
			expect(req.request.body).toEqual({ info: '', userId: 7, placeId: 5, records, currencyId: 1, cardUid: null });
			req.flush(mockResponse);
			const result = await promise;
			expect(result.type).toBe(ETransactionType.WITHDRAW);
		});
	});

	describe('storno', () => {
		it('should PUT cancellation on a transaction', async () => {
			const mockResponse: ITransactionResponse = {
				id: 50, info: '', userId: 5, type: ETransactionType.PAYMENT, placeId: 3,
				created: '2024-01-01', amount: 60, currencyId: 1, cancellation: true,
				userName: 'Bob', placeName: 'Cafe', records: [],
			};
			const promise = service.storno(50);
			const req = httpMock.expectOne(API_URL + 'transactions/50/cancellation');
			expect(req.request.method).toBe('PUT');
			expect(req.request.body).toEqual({});
			req.flush(mockResponse);
			const result = await promise;
			expect(result.cancellation).toBe(true);
		});
	});
});
