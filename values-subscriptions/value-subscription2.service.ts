import { Injectable, NgZone } from '@angular/core';
import { AppSettingsService, isNullOrUndefined, TraceService } from '@gms-flex/services-common';
import { Observable } from 'rxjs';

import { ClientIdentification } from '../shared/subscription/client-identification';
import { GmsNotificationDispatcher } from '../shared/subscription/gms-notification-dispatcher';
import { GmsSubscription } from '../shared/subscription/gms-subscription';
import { GmsSubscriptionInstrumentation } from '../shared/subscription/gms-subscription-instrumentation';
import { GmsSubscriptionStore } from '../shared/subscription/gms-subscription-store';
import { SubscriptionUtility } from '../shared/subscription/subscription-utility';
import { TraceModules } from '../shared/trace-modules';
import { ConnectionState, SubscriptionDeleteWsi, SubscriptionGmsVal, ValueDetails } from '../wsi-proxy-api/shared/data.model';
import { ValueSubscriptionProxyServiceBase } from '../wsi-proxy-api/values-subscriptions/value-subscription-proxy.service.base';
import { ValueSubscription2ServiceBase } from './value-subscription2.service.base';

/**
 * Provides the functionality for clients to subscribe for value changes.
 * Supports shared WSI subscriptions.
 * Supports automatic resubscribe mechanism.
 *
 * @export
 * @class ValueSubscription2Service
 * @extends {ValueSubscription2ServiceBase}
 */
@Injectable({
  providedIn: 'root'
})
export class ValueSubscription2Service extends ValueSubscription2ServiceBase {

  private readonly _subscriptionStore: GmsSubscriptionStore<ValueDetails> =
    new GmsSubscriptionStore<ValueDetails>(this.trace, TraceModules.values, this.valueChangeNotification);
  private readonly clientsRegistered: Map<string, ClientIdentification> = new Map<string, ClientIdentification>();
  private gotDisconnected = false;
  private readonly valueNotificationDispatcher: GmsNotificationDispatcher<ValueDetails>;
  private readonly subcriptionInstrumentation: GmsSubscriptionInstrumentation<ValueDetails>;

  public constructor(private readonly settingsService: AppSettingsService,
    private readonly trace: TraceService,
    private readonly valueSubscriptionProxy: ValueSubscriptionProxyServiceBase, private readonly ngZone: NgZone) {
    super();
    this.valueNotificationDispatcher =
      new GmsNotificationDispatcher<ValueDetails>(this.trace, TraceModules.values, this.valueChangeNotification, this._subscriptionStore);
    this.valueSubscriptionProxy.notifyConnectionState().subscribe(connectionState => this.onNotifyConnectionState(connectionState));
    this.subcriptionInstrumentation =
      new GmsSubscriptionInstrumentation<ValueDetails>(this.settingsService, this.trace,
        'ValueDetails', this.clientsRegistered, this._subscriptionStore, this.ngZone);
  }

  /**
   * All clients must register themselves upfront in order to invoke the further service business functionality.
   * This method returns an ID. All invoked methods must has have this ID as a parameter.
   *
   * @param {string } clientName: Any suitable name of the client.
   * @returns {string } The unique client ID
   * @memberof ValueSubscription2Service
   */
  public registerClient(clientName: string): string | any {
    if ((clientName == undefined) || (clientName === '')) {
      this.trace.error(TraceModules.values, 'ValueSubscription2Service.registerclient(): Invalid client name!');
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
      this.trace.error(TraceModules.values, 'ValueSubscription2Service.disposeClient() called with invalid arguments: clientId=%s', clientId);
      return;
    }
    this.clientsRegistered.delete(clientId);
    this.trace.info(TraceModules.values, 'ValueSubscription2Service.disposeClient() called from client: %s', clientId);

    const valSub: GmsSubscription<ValueDetails>[] = this._subscriptionStore.getAllActiveGmsSubscription(clientId);
    if (valSub.length > 0) {
      this.trace.error(TraceModules.values,
        'ValueSubscription2Service.disposeClient() called; client did not unsubscribe all its subscriptions! Client: %s', clientId);
    }
    // we intentinally do not unsubscribe in order that client does not forget to unsubscribe on observable of the ValueSubscription.
    // this.unsubscribeValues(this._subscriptionStore.getAllActiveValueSubscription(clientId), clientId);
    this._subscriptionStore.unregisterClientId(clientId);
  }

