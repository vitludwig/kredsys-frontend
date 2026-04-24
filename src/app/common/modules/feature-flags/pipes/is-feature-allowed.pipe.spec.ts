import {TestBed} from '@angular/core/testing';
import {IsFeatureAllowedPipe} from './is-feature-allowed.pipe';
import {FeatureFlagService} from '../services/feature-flag/feature-flag.service';
import {EFeatureFlag} from '../types/EFeatureFlag';

describe('IsFeatureAllowedPipe', () => {
  let pipe: IsFeatureAllowedPipe;
  let mockFeatureFlagService: jasmine.SpyObj<FeatureFlagService>;

  beforeEach(() => {
    mockFeatureFlagService = jasmine.createSpyObj('FeatureFlagService', ['isEnabled']);

    TestBed.configureTestingModule({
      providers: [
        IsFeatureAllowedPipe,
        {provide: FeatureFlagService, useValue: mockFeatureFlagService},
      ],
    });

    pipe = TestBed.inject(IsFeatureAllowedPipe);
  });

  it('should be created', () => {
    expect(pipe).toBeTruthy();
  });

  it('should return true for enabled feature', () => {
    mockFeatureFlagService.isEnabled.and.returnValue(true);
    expect(pipe.transform(EFeatureFlag.PRINTER)).toBeTrue();
    expect(mockFeatureFlagService.isEnabled).toHaveBeenCalledWith(EFeatureFlag.PRINTER);
  });

  it('should return false for disabled feature', () => {
    mockFeatureFlagService.isEnabled.and.returnValue(false);
    expect(pipe.transform('disabled-feature' as EFeatureFlag)).toBeFalse();
    expect(mockFeatureFlagService.isEnabled).toHaveBeenCalledWith('disabled-feature' as EFeatureFlag);
  });
});
