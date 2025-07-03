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
import { CommandSubscriptionProxyServiceBase } from '../wsi-proxy-api/command/command-subscription-proxy.service.base';
import { PropertyCommand, SubscriptionGmsCmd } from '../wsi-proxy-api/command/data.model';
import { ConnectionState, SubscriptionDeleteWsi } from '../wsi-proxy-api/shared/data.model';
import { CommandSubscriptionServiceBase } from './command-subscription.service.base';

/**
 * Provides the functionality for clients to subscribe for command state changes.
 * Supports shared WSI command subscriptions.
 * Supports automatic resubscribe mechanism.
 *
 * @export
 * @class CommandSubscriptionService
 * @extends {CommandSubscriptionServiceBase}
 */
@Injectable({
  providedIn: 'root'
})
export class CommandSubscriptionService extends CommandSubscriptionServiceBase {

  private readonly _subscriptionStore: GmsSubscriptionStore<PropertyCommand> =
    new GmsSubscriptionStore<PropertyCommand>(this.trace, TraceModules.command, this.commandChangeNotification);
  private readonly clientsRegistered: Map<string, ClientIdentification> = new Map<string, ClientIdentification>();
  private gotDisconnected = false;
  private readonly commandNotificationDispatcher: GmsNotificationDispatcher<PropertyCommand>;
  private readonly subcriptionInstrumentation: GmsSubscriptionInstrumentation<PropertyCommand>;

  public constructor(private readonly settingsService: AppSettingsService,
    private readonly trace: TraceService, private readonly commandSubscriptionProxy: CommandSubscriptionProxyServiceBase, private readonly ngZone: NgZone) {
    super();
    this.commandNotificationDispatcher =
      new GmsNotificationDispatcher<PropertyCommand>(this.trace, TraceModules.command, this.commandChangeNotification, this._subscriptionStore);
    this.commandSubscriptionProxy.notifyConnectionState().subscribe(connectionState => this.onNotifyConnectionState(connectionState));
    this.subcriptionInstrumentation = new GmsSubscriptionInstrumentation<PropertyCommand>(this.settingsService,
      this.trace, 'PropertyCommand', this.clientsRegistered, this._subscriptionStore, this.ngZone);
  }

