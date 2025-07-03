/* eslint-disable @typescript-eslint/member-ordering */
import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Injectable, NgZone } from '@angular/core';
import { AuthenticationServiceBase, ErrorNotificationServiceBase, isNullOrUndefined, TraceService } from '@gms-flex/services-common';
import { Observable, of, Subject, Subscription } from 'rxjs';
import { catchError, delay, map } from 'rxjs/operators';

import { HubProxyEvent, HubProxyShared, ReportHistoryResult, ReportSubscriptionProxyServiceBase,
  SignalRService, SubscribeContextChannelizedSingle, SubscriptionUtility,
  SubscriptionWsiReport,
  WsiEndpointService, WsiUtilityService } from '../public-api';
import { TraceModules } from '../shared/trace-modules';
import { ConnectionState } from '../wsi-proxy-api';

const historyLogsSubscriptionUrl = '/api/historylogsubscriptions/';
const reportsSubscriptionUrl = '/api/historylogsubscriptions/reports/subscribe/';
const reportUnsubscriptionUrl = '/api/historylogsubscriptions/reports/unsubscribe/';
const reportSubscriptionWsiUrl = '/api/historylogsubscriptions/reports/reportidsubscribe/';
const reportUnsubscriptionWsiUrl = '/api/historylogsubscriptions/reports/reportidunsubscribe/';
const noConnectionTrace = 'signalr connection not established; need to wait (postpone http calls) until established in order to get connection id.';
const reconnectTimeout = 5000;

/**
 * GMS WSI report subscription proxy implementation.
 */
@Injectable({
  providedIn: 'root'
})
export class ReportSubscriptionProxyService extends ReportSubscriptionProxyServiceBase {

  public hubProxyShared: HubProxyShared | undefined;
  public hubProxyEventEvents: HubProxyEvent< ReportHistoryResult> | undefined;
  public hubProxyEventSubs: HubProxyEvent<SubscriptionWsiReport> | undefined;

  private readonly _notifyConnectionState: Subject<ConnectionState> = new Subject<ConnectionState>();
  private readonly _subscribeRequestsInvoked: Map<string, SubscribeContextChannelizedSingle<boolean>> =
    new Map<string, SubscribeContextChannelizedSingle<boolean>>();
  private readonly _subscribeRequestsPending: Map<string, SubscribeContextChannelizedSingle<boolean>> =
    new Map<string, SubscribeContextChannelizedSingle<boolean>>();

  private readonly _report: Subject<ReportHistoryResult> = new Subject<ReportHistoryResult>();
  private contextId = '';

  public constructor(
    private readonly authenticationServiceBase: AuthenticationServiceBase,
    private readonly errorService: ErrorNotificationServiceBase,
    private readonly httpClient: HttpClient,
    private readonly ngZone: NgZone,
    private readonly traceService: TraceService,
    private readonly signalRService: SignalRService,
    private readonly wsiEndpointService: WsiEndpointService,
    private readonly wsiUtilityService: WsiUtilityService) {
    super();
    this.signalRService.getNorisHubConnectionStatus().subscribe((isConnected: boolean) => {
      if (isConnected) {
        this.createEventProxies();
        this.hubProxyShared?.hubConnection?.connectionState.subscribe((value: any) =>
          this.onSignalRConnectionState(value));
        this.hubProxyShared?.hubConnection?.disconnected.pipe(delay(reconnectTimeout)).subscribe(
          value => this.onSignalRDisconnected(value),
          error => this.onSignalRDisconnectedError(error));
        this.traceService.info(TraceModules.historyLog, 'ReportSubscriptionProxyService created.');
      } else {
        this.traceService.info(TraceModules.historyLog, 'NorisHub connection is not established!');
      }
    });
  }

  public notifyConnectionState(): Observable<ConnectionState> {
    return this._notifyConnectionState.asObservable();
  }

  public reportNotification(): Observable<ReportHistoryResult> {
    return this._report.asObservable();
  }

