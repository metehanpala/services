import { HttpClient, HttpHeaders, HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable, NgZone } from '@angular/core';
import { AuthenticationServiceBase, ErrorNotificationServiceBase, TraceService } from '@gms-flex/services-common';
import { Observable, throwError as observableThrowError, Subject, Subscription } from 'rxjs';
import { catchError, delay, map } from 'rxjs/operators';

import { SubscribeContextChannelized } from '../shared/subscription/subscribe-context-channelized';
import { SubscriptionUtility } from '../shared/subscription/subscription-utility';
import { TraceModules } from '../shared/trace-modules';
import { WsiUtilityService } from '../shared/wsi-utility.service';
import { HubProxyEvent } from '../signalr/hub-proxy-event';
import { HubProxyShared } from '../signalr/hub-proxy-shared';
import { SignalRService } from '../signalr/signalr.service';
import { WsiEndpointService } from '../wsi-endpoint/wsi-endpoint.service';
import { ConnectionState, SubscriptionDeleteWsi } from '../wsi-proxy-api/shared/data.model';
import { SystemBrowserSubscription, SystemBrowserSubscriptionKey } from '../wsi-proxy-api/system-browser/data.model';
import { SystemBrowserSubscriptionProxyServiceBase } from '../wsi-proxy-api/system-browser/system-browser-subscription-proxy.service.base';

const systemBrowserSubscriptionChannelizeUrl = '/api/sr/SystemBrowserSubscriptions/channelize/';
const systemBrowserSubscriptionWithbodyUrl = '/api/sr/SystemBrowserSubscriptions/withbody/';

const reconnectTimeout = 5000;

/**
 * GMS WSI system-browser subscription proxy implementation.
 */
@Injectable({
  providedIn: 'root'
})
export class SystemBrowserSubscriptionProxyService extends SystemBrowserSubscriptionProxyServiceBase {

  public hubProxyShared: HubProxyShared | undefined;
  public hubProxyEventNodeChanges: HubProxyEvent<SystemBrowserSubscription> | undefined;
  public hubProxyEventSubs: HubProxyEvent<SystemBrowserSubscriptionKey> | undefined;

  private readonly _notifyConnectionState: Subject<ConnectionState> = new Subject<ConnectionState>();
  private readonly _subscribeRequestsInvoked: Map<string, SubscribeContextChannelized<SystemBrowserSubscriptionKey>> =
    new Map<string, SubscribeContextChannelized<SystemBrowserSubscriptionKey>>();
  private readonly _subscribeRequestsPending: Map<string, SubscribeContextChannelized<SystemBrowserSubscriptionKey>> =
    new Map<string, SubscribeContextChannelized<SystemBrowserSubscriptionKey>>();
  private readonly _nodeChangeEvents: Subject<SystemBrowserSubscription[]> = new Subject<SystemBrowserSubscription[]>();

  private readonly trMod: string = TraceModules.sysBrowserNotification;

  /**
   * Constructor
   */
  public constructor(
    private readonly traceService: TraceService,
    private readonly httpClient: HttpClient,
    private readonly wsiEndpoint: WsiEndpointService,
    private readonly authenticationServiceBase: AuthenticationServiceBase,
    private readonly signalRService: SignalRService,
    private readonly wsiUtilityService: WsiUtilityService,
    private readonly errorService: ErrorNotificationServiceBase,
    private readonly ngZone: NgZone) {

    super();
    this.signalRService.getNorisHubConnectionStatus().subscribe((isConnected: boolean) => {
      if (isConnected) {
        this.createEventProxies();
        if (this.hubProxyShared) {
          this.hubProxyShared.hubConnection?.connectionState.subscribe((value: any) => this.onSignalRConnectionState(value));
          this.hubProxyShared.hubConnection?.disconnected.pipe(delay(reconnectTimeout)).subscribe(
            value => this.onSignalRDisconnected(value),
            error => this.onSignalRDisconnectedError(error));
          this.traceService.info(this.trMod, 'SystemBrowserSubscriptionProxyService created.');
        }
      } else {
        this.traceService.info(this.trMod, 'NorisHub connection is not established!');
      }
    });
  }

