import { HttpClient, HttpHeaders, HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable, NgZone } from '@angular/core';
import {
  AuthenticationServiceBase,
  ErrorNotificationServiceBase,
  isNullOrUndefined,
  TraceService
} from '@gms-flex/services-common';
import {
  Observable,
  of,
  Subject,
  Subscription,
  throwError
} from 'rxjs';
import { catchError, delay, map } from 'rxjs/operators';

import {
  SubscribeContextChannelizedSingle
} from '../shared/subscription/subscribe-context-channelized-single';
import { SubscriptionUtility } from '../shared/subscription/subscription-utility';
import { TraceModules } from '../shared/trace-modules';
import { WsiUtilityService } from '../shared/wsi-utility.service';
import { SignalRService } from '../signalr';
import { HubProxyEvent } from '../signalr/hub-proxy-event';
import { HubProxyShared } from '../signalr/hub-proxy-shared';
import { WsiEndpointService } from '../wsi-endpoint';
import {
  SessionsData,
  SubsWsiSessions
} from '../wsi-proxy-api/sessions';
import {
  SessionsSubscriptionsServiceBase
} from '../wsi-proxy-api/sessions/sessions-subscriptions.service.base';
import { ConnectionState } from '../wsi-proxy-api/shared/data.model';

const sessionsDeleteSubscriptionUrl = '/api/sr/SessionsSubscriptions/';
const sessionsSubscriptionChannelizeUrl = '/api/sr/SessionsSubscriptions/channelize/';
const reconnectTimeout = 5000;

@Injectable({
  providedIn: 'root'
})
export class SessionsSubscriptionsService extends SessionsSubscriptionsServiceBase {
  public hubProxyShared: HubProxyShared | undefined;
  public hubProxySessions: HubProxyEvent<SessionsData> | undefined;
  public hubProxySessionsSubs: HubProxyEvent<SubsWsiSessions> | undefined;

  private readonly _notifyConnectionState: Subject<ConnectionState> = new Subject<ConnectionState>();

  private readonly _subscribeRequestsInvoked: Map<string, SubscribeContextChannelizedSingle<SubsWsiSessions>> =
    new Map<string, SubscribeContextChannelizedSingle<SubsWsiSessions>>();

  private readonly _subscribeRequestsPending: Map<string, SubscribeContextChannelizedSingle<SubsWsiSessions>> =
    new Map<string, SubscribeContextChannelizedSingle<SubsWsiSessions>>();

  private subscriptionKey: any;
  private isSubscribed = false;
  private readonly _sessionsChangeNotification: Subject<SessionsData> = new Subject<SessionsData>();

  public sessionsChangeNotification(): Observable<SessionsData> {
    return this._sessionsChangeNotification.asObservable();
  }