  public subscribeWsi(systemId: number, objectId: string): Observable<boolean> {
    this.traceService.info(TraceModules.historyLog, 'ReportSubscriptionProxyService.subscribeReport() called.');

    const headers: HttpHeaders = this.wsiUtilityService.httpPostDefaultHeader(this.authenticationServiceBase.userToken);
    const httpPostProxy: Subject<boolean> = new Subject<boolean>();
    const ctx: SubscribeContextChannelizedSingle<boolean> = new SubscribeContextChannelizedSingle<boolean>(httpPostProxy);

    if (this.hubProxyShared?.hubConnection?.isConnected === false) {
      this._subscribeRequestsPending.set(ctx.id, ctx);
      this.traceService.debug(TraceModules.historyLog, 'ReportSubscriptionService.subscribeWsi(): ' + noConnectionTrace);

      const connectedSubscription: Subscription = this.hubProxyShared.hubConnection.connected.subscribe(started => {
        if (started === true) {
          this.traceService.debug(TraceModules.historyLog, 'ReportSubscriptionService.subscribeWsi(): connected reports; connection is now established.');
          // connection ID is available now, we can setup the "post observable" now and not earlier
          // (=> due to this we cannot use rxjs merge stream functionality such as "concat"!!)
          if (connectedSubscription !== undefined) {
            connectedSubscription.unsubscribe();
          } else {
            this.traceService.error(TraceModules.historyLog, 'ReportSubscriptionService.subscribeWsi(); Implementation error, we should not reach this!');
          }

          // POST “/api/historylogsubscriptions/reports/reportidsubscribe/{systemId}/{reportDefinitionId}/{connectionId}/{requestId}”
          const url: string = this.wsiEndpointService.entryPoint +
          historyLogsSubscriptionUrl + systemId + '/reports/reportidsubscribe/' + objectId + '/' + this.hubProxyShared?.connectionId + '/' + ctx.id;

          const httpPost: Observable<boolean> = this.httpClient.post(url, '', { headers }).pipe(
            map((response: HttpResponse<any> | any) => this.extractData(response)),
            catchError((response: HttpResponse<any>) =>
              this.wsiUtilityService.handleError(response, TraceModules.historyLog, 'subscribeWsi()', this.errorService)));

          // this.traceService.debug(TraceModules.historyLog, 'ReportSubscriptionService.subscribeWsi(); http post can be issued now (after connecting)...');
          this.traceService.info(TraceModules.eventsTiming, 'ReportSubscriptionService.subscribeWsi(); http post can be issued now (after connecting)...');

          httpPost.subscribe(
            value => this.onSubscribeReportWsiNext(value, httpPostProxy),
            error => this.onSubscribeReportWsiError(error, ctx, httpPostProxy));

          this.contextId = ctx.id;
          this._subscribeRequestsInvoked.set(ctx.id, ctx);
          this._subscribeRequestsPending.delete(ctx.id);
        }
      });
      this.hubProxyShared?.hubConnection.startHubConnection();
    } else {

      const url: string = this.wsiEndpointService.entryPoint +
      historyLogsSubscriptionUrl + systemId + '/reports/reportidsubscribe/' + objectId + '/' + this.hubProxyShared?.connectionId + '/' + ctx.id;

      const httpPost: Observable<boolean> = this.httpClient.post(url, '', { headers }).pipe(
        map((response: HttpResponse<any> | any) => this.extractData(response)),
        catchError((response: HttpResponse<any>) =>
          this.wsiUtilityService.handleError(response, TraceModules.historyLog, 'ReportSubscriptionService.subscribeWsi()', this.errorService)));
      this.traceService.debug(TraceModules.historyLog, 'ReportSubscriptionService.subscribeWsi(); http post can be issued now (after connecting)...');

      httpPost.subscribe(
        value => this.onSubscribeReportWsiNext(value, httpPostProxy),
        error => this.onSubscribeReportWsiError(error, ctx, httpPostProxy));

      this._subscribeRequestsInvoked.set(ctx.id, ctx);
      this.contextId = ctx.id;
    }
    return httpPostProxy.asObservable();

  }

