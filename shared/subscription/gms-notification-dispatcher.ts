import { TraceService } from '@gms-flex/services-common';
import { Observable, Subscription } from 'rxjs';

import { GmsSubscriptionFsm } from './gms-subscription-fsm';
import { GmsSubscriptionStore, SubscriptionKey } from './gms-subscription-store';

export class GmsNotificationDispatcher<T extends SubscriptionKey> {

  private readonly gmsSubscription: Subscription;

  public constructor(
    private readonly trace: TraceService,
    private readonly traceModule: string,
    private readonly gmsHubEvents: Observable<T[]>,
    private readonly subscriptionStore: GmsSubscriptionStore<T>) {
    this.gmsSubscription = this.gmsHubEvents.subscribe(values => this.onDispatchChanges(values), error => this.onDispatchChangesError(error));
  }

  public dispose(): void {
    if (this.gmsSubscription != undefined) {
      this.gmsSubscription.unsubscribe();
    }
  }

  private onDispatchChanges(values: T[]): void {
    values.forEach(value => {
      const fsms: Map<number, GmsSubscriptionFsm<T>> = this.subscriptionStore.getActiveGmsSubscriptionFsmsByKey(value.SubscriptionKey);
      if (fsms != undefined) {
        fsms.forEach((fsm, key) => {
          fsm.gmsSubscription.notifyChange(value);
        });
      }
    });
  }

  private onDispatchChangesError(error: any): void {
    this.trace.warn(this.traceModule, 'GmsNotificationDispatcher.onDispatchChangesError(); returned an error; %s', error);
  }
}
