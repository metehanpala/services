import { HttpClient, HttpErrorResponse, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Injectable, NgZone } from '@angular/core';
import { AuthenticationServiceBase, ErrorNotificationServiceBase, TraceService } from '@gms-flex/services-common';
import { Observable, of, Subject, Subscription } from 'rxjs';
import { catchError, delay, map } from 'rxjs/operators';

import { SubscribeContextChannelizedSingle } from '../shared/subscription/subscribe-context-channelized-single';
import { SubscriptionUtility } from '../shared/subscription/subscription-utility';
import { TraceModules } from '../shared/trace-modules';
import { WsiUtilityService } from '../shared/wsi-utility.service';
import { HubProxyEvent } from '../signalr/hub-proxy-event';
import { HubProxyShared } from '../signalr/hub-proxy-shared';
import { SignalRService } from '../signalr/signalr.service';
import { WsiEndpointService } from '../wsi-endpoint/wsi-endpoint.service';
import { ConnectionState } from '../wsi-proxy-api/shared/data.model';
import { LanguageInfo, SubscriptionWsiSystems, SystemInfo, SystemsResponseObject } from '../wsi-proxy-api/systems/data.model';
import { SystemsProxyServiceBase } from '../wsi-proxy-api/systems/systems-proxy.service.base';

const systemsUrl = '/api/systems';
const systemsLocalUrl = '/api/systems/local';
const systemLanguagesUrl = '/api/systems/languages';
const systemsSubscriptionUrl = '/api/sr/systemssubscriptions/';
const systemsSubscriptionChannelizeUrl = '/api/sr/systemssubscriptions/channelize/';

const reconnectTimeout = 5000;

/**
 * Systems service
 */
@Injectable({
  providedIn: 'root'
})
export class SystemsProxyService implements SystemsProxyServiceBase {

  public hubProxyShared: HubProxyShared | undefined;
  public hubProxySystems: HubProxyEvent<SystemInfo[]> | undefined;
  public hubProxySystemsSubs: HubProxyEvent<SubscriptionWsiSystems> | undefined;

  private readonly _notifyConnectionState: Subject<ConnectionState> = new Subject<ConnectionState>();
  private readonly _subscribeRequestsInvoked: Map<string, SubscribeContextChannelizedSingle<boolean>> =
    new Map<string, SubscribeContextChannelizedSingle<boolean>>();
  private readonly _subscribeRequestsPending: Map<string, SubscribeContextChannelizedSingle<boolean>> =
    new Map<string, SubscribeContextChannelizedSingle<boolean>>();

  private readonly _systemsEvents: Subject<SystemInfo[]> = new Subject<SystemInfo[]>();

