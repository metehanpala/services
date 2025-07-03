import { TraceService } from '@gms-flex/services-common';
import { Observable, Subscription } from 'rxjs';

import { SubscriptionDeleteWsi, SubscriptionGms } from '../../wsi-proxy-api/shared/data.model';
import { GmsSubscription, SubscriptionState } from './gms-subscription';
import { GmsSubscriptionFsm } from './gms-subscription-fsm';
import { FsmReplyType, GmsSubscriptionFsmReply, GmsSubscriptionShared } from './gms-subscription-shared';

export interface SubscriptionKey {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  SubscriptionKey: number;
}

export class GmsSubscriptionStore<T extends SubscriptionKey> {
  // key is the 'gmsId' of the requested subscription
  private readonly _subscriptionsActive: Map<string, GmsSubscriptionShared<T>> = new Map<string, GmsSubscriptionShared<T>>();
  // key is the 'key' of the returned wsi-subscription
  private readonly _subscriptionsActiveByKey: Map<number, GmsSubscriptionShared<T>> = new Map<number, GmsSubscriptionShared<T>>();
  // key is the 'wsiKey' of the subscription; reason: multiple inactive subsriptions of the same gmsId can exist.
  private readonly _subscriptionsInactive: Map<number, GmsSubscriptionShared<T>> = new Map<number, GmsSubscriptionShared<T>>();
  // Counts only the active subscriptions
  private readonly _gmsSubscriptionCountPerClient: Map<string, number> = new Map<string, number>();

  private readonly changeSubscription: Subscription | undefined;

  constructor(private readonly trace: TraceService, private readonly traceModule: string, private readonly gmsHubEvents: Observable<T[]>) {
    if (gmsHubEvents != undefined) {
      this.changeSubscription = this.gmsHubEvents.subscribe(changes => this.onGmsChanges(changes), error => this.onGmsChangesError(error));
    }
  }

  public registerClientId(clientId: string): void {
    this._gmsSubscriptionCountPerClient.set(clientId, 0);
  }

  public unregisterClientId(clientId: string): void {
    this._gmsSubscriptionCountPerClient.delete(clientId);
  }

  public dispose(): void {
    if (this.changeSubscription != undefined) {
      this.changeSubscription.unsubscribe();
    }
  }

  /**
   * Returns true if in either of the states: Subscribing, Subscribed or ResubscribePending
   */
  public isActive(gmsId: string): boolean {
    return (this._subscriptionsActive.has(gmsId));
  }

  /**
   * Returns true if in either of the states: Unsubscribing, Unsubscribed
   */
  public isInactive(gmsId: string): boolean {
    return !this.isActive(gmsId);
  }

  /**
   * Returns the number of active subscriptions; state is Subscribing, Subscribed or ResubscribePending
   */
  public countActiveSubscriptions(): number {
    return this._subscriptionsActive.size;
  }

  /**
   * Returns the number of active subscriptions
   */
  public countInactiveSubscriptions(): number {
    return this._subscriptionsInactive.size;
  }

  /**
   * Returns the number of active subscriptions hold by the key map; state is Subscribed or ResubscribePending
   */
  public countActiveSubscriptionsByKey(): number {
    return this._subscriptionsActiveByKey.size;
  }

  public getTraceActiveSubscriptions(): string {
    return Array.from(this._subscriptionsActive.values()).join('\n');
  }

  public getTraceInactiveSubscriptions(): string {
    return Array.from(this._subscriptionsInactive.values()).join('\n');
  }

  public getActiveSubscription(gmsId: string): GmsSubscriptionShared<T> | undefined {
    return this._subscriptionsActive.get(gmsId);
  }

  public getActiveSubscriptionByKey(key: number): GmsSubscriptionShared<T> | undefined {
    return this._subscriptionsActiveByKey.get(key);
  }

  public getInactiveSubscription(key: number): GmsSubscriptionShared<T> | undefined {
    return this._subscriptionsInactive.get(key);
  }

  public getNoOfGmsSubscriptions(clientId: string): number | undefined {
    return this._gmsSubscriptionCountPerClient.get(clientId);
  }

  public getAllActiveGmsSubscription(clientId: string): GmsSubscription<T>[] {
    const gmsSubs: GmsSubscription<T>[] = [];
    this._subscriptionsActive.forEach(sub => {
      sub.gmsSubscriptionFsms.forEach(gmsSub => {
        if (gmsSub.gmsSubscription.clientId === clientId) {
          gmsSubs.push(gmsSub.gmsSubscription);
        }
      });
    });
    return gmsSubs;
  }

  public getActiveGmsSubscriptionFsms(gmsId: string): Map<number, GmsSubscriptionFsm<T>> {
    const subscription: GmsSubscriptionShared<T> | undefined = this._subscriptionsActive.get(gmsId);
    if (subscription != undefined) {
      return subscription.gmsSubscriptionFsms;
    }
    return new Map<number, GmsSubscriptionFsm<T>>();
  }