  public subscribeReport(systemId: number, objectId: string, reportExecutionId: string): Observable<boolean> {
    this.traceService.info(TraceModules.historyLog, 'ReportSubscriptionProxyService.subscribeReport() called.');

    const headers: HttpHeaders = this.wsiUtilityService.httpPostDefaultHeader(this.authenticationServiceBase.userToken);
    const httpPostProxy: Subject<boolean> = new Subject<boolean>();

    if (this.hubProxyShared?.hubConnection?.isConnected && this.contextId != '') {
      // this._subscribeRequestsPending.set(ctx.id, ctx);
      this.traceService.debug(TraceModules.historyLog, 'ReportSubscriptionService.subscribeReport(): ' + noConnectionTrace);

      const connectedSubscription2: Subscription = this.hubProxyShared.hubConnection.connected.subscribe(started => {
        if (started === true) {
          this.traceService.debug(TraceModules.historyLog, 'ReportSubscriptionService.subscribeReport(): connected reports; connection is now established.');
          // connection ID is available now, we can setup the "post observable" now and not earlier
          // (=> due to this we cannot use rxjs merge stream functionality such as "concat"!!)
          // if (connectedSubscription2 !== undefined) {
          //   connectedSubscription2.unsubscribe();
          // } else {
          //   this.traceService.error(TraceModules.historyLog, 'ReportSubscriptionService.subscribeReport(); Implementation error, we should not reach this!');
          // }

          // POST /api/historylogsubscriptions/reports/subscribe/{systemId}/{reportExecutionId}/{connectionId}/{requestId}
          const url: string = this.wsiEndpointService.entryPoint +
            historyLogsSubscriptionUrl + systemId + '/reports/subscribe/' + reportExecutionId + '/' + this.hubProxyShared?.connectionId + '/' + this.contextId;

          const httpPost: Observable<boolean> = this.httpClient.post(url, '', { headers }).pipe(
            map((response: HttpResponse<any> | any) => this.extractDataReport(response)),
            catchError((response: HttpResponse<any>) =>
              this.wsiUtilityService.handleError(response, TraceModules.historyLog, 'subscribeReport()', this.errorService)));

          this.traceService.debug(TraceModules.historyLog, 'ReportSubscriptionService.subscribeReport(); http post can be issued now (after connecting)...');

          httpPost.subscribe(
            value => this.onSubscribeReportNext(value, httpPostProxy),
            error => this.onSubscribeReportError(error, this.contextId));
        }
      });
    } else {
      const url: string = this.wsiEndpointService.entryPoint +
        historyLogsSubscriptionUrl + systemId + '/reports/subscribe/' + reportExecutionId + '/' + this.hubProxyShared?.connectionId + '/' + this.contextId;

      const httpPost: Observable<boolean> = this.httpClient.post(url, '', { headers }).pipe(
        map((response: HttpResponse<any> | any) => this.extractData(response)),
        catchError((response: HttpResponse<any>) =>
          this.wsiUtilityService.handleError(response, TraceModules.historyLog, 'ReportSubscriptionService.subscribeEvents()', this.errorService)));
      this.traceService.debug(TraceModules.historyLog, 'ReportSubscriptionService.subscribeEvents(); http post can be issued now (after connecting)...');

      httpPost.subscribe(
        value => this.onSubscribeReportNext(value, httpPostProxy),
        error => this.onSubscribeReportError(error, this.contextId));
    }
    return of(true);
  }

