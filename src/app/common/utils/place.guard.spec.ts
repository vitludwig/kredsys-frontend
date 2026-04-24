import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { placeGuard } from './place.guard';
import { PlaceService } from '../../modules/admin/services/place/place/place.service';

describe('PlaceGuard', () => {
  let mockRouter: jasmine.SpyObj<Router>;
  let mockPlaceService: { selectedPlace: any };
  let mockRoute: ActivatedRouteSnapshot;
  let mockState: RouterStateSnapshot;

  beforeEach(() => {
    localStorage.clear();

    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockPlaceService = { selectedPlace: null };

    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: PlaceService, useValue: mockPlaceService },
      ],
    });

    mockRoute = {} as ActivatedRouteSnapshot;
    mockState = { url: '/admin/users' } as RouterStateSnapshot;
  });

  afterEach(() => {
    localStorage.clear();
  });

  function runGuard(route = mockRoute, state = mockState): ReturnType<typeof placeGuard> {
    return TestBed.runInInjectionContext(() => placeGuard(route, state));
  }

  it('should return true when place is already selected', () => {
    mockPlaceService.selectedPlace = { id: 1, name: 'Test Place' };
    expect(runGuard()).toBeTrue();
  });

  it('should return false when no place is selected', () => {
    mockPlaceService.selectedPlace = null;
    expect(runGuard()).toBeFalse();
  });

  it('should return false when selectedPlace is undefined', () => {
    mockPlaceService.selectedPlace = undefined;
    expect(runGuard()).toBeFalse();
  });

  it('should navigate to /place-select when no place is available', () => {
    runGuard();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/place-select'], jasmine.objectContaining({ queryParams: { returnUrl: '/admin/users' } }));
  });

  it('should pass returnUrl as query param', () => {
    const state = { url: '/sale' } as RouterStateSnapshot;
    runGuard(mockRoute, state);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/place-select'], { queryParams: { returnUrl: '/sale' } });
  });

  it('should not navigate when place is already selected', () => {
    mockPlaceService.selectedPlace = { id: 1 };
    runGuard();
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });

  it('should not navigate for any truthy selectedPlace value', () => {
    mockPlaceService.selectedPlace = { id: 99, name: 'Bar' };
    runGuard();
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });
});
