import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ConfigService } from './config.service';
import { environment } from '../../../../environments/environment';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('ConfigService', () => {
  let service: ConfigService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
    imports: [],
    providers: [ConfigService, provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting()]
});

    service = TestBed.inject(ConfigService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should load and merge config from /assets/config.json', async () => {
    const mockConfig = { apiUrl: '/custom-api/' };
    const loadPromise = service.loadAppConfig();

    const req = httpMock.expectOne('/assets/config.json');
    expect(req.request.method).toBe('GET');
    req.flush(mockConfig);

    await loadPromise;

    expect(service.config.apiUrl).toBe('/custom-api/');
  });

  it('should fall back to environment on HTTP error', async () => {
    spyOn(console, 'error');
    const loadPromise = service.loadAppConfig();

    const req = httpMock.expectOne('/assets/config.json');
    req.error(new ProgressEvent('Network error'));

    await loadPromise;

    expect(service.config).toEqual(environment as any);
    expect(console.error).toHaveBeenCalledWith('Unable to load app config file');
  });

  it('config getter should return environment when no config has been loaded', () => {
    expect(service.config).toEqual(environment as any);
  });

  it('should merge remote config over environment defaults', async () => {
    const partialConfig = { apiUrl: '/partial-api/' };
    const loadPromise = service.loadAppConfig();

    const req = httpMock.expectOne('/assets/config.json');
    req.flush(partialConfig);

    await loadPromise;

    expect(service.config.apiUrl).toBe('/partial-api/');
  });
});