  public constructor(
    private readonly traceService: TraceService,
    private readonly httpClient: HttpClient,
    private readonly signalRService: SignalRService,
    private readonly wsiEndpointService: WsiEndpointService,
    private readonly errorService: ErrorNotificationServiceBase,
    private readonly wsiUtilityService: WsiUtilityService,
    private readonly authenticationServiceBase: AuthenticationServiceBase,
    private readonly ngZone: NgZone) {
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
        this.traceService.info(TraceModules.systems, 'SystemsProxyService created.');
      } else {
        this.traceService.info(TraceModules.systems, 'NorisHub connection is not established!');
      }
    });
  }

  public notifyConnectionState(): Observable<ConnectionState> {
    return this._notifyConnectionState.asObservable();
  }

  /**
   * Gets all systems including languages installed and distributed/local system info.
   * See also WSI API specification.
   */
  public getSystemsExt(): Observable<SystemsResponseObject> {
    return this.getSystemsResponseObject().pipe(map((sro: SystemsResponseObject) => {
      return sro;
    }),
    catchError((error: HttpResponse<any>) =>
      this.wsiUtilityService.handleError(error, TraceModules.systems, 'getSystemsExt()', this.errorService)));
  }

  /**
   * Gets a list of all systems with languages installed in the system.
   * See also WSI API specification.
   *
   * @returns An observable with an array of {SystemInfo } objects.
   * @member SystemsService
   */
  public getSystems(): Observable<SystemInfo[]> {
    return this.getSystemsResponseObject().pipe(map((sro: SystemsResponseObject) => {
      return sro.Systems;
    }),
    catchError((error: HttpResponse<any>) =>
      this.wsiUtilityService.handleError(error, TraceModules.systems, 'getSystems()', this.errorService)));
  }

  /**
   * Provides the system information specific to systemId with language information as well
   * See also WSI API specification.
   *
   * @param systemId
   * @returns Observable of SystemInfo
   */
  public getSystem(systemId: any): Observable<SystemInfo> {
    return this.getSystemResponseObjectViaId(systemId).pipe(map((sro: SystemsResponseObject) => {
      return sro.Systems[0]; // even calling GET /api/systems/{systemid}, it retung ALWAYS an Array
    }),
    catchError((error: HttpResponse<any>) =>
      this.wsiUtilityService.handleError(error, TraceModules.systems, 'getSystem()', this.errorService)));
  }

  /**
   * Get the local system information.
   */
  public getSystemLocal(): Observable<SystemInfo> {
    return this.getSystemsLocalResponseObject().pipe(map((sro: SystemsResponseObject) => {
      return sro.Systems[0];
    }),
    catchError((error: HttpResponse<any>) =>
      this.wsiUtilityService.handleError(error, TraceModules.systems, 'getSystemLocal()', this.errorService)));
  }

  /**
   * Get the system languages information.
   */
  public getSystemLanguages(): Observable<LanguageInfo[]> {
    return this.getSystemsLanguagesResponseObject().pipe(map((sro: LanguageInfo[]) => {
      return sro;
    }),
    catchError((error: HttpResponse<any>) =>
      this.wsiUtilityService.handleError(error, TraceModules.systems, 'getSystemLanguages()', this.errorService)));
  }

  /**
   * Subscribes to systems.
   *
   * @returns An observable indicating the success of the subscription.
   */
  public subscribeSystems(): Observable<boolean> {
    this.traceService.info(TraceModules.systems, 'SystemsProxyService.subscribeSystems() called.');

    // Check if there are already pending subscription requests
    if (this._subscribeRequestsInvoked.size > 0) {
      // If there are pending subscription requests, log a warning and return an observable indicating success
      this.traceService.warn(TraceModules.systems, 'SystemsProxyService.subscribeSystems(): subscription was already made.');
      return of(true); // Return an observable immediately indicating success
    }

    // If no pending subscription requests, proceed with making the subscription
    // Create a subject to emit the result of the HTTP POST request
    const httpPostProxy: Subject<boolean> = new Subject<boolean>();

    // Create a context for the subscription
    const ctx: SubscribeContextChannelizedSingle<boolean> = new SubscribeContextChannelizedSingle<boolean>(httpPostProxy);

    // Check if the SignalR connection is not established
    if (this.hubProxyShared?.hubConnection?.isConnected === false) {
      // Handle subscription when connection is not established

      // Add the subscription request to the pending requests
      this._subscribeRequestsPending.set(ctx.id, ctx);

      // Log that the SignalR connection is not established and subscription needs to wait
      this.traceService.debug(TraceModules.systems, 'SystemsProxyService.subscribeSystems(): signalr connection not established; ' +
        'need to wait (postpone http calls) until established in order to get connection id.');

      // Subscribe to the connected event to execute the subscription when connection is established
      const connectedSubscription: Subscription = this.hubProxyShared.hubConnection.connected.subscribe(started => {
        if (started === true) {
          // When connection is established, execute the subscription request
          this.traceService.debug(TraceModules.systems,
            'SystemsProxyService.subscribeSystems(): connected event triggered; connection is now established.');

          // Unsubscribe from the connected event as it's no longer needed
          if (connectedSubscription !== undefined) {
            connectedSubscription.unsubscribe();
          }

          // Log that HTTP POST can be issued now as connection is established
          this.traceService.debug(TraceModules.systems,
            'SystemsProxyService.subscribeSystems(); HTTP POST can be issued now (connection is finally established)');

          // Invoke the HTTP POST request for subscription
          this.invokeHttpPostSystemsSubscription(httpPostProxy, ctx);

          // Add the subscription request to the invoked requests and remove it from pending requests
          this._subscribeRequestsInvoked.set(ctx.id, ctx);
          this._subscribeRequestsPending.delete(ctx.id);
        }
      });

      // Start the SignalR connection
      this.hubProxyShared.hubConnection.startHubConnection();
    } else {
      // Handle subscription when connection is already established
      this.traceService.debug(TraceModules.systems,
        'SystemsProxyService.subscribeSystems(); HTTP POST can be issued immediately (connection is already established)');

      // Invoke the HTTP POST request for subscription
      this.invokeHttpPostSystemsSubscription(httpPostProxy, ctx);

      // Add the subscription request to the invoked requests
      this._subscribeRequestsInvoked.set(ctx.id, ctx);
    }
    return httpPostProxy.asObservable();
  }

  public unSubscribeSystems(): Observable<boolean> {
    this.traceService.info(TraceModules.systems, 'SystemsProxyService.unSubscribeSystems() called');

    const httpDeleteProxy: Subject<boolean> = new Subject<boolean>();
    if (this.hubProxyShared?.hubConnection?.isConnected === false) {
      this.traceService.debug(TraceModules.systems,
        'unSubscribeSystems(): signalr connection not established; need to wait ' +
                '(postpone http calls) until established in order to get connection id.');
      const connectedSubscription: Subscription = this.hubProxyShared.hubConnection.connected.subscribe(started => {
        if (started === true) {
          this.traceService.debug(TraceModules.systems, 'unSubscribeSystems(): connected event triggered: connection is now established.');
          // connection ID is available now, we can setup the "post observable" now and not earlier
          // => due to this we cannot use rxjs merge stream functionality such as "concat"!!
          if (connectedSubscription !== undefined) {
            connectedSubscription.unsubscribe();
          }
          this.traceService.debug(TraceModules.systems, 'unSubscribeSystems(); http delete can be issued now (connection is finally established)');
          this.invokeHttpDeleteSystemsSubscription(httpDeleteProxy);
        }
      });
      this.hubProxyShared.hubConnection.startHubConnection();
    } else {
      this.traceService.debug(TraceModules.systems,
        'SystemsProxyService.unSubscribeSystems(); http delete can be issued immediately (connection is already established)');
      this.invokeHttpDeleteSystemsSubscription(httpDeleteProxy);
    }
    return httpDeleteProxy.asObservable();
  }

  public systemsNotification(): Observable<SystemInfo[]> {
    return this._systemsEvents.asObservable();
  }

  private invokeHttpPostSystemsSubscription(httpPostProxy: Subject<boolean>, ctx: SubscribeContextChannelizedSingle<boolean>): void {
    const methodName = 'SystemsProxyService.subscribeSystems()';
    const headers: HttpHeaders = this.wsiUtilityService.httpPostDefaultHeader(this.authenticationServiceBase.userToken);
    const url: string = this.wsiEndpointService.entryPoint + systemsSubscriptionChannelizeUrl + ctx.id + '/' + this.hubProxyShared?.connectionId;

    const httpPost: Observable<boolean> = this.httpClient.post(url, '', { headers }).pipe(
      map((response: HttpResponse<any> | any) => this.extractData(response)),
      catchError((response: HttpResponse<any>) =>
        this.wsiUtilityService.handleError(response, TraceModules.systems, methodName, this.errorService)));
    httpPost.subscribe(value => this.onSubscribeSystemsNext(value, httpPostProxy),
      error => this.onSubscribeSystemsError(error, ctx, httpPostProxy));
  }

  private invokeHttpDeleteSystemsSubscription(httpDeleteProxy: Subject<boolean>): void {
    const methodName = 'SystemsProxyService.unSubscribeSystems()';
    const headers: HttpHeaders = this.wsiUtilityService.httpDeleteDefaultHeader(this.authenticationServiceBase.userToken);

    const url: string = this.wsiEndpointService.entryPoint + (systemsSubscriptionUrl + this.hubProxyShared?.connectionId);
    const httpDelete: Observable<boolean> = this.httpClient.delete(url, { headers, observe: 'response' }).pipe(
      map((response: HttpResponse<any>) =>
        this.wsiUtilityService.extractData(response, TraceModules.systems, methodName)),
      catchError((response: HttpResponse<any>) =>
        this.wsiUtilityService.handleError(response, TraceModules.systems, methodName, this.errorService)));
    httpDelete.subscribe(value => this.onUnsubscribeSystemsNext(value, httpDeleteProxy),
      error => this.onUnsubscribeSystemsError(error, httpDeleteProxy));
  }

  /**
   * Retrieve WSI systems and languages via WSI API
   */
  private getSystemsResponseObject(): Observable<SystemsResponseObject> {
    const headers: HttpHeaders = this.wsiUtilityService.httpGetDefaultHeader(this.authenticationServiceBase.userToken);
    const url: string = this.wsiEndpointService.entryPoint + systemsUrl;
    return this.httpClient.get(url, { headers, observe: 'response' }).pipe(
      map((response: HttpResponse<any>) =>
        this.wsiUtilityService.extractData(response, TraceModules.systems, 'getSystemsResponseObjects()')),
      catchError((response: HttpErrorResponse) =>
        this.wsiUtilityService.handleError(response, TraceModules.systems, 'getSystemsResponseObjects()', this.errorService)));
  }

  /**
   * Retrieve information of a specific systems via WSI API
   */
  private getSystemResponseObjectViaId(systemId: number): Observable<SystemsResponseObject> {
    const headers: HttpHeaders = this.wsiUtilityService.httpGetDefaultHeader(this.authenticationServiceBase.userToken);
    let url: string = this.wsiEndpointService.entryPoint + systemsUrl;
    url = url + '/' + systemId;
    return this.httpClient.get(url, { headers, observe: 'response' }).pipe(
      map((response: HttpResponse<any>) =>
        this.wsiUtilityService.extractData(response, TraceModules.systems, 'getSystemResponseObjectViaId()')),
      catchError((response: HttpErrorResponse) =>
        this.wsiUtilityService.handleError(response, TraceModules.systems, 'getSystemResponseObjectViaId()', this.errorService)));
  }

  /**
   * Retrieve WSI system and language info for local system
   */
  private getSystemsLocalResponseObject(): Observable<SystemsResponseObject> {
    const headers: HttpHeaders = this.wsiUtilityService.httpGetDefaultHeader(this.authenticationServiceBase.userToken);
    const url: string = this.wsiEndpointService.entryPoint + systemsLocalUrl;
    return this.httpClient.get(url, { headers, observe: 'response' }).pipe(
      map((response: HttpResponse<any>) =>
        this.wsiUtilityService.extractData(response, TraceModules.systems, 'getSystemsLocalResponseObject()')),
      catchError((response: HttpErrorResponse) =>
        this.wsiUtilityService.handleError(response, TraceModules.systems, 'getSystemsLocalResponseObject()', this.errorService)));
  }

  /**
   * Retrieve WSI system and language info for system languages
   */
  private getSystemsLanguagesResponseObject(): Observable<LanguageInfo[]> {
    const headers: HttpHeaders = this.wsiUtilityService.httpGetDefaultHeader(this.authenticationServiceBase.userToken);
    const url: string = this.wsiEndpointService.entryPoint + systemLanguagesUrl;
    return this.httpClient.get(url, { headers, observe: 'response' }).pipe(
      map((response: HttpResponse<any>) =>
        this.wsiUtilityService.extractData(response, TraceModules.systems, 'getSystemsLanguagesResponseObject()')),
      catchError((response: HttpErrorResponse) =>
        this.wsiUtilityService.handleError(response, TraceModules.systems, 'getSystemsLanguagesResponseObject()', this.errorService)));
  }

  private createEventProxies(): void {
    this.hubProxyShared = this.signalRService.getNorisHub();
    this.hubProxySystems = new HubProxyEvent<SystemInfo[]>(
      this.traceService, this.hubProxyShared, 'notifySystems', this.ngZone, this.signalRService);
    this.hubProxySystems.eventChanged.subscribe(values => this.onSystemsNotification(values));
    this.hubProxySystemsSubs = new HubProxyEvent<SubscriptionWsiSystems>(
      this.traceService, this.hubProxyShared, 'notifySubscriptionStatus', this.ngZone, this.signalRService, 'notifySystems');
    this.hubProxySystemsSubs.eventChanged.subscribe(subscription => this.onNotifySubscriptions(subscription));
  }

  private onSignalRDisconnectedError(error: any): void {
    this.traceService.error(TraceModules.systems, 'SystemsProxyService.onSignalRDisconnectedError(): %s', error.toString());
  }

  private onSignalRDisconnected(value: boolean): void {
    if (value === true) {
      if (this.hubProxyShared?.hubConnection?.connectionStateValue === SignalR.ConnectionState.Disconnected) {
        this.traceService.info(TraceModules.systems, 'SystemsProxyService.onSignalRDisconnected(): starting again the connection');
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

  private onSystemsNotification(systemsInfo: SystemInfo[]): void {
    if (this.traceService.isDebugEnabled(TraceModules.systemsNotification)) {
      this.traceService.debug(TraceModules.systemsNotification,
        'SystemsProxyService.onSystemsNotification(): Main Name=%s', systemsInfo[0].Name);
    }
    this._systemsEvents.next(systemsInfo);
  }

  private onSubscribeSystemsNext(value: boolean, httpPostProxy: Subject<boolean>): void {
    this.traceService.info(TraceModules.systems, 'SystemsProxyService.onSubscribeValues() done: success=%s', value);
    // nothing to do if okay! we need to wait of the subscription notification over signalR
  }

  private onSubscribeSystemsError(error: any, ctx: SubscribeContextChannelizedSingle<boolean>, httpPostProxy: Subject<boolean>): void {
    this.traceService.warn(TraceModules.systems, 'SystemsProxyService.onSubscribeSystemsError(); http post returned an error; %s', error);
    this._subscribeRequestsInvoked.delete(ctx.id);
    httpPostProxy.error(error);
  }

  private onUnsubscribeSystemsNext(value: boolean, httpPostProxy: Subject<boolean>): void {
    httpPostProxy.next(value);
    httpPostProxy.complete();
  }

  private onUnsubscribeSystemsError(error: any, httpPostProxy: Subject<boolean>): void {
    this.traceService.warn(TraceModules.systems, 'SystemsProxyService.onUnsubscribeSystemsError(); http post returned an error; %s', error);
    httpPostProxy.error(error);
  }

  private extractData(response: HttpResponse<any>): boolean {
    // Note: subscribe call just returns Status Code 200 if okay
    return true;
  }

  private onNotifySubscriptions(subscription: SubscriptionWsiSystems): void {
    const foundCtx: SubscribeContextChannelizedSingle<boolean> | undefined = this._subscribeRequestsInvoked.get(subscription.RequestId);
    if (foundCtx != undefined) {
      if (this.traceService.isInfoEnabled!) {
        this.traceService.info(TraceModules.systems,
          `SystemsProxyService.onNotifySubscriptions():
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
          this.traceService.debug(TraceModules.systems,
            'SystemsProxyService.onNotifySubscriptions(), all subscribe notifies retrieved for context (requestId): %s', foundCtx.id);
        }
        foundCtx.postSubject.complete();
        this._subscribeRequestsInvoked.delete(foundCtx.id);
      }
    } else {
      this.traceService.error(TraceModules.systems,
        'SystemsProxyService.onNotifySubscriptions(), invalid context (requestId): %s, requestFor: %s;',
        subscription.RequestId, subscription.RequestFor);
    }

    if (this.traceService.isDebugEnabled!) {
      this.traceService.debug(TraceModules.systems,
        'SystemsProxyService.onNotifySubscriptions(), outstanding subscribe notifications on number of subscribe requests: %s',
        this._subscribeRequestsInvoked.size);

      this.traceService.debug(TraceModules.systems,
        'SystemsProxyService.onNotifySubscriptions(), pending subscribe requests (due to disconnected): %s',
        this._subscribeRequestsPending.size);
    }
  }
}
