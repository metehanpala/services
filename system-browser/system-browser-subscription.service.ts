import { Injectable, NgZone } from '@angular/core';
import { AppSettingsService, TraceService } from '@gms-flex/services-common';
import { Observable } from 'rxjs';

import { ClientIdentification } from '../shared/subscription/client-identification';
import { GmsNotificationDispatcher } from '../shared/subscription/gms-notification-dispatcher';
import { GmsSubscription } from '../shared/subscription/gms-subscription';
import { GmsSubscriptionInstrumentation } from '../shared/subscription/gms-subscription-instrumentation';
import { GmsSubscriptionStore } from '../shared/subscription/gms-subscription-store';
import { SubscriptionUtility } from '../shared/subscription/subscription-utility';
import { TraceModules } from '../shared/trace-modules';
import { ConnectionState, SubscriptionDeleteWsi, SubscriptionGms } from '../wsi-proxy-api/shared/data.model';
import { SystemBrowserSubscription, SystemBrowserSubscriptionKey, SystemBrowserSubscriptionKeyImpl } from '../wsi-proxy-api/system-browser/data.model';
import { SystemBrowserSubscriptionProxyServiceBase } from '../wsi-proxy-api/system-browser/system-browser-subscription-proxy.service.base';
import { SystemBrowserSubscriptionServiceBase } from './system-browser-subscription.service.base';

/**
 * Provides the functionality for clients to subscribe for node changes.
 * Supports shared WSI subscriptions.
 * Supports automatic resubscribe mechanism.
 */
@Injectable({
  providedIn: 'root'
})
export class SystemBrowserSubscriptionService extends SystemBrowserSubscriptionServiceBase {

  private readonly _subscriptionStore: GmsSubscriptionStore<SystemBrowserSubscription> =
    new GmsSubscriptionStore<SystemBrowserSubscription>(this.trace, TraceModules.sysBrowserNotification, this.nodeChangeNotification);
  private readonly clientsRegistered: Map<string, ClientIdentification> = new Map<string, ClientIdentification>();
  private gotDisconnected = false;
  private readonly nodeChangeNotificationDispatcher: GmsNotificationDispatcher<SystemBrowserSubscription>;
  private readonly subcriptionInstrumentation: GmsSubscriptionInstrumentation<SystemBrowserSubscription>;

  private readonly trMod: string = TraceModules.sysBrowserNotification;

  public constructor(
    private readonly settingsService: AppSettingsService,
    private readonly trace: TraceService,
    private readonly systemBrowserSubscriptionProxy: SystemBrowserSubscriptionProxyServiceBase,
    private readonly ngZone: NgZone) {

    super();

    this.nodeChangeNotificationDispatcher =
      new GmsNotificationDispatcher<SystemBrowserSubscription>(this.trace, this.trMod, this.nodeChangeNotification, this._subscriptionStore);
    this.systemBrowserSubscriptionProxy.notifyConnectionState().subscribe(connectionState => this.onNotifyConnectionState(connectionState));
    this.subcriptionInstrumentation =
      new GmsSubscriptionInstrumentation<SystemBrowserSubscription>(this.settingsService, this.trace,
        'SystemBrowserSubscription', this.clientsRegistered, this._subscriptionStore, this.ngZone);
  }

  /**
   * All clients must register themselves upfront in order to invoke the further service business functionality.
   * This method returns an ID. All invoked methods must has have this ID as a parameter.
   *
   * @param {string } clientName: Any suitable name of the client.
   * @returns {string } The unique client ID
   * @memberof ValueSubscription2Service
   */
  public registerClient(clientName: string): string | undefined {
    if ((clientName == undefined) || (clientName === '')) {
      this.trace.error(this.trMod, 'SystemBrowserSubscriptionService.registerclient(): Invalid client name!');
      return undefined;
    }
    const proxy: ClientIdentification = new ClientIdentification(clientName);
    this.clientsRegistered.set(proxy.clientId, proxy);
    this._subscriptionStore.registerClientId(proxy.clientId);
    this.subcriptionInstrumentation.start();
    return proxy.clientId;
  }

