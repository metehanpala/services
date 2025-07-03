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
import { ConnectionState } from '../wsi-proxy-api/shared/data.model';
import { ServiceRequestInfo, ServiceRequestSubscriptionModel, SubscriptionWsiSystems } from '../wsi-proxy-api/systems/data.model';
import { SystemsServicesProxyServiceBase } from '../wsi-proxy-api/systems/systems-services-proxy.service.base';

const servicesSubscriptionUrl = '/api/sr/systemssubscriptions/services';
const systemsSubscriptionChannelizeUrl = '/api/sr/systemssubscriptions/channelize/';

const reconnectTimeout = 5000;

/**
 * Systems service
 */
@Injectable({
  providedIn: 'root'
})
export class SystemsServicesProxyService implements SystemsServicesProxyServiceBase {

  public hubProxyShared: HubProxyShared | undefined;
  public hubProxySystems: HubProxyEvent<ServiceRequestInfo> | undefined;
  public hubProxySystemsSubs: HubProxyEvent<SubscriptionWsiSystems> | undefined;

  private readonly _notifyConnectionState: Subject<ConnectionState> = new Subject<ConnectionState>();
  private readonly _subscribeRequestsInvoked: Map<string, SubscribeContextChannelizedSingle<boolean>> =
    new Map<string, SubscribeContextChannelizedSingle<boolean>>();
  private readonly _subscribeRequestsPending: Map<string, SubscribeContextChannelizedSingle<boolean>> =
    new Map<string, SubscribeContextChannelizedSingle<boolean>>();

