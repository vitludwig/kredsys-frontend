import { Directive, OnDestroy } from '@angular/core';
import { ReplaySubject } from 'rxjs';

@Directive()
export abstract class WithSubscriptions implements OnDestroy {

	public destroy$: ReplaySubject<boolean> = new ReplaySubject(1);

	public ngOnDestroy(): void {
		this.destroy$.next(true);
		// Now let's also unsubscribe from the subject itself:
		this.destroy$.complete();
	}

}