  public unsubscribeReport(reportExecutionId: string, systemId: number): Observable<boolean> {
    this.traceService.info(TraceModules.historyLog, 'ReportSubscriptionService.unSubscribeEvents() called');

    const headers: HttpHeaders = this.wsiUtilityService.httpDeleteDefaultHeader(this.authenticationServiceBase.userToken);
    const httpPostProxy: Subject<boolean> = new Subject<boolean>();

    this.traceService.debug(TraceModules.historyLog, 'ReportSubscriptionServiceProxy.unsubscribeReport(); http delete can be issued immediately');
    const url: string = this.wsiEndpointService.entryPoint + reportUnsubscriptionUrl + reportExecutionId + '/' + systemId;

    const httpPost: Observable<boolean> = this.httpClient.delete(url, { headers, observe: 'response' }).pipe(
      map((response: HttpResponse<any>) =>
        this.wsiUtilityService.extractData(response, TraceModules.historyLog, 'ReportSubscriptionServiceProxy.unsubscribeReport()')),
      catchError((response: HttpResponse<any>) =>
        this.wsiUtilityService.handleError(response, TraceModules.historyLog, 'ReportSubscriptionServiceProxy.unsubscribeReport()', this.errorService)));

    httpPost.subscribe(
      value => this.onUnsubscribeReportNext(value, httpPostProxy),
      error => this.onUnsubscribeReportError(error, httpPostProxy));
    // }
    return httpPostProxy.asObservable();
  }

  public unsubscribeWsi(systemId: number, reportDefinitionId?: string): Observable<boolean> {
    this.traceService.info(TraceModules.historyLog, 'ReportSubscriptionService.unSubscribeEvents() called');

    const headers: HttpHeaders = this.wsiUtilityService.httpDeleteDefaultHeader(this.authenticationServiceBase.userToken);
    const httpPostProxy: Subject<boolean> = new Subject<boolean>();

    this.traceService.debug(TraceModules.historyLog, 'ReportSubscriptionService.unSubscribeEventCounters(); http delete can be issued immediately');
    const url: string = this.wsiEndpointService.entryPoint + reportUnsubscriptionWsiUrl + 
    this.hubProxyShared?.connectionId + '/' + systemId + '/' + reportDefinitionId;

    const httpPost: Observable<boolean> = this.httpClient.delete(url, { headers, observe: 'response' }).pipe(
      map((response: HttpResponse<any>) =>
        this.wsiUtilityService.extractData(response, TraceModules.historyLog, 'ReportSubscriptionService.unSubscribeEvents()')),
      catchError((response: HttpResponse<any>) =>
        this.wsiUtilityService.handleError(response, TraceModules.historyLog, 'ReportSubscriptionService.unSubscribeEvents()', this.errorService)));

    httpPost.subscribe(
      value => this.onUnsubscribeWsiReportNext(value, httpPostProxy),
      error => this.onUnsubscribeWsiReportError(error, httpPostProxy));

    return httpPostProxy.asObservable();
  }

  private extractData(response: HttpResponse<any>): boolean {
    // Note: subscribe call just returns Status Code 200 if okay
    return true;
  }

  private extractDataReport(response: HttpResponse<any>): boolean {
    // Note: subscribe call just returns Status Code 200 if okay
    return true;
  }

  private onSubscribeReportNext(value: boolean, httpPostProxy: Subject<boolean>): void {
    this.traceService.info(TraceModules.historyLog, 'ReportSubscriptionService.onSubscribeValues() done: success=%s', value);
  }

  private onSubscribeReportError(error: any, ctxId: string): void {
    this.traceService.warn(TraceModules.historyLog, 'onSubscribeReportError(); http post returned an error; %s', error);
  }

  private onSubscribeReportWsiNext(value: boolean, httpPostProxy: Subject<boolean>): void {
    this.traceService.info(TraceModules.historyLog, 'ReportSubscriptionService.onSubscribeValues() done: success=%s', value);
    // nothing to do if okay! we need to wait of the subscription notification over signalR
  }

  private onSubscribeReportWsiError(error: any, ctx: SubscribeContextChannelizedSingle<boolean>, httpPostProxy: Subject<boolean>): void {
    this.traceService.warn(TraceModules.historyLog, 'onSubscribeReportWsiError(); http post returned an error; %s', error);
    this._subscribeRequestsInvoked.delete(ctx.id);
    httpPostProxy.error(error);
  }

