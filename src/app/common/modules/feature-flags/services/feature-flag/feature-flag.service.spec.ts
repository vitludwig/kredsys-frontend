import { TestBed } from '@angular/core/testing';
import { FeatureFlagService } from './feature-flag.service';
import { EFeatureFlag } from '../../types/EFeatureFlag';

describe('FeatureFlagService', () => {
  let service: FeatureFlagService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [FeatureFlagService],
    });

    service = TestBed.inject(FeatureFlagService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('PRINTER flag should be enabled by default', () => {
    expect(service.isEnabled(EFeatureFlag.PRINTER)).toBeTrue();
  });

  it('should return false for unknown feature flag', () => {
    expect(service.isEnabled('nonexistent-feature' as EFeatureFlag)).toBeFalse();
  });
});
