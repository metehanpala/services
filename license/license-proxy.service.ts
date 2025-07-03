import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable, NgZone } from '@angular/core';
import { AuthenticationServiceBase, ErrorNotificationServiceBase, isNullOrUndefined, TraceService } from '@gms-flex/services-common';
import { Observable, of, Subject, Subscription } from 'rxjs';
import { catchError, delay, map } from 'rxjs/operators';

import { SubscribeContextChannelizedSingle } from '../shared/subscription/subscribe-context-channelized-single';
import { SubscriptionUtility } from '../shared/subscription/subscription-utility';
import { TraceModules } from '../shared/trace-modules';
import { WsiUtilityService } from '../shared/wsi-utility.service';
import { HubProxyEvent } from '../signalr/hub-proxy-event';
import { HubProxyShared } from '../signalr/hub-proxy-shared';
import { SignalRService } from '../signalr/signalr.service';
import { ValueServiceBase } from '../values/value.service.base';
import { WsiEndpointService } from '../wsi-endpoint/wsi-endpoint.service';
import { FilesServiceBase } from '../wsi-proxy-api/files/files.service.base';
import { LicenseWsi } from '../wsi-proxy-api/license/data.model';
import { LicenseProxyServiceBase } from '../wsi-proxy-api/license/license-proxy.service.base';
import { ValueDetails } from '../wsi-proxy-api/shared';
import { ConnectionState } from '../wsi-proxy-api/shared/data.model';
import { License, SubscriptionLicense } from './data.model';

const licenseChannelizeUrl = '/api/sr/licensessubscriptions/channelize/';
const licenseUrl = '/api/sr/licensessubscriptions/';
const serverOffsetUrl = '/api/diagnostics';
const noConnectionTrace = 'signalr connection not established; need to wait (postpone http calls) until established in order to get connection id.';
const unSubscribeEventsTrace = 'LicenseService.unSubscribeEvents()';
const postCommand2EventsTrace = 'LicenseService.postCommand2Events()';

const reconnectTimeout = 5000;

@Injectable({
  providedIn: 'root'
})
export class LicenseProxyService extends LicenseProxyServiceBase {

  public hubProxyShared: HubProxyShared | undefined;
  public hubProxyEventEvents: HubProxyEvent<LicenseWsi> | undefined;
  public hubProxyEventSubs: HubProxyEvent<SubscriptionLicense> | undefined;

  private readonly _notifyConnectionState: Subject<ConnectionState> = new Subject<ConnectionState>();
  private readonly _subscribeRequestsInvoked: Map<string, SubscribeContextChannelizedSingle<boolean>> =
    new Map<string, SubscribeContextChannelizedSingle<boolean>>();
  private readonly _subscribeRequestsPending: Map<string, SubscribeContextChannelizedSingle<boolean>> =
    new Map<string, SubscribeContextChannelizedSingle<boolean>>();

  private readonly _license: Subject<LicenseWsi> = new Subject<LicenseWsi>();

