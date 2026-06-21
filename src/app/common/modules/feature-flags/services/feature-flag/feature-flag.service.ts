import { Injectable } from '@angular/core';
import {EFeatureFlag} from "../../types/EFeatureFlag";

@Injectable({
	providedIn: 'root'
})
export class FeatureFlagService {
	// Feature flags are per-device: stored in localStorage, default OFF.
	private static readonly STORAGE_PREFIX = 'featureFlag.';

	public isEnabled(flag: EFeatureFlag): boolean {
		return localStorage.getItem(FeatureFlagService.STORAGE_PREFIX + flag) === 'true';
	}

	public setEnabled(flag: EFeatureFlag, enabled: boolean): void {
		localStorage.setItem(FeatureFlagService.STORAGE_PREFIX + flag, enabled + '');
	}
}
