import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Injectable, NgZone } from '@angular/core';
import { AuthenticationServiceBase, ErrorNotificationServiceBase, isNullOrUndefined, TraceService } from '@gms-flex/services-common';
import { Observable, Subject, Subscription } from 'rxjs';
import { catchError, delay, map } from 'rxjs/operators';

import { SubscribeContextChannelizedSingle } from '../shared/subscription/subscribe-context-channelized-single';
import { SubscriptionUtility } from '../shared/subscription/subscription-utility';
import { TraceModules } from '../shared/trace-modules';
import { WsiUtilityService } from '../shared/wsi-utility.service';
import { HubProxyEvent } from '../signalr/hub-proxy-event';
import { HubProxyShared } from '../signalr/hub-proxy-shared';
import { SignalRService } from '../signalr/signalr.service';
import { WsiEndpointService } from '../wsi-endpoint/wsi-endpoint.service';
import { SubscriptionWsiSuppressedObjects, SuppressedObjects } from '../wsi-proxy-api/event/data.model';
import { SuppressedObjectsProxyServiceBase } from '../wsi-proxy-api/event/suppressed-objects-proxy.service.base';
import { ConnectionState } from '../wsi-proxy-api/shared/data.model';

const suppressedObjectsUrl = '/api/eventcounters/';
const suppressedObjectsSubscriptionUrl = '/api/sr/eventcounterssubscriptions/suppressedobjects/';
const suppressedObjectsSubscriptionChannelizeUrl = '/api/sr/eventcounterssubscriptions/channelize/suppressedobjects/';
const noConnectionTrace = 'signalr connection not established; need to wait (postpone http calls) until established in order to get connection id.';
const subscribeSuppressedObjectsTrace = 'subscribeSuppressedObjects()';
const unsubscribeSuppressedObjectsTrace = 'unsubscribeSuppressedObjects()';

const reconnectTimeout = 5000;

/**
 * Implementation for the WSI event counter service.
 * See the WSI API documentation for details.
 *
 * @export
 * @class EventCounterProxyService
 * @extends {SuppressedObjectsProxyServiceBase}
 */
@Injectable({
  providedIn: 'root'
})
export class SuppressedObjectsProxyService extends SuppressedObjectsProxyServiceBase {

  public hubProxyShared: HubProxyShared | undefined;
  public hubProxySuppressedObjectsCounters: HubProxyEvent<SuppressedObjects> | undefined;
  public hubProxySuppressedObjectsSubs: HubProxyEvent<SubscriptionWsiSuppressedObjects> | undefined;

  private readonly _notifyConnectionState: Subject<ConnectionState> = new Subject<ConnectionState>();
  private readonly _subscribeRequestsInvoked: Map<string, SubscribeContextChannelizedSingle<boolean>> =
    new Map<string, SubscribeContextChannelizedSingle<boolean>>();
  private readonly _subscribeRequestsPending: Map<string, SubscribeContextChannelizedSingle<boolean>> =
    new Map<string, SubscribeContextChannelizedSingle<boolean>>();

  private _suppressedObjects: Subject<SuppressedObjects> = new Subject<SuppressedObjects>();
  private readonly gotDisconnected = false;
  private isSubscribed = false;
  private readonly isFirstInjection = true;
  /**
 * Constructor for the Suppressed-Objects Proxy Service Component.
 *
 * This constructor initializes the service component and establishes a SignalR connection
 * for real-time communication with the server. It relies on the user token retrieved from
 * the authentication service upon successful login. If the user token is available, the
 * SignalR connection is created along with event proxies. Otherwise, if the user token is
 * blank or undefined, the SignalR connection cannot be established.
 *
 * @param {AuthenticationService} authenticationServiceBase - The authentication service responsible for managing user tokens.
 * @param {HubProxyShared} [hubProxyShared] - An optional shared hub proxy for SignalR communication.
 * @param {number} [reconnectTimeout] - An optional timeout duration for reconnecting to the SignalR hub.
 *
 * @returns: An instance of the Suppressed-Objects Proxy Service Component.
 */
  public constructor(
    private readonly traceService: TraceService,
    private readonly httpClient: HttpClient,
    private readonly authenticationServiceBase: AuthenticationServiceBase,
    private readonly wsiEndpointService: WsiEndpointService,
    private readonly signalRService: SignalRService,
    private readonly wsiUtilityService: WsiUtilityService,
    private readonly errorService: ErrorNotificationServiceBase,
    private readonly ngZone: NgZone) {
    super();

    this.signalRService.getNorisHubConnectionStatus().subscribe((isConnected: boolean) => {
      if (isConnected) {
        this.createEventProxies();
        this.hubProxyShared?.hubConnection?.connectionState.subscribe((value: any) =>
          this.onSignalRConnectionState(value));
        const disconnectedObservable: Observable<boolean> | undefined = this.hubProxyShared?.hubConnection?.disconnected;
        if (disconnectedObservable !== undefined) {
          disconnectedObservable.pipe(delay(reconnectTimeout)).subscribe(
            value => this.onSignalRDisconnected(value), error => this.onSignalRDisconnectedError(error));
        }
        this.traceService.info(TraceModules.events, 'Suppressed Objects counter service created.');
      } else {
        this.traceService.info(TraceModules.events, 'Access token for the user is blank, cannot create the signalR connection');
      }
    });
  }

