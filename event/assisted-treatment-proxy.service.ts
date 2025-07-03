import { HttpClient, HttpHeaders, HttpParams, HttpResponse } from '@angular/common/http';
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
import { AssistedTreatmentProxyServiceBase } from '../wsi-proxy-api/assisted-treatment/assisted-treatment-proxy.service.base';
import { WSIProcedure, WSIStep } from '../wsi-proxy-api/assisted-treatment/data.model';
import { SubscriptionWsiProcedure } from '../wsi-proxy-api/event/data.model';
import { ConnectionState } from '../wsi-proxy-api/shared/data.model';

const procedureSubsUrlCreate = '/api/sr/operatingproceduressubscriptions/channelize/';
const procedureSubsUrlDelete = '/api/sr/operatingproceduressubscriptions/';
const procedureSendStepCommand = '/api/operatingprocedures/';
const updateStepTrace = 'AssistedTreatmentProxyService.updateStep()';
const unSubscribeProcedureTrace = 'unSubscribeProcedure()';

const reconnectTimeout = 5000;

/**
 * Implementation for the WSI Assisted Treatment Proxy Service.
 * See the WSI API documentation for details.
 *
 * @export
 * @class AssistedTreatmentProxyService
 * @extends {AssistedTreatmentProxyServiceBase}
 */
@Injectable({
  providedIn: 'root'
})
export class AssistedTreatmentProxyService extends AssistedTreatmentProxyServiceBase {
  public hubProxyShared: HubProxyShared | undefined;
  public hubProxyEventProcedure: HubProxyEvent<WSIProcedure> | undefined;
  public hubProxyEventSubs: HubProxyEvent<SubscriptionWsiProcedure> | undefined;
  public isSubscribed = false;

  private readonly _notifyConnectionState: Subject<ConnectionState> = new Subject<ConnectionState>();
  private readonly _subscribeRequestsInvoked: Map<string, SubscribeContextChannelizedSingle<boolean>> =
    new Map<string, SubscribeContextChannelizedSingle<boolean>>();
  private readonly _subscribeRequestsPending: Map<string, SubscribeContextChannelizedSingle<boolean>> =
    new Map<string, SubscribeContextChannelizedSingle<boolean>>();