  /**
   * Subscribes the specified designation.
   */
  public subscribeNodeChanges(designation: string): Observable<SystemBrowserSubscriptionKey> | any {

    if (designation == undefined) {
      this.traceService.error(this.trMod, 'SystemBrowserSubscriptionProxyService.subscribeNodeChanges() called with invalid argument!');
      return observableThrowError(new Error('Invalid argument!'));
    }

    this.traceService.info(this.trMod,
      'SystemBrowserSubscriptionProxyService.subscribeNodeChanges() called; designation:%s', designation);

    const headers: HttpHeaders = this.wsiUtilityService.httpPostDefaultHeader(this.authenticationServiceBase.userToken);
    const body: any = JSON.stringify([designation]);

    const httpPostProxy: Subject<SystemBrowserSubscriptionKey[]> = new Subject<SystemBrowserSubscriptionKey[]>();
    const ctx: SubscribeContextChannelized<SystemBrowserSubscriptionKey> =
      new SubscribeContextChannelized<SystemBrowserSubscriptionKey>([designation], httpPostProxy);

    if (this.hubProxyShared?.hubConnection?.isConnected === false) {
      this._subscribeRequestsPending.set(ctx.id, ctx);
      this.traceService.debug(this.trMod,
        `SystemBrowserSubscriptionProxyService.subscribeNodeChanges(): signalr connection not established;
          need to wait (and postpone http calls) until established in order to get connection id.`);
      const connectedSubscription: Subscription = this.hubProxyShared.hubConnection.connected.subscribe(started => {
        if (started === true) {
          this.traceService.debug(this.trMod,
            'SystemBrowserSubscriptionProxyService.subscribeNodeChanges(): connected event triggered: connection is now established.');
          // connection ID is available now, we can setup the "post observable" now and not earlier
          // (=> due to this we cannot use rxjs merge stream functionality such as "concat"!!)
          if (connectedSubscription !== undefined) {
            connectedSubscription.unsubscribe();
          } else {
            this.traceService.error(this.trMod,
              'SystemBrowserSubscriptionProxyService.subscribeNodeChanges(); Implementation error, we should not reach this!');
          }
          const url: string = this.wsiEndpoint.entryPoint + systemBrowserSubscriptionChannelizeUrl + ctx.id + '/' + this.hubProxyShared?.connectionId;
          const httpPost: Observable<boolean> = this.httpClient.post(url, body, { headers }).pipe(
            map((response: HttpResponse<any> | any) => this.extractData(response)),
            catchError((response: HttpResponse<any>) => this.wsiUtilityService.handleError(response, this.trMod,
              'SystemBrowserSubscriptionProxyService.subscribeNodeChanges()', this.errorService)));
          this.traceService.debug(this.trMod,
            'SystemBrowserSubscriptionProxyService.subscribeNodeChanges(); http post can be issued now (after connecting)...');
          httpPost.subscribe(
            value => this.onSubscribeNodeChanges(value, designation, httpPostProxy),
            error => this.onSubscribeNodeChangesError(error, ctx, httpPostProxy));
          this._subscribeRequestsInvoked.set(ctx.id, ctx);
          this._subscribeRequestsPending.delete(ctx.id);
        }
      });
      this.hubProxyShared.hubConnection.startHubConnection();
    } else {
      const url: string = this.wsiEndpoint.entryPoint + systemBrowserSubscriptionChannelizeUrl + ctx.id + '/' + this.hubProxyShared?.connectionId;
      const httpPost: Observable<boolean> = this.httpClient.post(url, body, { headers }).pipe(
        map((response: HttpResponse<any> | any) => this.extractData(response)),
        catchError((response: HttpResponse<any>) => this.wsiUtilityService.handleError(response, this.trMod,
          'SystemBrowserSubscriptionProxyService.subscribeNodeChanges()', this.errorService)));
      this.traceService.debug(this.trMod, 'SystemBrowserSubscriptionProxyService.subscribeNodeChanges(); http post can be issued immediately...');
      httpPost.subscribe(
        value => this.onSubscribeNodeChanges(value, designation, httpPostProxy),
        error => this.onSubscribeNodeChangesError(error, ctx, httpPostProxy));
      this._subscribeRequestsInvoked.set(ctx.id, ctx);
    }

    return httpPostProxy.asObservable().pipe(map(arr => arr != undefined && arr.length > 0 ? arr[0] : undefined));
  }

  /**
   * Event for the node change notifications.
   */
  public nodeChangeNotification(): Observable<SystemBrowserSubscription[]> {
    return this._nodeChangeEvents;
  }

  public notifyConnectionState(): Observable<ConnectionState> {
    return this._notifyConnectionState.asObservable();
  }