  /**
   * Subscribes the specified objects and/or properties.
   * Returns a "ValueSubscription" object per objectOrPropertyIds.
   * Implementation details
   * If the same objectOrPropertyIds is handed over multiple times (even in separate calls), for each objectOrPropertyIds a corresponding
   * "ValueSubscription" is returned. The underlying layer, however, creates just one subscription on WSI. I.e. the underlying layer
   * maintains refCounting.
   * Therefore, if the client unsubscribes/subscribes multiple objectOrPropertyIds in fast succession and and the same objectOrPropertyId
   * is possibly specified in both (unsubscribe and subscribe call), it is more effiecient to subcribe first and the do the unsubscribe after
   * in order to benefit of the refCounting mechanism.
   *
   * @param {string[] } objectOrPropertyIds ObjectIds or PropertyIds or Objectdesignations or PropertyDesignations
   * @param {string } clientId The unique client ID retrieved by the registerClient method.
   * @returns {ValueSubscription[] } The "ValueSubscription" object per objectOrPropertyIds.
   * @memberof ValueSubscription2Service
   */
  public subscribeValues(objectOrPropertyIds: string[], clientId: string, booleansAsNumericText?: boolean,
    bitsInReverseOrder?: boolean): GmsSubscription<ValueDetails>[] {
    const clientProxy: ClientIdentification | undefined = this.clientsRegistered.get(clientId);
    if ((objectOrPropertyIds == null) || (objectOrPropertyIds.length === 0) || (clientProxy == undefined)) {
      this.trace.error(TraceModules.values, 'ValueSubscription2Service.subscribeValues() called with invalid arguments: clientId=%s', clientId);
      return [];
    }
    this.trace.info(TraceModules.values,
      'ValueSubscription2Service.subscribeValues() called from client: %s; number of objectOrPropertyIds:%s', clientId, objectOrPropertyIds.length);
    if (this.trace.isDebugEnabled(TraceModules.values)) {
      this.trace.debug(TraceModules.values,
        'ValueSubscription2Service.subscribeValues(): objectOrPropertyIds to subscribe:\n%s', objectOrPropertyIds.join('\n'));
    }

    const createdSubs: { toBeSubscribed: string[]; gmsSubscriptions: GmsSubscription<ValueDetails>[] } =
      this._subscriptionStore.createSubscriptions(objectOrPropertyIds, clientId);
    if (createdSubs.toBeSubscribed.length > 0) {
      const asNumericText = !isNullOrUndefined(booleansAsNumericText) ? booleansAsNumericText : false;
      const inReverseOrder = !isNullOrUndefined(bitsInReverseOrder) ? bitsInReverseOrder : false;
      this.valueSubscriptionProxy.subscribeValues(createdSubs.toBeSubscribed, true,
        asNumericText, inReverseOrder).subscribe(
        subscriptions => this.onSubscribeValues(createdSubs.toBeSubscribed, subscriptions),
        error => this.onSubscribeValuesError(createdSubs.toBeSubscribed, error));
    }

    if (this.trace.isDebugEnabled(TraceModules.values)) {
      this.trace.debug(TraceModules.values,
        'ValueSubscription2Service.subscribeValues() returned ValueSubscription objects:\n%s', createdSubs.gmsSubscriptions.join('\n'));
    }
    return createdSubs.gmsSubscriptions;
  }

  /**
   * Unsubscribes the specified "ValueSubscription" objects.
   * Important: The client must detach from any events of these objects and release all references to them in order to avoid memory leaks.
   *
   * @param {ValueSubscription[] } subscriptions The "ValueSubscription" objects.
   * @param {string } clientId The unique client ID retrieved by the registerClient method.
   * @returns {void}
   * @memberof ValueSubscription2Service
   */
  public unsubscribeValues(subscriptions: GmsSubscription<ValueDetails>[], clientId: string): void {
    const clientProxy: ClientIdentification | undefined = this.clientsRegistered.get(clientId);
    if ((subscriptions == null) || (subscriptions.length === 0) || (clientProxy == undefined)) {
      this.trace.error(TraceModules.values,
        'ValueSubscription2Service.unSubscribeValues() called with invalid arguments: clientId=%s', clientId);
      return;
    }
    this.trace.info(TraceModules.values,
      'ValueSubscription2Service.unsubscribeValues() called from client: %s, no of value subscriptions:\n%s', clientId, subscriptions.length);
    if (this.trace.isDebugEnabled(TraceModules.values)) {
      this.trace.debug(TraceModules.values,
        'ValueSubscription2Service.unsubscribeValues() called from client: %s, value subscriptions:\n%s', clientId, subscriptions.join('\n'));
    }

    const toBeUnsubscribed: { toBeUnsubscribedKeys: number[]; toBeUnsubscribedIds: string[] } =
      this._subscriptionStore.removeSubscriptions(subscriptions, clientId);
    if (toBeUnsubscribed.toBeUnsubscribedKeys.length > 0) {
      this.valueSubscriptionProxy.unsubscribeValues(toBeUnsubscribed.toBeUnsubscribedKeys).subscribe(
        subDels => this.onUnsubscribeValues(toBeUnsubscribed.toBeUnsubscribedKeys, toBeUnsubscribed.toBeUnsubscribedIds, subDels),
        error => this.onUnsubscribeValuesError(toBeUnsubscribed.toBeUnsubscribedKeys, toBeUnsubscribed.toBeUnsubscribedIds, error));
    }
  }

  private get valueChangeNotification(): Observable<ValueDetails[]> {
    return this.valueSubscriptionProxy.valueChangeNotification();
  }