  public constructor(
    private readonly traceService: TraceService,
    private readonly httpClient: HttpClient,
    private readonly signalRService: SignalRService,
    private readonly wsiEndpointService: WsiEndpointService,
    private readonly errorService: ErrorNotificationServiceBase,
    private readonly wsiUtilityService: WsiUtilityService,
    private readonly authenticationServiceBase: AuthenticationServiceBase,
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
        this.traceService.info(TraceModules.sessions, 'SessionsServiceProxy created.');
      } else {
        this.traceService.info(TraceModules.sessions, 'NorisHub connection is not established!');
      }
    });
  }

  public notifyConnectionState(): Observable<ConnectionState> {
    return this._notifyConnectionState.asObservable();
  }

  public subscribeSessions(systemId: number): Observable<any> {
    const methodName = 'SessionsServiceProxy.subscribeSessions(): ';
    this.traceService.info(TraceModules.sessions, `${methodName} called`);

    if (systemId == null) {
      this.traceService.error(TraceModules.sessions, `${methodName} called with invalid arguments!.`);
      return throwError(() => new Error(`${methodName} called with invalid arguments!.`));
    }

    if (this.isSubscribed) {
      this.traceService.debug(TraceModules.sessions, `${methodName} already subscribed`);
      return of(true); 
    }

    // If no pending subscription requests, proceed with making the subscription
    // Create a subject to emit the result of the HTTP POST request
    const httpPostProxy: Subject<SubsWsiSessions> = new Subject<SubsWsiSessions>();

    // Create a context for the subscription
    const ctx: SubscribeContextChannelizedSingle<SubsWsiSessions> = new SubscribeContextChannelizedSingle<SubsWsiSessions>(httpPostProxy);

    // Check if the SignalR connection is not established
    if (this.hubProxyShared?.hubConnection?.isConnected === false) {
      // Handle subscription when connection is not established

      // Add the subscription request to the pending requests
      this._subscribeRequestsPending.set(ctx.id, ctx);

      // Log that the SignalR connection is not established and subscription needs to wait
      this.traceService.debug(TraceModules.sessions, `${methodName} signalr connection not established; 
      need to wait (postpone http calls) until established in order to get connection id.`);

      // Subscribe to the connected event to execute the subscription when connection is established
      const connectedSubscription: Subscription = this.hubProxyShared.hubConnection.connected.subscribe(started => {
        if (started === true) {
          // When connection is established, execute the subscription request
          this.traceService.debug(TraceModules.sessions, `${methodName} connected event triggered; connection is now established.`);

          // Unsubscribe from the connected event as it's no longer needed
          if (connectedSubscription !== undefined) {
            connectedSubscription.unsubscribe();
          }

          // Log that HTTP POST can be issued now as connection is established
          this.traceService.debug(TraceModules.sessions, `${methodName}  HTTP POST can be issued now (connection is finally established)`);

          // Invoke the HTTP POST request for subscription
          this.invokeHttpPostSessionsSubscription(httpPostProxy, ctx, systemId);

          // Add the subscription request to the invoked requests and remove it from pending requests
          this._subscribeRequestsInvoked.set(ctx.id, ctx);
          this._subscribeRequestsPending.delete(ctx.id);
        }
      });

      // Start the SignalR connection
      this.hubProxyShared.hubConnection.startHubConnection();
    } else {
      // Handle subscription when connection is already established
      this.traceService.debug(TraceModules.sessions, `${methodName}  HTTP POST can be issued immediately (connection is already established)`);

      // Invoke the HTTP POST request for subscription
      this.invokeHttpPostSessionsSubscription(httpPostProxy, ctx, systemId);

      // Add the subscription request to the invoked requests
      this._subscribeRequestsInvoked.set(ctx.id, ctx);
    }
    return httpPostProxy.asObservable();
  }

  public unsubscribeSessions(systemId: number, subscriptionKey: number): Observable<any> {
    const methodName = 'SessionsServiceProxy.unsubscribeSessions(): '
    this.traceService.debug(TraceModules.sessions, `${methodName}  called.`);

    if (systemId == null || subscriptionKey == null) {
      this.traceService.error(TraceModules.sessions, `${methodName} called with invalid arguments!.`);
      return throwError(() => new Error(`${methodName} called with invalid arguments!.`));
    }

    const httpDeleteProxy: Subject<any> = new Subject<any>();
    if (this.hubProxyShared?.hubConnection?.isConnected === false) {
      this.traceService.debug(TraceModules.sessions, `${methodName}  
      signalr connection not established; 
      need to wait(postpone http calls) until established in order to get connection id.`);

      const connectedSubscription: Subscription = this.hubProxyShared.hubConnection.connected.subscribe(started => {
        if (started === true) {
          this.traceService.debug(TraceModules.sessions, `${methodName} connected event triggered: connection is now established.`);

          // connection ID is available now, we can setup the "post observable" now and not earlier
          // => due to this we cannot use rxjs merge stream functionality such as "concat"!!
          if (connectedSubscription !== undefined) {
            connectedSubscription.unsubscribe();
          }
          this.traceService.debug(TraceModules.sessions, `${methodName} http delete can be issued now (connection is finally established).`);
          this.invokeHttpDeleteSessionsSubscription(httpDeleteProxy, systemId, subscriptionKey);
        }
      });
      this.hubProxyShared.hubConnection.startHubConnection();
    } else {
      this.traceService.debug(TraceModules.sessions, `${methodName} http delete can be issued immediately (connection is already established).`);
      this.invokeHttpDeleteSessionsSubscription(httpDeleteProxy, systemId, subscriptionKey);
    }
    return httpDeleteProxy.asObservable();
  }

  private invokeHttpPostSessionsSubscription(httpPostProxy: Subject<any>,
    ctx: SubscribeContextChannelizedSingle<SubsWsiSessions>,
    systemId: number): void {
    const methodName = 'SessionsServiceProxy.invokeHttpPostSessionsSubscription()';
    const headers: HttpHeaders = this.wsiUtilityService.httpPostDefaultHeader(this.authenticationServiceBase.userToken);

    // /api/sr/SessionsSubscriptions/channelize/{systemId}/{connectionId}/{requestId}
    const url: string = this.wsiEndpointService.entryPoint
      + sessionsSubscriptionChannelizeUrl
      + systemId
      + '/'
      + this.hubProxyShared?.connectionId
      + '/'
      + ctx.id;

    const httpPost: Observable<any> = this.httpClient.post(url, '', {
      headers,
      observe: 'response'
    })
      .pipe(
        map((response: HttpResponse<any> | any) => {
          if (response) {
            this.isSubscribed = response.status === 200;
            this.wsiUtilityService.extractData(response, TraceModules.sessions, methodName);
          }
          return response;
        }),
        catchError((response: HttpResponse<any>) => {
          this.wsiUtilityService.handleError(response, TraceModules.sessions, methodName, this.errorService);
          return of(response);
        }));

    httpPost.subscribe(value => this.onSubscribeSessionsNext(value, httpPostProxy),
      error => this.onSubscribeSessionsError(error, ctx, httpPostProxy));
  }

  private invokeHttpDeleteSessionsSubscription(httpDeleteProxy: Subject<any>, systemId: number, subscriptionKey?: any): void {
    const methodName = 'SessionsServiceProxy.unsubscribeSessions()';
    const headers: HttpHeaders = this.wsiUtilityService.httpDeleteDefaultHeader(this.authenticationServiceBase.userToken);
    // /api/sr/SessionsSubscriptions/{systemId}/{connectionId}
    const url: string = this.wsiEndpointService.entryPoint + sessionsDeleteSubscriptionUrl + systemId + '/' +
      this.hubProxyShared?.connectionId;
    let params: HttpParams = new HttpParams();
    const key = subscriptionKey ?? this.subscriptionKey;
    if (!isNullOrUndefined(key)) {
      params = params.append('subscriptionKey', key);
    }

    const httpDelete: Observable<any> = this.httpClient.delete(url, { headers, params, observe: 'response' }).pipe(
      map((response: HttpResponse<any>) => {
        if (response) {
          this.isSubscribed = false;
          this.wsiUtilityService.extractData(response, TraceModules.sessions, methodName);
        } else {
          this.traceService.warn(TraceModules.sessions, `${methodName} response = ${response}`);
        }
        return response;
      }),
      catchError((response: HttpResponse<any>) => {
        this.wsiUtilityService.handleError(response, TraceModules.sessions, methodName, this.errorService);
        return of(response);
      }));

    httpDelete.subscribe(value => this.onUnsubscribeSessionsNext(value, httpDeleteProxy),
      error => this.onUnsubscribeSessionsError(error, httpDeleteProxy));
  }

  private createEventProxies(): void {
    this.hubProxyShared = this.signalRService.getNorisHub();

    this.hubProxySessions = new HubProxyEvent<SessionsData>(
      this.traceService, this.hubProxyShared, 'notifySessionChanges', this.ngZone, this.signalRService);

    this.hubProxySessions.eventChanged.subscribe(
      values => this.onNotifySessionsChanges(values),
      err => this.traceService.error(TraceModules.sessions,
        'onNotifySessionsChanges() not able to receive subscription : %s', err.toString()
      ));

    this.hubProxySessionsSubs = new HubProxyEvent<any>(
      this.traceService, this.hubProxyShared, 'notifySubscriptionStatus', this.ngZone, this.signalRService, 'notifySessionChanges');

    this.hubProxySessionsSubs.eventChanged.subscribe(subscription => this.onNotifySubscriptions(subscription));
  }

  private onSignalRDisconnectedError(error: any): void {
    this.traceService.error(TraceModules.sessions, 'SessionsServiceProxy.onSignalRDisconnectedError(): %s', error.toString());
  }

  private onSignalRDisconnected(value: boolean): void {
    if (value === true) {
      if (this.hubProxyShared?.hubConnection?.connectionStateValue === SignalR.ConnectionState.Disconnected) {
        this.traceService.info(TraceModules.sessions, 'SessionsServiceProxy.onSignalRDisconnected(): starting again the connection');
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

  private onNotifySessionsChanges(sessions: SessionsData): void {
    if (this.traceService.isDebugEnabled(TraceModules.sessions)) {
      this.traceService.debug(TraceModules.sessions,
        'SessionsServiceProxy.onNotifySessionsChanges(): Length=%s', sessions?.SessionRepresentations?.length);
    }

    this._sessionsChangeNotification.next(sessions);
  }

  private onSubscribeSessionsNext(value: any, httpPostProxy: Subject<SubsWsiSessions>): void {
    this.traceService.info(TraceModules.sessions, 'SessionsServiceProxy.onSubscribeSessionsNext() done: success=%s', value);
    // nothing to do if okay! we need to wait of the subscription notification over signalR
  }

  private onSubscribeSessionsError(error: any, ctx: SubscribeContextChannelizedSingle<SubsWsiSessions>, httpPostProxy: Subject<SubsWsiSessions>): void {
    this.traceService.warn(TraceModules.sessions, 'SessionsServiceProxy.onSubscribeSessionsError(); http post returned an error; %s', error);
    this._subscribeRequestsInvoked.delete(ctx.id);
    httpPostProxy.error(error);
  }

  private onUnsubscribeSessionsNext(value: any, httpPostProxy: Subject<SubsWsiSessions>): void {
    httpPostProxy.next(value);
    httpPostProxy.complete();
  }

  private onUnsubscribeSessionsError(error: any, httpPostProxy: Subject<SubsWsiSessions>): void {
    this.traceService.warn(TraceModules.sessions, 'SessionsServiceProxy.onUnsubscribeSessionsError(); http post returned an error; %s', error);
    httpPostProxy.error(error);
  }

  private onNotifySubscriptions(subscription: any): void {
    const methodName = 'SessionsServiceProxy.onNotifySubscriptions(): ';
    const foundCtx: SubscribeContextChannelizedSingle<SubsWsiSessions> | undefined = this._subscribeRequestsInvoked.get(subscription.RequestId);

    this.subscriptionKey = subscription?.Key;
    if (foundCtx != undefined) {
      if (this.traceService.isInfoEnabled!) {
        this.traceService.info(TraceModules.sessions,
          `${methodName}  context= ${foundCtx.id} 
          | errorCode= ${subscription.ErrorCode} 
          | requestFor= ${subscription.RequestFor} 
          | connectionState= ${ this.hubProxyShared?.hubConnection?.connectionStateValueText}`);
      }

      foundCtx.setReply(subscription);
      // reply every single subscription request as the API is Request-MultiReply
      foundCtx.postSubject.next(subscription);
      if (foundCtx.checkAllRepliesDone() === true) {
        if (this.traceService.isDebugEnabled!) {
          this.traceService.debug(TraceModules.sessions, `${methodName} all subscribe notifies retrieved for context (requestId)= ${foundCtx.id}`);
        }
        foundCtx.postSubject.complete();
        this._subscribeRequestsInvoked.delete(foundCtx.id);
      }
    } else {
      this.traceService.error(TraceModules.sessions,
        `${methodName} invalid context (requestId)= ${ subscription.RequestId} | requestFor= ${subscription.RequestFor}`);
    }

    if (this.traceService.isDebugEnabled!) {
      this.traceService.debug(TraceModules.sessions,
        `${methodName} Outstanding subscribe notifications= ${ this._subscribeRequestsInvoked.size} | Pending= ${this._subscribeRequestsPending.size}`);
    }
  }
}