  public notifyConnectionState(): Observable<ConnectionState> {
    return this._notifyConnectionState.asObservable();
  }

  /**
   * Subscribes for all Suppressed Objects of the system.
   *
   * @returns {Observable<void>}
   *
   * @memberOf SuppressedObjectsProxyService
   */
  public subscribeSuppressedObjects(): Observable<boolean> {
    this.traceService.info(TraceModules.events, 'subscribeSuppressedObjects() called.');
    this.isSubscribed = true;
    const headers: HttpHeaders = this.wsiUtilityService.httpPostDefaultHeader(this.authenticationServiceBase.userToken);
    const httpPostProxy: Subject<boolean> = new Subject<boolean>();
    const ctx: SubscribeContextChannelizedSingle<boolean> = new SubscribeContextChannelizedSingle<boolean>(httpPostProxy);

    if (this.hubProxyShared?.hubConnection?.isConnected === false) {
      this._subscribeRequestsPending.set(ctx.id, ctx);
      this.traceService.debug(TraceModules.events,
        'subscribeSuppressedObjects(): ' + noConnectionTrace);
      const connectedSubscription: Subscription = this.hubProxyShared.hubConnection.connected.subscribe(started => {
        if (started === true) {
          this.traceService.debug(TraceModules.events, 'subscribeSuppressedObjects(): connected event triggered; conection is now established.');
          // connection ID is available now, we can setup the "post observable" now and not earlier
          // (=> due to this we cannot use rxjs merge stream functionality such as "concat"!!)
          if (connectedSubscription !== undefined) {
            connectedSubscription.unsubscribe();
          }
          const url: string = this.wsiEndpointService.entryPoint + suppressedObjectsSubscriptionChannelizeUrl + ctx.id + '/'
          + this.hubProxyShared?.connectionId;
          const httpPost: Observable<boolean> = this.httpClient.post(url, '', { headers }).pipe(
            map((response: HttpResponse<any> | any) =>
              this.extractData(response)),
            catchError((response: HttpResponse<any>) =>
              this.wsiUtilityService.handleError(response, TraceModules.events, subscribeSuppressedObjectsTrace, this.errorService)));
          this.traceService.debug(TraceModules.events, 'subscribSuppressedObjects(); http post can be issued now (after connecting)...');
          httpPost.subscribe(value => this.onSubscribeSuppressedObjectsNext(value, httpPostProxy),
            error => this.onSubscribeSuppressedObjectsError(error, ctx, httpPostProxy));
          this._subscribeRequestsInvoked.set(ctx.id, ctx);
          this._subscribeRequestsPending.delete(ctx.id);
        }
      });
      this.hubProxyShared.hubConnection.startHubConnection();
    } else {
      const url: string = this.wsiEndpointService.entryPoint + suppressedObjectsSubscriptionChannelizeUrl + ctx.id + '/' + this.hubProxyShared?.connectionId;
      const httpPost: Observable<boolean> = this.httpClient.post(url, '', { headers }).pipe(
        map((response: HttpResponse<any> | any) =>
          this.extractData(response)),
        catchError((response: HttpResponse<any>) =>
          this.wsiUtilityService.handleError(response, TraceModules.events, subscribeSuppressedObjectsTrace, this.errorService)));
      this.traceService.debug(TraceModules.events, 'subscribeSuppressedObjects(); http post can be issued now (after connecting)...');
      httpPost.subscribe(value => this.onSubscribeSuppressedObjectsNext(value, httpPostProxy),
        error => this.onSubscribeSuppressedObjectsError(error, ctx, httpPostProxy));
      this._subscribeRequestsInvoked.set(ctx.id, ctx);
      this._subscribeRequestsPending.delete(ctx.id);
    }
    return httpPostProxy.asObservable();
  }