  private readonly _systemsEvents: Subject<ServiceRequestInfo> = new Subject<ServiceRequestInfo>();

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
        this.traceService.info(TraceModules.systems, 'SystemsServicesProxyService created.');
      } else {
        this.traceService.info(TraceModules.systems, 'NorisHub connection is not established!');
      }
    });
  }

  public notifyConnectionState(): Observable<ConnectionState> {
    return this._notifyConnectionState.asObservable();
  }

  public subscribeSystemService(serviceRequestObject: ServiceRequestSubscriptionModel[] | undefined): Observable<boolean> {
    this.traceService.info(TraceModules.systems, 'SystemsServicesProxyService.subscribeSystemService() called.');

    const httpPostProxy: Subject<boolean> = new Subject<boolean>();
    const ctx: SubscribeContextChannelizedSingle<boolean> = new SubscribeContextChannelizedSingle<boolean>(httpPostProxy);

    if (this.hubProxyShared?.hubConnection?.isConnected === false) {
      this._subscribeRequestsPending.set(ctx.id, ctx);
      this.traceService.debug(TraceModules.systems, 'SystemsServicesProxyService.subscribeSystemService(): signalr connection not established; ' +
                'need to wait (postpone http calls) until established in order to get connection id.');
      const connectedSubscription: Subscription = this.hubProxyShared.hubConnection.connected.subscribe(started => {
        if (started === true) {
          this.traceService.debug(TraceModules.systems,
            'SystemsServicesProxyService.subscribeSystemService(): connected event triggered; connection is now established.');
          if (connectedSubscription !== undefined) {
            connectedSubscription.unsubscribe();
          }
          this.traceService.debug(TraceModules.systems,
            'SystemsServicesProxyService.subscribeSystemService(); http post can be issued now (connection is finally established)');
          this.invokeHttpPostServiceSubscription(httpPostProxy, ctx, serviceRequestObject);
          this._subscribeRequestsInvoked.set(ctx.id, ctx);
          this._subscribeRequestsPending.delete(ctx.id);
        }
      });
      this.hubProxyShared?.hubConnection?.startHubConnection();
    } else {
      this.traceService.debug(TraceModules.systems,
        'SystemsServicesProxyService.subscribeSystemService(); http post can be issued issued immediately (connection is already established)');
      this.invokeHttpPostServiceSubscription(httpPostProxy, ctx, serviceRequestObject);
      this._subscribeRequestsInvoked.set(ctx.id, ctx);
    }
    return httpPostProxy.asObservable();
  }

  public unSubscribeSystemService(): Observable<boolean> {
    this.traceService.info(TraceModules.systems, 'SystemsServicesProxyService.unSubscribeSystemService() called');

    const httpDeleteProxy: Subject<boolean> = new Subject<boolean>();
    if (this.hubProxyShared?.hubConnection?.isConnected === false) {
      this.traceService.debug(TraceModules.systems,
        'unSubscribeSystemService(): signalr connection not established; need to wait ' +
        '(postpone http calls) until established in order to get connection id.');
      const connectedSubscription: Subscription = this.hubProxyShared?.hubConnection?.connected.subscribe(started => {
        if (started === true) {
          this.traceService.debug(TraceModules.systems, 'unSubscribeSystemService(): connected event triggered: connection is now established.');
          // connection ID is available now, we can setup the "post observable" now and not earlier
          // => due to this we cannot use rxjs merge stream functionality such as "concat"!!
          if (connectedSubscription !== undefined) {
            connectedSubscription.unsubscribe();
          }
          this.traceService.debug(TraceModules.systems, 'unSubscribeSystemService(); http delete can be issued now (connection is finally established)');
          this.invokeHttpDeleteSystemServiceSubscription(httpDeleteProxy);
        }
      });
      this.hubProxyShared?.hubConnection?.startHubConnection();
    } else {
      this.traceService.debug(TraceModules.systems,
        'SystemsServicesProxyService.unSubscribeSystemService(); http delete can be issued immediately (connection is already established)');
      this.invokeHttpDeleteSystemServiceSubscription(httpDeleteProxy);
    }
    return httpDeleteProxy.asObservable();
  }

  public systemsNotification(): Observable<ServiceRequestInfo> {
    return this._systemsEvents.asObservable();
  }

  private invokeHttpPostServiceSubscription(httpPostProxy: Subject<boolean>, ctx: SubscribeContextChannelizedSingle<boolean>
    , serviceRequestObject: ServiceRequestSubscriptionModel[] | undefined): void {
    const methodName = 'SystemsServicesProxyService.invokeHttpPostServiceSubscription()';
    const headers: HttpHeaders = this.wsiUtilityService.httpPostDefaultHeader(this.authenticationServiceBase.userToken);
    const url: string = this.wsiEndpointService.entryPoint + systemsSubscriptionChannelizeUrl + ctx.id + '/'
    + this.hubProxyShared?.connectionId + '/services';
    const body: any = JSON.stringify(serviceRequestObject);

    const httpPost: Observable<boolean> = this.httpClient.post(url, body, { headers }).pipe(
      map((response: HttpResponse<any> | any) => this.extractServiceData(response)),
      catchError((response: HttpResponse<any>) =>
        this.wsiUtilityService.handleError(response, TraceModules.systems, methodName, this.errorService)));
    httpPost.subscribe(value => this.onSubscribeServiceNext(value, httpPostProxy),
      error => this.onSubscribeSystemsError(error, ctx, httpPostProxy));
  }

  private invokeHttpDeleteSystemServiceSubscription(httpDeleteProxy: Subject<boolean>): void {
    const methodName = 'SystemsServicesProxyService.invokeHttpDeleteSystemServiceSubscription()';
    const headers: HttpHeaders = this.wsiUtilityService.httpDeleteDefaultHeader(this.authenticationServiceBase.userToken);

    const url: string = this.wsiEndpointService.entryPoint + (servicesSubscriptionUrl + '/' + this.hubProxyShared?.connectionId);
    const httpDelete: Observable<boolean> = this.httpClient.delete(url, { headers, observe: 'response' }).pipe(
      map((response: HttpResponse<any>) =>
        this.extractServiceUnsubscribeResponse(response)),
      catchError((response: HttpResponse<any>) =>
        this.wsiUtilityService.handleError(response, TraceModules.systems, methodName, this.errorService)));
    httpDelete.subscribe(value => this.onUnsubscribeSystemsNext(value, httpDeleteProxy),
      error => this.onUnsubscribeSystemsError(error, httpDeleteProxy));
  }

  private createEventProxies(): void {
    this.hubProxyShared = this.signalRService.getNorisHub();
    this.hubProxySystems = new HubProxyEvent<ServiceRequestInfo>(
      this.traceService, this.hubProxyShared, 'notifyServices', this.ngZone, this.signalRService);
    this.hubProxySystems.eventChanged.subscribe(values => this.onSystemsNotification(values));
    this.hubProxySystemsSubs = new HubProxyEvent<SubscriptionWsiSystems>(
      this.traceService, this.hubProxyShared, 'notifySubscriptionStatus', this.ngZone, this.signalRService, 'notifyServices');
    this.hubProxySystemsSubs.eventChanged.subscribe(subscription => this.onNotifySubscriptions(subscription));
  }

  private onSignalRDisconnectedError(error: any): void {
    this.traceService.error(TraceModules.systems, 'SystemsServicesProxyService.onSignalRDisconnectedError(): %s', error.toString());
  }

  private onSignalRDisconnected(value: boolean): void {
    if (value === true) {
      if (this.hubProxyShared?.hubConnection?.connectionStateValue === SignalR.ConnectionState.Disconnected) {
        this.traceService.info(TraceModules.systems, 'SystemsServicesProxyService.onSignalRDisconnected(): starting again the connection');
        this.hubProxyShared?.hubConnection?.startHubConnection();
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

  private onSystemsNotification(systemsInfo: ServiceRequestInfo): void {
    if (this.traceService.isDebugEnabled(TraceModules.systemsNotification)) {
      this.traceService.debug(TraceModules.systemsNotification,
        'SystemsServicesProxyService.onSystemsNotification(): ServiceId=%s', systemsInfo.ServiceId);
    }
    this._systemsEvents.next(systemsInfo);
  }

  private onSubscribeServiceNext(value: boolean, httpPostProxy: Subject<boolean>): void {
    this.traceService.info(TraceModules.systems, 'SystemsServicesProxyService.onSubscribeServiceNext() done: success=%s', value);
    httpPostProxy.next(value);
  }

  private onSubscribeSystemsError(error: any, ctx: SubscribeContextChannelizedSingle<boolean>, httpPostProxy: Subject<boolean>): void {
    this.traceService.warn(TraceModules.systems, 'SystemsServicesProxyService.onSubscribeSystemsError(); http post returned an error; %s', error);
    this._subscribeRequestsInvoked.delete(ctx.id);
    httpPostProxy.error(error);
  }

  private onUnsubscribeSystemsNext(value: boolean, httpPostProxy: Subject<boolean>): void {
    httpPostProxy.next(value);
    httpPostProxy.complete();
  }

  private onUnsubscribeSystemsError(error: any, httpPostProxy: Subject<boolean>): void {
    this.traceService.warn(TraceModules.systems,
      'SystemsServicesProxyService.onUnsubscribeSystemsError(); http post returned an error; %s', error);
    httpPostProxy.error(error);
  }

  private extractServiceData(response: HttpResponse<any> | any): boolean {
    if (response?.[0]?.ErrorCode === 0) {
      this.traceService.info(TraceModules.systems,
        'SystemsServicesProxyService.extractServiceData(); successfully subscribed to ServiceId; %s', response?.[0]?.ServiceId);
      return true;
    } else {
      this.traceService.error(TraceModules.systems,
        'SystemsServicesProxyService.extractServiceData(); http post returned an error; Not able to subscribe ServiceId %s ',
        response?.[0]?.ServiceId);
      return false;
    }
  }

  private extractServiceUnsubscribeResponse(response: HttpResponse<any> | any): boolean {
    return response.status === 200;
  }

  private onNotifySubscriptions(subscription: SubscriptionWsiSystems): void {
    const foundCtx: SubscribeContextChannelizedSingle<boolean> | undefined = this._subscribeRequestsInvoked.get(subscription.RequestId);
    if (foundCtx != undefined) {
      if (this.traceService.isInfoEnabled!) {
        this.traceService.info(TraceModules.systems,
          `SystemsServicesProxyService.onNotifySubscriptions():
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
            'SystemsServicesProxyService.onNotifySubscriptions(), all subscribe notifies retrieved for context (requestId): %s', foundCtx.id);
        }
        foundCtx.postSubject.complete();
        this._subscribeRequestsInvoked.delete(foundCtx.id);
      }
    } else {
      this.traceService.error(TraceModules.systems,
        'SystemsServicesProxyService.onNotifySubscriptions(), invalid context (requestId): %s, requestFor: %s;',
        subscription.RequestId, subscription.RequestFor);
    }

    if (this.traceService.isDebugEnabled!) {
      this.traceService.debug(TraceModules.systems,
        'SystemsServicesProxyService.onNotifySubscriptions(), outstanding subscribe notifications on number of subscribe requests: %s',
        this._subscribeRequestsInvoked.size);

      this.traceService.debug(TraceModules.systems,
        'SystemsServicesProxyService.onNotifySubscriptions(), pending subscribe requests (due to disconnected): %s',
        this._subscribeRequestsPending.size);
    }
  }

}