  public getActiveGmsSubscriptionFsmsByKey(key: number): Map<number, GmsSubscriptionFsm<T>> {
    const subscription: GmsSubscriptionShared<T> | undefined = this._subscriptionsActiveByKey.get(key);
    if (subscription != undefined) {
      return subscription.gmsSubscriptionFsms;
    }
    return new Map<number, GmsSubscriptionFsm<T>>();
  }

  public createSubscriptions(gmsIds: string[], clientId: string): { toBeSubscribed: string[]; gmsSubscriptions: GmsSubscription<T>[] } {
    const toBeSubscribed: string[] = [];
    const gmsSubs: GmsSubscription<T>[] = [];
    gmsIds.forEach(id => {
      if (this.isActive(id) === false) {
        toBeSubscribed.push(id);
      }
      const gmsSubCreated: GmsSubscription<T> | undefined = this.createSubscription(id, clientId);
      if (gmsSubCreated != undefined) {
        gmsSubs.push(gmsSubCreated);
        this.incNoOfGmsSubscriptions(clientId);
      }
    });
    // note: making 'toBeSubscribed' distinct!
    return { toBeSubscribed: Array.from(new Set(toBeSubscribed)), gmsSubscriptions: gmsSubs };
  }

  public subscribeReply(subscriptionsWsi: SubscriptionGms[]): { keys: number[]; ids: string[] } {
    const toBeUnsubscribedKeys: number[] = [];
    const toBeUnsubscribedIds: string[] = [];
    subscriptionsWsi.forEach(subWsi => {
      const subShared: GmsSubscriptionShared<T> | undefined = this.getActiveSubscription(subWsi.originalId);
      if (subShared != undefined) {
        this._subscriptionsActiveByKey.set(subWsi.key, subShared);
        if (subShared?.subscribeReply(subWsi)?.fsmReplyType === FsmReplyType.DoUnsubscribe) {
          toBeUnsubscribedKeys.push(subWsi.key);
          toBeUnsubscribedIds.push(subWsi.originalId);
        }
        this.checkToRemoveToInactiveMap(subShared);
        this.checkInactiveForDeletion(subShared);
      }
    });
    return { keys: toBeUnsubscribedKeys, ids: toBeUnsubscribedIds };
  }

  public subscribeReplyError(gmsIds: string[]): { keys: number[]; ids: string[] } {
    const toBeUnsubscribedKeys: number[] = [];
    const toBeUnsubscribedIds: string[] = [];
    gmsIds.forEach(id => {
      const subShared: GmsSubscriptionShared<T> | undefined = this.getActiveSubscription(id);
      if (subShared != undefined) {
        subShared.subscribeReply(undefined!);
        this.checkToRemoveToInactiveMap(subShared);
        this.checkInactiveForDeletion(subShared);
      }
    });
    return { keys: toBeUnsubscribedKeys, ids: toBeUnsubscribedIds };
  }

  public removeSubscriptions(subscriptions: GmsSubscription<T>[], clientId: string): { toBeUnsubscribedKeys: number[]; toBeUnsubscribedIds: string[] } {
    const toBeUnsubscribedKeys: number[] = [];
    const toBeUnsubscribedIds: string[] = [];
    subscriptions.forEach(sub => {
      if (this.isActive(sub.gmsId)) {
        const subShared: GmsSubscriptionShared<T> | undefined = this.getActiveSubscription(sub.gmsId);
        const reply: GmsSubscriptionFsmReply<T> | undefined = subShared?.unsubscribe(sub);
        if (reply?.subFsmRemoved != undefined) {
          this.decNoOfGmsSubscriptions(clientId);
        }
        if (reply?.fsmReplyType === FsmReplyType.DoUnsubscribe) {
          toBeUnsubscribedKeys.push(subShared!.subscriptionWsi!.key);
          toBeUnsubscribedIds.push(subShared!.gmsId!);
        }
        this.checkToRemoveToInactiveMap(subShared);
        this.checkInactiveForDeletion(subShared);
      }
    });
    return { toBeUnsubscribedKeys, toBeUnsubscribedIds };
  }

  public unsubscribeReply(subDelsWsi: SubscriptionDeleteWsi[], gmsIds: string[]): void {
    subDelsWsi.forEach((subDelWsi, index) => {
      const subShared: GmsSubscriptionShared<T> | undefined = this.getInactiveSubscription(subDelWsi.Key);
      if (subShared != undefined) {
        subShared.unsubscribeReply(subDelWsi);
        this.checkInactiveForDeletion(subShared);
      }
      if (subDelWsi.ErrorCode !== 0) {
        this.trace.warn(this.traceModule, 'GmsSubscriptionStore.unsubscribeReply(): unsubscribe failed for key: %s, gmsId: %s',
          subDelWsi.Key, gmsIds[index]);
      }
    });
  }

