import { NgZone } from '@angular/core';
import { AppSettings, AppSettingsService, TraceService } from '@gms-flex/services-common';
import { interval, Subscription } from 'rxjs';

import { TraceModules } from '../../shared/trace-modules';
import { ClientIdentification } from './client-identification';
import { GmsSubscriptionStore, SubscriptionKey } from './gms-subscription-store';

export class GmsSubscriptionInstrumentation<T extends SubscriptionKey> {

  private timerSubscription: Subscription | undefined;
  private started = false;
  private readonly instrumentationInterval: number;

  public constructor(
    private readonly appSettingsService: AppSettingsService,
    private readonly trace: TraceService,
    private readonly storeType: string = '',
    private readonly clients: Map<string, ClientIdentification>,
    private readonly subscriptionStore: GmsSubscriptionStore<T>,
    private readonly ngZone: NgZone) {

    const settings: AppSettings = this.appSettingsService.getAppSettingsValue();
    this.instrumentationInterval = (settings?.instrumentationTimeout != null) ? settings.instrumentationTimeout : 30;
  }

  public start(): void {
    if (this.started === false) {
      this.ngZone.runOutsideAngular(() => {
        this.timerSubscription = interval(this.instrumentationInterval * 1000).subscribe(value => this.onInstrumentationTimer(value));
      });
      this.started = true;
    }
  }

  private onInstrumentationTimer(counter: number): void {
    this.clients.forEach(proxy => {
      if (this.trace.isInfoEnabled(TraceModules.instrumentation)) {
        this.trace.info(TraceModules.instrumentation, 'GmsSubscriptionStore<%s>: client = %s, number of subscriptions = %s',
          this.storeType, proxy.clientId, this.subscriptionStore.getNoOfGmsSubscriptions(proxy.clientId));
      }
    });

    if (this.trace.isInfoEnabled(TraceModules.instrumentation)) {
      this.trace.info(TraceModules.instrumentation, 'GmsSubscriptionStore<%s>: number of shared active subscriptions = %s',
        this.storeType, this.subscriptionStore.countActiveSubscriptions());
      this.trace.info(TraceModules.instrumentation, 'GmsSubscriptionStore<%s>: number of shared inactive subscriptions = %s',
        this.storeType, this.subscriptionStore.countInactiveSubscriptions());
      this.trace.info(TraceModules.instrumentation,
        'GmsSubscriptionStore<%s>: number of shared subscriptions (by key; state Subscribed or ResubscribePending) = %s',
        this.storeType, this.subscriptionStore.countActiveSubscriptionsByKey());
    }

    if (this.trace.isDebugEnabled(TraceModules.instrumentation)) {
      if (this.subscriptionStore.countActiveSubscriptions() > 0) {
        this.trace.debug(TraceModules.instrumentation, 'GmsSubscriptionStore<%s>: shared active subscriptions:\n %s',
          this.storeType, this.subscriptionStore.getTraceActiveSubscriptions());
      }
      if (this.subscriptionStore.countInactiveSubscriptions()) {
        this.trace.debug(TraceModules.instrumentation, 'GmsSubscriptionStore<%s>: shared inactive subscriptions:\n %s',
          this.storeType, this.subscriptionStore.getTraceInactiveSubscriptions());
      }
    }
  }
}