  /**
   * All clients must register themselves upfront in order to invoke the further service business functionality.
   * This method returns an ID. All invoked methods must has have this ID as a parameter.
   *
   * @param {string} clientName: Any suitable name of the client.
   * @returns {string} The unique client ID
   * @memberof CommandSubscriptionService
   */
  public registerClient(clientName: string): string | any {
    if ((clientName == undefined) || (clientName === '')) {
      this.trace.error(TraceModules.command, 'CommandSubscriptionService.registerclient(): Invalid client name!');
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
   * @param {string} clientId The unique client ID retrieved by the registerClient method.
   * @returns {void}
   * @memberof CommandSubscriptionService
   */
  public disposeClient(clientId: string): void {
    const clientProxy: ClientIdentification | undefined = this.clientsRegistered.get(clientId);
    if (clientProxy == undefined) {
      this.trace.error(TraceModules.command, 'CommandSubscriptionService.disposeClient() called with invalid arguments: clientId=%s', clientId);
      return;
    }
    this.clientsRegistered.delete(clientId);
    this.trace.info(TraceModules.command, 'CommandSubscriptionService.disposeClient() called from client: %s', clientId);

    const cmdSub: GmsSubscription<PropertyCommand>[] = this._subscriptionStore.getAllActiveGmsSubscription(clientId);
    if (cmdSub.length > 0) {
      this.trace.error(TraceModules.command,
        'CommandSubscriptionService.disposeClient() called; client did not unsubscribe all its subscriptions! Client: %s', clientId);
    }
    // we intentinally do not unsubscribe in order that client does not forget to unsubscribe on observable of the CommandSubscription.
    // this.unsubscribeCommands(this._subscriptionStore.getAllActiveGmsSubscription(clientId), clientId);
    this._subscriptionStore.unregisterClientId(clientId);
  }

  /**
   * Subscribes the specified properties.
   * Returns a 'GmsSubscription<PropertyCommand>' object per propertyId.
   * Implementation details:
   * If the same propertyId is handed over multiple times (even in separate calls), for each propertyId a corresponding
   * 'GmsSubscription<PropertyCommand>' is returned. The underlying layer, however, creates just one subscription on WSI. I.e. the underlying layer
   * maintains refCounting.
   * Therefore, if the client unsubscribes/subscribes multiple propertyIds in fast succession and the same propertyId
   * is possibly specified in both (unsubscribe and subscribe call), it is more efficient to subcribe first and then do the unsubscribe after
   * in order to benefit from the refCounting mechanism.
   *
   * @param {string[]} propertyIds propertyIds (type model or type function) or propertyDesignations
   * @param {string} clientId The unique client ID retrieved by the registerClient method.
   * @returns {GmsSubscription<PropertyCommand>[]} The 'GmsSubscription<PropertyCommand>' object per propertyIds.
   * @memberof CommandSubscriptionService
   */
  public subscribeCommands(propertyIds: string[], clientId: string, booleansAsNumericText?: boolean): GmsSubscription<PropertyCommand>[] {
    const clientProxy: ClientIdentification | undefined = this.clientsRegistered.get(clientId);
    if ((propertyIds == null) || (propertyIds.length === 0) || (clientProxy == undefined)) {
      this.trace.error(TraceModules.command, 'CommandSubscriptionService.subscribeCommands() called with invalid arguments: clientId=%s', clientId);
      return [];
    }
    this.trace.info(TraceModules.command,
      'CommandSubscriptionService.subscribeCommands() called from client: %s; number of propertyIds:%s', clientId, propertyIds.length);
    if (this.trace.isDebugEnabled(TraceModules.command)) {
      this.trace.debug(TraceModules.command,
        'CommandSubscriptionService.subscribeCommands(): propertyIds to subscribe:\n%s', propertyIds.join('\n'));
    }

    const createdSubs: { toBeSubscribed: string[]; gmsSubscriptions: GmsSubscription<PropertyCommand>[] } =
      this._subscriptionStore.createSubscriptions(propertyIds, clientId);
    if (createdSubs.toBeSubscribed.length > 0) {
      if (!isNullOrUndefined(booleansAsNumericText)) {
        this.commandSubscriptionProxy.subscribeCommands(createdSubs.toBeSubscribed, booleansAsNumericText).subscribe(
          subscriptions => this.onSubscribeCommands(createdSubs.toBeSubscribed, subscriptions),
          error => this.onSubscribeCommandsError(createdSubs.toBeSubscribed, error));
      } else {
        this.commandSubscriptionProxy.subscribeCommands(createdSubs.toBeSubscribed).subscribe(
          subscriptions => this.onSubscribeCommands(createdSubs.toBeSubscribed, subscriptions),
          error => this.onSubscribeCommandsError(createdSubs.toBeSubscribed, error));
      }
    }

    if (this.trace.isDebugEnabled(TraceModules.command)) {
      this.trace.debug(TraceModules.command,
        'CommandSubscriptionService.subscribeCommands() returned GmsSubscription<PropertyCommand> objects:\n%s', createdSubs.gmsSubscriptions.join('\n'));
    }
    return createdSubs.gmsSubscriptions;
  }

  /**
   * Unsubscribes the specified 'GmsSubscription<PropertyCommand>' objects.
   * Important: The client must detach from any events of these objects and release all references to them in order to avoid memory leaks.
   *
   * @param {GmsSubscription<PropertyCommand>[]} subscriptions The 'GmsSubscription<PropertyCommand>' objects.
   * @param {string} clientId The unique client ID retrieved by the registerClient method.
   * @returns {void}
   * @memberof CommandSubscriptionService
   */
  public unsubscribeCommands(subscriptions: GmsSubscription<PropertyCommand>[], clientId: string): void {
    const clientProxy: ClientIdentification | undefined = this.clientsRegistered.get(clientId);
    if ((subscriptions == null) || (subscriptions.length === 0) || (clientProxy == undefined)) {
      this.trace.error(TraceModules.command,
        'CommandSubscriptionService.unsubscribeCommands() called with invalid arguments: clientId=%s', clientId);
      return;
    }
    this.trace.info(TraceModules.command,
      'CommandSubscriptionService.unsubscribeCommands() called from client: %s, no of command subscriptions:\n%s', clientId, subscriptions.length);
    if (this.trace.isDebugEnabled(TraceModules.command)) {
      this.trace.debug(TraceModules.command,
        'CommandSubscriptionService.unsubscribeCommands() called from client: %s, command subscriptions:\n%s', clientId, subscriptions.join('\n'));
    }

    const toBeUnsubscribed: { toBeUnsubscribedKeys: number[]; toBeUnsubscribedIds: string[] } =
      this._subscriptionStore.removeSubscriptions(subscriptions, clientId);
    if (toBeUnsubscribed.toBeUnsubscribedKeys.length > 0) {
      this.commandSubscriptionProxy.unSubscribeCommands(toBeUnsubscribed.toBeUnsubscribedKeys).subscribe(
        subDels => this.onUnsubscribeCommands(toBeUnsubscribed.toBeUnsubscribedKeys, toBeUnsubscribed.toBeUnsubscribedIds, subDels),
        error => this.onUnsubscribeCommandsError(toBeUnsubscribed.toBeUnsubscribedKeys, toBeUnsubscribed.toBeUnsubscribedIds, error));
    }
  }

  private get commandChangeNotification(): Observable<PropertyCommand[]> {
    return this.commandSubscriptionProxy.commandChangeNotification();
  }

  private onSubscribeCommands(toBeSubscribed: string[], subscriptionsWsi: SubscriptionGmsCmd[]): void {
    // Important note:
    // If the channelized wsi subscription API is used, we get here multiple replies for one request with multiple Id's to subscribe!

    this.trace.info(TraceModules.command, 'CommandSubscriptionService.onSubscribeCommands() done; wsi key(s) returned: %s');

    const toBeUnsubscribed: { keys: number[]; ids: string[] } = this._subscriptionStore.subscribeReply(subscriptionsWsi);
    if (toBeUnsubscribed.keys.length > 0) {

      this.trace.info(TraceModules.command, 'CommandSubscriptionService.onSubscribeCommands() unsubscribe of commands pending, no of commands:\n%s',
        toBeUnsubscribed.keys.length);
      if (this.trace.isDebugEnabled(TraceModules.command)) {
        this.trace.debug(TraceModules.command,
          'CommandSubscriptionService.onSubscribeCommands() unsubscribe of commands pending: %s, propertyIds to subscribe:\n%s',
          toBeUnsubscribed.ids.join('\n'));
      }

      this.commandSubscriptionProxy.unSubscribeCommands(toBeUnsubscribed.keys).subscribe(
        subDels => this.onUnsubscribeCommands(toBeUnsubscribed.keys, toBeUnsubscribed.ids, subDels),
        error => this.onUnsubscribeCommandsError(toBeUnsubscribed.keys, toBeUnsubscribed.ids, error));
    }
  }

  private onSubscribeCommandsError(toBeSubscribed: string[], error: any): void {
    this.trace.warn(TraceModules.command, 'CommandSubscriptionService.onSubscribeCommandsError() error; WSI subscription failed.');

    const toBeUnsubscribed: { keys: number[]; ids: string[] } = this._subscriptionStore.subscribeReplyError(toBeSubscribed);
    if (toBeUnsubscribed.keys.length > 0) {

      this.trace.info(TraceModules.command, 'CommandSubscriptionService.onSubscribeCommandsError() unsubscribe of commands pending, no of commands:\n%s',
        toBeUnsubscribed.keys.length);
      if (this.trace.isDebugEnabled(TraceModules.command)) {
        this.trace.debug(TraceModules.command,
          'CommandSubscriptionService.onSubscribeCommandsError() unsubscribe of commands pending: %s, propertyIds to subscribe:\n%s',
          toBeUnsubscribed.ids.join('\n'));
      }

      this.commandSubscriptionProxy.unSubscribeCommands(toBeUnsubscribed.keys).subscribe(
        subDels => this.onUnsubscribeCommands(toBeUnsubscribed.keys, toBeUnsubscribed.ids, subDels),
        err => this.onUnsubscribeCommandsError(toBeUnsubscribed.keys, toBeUnsubscribed.ids, err));
    }
  }

  private onUnsubscribeCommands(toBeUnsubscribedKeys: number[], toBeUnsubscribedIds: string[], subDelWsi: SubscriptionDeleteWsi[]): void {
    this.trace.info(TraceModules.command, 'CommandSubscriptionService.onUnsubscribeCommands() done; wsi del keys returned.');

    this._subscriptionStore.unsubscribeReply(subDelWsi, toBeUnsubscribedIds);
  }

  private onUnsubscribeCommandsError(toBeUnsubscribedKeys: number[], toBeUnsubscribedIds: string[], error: any): void {
    this.trace.warn(TraceModules.command, 'CommandSubscriptionService.onUnsubscribeCommandsError() error; WSI unsubscription failed.');

    this._subscriptionStore.unsubscribeReplyError(toBeUnsubscribedKeys, toBeUnsubscribedIds);
  }

  private onNotifyConnectionState(connectionState: ConnectionState): void {
    this.trace.info(TraceModules.command, 'CommandSubscriptionService.onNotifyConnectionState() state: %s',
      SubscriptionUtility.getTextForConnection(connectionState));

    if (connectionState === ConnectionState.Disconnected) {
      this._subscriptionStore.notifyChannelDisconnected();
      this.gotDisconnected = true;
    } else if ((connectionState === ConnectionState.Connected) && this.gotDisconnected) {
      const toBeResubscribed: string[] = this._subscriptionStore.notifyChannelReconnected();
      this.gotDisconnected = false;
      if (toBeResubscribed.length > 0) {
        this.trace.info(TraceModules.command,
          'CommandSubscriptionService.onNotifyConnectionState(): Resubscribing commands; number of propertyIds:%s', toBeResubscribed.length);
        if (this.trace.isDebugEnabled(TraceModules.command)) {
          this.trace.debug(TraceModules.command,
            'CommandSubscriptionService.onNotifyConnectionState(): propertyIds to resubscribe:\n%s', toBeResubscribed.join('\n'));
        }

        this.commandSubscriptionProxy.subscribeCommands(toBeResubscribed).subscribe(
          subscriptions => this.onSubscribeCommands(toBeResubscribed, subscriptions),
          error => this.onSubscribeCommandsError(toBeResubscribed, error));
      }
    }
  }
}
