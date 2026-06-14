import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { utcDateInterceptor } from './utc-date.interceptor';

describe('utcDateInterceptor', () => {
	let http: HttpClient;
	let httpMock: HttpTestingController;

	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [
				provideHttpClient(withInterceptors([utcDateInterceptor])),
				provideHttpClientTesting(),
			],
		});
		http = TestBed.inject(HttpClient);
		httpMock = TestBed.inject(HttpTestingController);
	});

	afterEach(() => httpMock.verify());

	function respondWith(body: any): Promise<any> {
		const promise = new Promise<any>((resolve) => http.get('/api/test').subscribe(resolve));
		httpMock.expectOne('/api/test').flush(body);
		return promise;
	}

	it('appends Z to a zone-less ISO timestamp', async () => {
		const body = await respondWith({ created: '2026-06-14T18:00:00' });
		expect(body.created).toBe('2026-06-14T18:00:00Z');
	});

	it('appends Z to a zone-less timestamp with fractional seconds', async () => {
		const body = await respondWith({ created: '2026-06-14T18:00:00.123' });
		expect(body.created).toBe('2026-06-14T18:00:00.123Z');
	});

	it('leaves timestamps that already carry a zone untouched', async () => {
		const body = await respondWith({ a: '2026-06-14T18:00:00Z', b: '2026-06-14T18:00:00+02:00' });
		expect(body.a).toBe('2026-06-14T18:00:00Z');
		expect(body.b).toBe('2026-06-14T18:00:00+02:00');
	});

	it('leaves a shape-matching but impossible date untouched (stays parseable as-is)', async () => {
		const body = await respondWith({ created: '2026-13-40T25:61:00' });
		// Not rewritten — appending Z would make it an invalid date, so the original is kept.
		expect(body.created).toBe('2026-13-40T25:61:00');
	});

	it('every rewritten value parses to a valid date', async () => {
		const body = await respondWith({ a: '2026-06-14T18:00:00', b: '2026-02-28T23:59:59.999' });
		expect(Number.isNaN(new Date(body.a).getTime())).toBeFalse();
		expect(Number.isNaN(new Date(body.b).getTime())).toBeFalse();
		expect(body.a.endsWith('Z')).toBeTrue();
		expect(body.b.endsWith('Z')).toBeTrue();
	});

	it('leaves date-only and non-date strings untouched', async () => {
		const body = await respondWith({ day: '2024-01-01', name: 'Karel', note: 'not-a-date' });
		expect(body.day).toBe('2024-01-01');
		expect(body.name).toBe('Karel');
		expect(body.note).toBe('not-a-date');
	});

	it('recurses into nested objects and arrays', async () => {
		const body = await respondWith({
			data: [
				{ created: '2026-06-14T18:00:00' },
				{ created: '2026-06-14T19:30:00', nested: { ts: '2026-06-14T20:00:00' } },
			],
		});
		expect(body.data[0].created).toBe('2026-06-14T18:00:00Z');
		expect(body.data[1].created).toBe('2026-06-14T19:30:00Z');
		expect(body.data[1].nested.ts).toBe('2026-06-14T20:00:00Z');
	});

	it('does not corrupt a Blob body (file download)', async () => {
		const blob = new Blob(['x'], { type: 'application/octet-stream' });
		const promise = new Promise<Blob>((resolve) =>
			http.get('/api/file', { responseType: 'blob' }).subscribe((b) => resolve(b)),
		);
		httpMock.expectOne('/api/file').flush(blob);
		const result = await promise;
		expect(result instanceof Blob).toBeTrue();
	});
});
