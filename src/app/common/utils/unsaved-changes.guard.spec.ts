import {unsavedChangesGuard, UNSAVED_CHANGES_MSG} from './unsaved-changes.guard';
import {CanComponentDeactivate} from '../types/CanComponentDeactivate';
import {ActivatedRouteSnapshot, RouterStateSnapshot} from '@angular/router';

describe('unsavedChangesGuard', () => {
  let mockRoute: ActivatedRouteSnapshot;
  let mockState: RouterStateSnapshot;
  let mockNextState: RouterStateSnapshot;

  beforeEach(() => {
    mockRoute = {} as ActivatedRouteSnapshot;
    mockState = {} as RouterStateSnapshot;
    mockNextState = {} as RouterStateSnapshot;
  });

  it('should return true when component.canDeactivate() returns true', () => {
    const component: CanComponentDeactivate = {canDeactivate: () => true};
    const result = unsavedChangesGuard(component, mockRoute, mockState, mockNextState);
    expect(result).toBeTrue();
  });

  it('should return false when component.canDeactivate() returns false', () => {
    const component: CanComponentDeactivate = {canDeactivate: () => false};
    const result = unsavedChangesGuard(component, mockRoute, mockState, mockNextState);
    expect(result).toBeFalse();
  });

  it('should call canDeactivate on the component', () => {
    const component: CanComponentDeactivate = {canDeactivate: jasmine.createSpy('canDeactivate').and.returnValue(true)};
    unsavedChangesGuard(component, mockRoute, mockState, mockNextState);
    expect(component.canDeactivate).toHaveBeenCalled();
  });

  it('should export UNSAVED_CHANGES_MSG constant', () => {
    expect(UNSAVED_CHANGES_MSG).toBe('Máte neuložená data, opravdu chcete stránku opustit?');
  });
});