  /**
     *
     *
     * This service extends LicenseProxyServiceBase and provides functionality for managing licenses
     * through a SignalR connection. It handles subscription and unsubscription of license events
     * and notifies subscribers about the connection state and license notifications.
     *
     * @param {TraceService} traceService - The service for tracing and logging.
     * @param {HttpClient} httpClient - The HTTP client for making API requests.
     * @param {AuthenticationServiceBase} authenticationServiceBase - The authentication service for managing user tokens.
     * @param {WsiEndpointService} wsiEndpointService - The service for managing WSI endpoints.
     * @param {WsiUtilityService} wsiUtilityService - The utility service for WSI-related operations.
     * @param {SignalRService} signalRService - The service for managing SignalR connections.
     * @param {NgZone} ngZone - The Angular zone service for handling asynchronous tasks.
     * @param {ErrorNotificationServiceBase} errorService - The service for handling error notifications.
     *
     * @returns {LicenseProxyService} An instance of LicenseProxyService.
  */
  public constructor(
    private readonly traceService: TraceService,
    private readonly httpClient: HttpClient,
    private readonly authenticationServiceBase: AuthenticationServiceBase,
    private readonly wsiEndpointService: WsiEndpointService,
    private readonly wsiUtilityService: WsiUtilityService,
    private readonly signalRService: SignalRService,
    private readonly ngZone: NgZone,
    private readonly errorService: ErrorNotificationServiceBase) {
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
        this.traceService.info(TraceModules.license, 'Service created.');
      } else {
        this.traceService.info(TraceModules.license, 'NorisHub connection is not established!');
      }
    });
  }

  /**
     * Returns an observable for the connection state.
     * @returns {Observable<ConnectionState>} An observable emitting the connection state.
     */
  public notifyConnectionState(): Observable<ConnectionState> {
    return this._notifyConnectionState.asObservable();
  }

  /**
   * Returns an observable for license notifications.
   * @returns {Observable<LicenseWsi>} An observable emitting license notifications.
   */
  public licenseNotification(): Observable<LicenseWsi> {
    return this._license.asObservable();
  }

  /**
  * Unsubscribes from license events.
  * @returns {Observable<boolean>} An observable emitting the result of the unsubscription.
  */
  public unsubscribeLicense(): Observable<boolean> {
    this.traceService.info(TraceModules.license, 'LicenseService.unSubscribeEvents() called');

    const headers: HttpHeaders = this.wsiUtilityService.httpDeleteDefaultHeader(this.authenticationServiceBase.userToken);
    const httpPostProxy: Subject<boolean> = new Subject<boolean>();

    if (this.hubProxyShared?.hubConnection?.isConnected === false) {
      this.traceService.debug(TraceModules.license,
        'LicenseService.unSubscribeEventCounters(): ' + noConnectionTrace);
      const connectedSubscription: Subscription = this.hubProxyShared?.hubConnection.connected.subscribe(started => {
        if (started === true) {
          this.traceService.debug(TraceModules.license,
            'LicenseService.unSubscribeEventCounters(): connected event triggered: connection is now established.');
          // connection ID is available now, we can setup the "post observable" now and not earlier
          // => due to this we cannot use rxjs merge stream functionality such as "concat"!!
          if (connectedSubscription !== undefined) {
            connectedSubscription.unsubscribe();
          } else {
            this.traceService.error(TraceModules.license, 'LicenseService.unSubscribeEventCounters(); Implementation error, we should not reach this!');
          }
          this.traceService.debug(TraceModules.license, 'LicenseService.unSubscribeEventCounters(); http delete can be issued (after connecting)...');
          const url: string = this.wsiEndpointService.entryPoint + licenseUrl + this.hubProxyShared?.connectionId;
          const httpPost: Observable<boolean> = this.httpClient.delete(url, { headers, observe: 'response' }).pipe(
            map((response: HttpResponse<any>) =>
              this.wsiUtilityService.extractData(response, TraceModules.license, unSubscribeEventsTrace)),
            catchError((response: HttpResponse<any>) => this.wsiUtilityService.handleError(response, TraceModules.license,
              unSubscribeEventsTrace, this.errorService)));
          httpPost.subscribe(value => this.onUnsubscribeLicenseNext(value, httpPostProxy),
            error => this.onUnsubscribeLicenseError(error, httpPostProxy));
        }
      });
      this.hubProxyShared?.hubConnection.startHubConnection();
    } else {
      this.traceService.debug(TraceModules.license, 'LicenseService.unSubscribeEventCounters(); http delete can be issued immediately');
      const url: string = this.wsiEndpointService.entryPoint + licenseUrl + this.hubProxyShared?.connectionId;
      const httpPost: Observable<boolean> = this.httpClient.delete(url, { headers, observe: 'response' }).pipe(
        map((response: HttpResponse<any>) =>
          this.wsiUtilityService.extractData(response, TraceModules.license, unSubscribeEventsTrace)),
        catchError((response: HttpResponse<any>) =>
          this.wsiUtilityService.handleError(response, TraceModules.license, unSubscribeEventsTrace, this.errorService)));
      httpPost.subscribe(value => this.onUnsubscribeLicenseNext(value, httpPostProxy),
        error => this.onUnsubscribeLicenseError(error, httpPostProxy));
    }
    return httpPostProxy.asObservable();
  }

  /**
    * Subscribes to license events.
    * @returns {Observable<boolean>} An observable emitting the result of the subscription.
    */
  public subscribeLicense(): Observable<boolean> {
    this.traceService.info(TraceModules.license, 'LicenseService.subscribeEvents() called.');

    const headers: HttpHeaders = this.wsiUtilityService.httpPostDefaultHeader(this.authenticationServiceBase.userToken);
    const httpPostProxy: Subject<boolean> = new Subject<boolean>();
    const ctx: SubscribeContextChannelizedSingle<boolean> = new SubscribeContextChannelizedSingle<boolean>(httpPostProxy);

    if (this.hubProxyShared?.hubConnection?.isConnected === false) {
      this._subscribeRequestsPending.set(ctx.id, ctx);
      this.traceService.debug(TraceModules.license,
        'LicenseService.subscribeEvents(): ' + noConnectionTrace);
      const connectedSubscription: Subscription = this.hubProxyShared?.hubConnection.connected.subscribe(started => {
        if (started === true) {
          this.traceService.debug(TraceModules.license, 'LicenseService.subscribeEvents(): connected event triggered; connection is now established.');
          // connection ID is available now, we can setup the "post observable" now and not earlier
          // (=> due to this we cannot use rxjs merge stream functionality such as "concat"!!)
          if (connectedSubscription !== undefined) {
            connectedSubscription.unsubscribe();
          } else {
            this.traceService.error(TraceModules.license, 'LicenseService.subscribeEvents(); Implementation error, we should not reach this!');
          }
          const url: string = this.wsiEndpointService.entryPoint + licenseChannelizeUrl + ctx.id + '/' + this.hubProxyShared?.connectionId;
          const httpPost: Observable<boolean> = this.httpClient.post(url, '', { headers }).pipe(
            map((response: HttpResponse<any> | any) => this.extractData(response)),
            catchError((response: HttpResponse<any>) =>
              this.wsiUtilityService.handleError(response, TraceModules.license, 'subscribeEvents()', this.errorService)));
          this.traceService.debug(TraceModules.license, 'LicenseService.subscribeEvents(); http post can be issued now (after connecting)...');
          httpPost.subscribe(value => this.onSubscribeLicenseNext(value, httpPostProxy),
            error => this.onSubscribeLicenseError(error, ctx, httpPostProxy));
          this._subscribeRequestsInvoked.set(ctx.id, ctx);
          this._subscribeRequestsPending.delete(ctx.id);
        }
      });
      this.hubProxyShared?.hubConnection.startHubConnection();
    } else {
      const url: string = this.wsiEndpointService.entryPoint + licenseChannelizeUrl + ctx.id + '/' + this.hubProxyShared?.connectionId;
      const httpPost: Observable<boolean> = this.httpClient.post(url, '', { headers }).pipe(
        map((response: HttpResponse<any> | any) => this.extractData(response)),
        catchError((response: HttpResponse<any>) =>
          this.wsiUtilityService.handleError(response, TraceModules.license, 'LicenseService.subscribeEvents()', this.errorService)));
      this.traceService.debug(TraceModules.license, 'LicenseService.subscribeEvents(); http post can be issued now (after connecting)...');
      httpPost.subscribe(value => this.onSubscribeLicenseNext(value, httpPostProxy),
        error => this.onSubscribeLicenseError(error, ctx, httpPostProxy));
      this._subscribeRequestsInvoked.set(ctx.id, ctx);
    }
    return httpPostProxy.asObservable();
  }

  /**
   * Handles errors that occur during the SignalR connection disconnection process.
   * @param {any} error - The error that occurred during disconnection.
   * @returns {void}
   */
  private onSignalRDisconnectedError(error: any): void {
    this.traceService.error(TraceModules.license, 'LicenseService.onSignalRDisconnectedError(): %s', error.toString());
  }

  /**
   * Handles the SignalR disconnection event and restarts the connection if needed.
   * @param {boolean} value - The value indicating whether the connection is disconnected.
   * @returns {void}
   */
  private onSignalRDisconnected(value: boolean): void {
    if (value === true) {
      if (this.hubProxyShared?.hubConnection?.connectionStateValue === SignalR.ConnectionState.Disconnected) {
        this.traceService.info(TraceModules.license, 'LicenseService.onSignalRDisconnected(): starting again the connection');
        this.hubProxyShared?.hubConnection.startHubConnection();
      }
    }
  }

  /**
   * Handles the connection state change event of the SignalR connection.
   * @param {SignalR.ConnectionState} value - The new connection state.
   * @returns {void}
   */
  private onSignalRConnectionState(value: SignalR.ConnectionState): void {
    if (value === SignalR.ConnectionState.Disconnected) {
      this._subscribeRequestsInvoked.forEach(ctx => {
        ctx.postSubject.error('Notification channel disconnected.');
      });
      this._subscribeRequestsInvoked.clear();
    }
    this._notifyConnectionState.next(SubscriptionUtility.convert(value));
  }

  /**
   * Extracts data from the HTTP response.
   * @param {HttpResponse<any>} response - The HTTP response.
   * @returns {boolean} True if extraction is successful, false otherwise.
   */
  private extractData(response: HttpResponse<any>): boolean {
    // Note: subscribe call just returns Status Code 200 if okay
    return true;
  }

  private onSubscribeLicenseNext(value: boolean, httpPostProxy: Subject<boolean>): void {
    this.traceService.info(TraceModules.license, 'LicenseProxyService.onSubscribeValues() done: success=%s', value);
    // nothing to do if okay! we need to wait of the subscription notification over signalR
  }

  private onSubscribeLicenseError(error: any, ctx: SubscribeContextChannelizedSingle<boolean>, httpPostProxy: Subject<boolean>): void {
    this.traceService.warn(TraceModules.license, 'onSubscribeEventsError(); http post returned an error; %s', error);
    this._subscribeRequestsInvoked.delete(ctx.id);
    httpPostProxy.error(error);
  }

  private onUnsubscribeLicenseNext(value: boolean, httpPostProxy: Subject<boolean>): void {
    httpPostProxy.next(value);
    httpPostProxy.complete();
  }

  private onUnsubscribeLicenseError(error: any, httpPostProxy: Subject<boolean>): void {
    this.traceService.warn(TraceModules.license, 'onUnsubscribeEventsError(); http post returned an error; %s', error);
    httpPostProxy.error(error);
  }

  private createEventProxies(): void {
    this.hubProxyShared = this.signalRService.getNorisHub();
    this.hubProxyEventEvents = new HubProxyEvent<LicenseWsi>(
      this.traceService, this.hubProxyShared, 'notifyLicenseMode', this.ngZone, this.signalRService);
    this.hubProxyEventEvents.eventChanged.subscribe(values => this.onLicenseNotification(values));
    this.hubProxyEventSubs = new HubProxyEvent<SubscriptionLicense>(
      this.traceService, this.hubProxyShared, 'notifySubscriptionStatus', this.ngZone, this.signalRService, 'notifyLicenseMode');
    this.hubProxyEventSubs.eventChanged.subscribe(subscription => this.onNotifySubscriptions(subscription));
  }

  private onLicenseNotification(license: LicenseWsi): void {
    this._license.next(license);
  }

  private onNotifySubscriptions(subscription: SubscriptionLicense): void {
    const foundCtx: SubscribeContextChannelizedSingle<boolean> | undefined = this._subscribeRequestsInvoked.get(subscription.RequestId);
    if (foundCtx != undefined) {
      if (this.traceService.isInfoEnabled!) {
        this.traceService.info(TraceModules.license,
          `LicenseProxyService.onNotifySubscriptions():
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
          this.traceService.debug(TraceModules.license,
            'LicenseProxyService.onNotifySubscriptions(), all subscribe notifies retrieved for context (requestId): %s', foundCtx.id);
        }
        foundCtx.postSubject.complete();
        this._subscribeRequestsInvoked.delete(foundCtx.id);
      }
    } else {
      this.traceService.error(TraceModules.license,
        'LicenseProxyService.onNotifySubscriptions(), invalid context (requestId): %s, requestFor: %s;',
        subscription.RequestId, subscription.RequestFor);
    }

    if (this.traceService.isDebugEnabled!) {
      this.traceService.debug(TraceModules.license,
        'LicenseProxyService.onNotifySubscriptions(), outstanding subscribe notifications on number of subscribe requests: %s',
        this._subscribeRequestsInvoked.size);

      this.traceService.debug(TraceModules.license,
        'LicenseProxyService.onNotifySubscriptions(), pending subscribe requests (due to disconnected): %s',
        this._subscribeRequestsPending.size);
    }
  }
}