  private onSubscribeValues(toBeSubscribed: string[], subscriptionsWsi: SubscriptionGmsVal[]): void {
    // Important note:
    // If the channelized wsi subscription API is used, we get here multiple replies for one request with multiple Id's to subscribe!

    this.trace.info(TraceModules.values, 'ValueSubscription2Service.onSubscribeValues() done; wsi key(s) returned.');

    const toBeUnsubscribed: { keys: number[]; ids: string[] } = this._subscriptionStore.subscribeReply(subscriptionsWsi);
    if (toBeUnsubscribed.keys.length > 0) {

      this.trace.info(TraceModules.values, 'ValueSubscription2Service.onSubscribeValues() unsubscribe of values pending, no of values:\n%s',
        toBeUnsubscribed.keys.length);
      if (this.trace.isDebugEnabled(TraceModules.values)) {
        this.trace.debug(TraceModules.values,
          'ValueSubscription2Service.onSubscribeValues() unsubscribe of values pending: %s, objectOrPropertyIds to subscribe:\n%s',
          toBeUnsubscribed.ids.join('\n'));
      }

      this.valueSubscriptionProxy.unsubscribeValues(toBeUnsubscribed.keys).subscribe(
        subDels => this.onUnsubscribeValues(toBeUnsubscribed.keys, toBeUnsubscribed.ids, subDels),
        error => this.onUnsubscribeValuesError(toBeUnsubscribed.keys, toBeUnsubscribed.ids, error));
    }
  }

  private onSubscribeValuesError(toBeSubscribed: string[], error: any): void {
    this.trace.warn(TraceModules.values, 'ValueSubscription2Service.onSubscribeValuesError() error; WSI subscription failed.');

    const toBeUnsubscribed: { keys: number[]; ids: string[] } = this._subscriptionStore.subscribeReplyError(toBeSubscribed);
    if (toBeUnsubscribed.keys.length > 0) {

      this.trace.info(TraceModules.values, 'ValueSubscription2Service.onSubscribeValuesError() unsubscribe of values pending, no of values:\n%s',
        toBeUnsubscribed.keys.length);
      if (this.trace.isDebugEnabled(TraceModules.values)) {
        this.trace.debug(TraceModules.values,
          'ValueSubscription2Service.onSubscribeValues() unsubscribe of values pending: %s, objectOrPropertyIds to subscribe:\n%s',
          toBeUnsubscribed.ids.join('\n'));
      }

      this.valueSubscriptionProxy.unsubscribeValues(toBeUnsubscribed.keys).subscribe(
        subDels => this.onUnsubscribeValues(toBeUnsubscribed.keys, toBeUnsubscribed.ids, subDels),
        err => this.onUnsubscribeValuesError(toBeUnsubscribed.keys, toBeUnsubscribed.ids, err));
    }
  }

  private onUnsubscribeValues(toBeUnsubscribedKeys: number[], toBeUnsubscribedIds: string[], subDelWsi: SubscriptionDeleteWsi[]): void {
    this.trace.info(TraceModules.values, 'ValueSubscription2Service.onUnsubscribeValues() done; wsi del keys returned.');

    this._subscriptionStore.unsubscribeReply(subDelWsi, toBeUnsubscribedIds);
  }

  private onUnsubscribeValuesError(toBeUnsubscribedKeys: number[], toBeUnsubscribedIds: string[], error: any): void {
    this.trace.warn(TraceModules.values, 'ValueSubscription2Service.onUnsubscribeValuesError() error; WSI unsubscription failed.');

    this._subscriptionStore.unsubscribeReplyError(toBeUnsubscribedKeys, toBeUnsubscribedIds);
  }

  private onNotifyConnectionState(connectionState: ConnectionState): void {
    this.trace.info(TraceModules.values, 'ValueSubscription2Service.onNotifyConnectionState() state: %s',
      SubscriptionUtility.getTextForConnection(connectionState));

    if (connectionState === ConnectionState.Disconnected) {
      this._subscriptionStore.notifyChannelDisconnected();
      this.gotDisconnected = true;
    } else if ((connectionState === ConnectionState.Connected) && this.gotDisconnected) {
      const toBeResubscribed: string[] = this._subscriptionStore.notifyChannelReconnected();
      this.gotDisconnected = false;
      if (toBeResubscribed.length > 0) {
        this.trace.info(TraceModules.values,
          'ValueSubscription2Service.onNotifyConnectionState(): Resubscribing values; number of objectOrPropertyIds:%s', toBeResubscribed.length);
        if (this.trace.isDebugEnabled(TraceModules.values)) {
          this.trace.debug(TraceModules.values,
            'ValueSubscription2Service.onNotifyConnectionState(): objectOrPropertyIds to resubscribe:\n%s', toBeResubscribed.join('\n'));
        }

        this.valueSubscriptionProxy.subscribeValues(toBeResubscribed, true, false).subscribe(
          subscriptions => this.onSubscribeValues(toBeResubscribed, subscriptions),
          error => this.onSubscribeValuesError(toBeResubscribed, error));
      }
    }
  }
}
