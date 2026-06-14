import { Injectable } from '@angular/core';
import {EFeatureFlag} from "../../types/EFeatureFlag";

@Injectable({
	providedIn: 'root'
})
export class FeatureFlagService {
	private featureFlags: Record<EFeatureFlag, boolean> = {
		[EFeatureFlag.PRINTER]: true,
	};

	public isEnabled(flag: EFeatureFlag): boolean {
		return this.featureFlags[flag] ?? false;
	}
}