  public unsubscribeReplyError(unsubscribeKeys: number[], gmsIds: string[]): void {
    unsubscribeKeys.forEach((key, idx) => {
      const subShared: GmsSubscriptionShared<T> | undefined = this.getInactiveSubscription(key);
      if (subShared != undefined) {
        subShared.unsubscribeReply(undefined);
        this.checkInactiveForDeletion(subShared);
      }
      this.trace.warn(this.traceModule, 'GmsSubscriptionStore.unsubscribeReply(): unsubscribe failed for gmsId: %s', gmsIds[idx]);
    });
  }

  public notifyChannelDisconnected(): void {
    this._subscriptionsActive.forEach(sub => {
      sub.notifyChannelDisconnected();
    });
  }

  public notifyChannelReconnected(): string[] {
    const gmsIds: string[] = [];
    this._subscriptionsActive.forEach(sub => {
      const reply: GmsSubscriptionFsmReply<T> | undefined = sub.notifyChannelReconnected();
      if (reply?.fsmReplyType === FsmReplyType.DoSubscribe) {
        gmsIds.push(sub.gmsId!);
      }
    });
    return gmsIds;
  }

  private checkToRemoveToInactiveMap(subShared: GmsSubscriptionShared<T> | undefined): void {
    if (subShared?.isActive === false) {
      if (this._subscriptionsActive.has(subShared.gmsId!)) {
        if (subShared.subscriptionWsi?.key !== undefined) {
          this._subscriptionsInactive.set(subShared.subscriptionWsi.key,
            this._subscriptionsActive.get(subShared.gmsId!)!);

          // to be deleted only when a key is available (otherwise, the entry has never been made!)
          this._subscriptionsActiveByKey.delete(subShared.subscriptionWsi.key);
        }
        this._subscriptionsActive.delete(subShared.gmsId!);
      }
    }
  }

  private checkInactiveForDeletion(subShared: GmsSubscriptionShared<T> | undefined): void {
    if ((subShared?.state === SubscriptionState.Unsubscribed) && (subShared?.subscriptionWsi !== undefined) && (subShared.subscriptionWsi.key !== undefined)) {
      this._subscriptionsInactive.delete(subShared.subscriptionWsi.key);
    }
  }

  private createSubscription(gmsId: string, clientId: string): GmsSubscription<T> | undefined {
    if (this.isActive(gmsId)) {
      const sharedSub: GmsSubscriptionShared<T> | undefined = this.getActiveSubscription(gmsId);
      return sharedSub?.subscribe(clientId)?.subFsmCreated?.gmsSubscription;
    } else {
      const newSubscription: GmsSubscriptionShared<T> = new GmsSubscriptionShared();
      this._subscriptionsActive.set(gmsId, newSubscription);
      return newSubscription.initialize(gmsId, this.trace, this.traceModule, clientId).subFsmCreated?.gmsSubscription;
    }
  }

  private incNoOfGmsSubscriptions(clientId: string): void {
    this._gmsSubscriptionCountPerClient.set(clientId, this._gmsSubscriptionCountPerClient.get(clientId)! + 1);
  }

  private decNoOfGmsSubscriptions(clientId: string): void {
    this._gmsSubscriptionCountPerClient.set(clientId, this._gmsSubscriptionCountPerClient.get(clientId)! - 1);
  }

  private onGmsChanges(changes: T[]): void {
    changes.forEach(gmsChange => {
      const subShared: GmsSubscriptionShared<T> | undefined = this.getActiveSubscriptionByKey(gmsChange.SubscriptionKey);

      // used only for checking against race conditions!
      // let subSharedOrig: SubscriptionShared = this.getActiveSubscription(gmsChange.OriginalObjectOrPropertyId);
      // if (subShared !== subSharedOrig) {
      //   this.trace.error(this.traceModule,
      //     "GmsSubscriptionStore.onGmsChanges(); notifications for changes with no key: %s\n%s",
      //      gmsChange.SubscriptionKey, gmsChange.OriginalObjectOrPropertyId);
      //   if (subShared != undefined) {
      //     this.trace.error(this.traceModule,
      //       "GmsSubscriptionStore.onGmsChanges(); state: %s\n%s", subShared.state);
      //   }
      // }

      if (subShared != undefined) {
        subShared.latestGmsChange = gmsChange;
      }
    });
  }

  private onGmsChangesError(error: any): void {
    this.trace.warn(this.traceModule, 'GmsSubscriptionStore.onGmsChangesError(); returned an error; %s', error);
  }
}