  /**
   * Unsubscribes designation (associated with the subscription key).
   */
  public unsubscribeNodeChanges(key: number): Observable<SubscriptionDeleteWsi> {

    this.traceService.info(this.trMod, 'SystemBrowserSubscriptionProxyService.unsubscribeNodeChanges() called; key:%s', key);

    const headers: HttpHeaders = this.wsiUtilityService.httpPostDefaultHeader(this.authenticationServiceBase.userToken);
    const keys: number[] = [key];
    const body: any = JSON.stringify(keys);
    // Initialize Params Object
    const params: HttpParams = new HttpParams();
    // Begin assigning parameters
    // params = params.set("subscriptionKey", keysJson);

    const methodName = 'SystemBrowserSubscriptionProxyService.unsubscribeNodeChanges()';
    const httpPostProxy: Subject<SubscriptionDeleteWsi> = new Subject<SubscriptionDeleteWsi>();
    if (this.hubProxyShared?.hubConnection?.isConnected === false) {
      this.traceService.debug(this.trMod,
        `SystemBrowserSubscriptionProxyService.unsubscribeNodeChanges(): signalr connection not established;
        need to wait (postpone http calls) until established in order to get connection id.`);
      const connectedSubscription: Subscription = this.hubProxyShared.hubConnection.connected.subscribe(started => {
        if (started === true) {
          this.traceService.debug(this.trMod,
            'SystemBrowserSubscriptionProxyService.unsubscribeNodeChanges(): connected event triggered: connection is now established.');
          // connection ID is available now, we can setup the "post observable" now and not earlier
          // => due to this we cannot use rxjs merge stream functionality such as "concat"!!
          if (connectedSubscription !== undefined) {
            connectedSubscription.unsubscribe();
          } else {
            this.traceService.error(this.trMod,
              'SystemBrowserSubscriptionProxyService.unsubscribeNodeChanges(); Implementation error, we should not reach this!');
          }
          this.traceService.debug(this.trMod,
            'SystemBrowserSubscriptionProxyService.unsubscribeNodeChanges(); http delete can be issued (after connecting)...');
          const url: string = this.wsiEndpoint.entryPoint + systemBrowserSubscriptionWithbodyUrl + this.hubProxyShared?.connectionId;
          const httpDelete: Observable<SubscriptionDeleteWsi> =
            this.httpClient.request('DELETE', url, { body, headers, params, observe: 'response' }).pipe(
              map((response: HttpResponse<any>) =>
                this.wsiUtilityService.extractData(response, this.trMod, methodName)),
              catchError((response: HttpResponse<any>) =>
                this.wsiUtilityService.handleError(response, this.trMod, methodName, this.errorService)));
          httpDelete.subscribe(
            value => this.onUnsubscribeNodeChanges(value, key, httpPostProxy),
            error => this.onUnsubscribeNodeChangesError(error, httpPostProxy));
        }
      });
      this.hubProxyShared.hubConnection.startHubConnection();
    } else {
      this.traceService.debug(this.trMod, 'ValueSubscriptionProxyService.unsubscribeNodeChanges(); http delete can be issued immediately');
      const url: string = this.wsiEndpoint.entryPoint + systemBrowserSubscriptionWithbodyUrl + this.hubProxyShared?.connectionId;
      const httpDelete: Observable<SubscriptionDeleteWsi> =
        this.httpClient.request('DELETE', url, { body, headers, params, observe: 'response' }).pipe(
          map((response: HttpResponse<any>) =>
            this.wsiUtilityService.extractData(response, this.trMod, methodName)),
          catchError((response: HttpResponse<any>) =>
            this.wsiUtilityService.handleError(response, this.trMod, methodName, this.errorService)));
      httpDelete.subscribe(
        value => this.onUnsubscribeNodeChanges(value, key, httpPostProxy),
        error => this.onUnsubscribeNodeChangesError(error, httpPostProxy));
    }
    return httpPostProxy.asObservable();
  }

  private extractData(response: HttpResponse<any>): boolean {
    // Note: subscribe call just returns Status Code 200 if okay
    return true;
  }

  private onSubscribeNodeChanges(success: boolean, designation: string, httpPostProxy: Subject<SystemBrowserSubscriptionKey[]>): void {
    this.traceService.info(this.trMod, 'SystemBrowserSubscriptionProxyService.onSubscribeNodeChanges() done: success=%s', success);
    // nothing to do if okay! we need to wait of the subscription notification over signalR
  }

  private onSubscribeNodeChangesError(error: any,
    ctx: SubscribeContextChannelized<SystemBrowserSubscriptionKey>,
    httpPostProxy: Subject<SystemBrowserSubscriptionKey[]>): void {

    this.traceService.warn(this.trMod, 'SystemBrowserSubscriptionProxyService.onSubscribeNodeChangesError(); http post returned not okay; %s', error);
    this._subscribeRequestsInvoked.delete(ctx.id);
    httpPostProxy.error(error);
  }