  /**
   * Event for the event counter notifications.
   *
   * @returns {Observable<EventCounterList>}
   *
   * @memberOf EventCounterProxyService
   */
  public suppressedObjectsNotification(): Observable<SuppressedObjects> {
    /* if null this one is not called, so no new subject */
    if (this._suppressedObjects === undefined) {
      this._suppressedObjects = new Subject<SuppressedObjects>();
    }
    return this._suppressedObjects.asObservable();
  }

  public unSubscribeSuppressedObjects(): Observable<boolean> {
    this.traceService.info(TraceModules.events, 'unSubscribeSuppressedObjects() called');
    this.isSubscribed = false;
    const headers: HttpHeaders = this.wsiUtilityService.httpDeleteDefaultHeader(this.authenticationServiceBase.userToken);
    const httpPostProxy: Subject<boolean> = new Subject<boolean>();

    if (this.hubProxyShared?.hubConnection?.isConnected === false) {
      this.traceService.debug(TraceModules.events,
        'unSubscribeSuppressedObjects(): ' + noConnectionTrace);
      const connectedSubscription: Subscription = this.hubProxyShared.hubConnection.connected.subscribe(started => {
        if (started === true) {
          this.traceService.debug(TraceModules.events, 'unSubscribeSuppressedObjects(): connected event triggered: connection is now established.');
          // connection ID is available now, we can setup the "post observable" now and not earlier
          // => due to this we cannot use rxjs merge stream functionality such as "concat"!!
          if (connectedSubscription !== undefined) {
            connectedSubscription.unsubscribe();
          }
          this.traceService.debug(TraceModules.events, 'unSubscribeSuppressedObjects(); http delete can be issued (after connecting)...');
          const url: string = this.wsiEndpointService.entryPoint + (suppressedObjectsSubscriptionUrl + this.hubProxyShared?.connectionId);
          const httpPost: Observable<boolean> = this.httpClient.delete(url, { headers, observe: 'response' }).pipe(
            map((response: HttpResponse<any>) =>
              this.wsiUtilityService.extractData(response, TraceModules.events, unsubscribeSuppressedObjectsTrace)),
            catchError((response: HttpResponse<any>) =>
              this.wsiUtilityService.handleError(response, TraceModules.events, unsubscribeSuppressedObjectsTrace, this.errorService)));
          httpPost.subscribe(value => this.onUnsubscribeSuppressedObjectsNext(value, httpPostProxy),
            error => this.onUnsubscribeSuppressedObjectsError(error, httpPostProxy));
        }
      });
      this.hubProxyShared?.hubConnection.startHubConnection();
    } else {
      this.traceService.debug(TraceModules.events, 'unSubscribeSuppressedObjects(); http delete can be issued immediately');
      const url: string = this.wsiEndpointService.entryPoint + (suppressedObjectsSubscriptionUrl + this.hubProxyShared?.connectionId);
      const httpPost: Observable<boolean> = this.httpClient.delete(url, { headers, observe: 'response' }).pipe(
        map((response: HttpResponse<any>) =>
          this.wsiUtilityService.extractData(response, TraceModules.events, unsubscribeSuppressedObjectsTrace)),
        catchError((response: HttpResponse<any>) =>
          this.wsiUtilityService.handleError(response, TraceModules.events, unsubscribeSuppressedObjectsTrace, this.errorService)));
      httpPost.subscribe(value => this.onUnsubscribeSuppressedObjectsNext(value, httpPostProxy),
        error => this.onUnsubscribeSuppressedObjectsError(error, httpPostProxy));
    }
    return httpPostProxy.asObservable();
  }

  private extractData(res: HttpResponse<any>): boolean {
    return true;
  }

  private onSubscribeSuppressedObjectsNext(value: boolean, httpPostProxy: Subject<boolean>): void {
    this.traceService.info(TraceModules.events, 'SuppressedObjectsService.onSubscribeValues() done: success=%s', value);
    // nothing to do if okay! we need to wait of the subscription notification over signalR
  }

  private onSubscribeSuppressedObjectsError(error: any, ctx: SubscribeContextChannelizedSingle<boolean>, httpPostProxy: Subject<boolean>): void {
    this.traceService.warn(TraceModules.events, 'onSubscribeSuppressedObjectsError(); http post returned an error; %s', error);
    this._subscribeRequestsInvoked.delete(ctx.id);
    httpPostProxy.error(error);
  }

  private onUnsubscribeSuppressedObjectsNext(value: boolean, httpPostProxy: Subject<boolean>): void {
    httpPostProxy.next(value);
    httpPostProxy.complete();
  }

  private onUnsubscribeSuppressedObjectsError(error: any, httpPostProxy: Subject<boolean>): void {
    this.traceService.warn(TraceModules.events, 'onUnsubscribeSuppressedObjectsError(); http post returned an error; %s', error);
    httpPostProxy.error(error);
  }