  /**
   * All clients must dispose themselves at the end of their lifetime.
   * This method traces an error message, if a client did not unsubscribe all its subscriptions prior to this call.
   *
   * @param {string } clientId The unique client ID retrieved by the registerClient method.
   * @returns {void}
   * @memberof ValueSubscription2Service
   */
  public disposeClient(clientId: string): void {
    const clientProxy: ClientIdentification | undefined = this.clientsRegistered.get(clientId);
    if (clientProxy == undefined) {
      this.trace.error(this.trMod, 'SystemBrowserSubscriptionService.disposeClient() called with invalid arguments: clientId=%s', clientId);
      return;
    }
    this.clientsRegistered.delete(clientId);
    this.trace.info(this.trMod, 'SystemBrowserSubscriptionService.disposeClient() called from client: %s', clientId);

    const nodeChangeSub: GmsSubscription<SystemBrowserSubscription>[] = this._subscriptionStore.getAllActiveGmsSubscription(clientId);
    if (nodeChangeSub.length > 0) {
      this.trace.error(this.trMod,
        'SystemBrowserSubscriptionService.disposeClient() called; client did not unsubscribe all its subscriptions! Client: %s', clientId);
    }
    // we intentinally do not unsubscribe in order that client does not forget to unsubscribe on observable of the ValueSubscription.
    // this.unsubscribeNodeChanges(this._subscriptionStore.getAllActiveValueSubscription(clientId), clientId);
    this._subscriptionStore.unregisterClientId(clientId);
  }

  /**
   * Subscribes for changes within the specified designation.
   * Returns a "GmsSubscription" object.
   * Implementation details
   * If the same designation is handed over multiple times (even in separate calls), for each designation a corresponding
   * "GmsSubscription" is returned. The underlying layer, however, creates just one subscription on WSI. I.e. the underlying layer
   * maintains refCounting.
   * Therefore, if the client unsubscribes/subscribes multiple designations in fast succession and the same designation
   * is possibly specified in both (unsubscribe and subscribe call), it is more effiecient to subcribe first and the do the unsubscribe after
   * in order to benefit of the refCounting mechanism.
   */
  public subscribeNodeChanges(designation: string, clientId: string): GmsSubscription<SystemBrowserSubscription> | undefined {
    const clientProxy: ClientIdentification | undefined = this.clientsRegistered.get(clientId);
    if (designation == undefined || clientProxy == undefined) {
      this.trace.error(this.trMod, 'SystemBrowserSubscriptionService.subscribeNodeChanges() called with invalid arguments: clientId=%s', clientId);
      return undefined;
    }
    this.trace.info(this.trMod,
      'SystemBrowserSubscriptionService.subscribeNodeChanges() called from client: %s; designation:%s', clientId, designation);

    const createdSubs: { toBeSubscribed: string[]; gmsSubscriptions: GmsSubscription<SystemBrowserSubscription>[] } =
      this._subscriptionStore.createSubscriptions([designation], clientId);
    if (createdSubs.toBeSubscribed.length > 0) {
      this.systemBrowserSubscriptionProxy.subscribeNodeChanges(designation).subscribe(
        subscription => this.onSubscribeNodeChanges(designation, subscription),
        error => this.onSubscribeNodeChangesError(designation, error));
    }

    const gmsSub: GmsSubscription<SystemBrowserSubscription> = createdSubs.gmsSubscriptions[0];
    if (this.trace.isDebugEnabled(this.trMod)) {
      this.trace.debug(this.trMod,
        'SystemBrowserSubscriptionService.subscribeNodeChanges() returned ValueSubscription object:%s', gmsSub);
    }
    return gmsSub;
  }

  /**
   * Unsubscribes the specified "ValueSubscription" object.
   * Important: The client must detach from any events of these objects and release all references to them in order to avoid memory leaks.
   */
  public unsubscribeNodeChanges(subscription: GmsSubscription<SystemBrowserSubscription>, clientId: string): void {
    const clientProxy: ClientIdentification | undefined = this.clientsRegistered.get(clientId);
    if (subscription == undefined || clientProxy == undefined) {
      this.trace.error(this.trMod,
        'SystemBrowserSubscriptionService.unsubscribeNodeChanges() called with invalid arguments: clientId=%s', clientId);
      return;
    }
    this.trace.info(this.trMod,
      'SystemBrowserSubscriptionService.unsubscribeNodeChanges() called from client: %s, value subscription:%s', clientId, subscription);

    const toBeUnsubscribed: { toBeUnsubscribedKeys: number[]; toBeUnsubscribedIds: string[] } =
      this._subscriptionStore.removeSubscriptions([subscription], clientId);
    if (toBeUnsubscribed.toBeUnsubscribedKeys.length > 0) {
      const key: number = toBeUnsubscribed.toBeUnsubscribedKeys[0];
      const id: string = toBeUnsubscribed.toBeUnsubscribedIds[0];
      this.systemBrowserSubscriptionProxy.unsubscribeNodeChanges(key).subscribe(
        subDel => this.onUnsubscribeNodeChanges(key, id, subDel),
        error => this.onUnsubscribeNodeChangesError(key, id, error));
    }
  }

