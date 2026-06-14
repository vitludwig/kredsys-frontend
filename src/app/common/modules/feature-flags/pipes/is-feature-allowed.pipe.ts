import {inject, Pipe, PipeTransform} from '@angular/core';
import {FeatureFlagService} from "../services/feature-flag/feature-flag.service";
import {EFeatureFlag} from "../types/EFeatureFlag";

@Pipe({
	name: 'isFeatureAllowed',
	standalone: true
})
export class IsFeatureAllowedPipe implements PipeTransform {
	private featureFlagService = inject(FeatureFlagService);

	transform(value: EFeatureFlag): boolean {
		return this.featureFlagService.isEnabled(value);
	}

}
