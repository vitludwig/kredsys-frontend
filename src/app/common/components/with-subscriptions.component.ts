import { Component, OnDestroy } from '@angular/core';
import { WithSubscriptions } from './with-subscriptions';

@Component({
  template: ''
})
export abstract class WithSubscriptionsComponent extends WithSubscriptions implements OnDestroy {

  public override ngOnDestroy(): void {
    super.ngOnDestroy();
  }

}