  private readonly _procedure: Subject<WSIProcedure> = new Subject<WSIProcedure>();
  private op: WSIProcedure | undefined;
  private subscriptionKey: string | undefined;

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
        this.hubProxyShared?.hubConnection?.connectionState.subscribe((value: any) => this.onSignalRConnectionState(value));
        const disconnectedObservable: Observable<boolean> | undefined = this.hubProxyShared?.hubConnection?.disconnected;
        if (disconnectedObservable !== undefined) {
          disconnectedObservable.pipe(delay(reconnectTimeout)).subscribe(
            value => this.onSignalRDisconnected(value), error => this.onSignalRDisconnectedError(error));
        }
        this.traceService.info(TraceModules.assistedTreatment, 'Assisted Treatment service created.');
      } else {
        this.traceService.info(TraceModules.assistedTreatment, 'Access token for the user is blank, cannot create the signalR connection');
      }
    });
  }

  public notifyConnectionState(): Observable<ConnectionState> {
    return this._notifyConnectionState.asObservable();
  }

  /**
   * Subscribes to the specific procedure.
   *
   * @returns { Observable<boolean> }
   *
   * @memberOf AssistedTreatmentProxyService
   */
  public subscribeProcedure(procedureId: string): Observable<boolean> {
    this.traceService.info(TraceModules.assistedTreatment, 'subscribeProcedure() called.');
    this.isSubscribed = true;
    const httpPostProxy: Subject<boolean> = new Subject<boolean>();
    const ctx: SubscribeContextChannelizedSingle<boolean> = new SubscribeContextChannelizedSingle<boolean>(httpPostProxy);

    if (this.hubProxyShared?.hubConnection?.isConnected === false) {
      this._subscribeRequestsPending.set(ctx.id, ctx);
      this.traceService.debug(TraceModules.assistedTreatment,
        'subscribeProcedure(): signalr connection not established; need to wait (postpone http calls) until established in order to get connection id.');
      const connectedSubscription: Subscription = this.hubProxyShared.hubConnection.connected.subscribe(started => {
        if (started === true) {
          this.traceService.debug(TraceModules.assistedTreatment, 'subscribeProcedure(): connected event triggered; conection is now established.');
          // connection ID is available now, we can setup the "post observable" now and not earlier
          // (=> due to this we cannot use rxjs merge stream functionality such as "concat"!!)
          if (connectedSubscription !== undefined) {
            connectedSubscription.unsubscribe();
          }
          this.traceService.debug(TraceModules.assistedTreatment, 'subscribeProcedure(); http post can be issued now  (connection is finally established)');
          this.invokeHttpPostProcedureSubscription(httpPostProxy, procedureId, ctx);
          this._subscribeRequestsInvoked.set(ctx.id, ctx);
          this._subscribeRequestsPending.delete(ctx.id);
        }
      });
      this.hubProxyShared.hubConnection.startHubConnection();
    } else {
      this.traceService.debug(TraceModules.assistedTreatment, 'subscribeProcedure(); http post can be issued now (connection is already established)');
      this.invokeHttpPostProcedureSubscription(httpPostProxy, procedureId, ctx);
      this._subscribeRequestsInvoked.set(ctx.id, ctx);
      this._subscribeRequestsPending.delete(ctx.id);
    }
    return httpPostProxy.asObservable();
  }

  /**
   * Retrieves procedure data.
   *
   * @returns { Observable<WSIProcedure> }
   *
   * @memberOf AssistedTreatmentProxyService
   */
  public getProcedure(procID: string): Observable<WSIProcedure> {
    this.traceService.info(TraceModules.assistedTreatment, 'AssistedTreatmentProxyService:getProcedure(...) called with Procedure ID: %s', procID);
    const headers: HttpHeaders = this.wsiUtilityService.httpGetDefaultHeader(this.authenticationServiceBase.userToken);

    const url: string = this.wsiEndpointService.entryPoint + '/api/operatingprocedures';
    let params: HttpParams = new HttpParams();
    params = params.set('id', procID);

    return this.httpClient.get(url, { headers, observe: 'response', params }).pipe(
      map((response: HttpResponse<any>) =>
        this.wsiUtilityService.extractData(response, TraceModules.assistedTreatment, 'AssistedTreatmentProxyService:getProcedure(...)')),
      catchError((response: HttpResponse<any>) =>
        this.wsiUtilityService.handleError(response, TraceModules.events, 'AssistedTreatmentProxyService:getProcedure(...)', this.errorService)));
  }

  /**
   * Update step of the specified procedure.
   *
   * @returns { Observable<void> }
   *
   * @memberOf AssistedTreatmentProxyService
   */
  public updateStep(procID: string, step: WSIStep): Observable<void> {
    const httpPutProxy: Subject<boolean> = new Subject<boolean>();

    if (this.hubProxyShared?.hubConnection?.isConnected === false) {
      this.traceService.debug(TraceModules.events,
        'AssistedTreatmentProxyService.updateStep(): signalr connection not established;' +
        ' need to wait (postpone http calls) until established in order to get connection id.');
      const connectedSubscription: Subscription = this.hubProxyShared.hubConnection.connected.subscribe(started => {
        if (started === true) {
          this.traceService.debug(TraceModules.events, 'AssistedTreatmentProxyService.updateStep(): connected event triggered; connection established.');
          if (connectedSubscription !== undefined) {
            connectedSubscription.unsubscribe();
          } else {
            this.traceService.error(TraceModules.events, 'AssistedTreatmentProxyService.updateStep(); Implementation error');
          }
          this.traceService.debug(TraceModules.events,
            'AssistedTreatmentProxyService.updateStep(); http put can be issued now (connection is finally established)');
          this.invokeHttpPutUpdateStep(httpPutProxy, procID, step);
        }
      });
      this.hubProxyShared.hubConnection.startHubConnection();
    } else {
      this.traceService.debug(TraceModules.events,
        'AssistedTreatmentProxyService.updateStep(); http put can be issued now (connection is already established)');
      this.invokeHttpPutUpdateStep(httpPutProxy, procID, step);
    }
    return undefined!;
  }

  /**
   * Event for the procedures notifications.
   *
   * @returns { Observable<WSIProcedure> }
   *
   * @memberOf AssistedTreatmentProxyService
   */
  public procedureNotification(): Observable<WSIProcedure> {
    // if null this one is not called, so no new subject

    return this._procedure.asObservable();
  }

  /**
   * Unsubscribes to the specific procedure.
   *
   * @returns { Observable<boolean> }
   *
   * @memberOf AssistedTreatmentProxyService
   */
  public unSubscribeProcedure(): Observable<boolean> {
    this.traceService.info(TraceModules.assistedTreatment, 'unSubscribeProcedure() called');
    this.isSubscribed = false;
    const httpPostProxy: Subject<boolean> = new Subject<boolean>();

    if (this.hubProxyShared?.hubConnection?.isConnected === false) {
      this.traceService.debug(TraceModules.assistedTreatment,
        'unSubscribeProcedure(): signalr connection not established; need to wait (postpone http calls) until established in order to get connection id.');
      const connectedSubscription: Subscription = this.hubProxyShared.hubConnection.connected.subscribe(started => {
        if (started === true) {
          this.traceService.debug(TraceModules.assistedTreatment, 'unSubscribeProcedure(): connected event triggered: connection is now established.');
          // connection ID is available now, we can setup the "post observable" now and not earlier
          // => due to this we cannot use rxjs merge stream functionality such as "concat"!!
          if (connectedSubscription !== undefined) {
            connectedSubscription.unsubscribe();
          }
          this.traceService.debug(TraceModules.assistedTreatment, 'unSubscribeProcedure(); http delete can be issued (connection is finally established)');
          this.invokeHttpDeleteProcedureSubscription(httpPostProxy);
        }
      });
      this.hubProxyShared.hubConnection.startHubConnection();
    } else {
      this.traceService.debug(TraceModules.assistedTreatment,
        'unSubscribeProcedure(); http delete can be issued immediately (connection is already established)');
      this.invokeHttpDeleteProcedureSubscription(httpPostProxy);
    }
    return httpPostProxy.asObservable();
  }

  private invokeHttpPostProcedureSubscription(httpPostProxy: Subject<boolean>, procedureId: string, ctx: SubscribeContextChannelizedSingle<boolean>): void {
    const headers: HttpHeaders = this.wsiUtilityService.httpPostDefaultHeader(this.authenticationServiceBase.userToken);
    const url: string = this.wsiEndpointService.entryPoint + procedureSubsUrlCreate + ctx.id + '/' + this.hubProxyShared?.connectionId;

    let params: HttpParams = new HttpParams();
    params = params.set('id', procedureId);
    const body: string | null = null;

    const httpPost: Observable<boolean> = this.httpClient.post(url, body, { headers, params }).pipe(
      map((response: HttpResponse<any> | any) =>
        this.extractData(response)),
      catchError((response: HttpResponse<any>) =>
        this.wsiUtilityService.handleError(response, TraceModules.assistedTreatment, 'subscribeProcedure()', this.errorService)));
    httpPost.subscribe(value => this.onSubscribeProcedureNext(value, httpPostProxy),
      error => this.onSubscribeProcedureError(error, ctx, httpPostProxy));
  }

  private invokeHttpDeleteProcedureSubscription(httpDeleteProxy: Subject<boolean>): void {
    const headers: HttpHeaders = this.wsiUtilityService.httpDeleteDefaultHeader(this.authenticationServiceBase.userToken);
    let url: string = this.wsiEndpointService.entryPoint + procedureSubsUrlDelete + this.hubProxyShared?.connectionId;
    if (this.subscriptionKey !== undefined) {
      url = url + '?subscriptionKey=' + this.subscriptionKey;
    }

    const httpDelete: Observable<boolean> = this.httpClient.delete(url, { headers, observe: 'response' }).pipe(
      map((response: HttpResponse<any>) =>
        this.wsiUtilityService.extractData(response, TraceModules.assistedTreatment, unSubscribeProcedureTrace)),
      catchError((response: HttpResponse<any>) =>
        this.wsiUtilityService.handleError(response, TraceModules.assistedTreatment, unSubscribeProcedureTrace, this.errorService)));
    httpDelete.subscribe(value => this.onUnSubscribeProcedureNext(value, httpDeleteProxy),
      error => this.onUnSubscribeProcedureError(error, httpDeleteProxy));
  }

  private invokeHttpPutUpdateStep(httpPutProxy: Subject<boolean>, procID: string, step: WSIStep): void {
    const headers: HttpHeaders = this.wsiUtilityService.httpPutDefaultHeader(this.authenticationServiceBase.userToken);
    const url: string = this.wsiEndpointService.entryPoint + procedureSendStepCommand + procID + '/step';
    const body: string = JSON.stringify(step);

    const httpPut: Observable<boolean> = this.httpClient.put(url, body, { headers, observe: 'response' }).pipe(
      map((response: HttpResponse<any>) =>
        this.wsiUtilityService.extractData(response, TraceModules.events, updateStepTrace)),
      catchError((response: HttpResponse<any>) =>
        this.wsiUtilityService.handleError(response, TraceModules.events, updateStepTrace, this.errorService)));
    httpPut.subscribe(value => this.onUpdateStepCommandNext(value, httpPutProxy),
      error => this.onUpdateStepCommandError(error, httpPutProxy));
  }

  private onUpdateStepCommandNext(value: boolean, httpPostProxy: Subject<boolean>): void {
    httpPostProxy.next(value);
    httpPostProxy.complete();
  }

  private onUpdateStepCommandError(error: any, httpPostProxy: Subject<boolean>): void {
    this.traceService.warn(TraceModules.events, 'onsendOPStepCommandError(); http post returned an error; %s', error);
    httpPostProxy.error(error);
  }

  private extractData(res: HttpResponse<any>): boolean {
    return true;
  }

  private onSubscribeProcedureNext(value: boolean, httpPostProxy: Subject<boolean>): void {
    this.traceService.info(TraceModules.assistedTreatment, 'AssistedTreatmentProxyService.onSubscribeValues() done: success=%s', value);
    // nothing to do if okay! we need to wait for the subscription notification over signalR
  }

  private onSubscribeProcedureError(error: any, ctx: SubscribeContextChannelizedSingle<boolean>, httpPostProxy: Subject<boolean>): void {
    this.traceService.warn(TraceModules.assistedTreatment, 'onSubscribeProcedureError(); http post returned an error; %s', error);
    this._subscribeRequestsInvoked.delete(ctx.id);
    httpPostProxy.error(error);
  }

  private onUnSubscribeProcedureNext(value: boolean, httpPostProxy: Subject<boolean>): void {
    httpPostProxy.next(value);
    httpPostProxy.complete();
  }

  private onUnSubscribeProcedureError(error: any, httpPostProxy: Subject<boolean>): void {
    this.traceService.warn(TraceModules.assistedTreatment, 'onUnSubscribeProcedureError(); http post returned an error; %s', error);
    httpPostProxy.error(error);
  }

  private createEventProxies(): void {
    this.hubProxyShared = this.signalRService.getNorisHub();
    this.hubProxyEventProcedure = new HubProxyEvent<WSIProcedure>(
      this.traceService, this.hubProxyShared, 'notifyOperatingProcedures', this.ngZone, this.signalRService);
    this.hubProxyEventProcedure.eventChanged.subscribe(
      values => this.onProcedureNotification(values),
      err => this.traceService.error(TraceModules.assistedTreatment,
        'AssistedTreatmentProxyService.onProcedureNotification() not able to receive subscription : %s', err.toString()
      ));
    this.hubProxyEventSubs = new HubProxyEvent<SubscriptionWsiProcedure>(
      this.traceService, this.hubProxyShared, 'notifySubscriptionStatus', this.ngZone, this.signalRService, 'notifyOperatingProcedures');
    this.hubProxyEventSubs.eventChanged.subscribe(subscription => this.onNotifySubscriptions(subscription));
  }

  private onProcedureNotification(wsiProcedure: WSIProcedure): void {
    if (this.traceService.isDebugEnabled(TraceModules.assistedTreatment)) {
      let trcStr = '';
      if (wsiProcedure?.Steps) {
        trcStr = `Procedure Id=${wsiProcedure.Id}; Num Steps=${wsiProcedure.Steps.length}`;
        wsiProcedure.Steps.forEach(step => {
          trcStr = trcStr + '\n' + `Status=${step.Status}`;
        });
      }
      this.traceService.debug(TraceModules.assistedTreatment, 'AssistedTreatmentProxyService:onProcedureNotification():\n' + trcStr);
    }
    this.op = wsiProcedure;
    this._procedure.next(wsiProcedure);
  }

  private onSignalRDisconnectedError(error: any): void {
    this.traceService.error(TraceModules.assistedTreatment, 'AssistedTreatmentProxyService.onSignalRDisconnectedError(): %s', error.toString());
  }

  private onSignalRDisconnected(value: boolean): void {
    if (value === true) {
      if (this.hubProxyShared?.hubConnection?.connectionStateValue === SignalR.ConnectionState.Disconnected) {
        this.traceService.info(TraceModules.assistedTreatment, 'AssistedTreatmentProxyService.onSignalRDisconnected(): starting again the connection');
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

  private onNotifySubscriptions(subscription: SubscriptionWsiProcedure): void {
    const foundCtx: SubscribeContextChannelizedSingle<boolean> | undefined = this._subscribeRequestsInvoked.get(subscription.RequestId);
    this.subscriptionKey = subscription.Key;

    if (foundCtx != undefined) {
      if (this.traceService.isInfoEnabled!) {
        this.traceService.info(TraceModules.assistedTreatment,
          `AssistedTreatmentProxyService.onNotifySubscriptions():
           context (requestId): %s; subscription Key: %s; errorCode: %s; requestFor: %s; connectionState: %s`,
          foundCtx.id, subscription.Key, subscription.ErrorCode, subscription.RequestFor,
          this.hubProxyShared?.hubConnection?.connectionStateValueText);
      }

      const isSucceeded: boolean = subscription.ErrorCode === 0;

      foundCtx.setReply(isSucceeded);
      // reply every single subscription request as the API is Request-MultiReply
      foundCtx.postSubject.next(isSucceeded);
      if (foundCtx.checkAllRepliesDone() === true) {
        if (this.traceService.isDebugEnabled!) {
          this.traceService.debug(TraceModules.assistedTreatment,
            'AssistedTreatmentProxyService.onNotifySubscriptions(), all subscribe notifies retrieved for context (requestId): %s', foundCtx.id);
        }
        foundCtx.postSubject.complete();
        this._subscribeRequestsInvoked.delete(foundCtx.id);
      }
    } else {
      this.traceService.error(TraceModules.assistedTreatment,
        'AssistedTreatmentProxyService.onNotifySubscriptions(), invalid context (requestId): %s, requestFor: %s;',
        subscription.RequestId, subscription.RequestFor);
    }

    if (this.traceService.isDebugEnabled!) {
      this.traceService.debug(TraceModules.assistedTreatment,
        'AssistedTreatmentProxyService.onNotifySubscriptions(), outstanding subscribe notifications on number of subscribe requests: %s',
        this._subscribeRequestsInvoked.size);

      this.traceService.debug(TraceModules.assistedTreatment,
        'AssistedTreatmentProxyService.onNotifySubscriptions(), pending subscribe requests (due to disconnected): %s',
        this._subscribeRequestsPending.size);
    }
  }
}
