import { TestBed } from '@angular/core/testing';
import { FeatureFlagService } from './feature-flag.service';
import { EFeatureFlag } from '../../types/EFeatureFlag';

describe('FeatureFlagService', () => {
	let service: FeatureFlagService;

	beforeEach(() => {
		localStorage.clear();

		TestBed.configureTestingModule({
			providers: [FeatureFlagService],
		});

		service = TestBed.inject(FeatureFlagService);
	});

	afterEach(() => {
		localStorage.clear();
	});

	it('should be created', () => {
		expect(service).toBeTruthy();
	});

	it('PRINTER flag should be disabled by default', () => {
		expect(service.isEnabled(EFeatureFlag.PRINTER)).toBeFalse();
	});

	it('setEnabled(true) enables the flag and persists it to localStorage', () => {
		service.setEnabled(EFeatureFlag.PRINTER, true);

		expect(service.isEnabled(EFeatureFlag.PRINTER)).toBeTrue();
		expect(localStorage.getItem('featureFlag.printer')).toBe('true');
	});

	it('setEnabled(false) disables a previously enabled flag', () => {
		service.setEnabled(EFeatureFlag.PRINTER, true);
		service.setEnabled(EFeatureFlag.PRINTER, false);

		expect(service.isEnabled(EFeatureFlag.PRINTER)).toBeFalse();
	});

	it('reads the enabled state from localStorage (per-device)', () => {
		localStorage.setItem('featureFlag.printer', 'true');

		expect(service.isEnabled(EFeatureFlag.PRINTER)).toBeTrue();
	});

	it('should return false for unknown feature flag', () => {
		expect(service.isEnabled('nonexistent-feature' as EFeatureFlag)).toBeFalse();
	});
});