  private onUnsubscribeReportNext(value: boolean, httpPostProxy: Subject<boolean>): void {
    httpPostProxy.next(value);
    httpPostProxy.complete();
  }

  private onUnsubscribeReportError(error: any, httpPostProxy: Subject<boolean>): void {
    this.traceService.warn(TraceModules.historyLog, 'onUnsubscribeReportError(); http post returned an error; %s', error);
    httpPostProxy.error(error);
  }

  private onUnsubscribeWsiReportNext(value: boolean, httpPostProxy: Subject<boolean>): void {
    httpPostProxy.next(value);
    httpPostProxy.complete();
  }

  private onUnsubscribeWsiReportError(error: any, httpPostProxy: Subject<boolean>): void {
    this.traceService.warn(TraceModules.historyLog, 'onUnsubscribeWsiReportError(); http post returned an error; %s', error);
    httpPostProxy.error(error);
  }

  private onSignalRDisconnected(value: boolean): void {
    if (value === true) {
      if (this.hubProxyShared?.hubConnection?.connectionStateValue === SignalR.ConnectionState.Disconnected) {
        this.traceService.info(TraceModules.historyLog, 'ReportSubscriptionService.onSignalRDisconnected(): starting again the connection');
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

  private onSignalRDisconnectedError(error: any): void {
    this.traceService.error(TraceModules.historyLog, 'ReportSubscriptionService.onSignalRDisconnectedError(): %s', error.toString());
  }

  private createEventProxies(): void {
    this.hubProxyShared = this.signalRService.getNorisHub();

    this.hubProxyEventEvents = new HubProxyEvent<ReportHistoryResult>(
      this.traceService, this.hubProxyShared, 'notifyReportExecutions', this.ngZone, this.signalRService);

    this.hubProxyEventEvents.eventChanged.subscribe(values => this.onReportNotification(values));

    this.hubProxyEventSubs = new HubProxyEvent<SubscriptionWsiReport >(
      this.traceService, this.hubProxyShared, 'notifySubscriptionStatus', this.ngZone, this.signalRService, 'notifyReportExecutions');

    this.hubProxyEventSubs.eventChanged.subscribe(subscription => this.onNotifySubscriptions(subscription));
  }

  private onReportNotification(value: ReportHistoryResult): void {
    this.traceService.info(TraceModules.historyLog, 'ReportSubscriptionService.onReportNotification(): ', value);
    this._report.next(value);
  }

  private onNotifySubscriptions(subscription: SubscriptionWsiReport): void {
    const foundCtx: SubscribeContextChannelizedSingle<boolean> | undefined = this._subscribeRequestsInvoked.get(subscription.RequestId);
    if (foundCtx != undefined) {
      if (this.traceService.isInfoEnabled!) {
        this.traceService.info(TraceModules.historyLog,
          `ReportSubscriptionService.onNotifySubscriptions():
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
          this.traceService.debug(TraceModules.historyLog,
            'ReportSubscriptionService.onNotifySubscriptions(), all subscribe notifies retrieved for context (requestId): %s', foundCtx.id);
        }
        foundCtx.postSubject.complete();
        this._subscribeRequestsInvoked.delete(foundCtx.id);
      }
    } else {
      this.traceService.error(TraceModules.historyLog,
        'ReportSubscriptionService.onNotifySubscriptions(), invalid context (requestId): %s, requestFor: %s;',
        subscription.RequestId, subscription.RequestFor);
    }

    if (this.traceService.isDebugEnabled!) {
      this.traceService.debug(TraceModules.historyLog,
        'ReportSubscriptionService.onNotifySubscriptions(), outstanding subscribe notifications on number of subscribe requests: %s',
        this._subscribeRequestsInvoked.size);

      this.traceService.debug(TraceModules.historyLog,
        'ReportSubscriptionService.onNotifySubscriptions(), pending subscribe requests (due to disconnected): %s',
        this._subscribeRequestsPending.size);
    }
  }
}