  private createEventProxies(): void {
    this.hubProxyShared = this.signalRService.getNorisHub();
    this.hubProxySuppressedObjectsCounters = new HubProxyEvent<SuppressedObjects>(
      this.traceService, this.hubProxyShared, 'notifySuppressedObjects', this.ngZone, this.signalRService);
    this.hubProxySuppressedObjectsCounters.eventChanged.subscribe(
      values => this.onSuppressedObjectsNotification(values),
      err => this.traceService.error(TraceModules.events,
        'SuppressedObjectsProxyService.onSuppressedObjectsNotification() not able to receive subscription : %s', err.toString()
      ));
    this.hubProxySuppressedObjectsSubs = new HubProxyEvent<SubscriptionWsiSuppressedObjects>(
      this.traceService, this.hubProxyShared, 'notifySubscriptionStatus', this.ngZone, this.signalRService, 'notifySuppressedObjects');
    this.hubProxySuppressedObjectsSubs.eventChanged.subscribe(subscription => this.onNotifySubscriptions(subscription));
  }

  private onSuppressedObjectsNotification(suppressedObjects: SuppressedObjects): void {
    if (this.traceService.isDebugEnabled(TraceModules.eventCounterNotifications)) {
      this.traceService.debug(TraceModules.eventCounterNotifications, 'SuppressedObjectsProxyService:onEventCountersNotification():\n' + suppressedObjects);
    }
    this._suppressedObjects.next(suppressedObjects);
  }

  private onSignalRDisconnectedError(error: any): void {
    this.traceService.error(TraceModules.events, 'SuppressedObjectsProxyService.onSignalRDisconnectedError(): %s', error.toString());
  }

  private onSignalRDisconnected(value: boolean): void {
    if (value === true) {
      if (this.hubProxyShared?.hubConnection?.connectionStateValue === SignalR.ConnectionState.Disconnected) {
        this.traceService.info(TraceModules.events, 'SuppressedObjectsProxyService.onSignalRDisconnected(): starting again the connection');
        this.hubProxyShared.hubConnection.startHubConnection();
      }
    }
  }

  private onSignalRConnectionState(value: SignalR.ConnectionState): void {
    if (value === SignalR.ConnectionState.Disconnected) {
      this._subscribeRequestsInvoked.forEach(ctx => {
        ctx.postSubject.error('Notification channel disconnected.');
      });
      this._subscribeRequestsInvoked.clear();
    }
    this._notifyConnectionState.next(SubscriptionUtility.convert(value));
  }

  private onNotifySubscriptions(subscription: SubscriptionWsiSuppressedObjects): void {
    const foundCtx: SubscribeContextChannelizedSingle<boolean> | undefined = this._subscribeRequestsInvoked.get(subscription.RequestId);
    if (foundCtx != undefined) {
      if (this.traceService.isInfoEnabled!) {
        this.traceService.info(TraceModules.events,
          `SuppressedObjectsProxyService.onNotifySubscriptions():
           context (requestId): %s; errorCode: %s; requestFor: %s; connectionState: %s`,
          foundCtx.id, subscription.ErrorCode, subscription.RequestFor,
          this.hubProxyShared?.hubConnection?.connectionStateValueText);
      }

      const isSucceeded: boolean = subscription.ErrorCode === 0;

      foundCtx.setReply(isSucceeded);
      // reply every single subscription request as the API is Request-MultiReply
      foundCtx.postSubject.next(isSucceeded);
      if (foundCtx.checkAllRepliesDone() === true) {
        if (this.traceService.isDebugEnabled!) {
          this.traceService.debug(TraceModules.events,
            'SuppressedObjectsProxyService.onNotifySubscriptions(), all subscribe notifies retrieved for context (requestId): %s', foundCtx.id);
        }
        foundCtx.postSubject.complete();
        this._subscribeRequestsInvoked.delete(foundCtx.id);
      }
    } else {
      this.traceService.error(TraceModules.events,
        'SuppressedObjectsProxyService.onNotifySubscriptions(), invalid context (requestId): %s, requestFor: %s;',
        subscription.RequestId, subscription.RequestFor);
    }

    if (this.traceService.isDebugEnabled!) {
      this.traceService.debug(TraceModules.events,
        'SuppressedObjectsProxyService.onNotifySubscriptions(), outstanding subscribe notifications on number of subscribe requests: %s',
        this._subscribeRequestsInvoked.size);

      this.traceService.debug(TraceModules.events,
        'SuppressedObjectsProxyService.onNotifySubscriptions(), pending subscribe requests (due to disconnected): %s',
        this._subscribeRequestsPending.size);
    }
  }

}