  private onUnsubscribeNodeChanges(value: SubscriptionDeleteWsi, requestedKey: number, httpPostProxy: Subject<SubscriptionDeleteWsi>): void {

    this.traceService.info(this.trMod, 'SystemBrowserSubscriptionProxyService.onUnsubscribeNodeChanges() done!');

    httpPostProxy.next(value);
    httpPostProxy.complete();
  }

  private onUnsubscribeNodeChangesError(error: any, httpPostProxy: Subject<SubscriptionDeleteWsi>): void {
    this.traceService.warn(this.trMod, 'SystemBrowserSubscriptionProxyService.onUnsubscribeNodeChangesError(); http delete returned an error; %s', error);
    httpPostProxy.error(error);
  }

  private createEventProxies(): void {
    this.hubProxyShared = this.signalRService.getNorisHub();
    this.hubProxyEventNodeChanges = new HubProxyEvent<SystemBrowserSubscription>(
      this.traceService, this.hubProxyShared, 'notifySystemBrowserChanges', this.ngZone, this.signalRService);
    this.hubProxyEventNodeChanges.eventChanged.subscribe(nodeChange => this.onNotifyNodeChange(nodeChange));
    this.hubProxyEventSubs = new HubProxyEvent<SystemBrowserSubscriptionKey>(
      this.traceService, this.hubProxyShared, 'notifySubscriptionStatus', this.ngZone, this.signalRService, 'notifySystemBrowserChanges');
    this.hubProxyEventSubs.eventChanged.subscribe(subscription => this.onNotifySubscriptions(subscription));
  }

  private onSignalRDisconnectedError(error: any): void {
    this.traceService.error(this.trMod, 'SystemBrowserSubscriptionProxyService.onSignalRDisconnectedError(): %s', error.toString());
  }

  private onSignalRDisconnected(value: boolean): void {
    if (value === true) {
      if (this.hubProxyShared?.hubConnection?.connectionStateValue === SignalR.ConnectionState.Disconnected) {
        this.traceService.info(this.trMod, 'SystemBrowserSubscriptionProxyService.onSignalRDisconnected(): starting again the connection');
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

  private onNotifyNodeChange(nodeChange: SystemBrowserSubscription): void {
    if (this.traceService.isDebugEnabled(this.trMod)) {
      this.traceService.debug(this.trMod, 'SystemBrowserSubscriptionProxyService.onNotifyNodeChange() called: view=%s, node=%s, action=%s, change=%s',
        nodeChange.View, nodeChange.Node.Designation, nodeChange.Action, nodeChange.Change);
    }
    this._nodeChangeEvents.next([nodeChange]);
  }

  private onNotifySubscriptions(subscription: SystemBrowserSubscriptionKey): void {
    const foundCtx: SubscribeContextChannelized<SystemBrowserSubscriptionKey> | undefined = this._subscribeRequestsInvoked.get(subscription.RequestId);
    if (foundCtx != undefined) {
      if (this.traceService.isInfoEnabled(this.trMod)) {
        this.traceService.info(this.trMod,
          `SystemBrowserSubscriptionProxyService.onNotifySubscriptions():
           context (requestId): %s; designations: %s; wsiKey: %s; errorCode: %s; requestFor: %s; connectionState: %s`,
          foundCtx.id, subscription.Designations.join(','), subscription.Key, subscription.ErrorCode, subscription.RequestFor,
          this.hubProxyShared?.hubConnection?.connectionStateValueText);
      }
      foundCtx.setReply(subscription.RequestId, subscription);
      // reply every single subscription request as the API is Request-MultiReply
      foundCtx.postSubject.next([subscription]);
      if (foundCtx.checkAllRepliesDone() === true) {
        if (this.traceService.isDebugEnabled!) {
          this.traceService.debug(this.trMod,
            'SystemBrowserSubscriptionProxyService.onNotifySubscriptions(), all subscribe notifies retrieved for context (requestId): %s', foundCtx.id);
        }
        foundCtx.postSubject.complete();
        this._subscribeRequestsInvoked.delete(foundCtx.id);
      }
    } else {
      this.traceService.error(this.trMod,
        'SystemBrowserSubscriptionProxyService.onNotifySubscriptions(), invalid context (requestId): %s, wsiKey: %s',
        subscription.RequestId, subscription.Key);
    }

    if (this.traceService.isDebugEnabled!) {
      this.traceService.debug(this.trMod,
        'SystemBrowserSubscriptionProxyService.onNotifySubscriptions(), outstanding subscribe notifications on number of subscribe requests: %s',
        this._subscribeRequestsInvoked.size);

      this.traceService.debug(this.trMod,
        'SystemBrowserSubscriptionProxyService.onNotifySubscriptions(), pending subscribe requests (due to disconnected): %s',
        this._subscribeRequestsPending.size);
    }
  }
}