  private get nodeChangeNotification(): Observable<SystemBrowserSubscription[]> {
    return this.systemBrowserSubscriptionProxy.nodeChangeNotification();
  }

  private onSubscribeNodeChanges(designation: string, subscription: SystemBrowserSubscriptionKey): void {
    this.trace.info(this.trMod, 'SystemBrowserSubscriptionService.onSubscribeNodeChanges() done; wsi key returned.');
    const subscriptionsWsi: SubscriptionGms = new SystemBrowserSubscriptionKeyImpl(subscription);

    const toBeUnsubscribed: { keys: number[]; ids: string[] } = this._subscriptionStore.subscribeReply([subscriptionsWsi]);
    if (toBeUnsubscribed.keys.length > 0) {
      const key: number = toBeUnsubscribed.keys[0];
      const id: string = toBeUnsubscribed.ids[0];
      this.trace.debug(this.trMod,
        'SystemBrowserSubscriptionService.onSubscribeNodeChanges() unsubscribe of node-changes pending: designation to unsubscribe:%s', id);

      this.systemBrowserSubscriptionProxy.unsubscribeNodeChanges(key).subscribe(
        subDel => this.onUnsubscribeNodeChanges(key, id, subDel),
        error => this.onUnsubscribeNodeChangesError(key, id, error));
    }
  }

  private onSubscribeNodeChangesError(designation: string, error: any): void {
    this.trace.warn(this.trMod, 'SystemBrowserSubscriptionService.onSubscribeNodeChangesError() error; WSI subscription failed.');

    const toBeUnsubscribed: { keys: number[]; ids: string[] } = this._subscriptionStore.subscribeReplyError([designation]);
    if (toBeUnsubscribed.keys.length > 0) {
      const key: number = toBeUnsubscribed.keys[0];
      const id: string = toBeUnsubscribed.ids[0];
      this.trace.debug(this.trMod,
        'SystemBrowserSubscriptionService.onSubscribeNodeChangesError() unsubscribe of node-changes pending: designation to unsubscribe:%s', id);

      this.systemBrowserSubscriptionProxy.unsubscribeNodeChanges(key).subscribe(
        subDel => this.onUnsubscribeNodeChanges(key, id, subDel),
        err => this.onUnsubscribeNodeChangesError(key, id, err));
    }
  }

  private onUnsubscribeNodeChanges(toBeUnsubscribedKey: number, toBeUnsubscribedId: string, subDelWsi: SubscriptionDeleteWsi): void {
    this.trace.info(this.trMod, 'SystemBrowserSubscriptionService.onUnsubscribeNodeChanges() done; wsi del keys returned.');

    this._subscriptionStore.unsubscribeReply([subDelWsi], [toBeUnsubscribedId]);
  }

  private onUnsubscribeNodeChangesError(toBeUnsubscribedKey: number, toBeUnsubscribedId: string, error: any): void {
    this.trace.warn(this.trMod, 'SystemBrowserSubscriptionService.onUnsubscribeNodeChangesError() error; WSI unsubscription failed.');

    this._subscriptionStore.unsubscribeReplyError([toBeUnsubscribedKey], [toBeUnsubscribedId]);
  }

  private onNotifyConnectionState(connectionState: ConnectionState): void {
    this.trace.info(this.trMod, 'SystemBrowserSubscriptionService.onNotifyConnectionState() state: %s',
      SubscriptionUtility.getTextForConnection(connectionState));

    if (connectionState === ConnectionState.Disconnected) {
      this._subscriptionStore.notifyChannelDisconnected();
      this.gotDisconnected = true;
    } else if ((connectionState === ConnectionState.Connected) && this.gotDisconnected) {
      const toBeResubscribed: string[] = this._subscriptionStore.notifyChannelReconnected();
      this.gotDisconnected = false;
      if (toBeResubscribed.length > 0) {
        this.trace.info(this.trMod,
          'SystemBrowserSubscriptionService.onNotifyConnectionState(): designations to resubscribe:\n%s', toBeResubscribed.join('\n'));

        toBeResubscribed.forEach(designation => {
          this.systemBrowserSubscriptionProxy.subscribeNodeChanges(designation).subscribe(
            subscription => this.onSubscribeNodeChanges(designation, subscription),
            error => this.onSubscribeNodeChangesError(designation, error));
        });
      }
    }
  }
}
