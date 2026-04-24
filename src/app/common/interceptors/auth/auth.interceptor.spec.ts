import { TestBed } from '@angular/core/testing';
import { HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { authInterceptor } from './auth.interceptor';

function createMockJwt(exp: number): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({ exp, sub: '123' }));
  return `${header}.${payload}.signature`;
}

describe('AuthInterceptor', () => {
  let mockNext: jasmine.Spy;

  beforeEach(() => {
    localStorage.clear();
    mockNext = jasmine.createSpy('next').and.returnValue(of({} as HttpEvent<any>));
    TestBed.configureTestingModule({});
  });

  afterEach(() => {
    localStorage.clear();
  });

  function runInterceptor(request: HttpRequest<any>): Observable<HttpEvent<any>> {
    return TestBed.runInInjectionContext(() =>
      authInterceptor(request, mockNext as unknown as HttpHandlerFn)
    );
  }

  it('should be created', () => {
    expect(authInterceptor).toBeTruthy();
  });

  it('should add Authorization header when apiToken exists in localStorage', () => {
    const futureExp = Math.round(Date.now() / 1000) + 3600;
    const token = createMockJwt(futureExp);
    localStorage.setItem('apiToken', token);

    const request = new HttpRequest('GET', '/api/test');
    runInterceptor(request).subscribe();

    const passedRequest: HttpRequest<any> = mockNext.calls.mostRecent().args[0];
    expect(passedRequest.headers.get('Authorization')).toBe(token);
  });

  it('should not add Authorization header when no apiToken in localStorage', () => {
    const request = new HttpRequest('GET', '/api/test');
    runInterceptor(request).subscribe();

    const passedRequest: HttpRequest<any> = mockNext.calls.mostRecent().args[0];
    expect(passedRequest.headers.has('Authorization')).toBeFalse();
  });

  it('should remove apiToken and userId from localStorage when token is expired', () => {
    const pastExp = Math.round(Date.now() / 1000) - 3600;
    const token = createMockJwt(pastExp);
    localStorage.setItem('apiToken', token);
    localStorage.setItem('userId', '42');

    const request = new HttpRequest('GET', '/api/test');
    runInterceptor(request).subscribe();

    expect(localStorage.getItem('apiToken')).toBeNull();
    expect(localStorage.getItem('userId')).toBeNull();
  });

  it('should NOT set Authorization header when token is expired', () => {
    const pastExp = Math.round(Date.now() / 1000) - 3600;
    const token = createMockJwt(pastExp);
    localStorage.setItem('apiToken', token);

    const request = new HttpRequest('GET', '/api/test');
    runInterceptor(request).subscribe();

    const passedRequest: HttpRequest<any> = mockNext.calls.mostRecent().args[0];
    expect(passedRequest.headers.has('Authorization')).toBeFalse();
  });

  it('should pass request to next handler', () => {
    const request = new HttpRequest('GET', '/api/test');
    runInterceptor(request).subscribe();
    expect(mockNext).toHaveBeenCalled();
  });

  it('should accept a fresh token after a previous expired one', () => {
    const pastExp = Math.round(Date.now() / 1000) - 3600;
    const expiredToken = createMockJwt(pastExp);
    localStorage.setItem('apiToken', expiredToken);

    const request = new HttpRequest('GET', '/api/test');
    runInterceptor(request).subscribe();

    const futureExp = Math.round(Date.now() / 1000) + 3600;
    const freshToken = createMockJwt(futureExp);
    localStorage.setItem('apiToken', freshToken);

    runInterceptor(request).subscribe();

    const passedRequest: HttpRequest<any> = mockNext.calls.mostRecent().args[0];
    expect(passedRequest.headers.get('Authorization')).toBe(freshToken);
  });
});
