import { HttpClient, HttpHeaders, HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable, NgZone } from '@angular/core';
import { AuthenticationServiceBase, ErrorNotificationServiceBase, TraceService } from '@gms-flex/services-common';
import { Observable, Subject, Subscription } from 'rxjs';
import { catchError, delay, map } from 'rxjs/operators';

import { SubscribeContextChannelizedSingle } from '../shared/subscription/subscribe-context-channelized-single';
import { SubscriptionUtility } from '../shared/subscription/subscription-utility';
import { TraceModules } from '../shared/trace-modules';
import { WsiUtilityService } from '../shared/wsi-utility.service';
import { SignalRService } from '../signalr';
import { HubProxyEvent } from '../signalr/hub-proxy-event';
import { HubProxyShared } from '../signalr/hub-proxy-shared';
import { WsiEndpointService } from '../wsi-endpoint';
import { OperatorTaskInfo, SubscriptionWsiOpTasks, TaskFilterBody } from '../wsi-proxy-api/operator-tasks';
import { OperatorTasksSubscriptionsServiceBase } from '../wsi-proxy-api/operator-tasks/operator-tasks-subscriptions.service.base';
import { ConnectionState } from '../wsi-proxy-api/shared/data.model';

const reconnectTimeout = 5000;

@Injectable({
  providedIn: 'root'
})
export class OperatorTasksSubscriptionsService extends OperatorTasksSubscriptionsServiceBase {
  public hubProxyShared: HubProxyShared | undefined;
  public hubProxyOperatorTasks: HubProxyEvent<OperatorTaskInfo[]> | undefined;
  public hubProxyOperatorTasksSubs: HubProxyEvent<SubscriptionWsiOpTasks> | undefined;

  private readonly _notifyConnectionState: Subject<ConnectionState> = new Subject<ConnectionState>();

  private readonly _subscribeRequestsInvoked: Map<string, SubscribeContextChannelizedSingle<boolean>> =
    new Map<string, SubscribeContextChannelizedSingle<boolean>>();

  private readonly _subscribeRequestsPending: Map<string, SubscribeContextChannelizedSingle<boolean>> =
    new Map<string, SubscribeContextChannelizedSingle<boolean>>();

  private readonly operatorTasksSubscriptionsChannelizeUrl = '/api/sr/OperatorTasksSubscriptions/channelize/';
  private readonly operatorTasksSubscriptionsUrl = '/api/sr/operatortaskssubscriptions/';

  private readonly _operatorTasksChangeNotification: Subject<OperatorTaskInfo[]> = new Subject<OperatorTaskInfo[]>();

  public operatorTasksChangeNotification(): Observable<OperatorTaskInfo[]> {
    return this._operatorTasksChangeNotification;
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
        this.hubProxyShared?.hubConnection?.connectionState.subscribe((value: any) => this.onSignalRConnectionState(value));
        const disconnectedObservable: Observable<boolean> | undefined = this.hubProxyShared?.hubConnection?.disconnected;
        if (disconnectedObservable != undefined) {
          disconnectedObservable.pipe(delay(reconnectTimeout)).subscribe(
            value => this.onSignalRDisconnected(value), error => this.onSignalRDisconnectedError(error));
        }
        this.traceService.info(TraceModules.operatorTasks, 'OperatorTasksSubscriptionsService created.');
      } else {
        this.traceService.info(TraceModules.operatorTasks, 'Access token for the user is blank, cannot create the signalR connection');
      }
    });
  }

  public subscribeOperatorTasks(filter: TaskFilterBody, isSuspended?: boolean): Observable<boolean> {
    const functionName = 'subscribeOperatorTasks()';
    this.traceService.info(TraceModules.operatorTasks, `${functionName}: called`);
    const httpPostProxy: Subject<boolean> = new Subject<boolean>();
    const ctx: SubscribeContextChannelizedSingle<boolean> = new SubscribeContextChannelizedSingle<boolean>(httpPostProxy);

    if (this.hubProxyShared?.hubConnection?.isConnected === false) {
      this._subscribeRequestsPending.set(ctx.id, ctx);
      const connectedSubscription: Subscription = this.hubProxyShared?.hubConnection.connected.subscribe(started => {
        if (started === true) {
          this.traceService.debug(TraceModules.operatorTasks,
            `${functionName}: connected event triggered, connection is now established.`);
          // connection ID is available now, we can setup the "post observable" now and not earlier
          // (=> due to this we cannot use rxjs merge stream functionality such as "concat"!!)
          if (connectedSubscription !== undefined) {
            connectedSubscription.unsubscribe();
          } else {
            this.traceService.error(TraceModules.operatorTasks,
              `${functionName}: Implementation error, we should not reach this!`);
          }
          this.invokeOperatorTasksSubscription(ctx, httpPostProxy, filter, isSuspended ?? false);
          this._subscribeRequestsPending.delete(ctx.id);
        }
      });
      this.hubProxyShared?.hubConnection.startHubConnection();
    } else {
      this.invokeOperatorTasksSubscription(ctx, httpPostProxy, filter, isSuspended ?? false);
    }
    return httpPostProxy.asObservable();
  }

  public unSubscribeOperatorTasks(): Observable<boolean> {
    const functionName = 'unSubscribeOperatorTasks()';
    this.traceService.info(TraceModules.operatorTasks, `${functionName}: called`);
    const httpPostProxy: Subject<boolean> = new Subject<boolean>();

    if (this.hubProxyShared?.hubConnection?.isConnected === false) {
      const connectedSubscription: Subscription = this.hubProxyShared.hubConnection.connected.subscribe(started => {
        if (started === true) {
          this.traceService.debug(TraceModules.operatorTasks,
            `${functionName}: connected event triggered, connection is now established.`);
          if (connectedSubscription !== undefined) {
            connectedSubscription.unsubscribe();
          } else {
            this.traceService.error(TraceModules.operatorTasks,
              `${functionName}:  Implementation error, we should not reach this!`);
          }
          this.traceService.debug(TraceModules.operatorTasks,
            `${functionName}:  http delete can be issued (after connecting)...`);

          this.invokeOperatorTasksDelete(httpPostProxy);
        }
      });
      this.hubProxyShared.hubConnection.startHubConnection();
    } else {
      this.traceService.debug(TraceModules.operatorTasks, `${functionName}:  http delete can be issued immediately`);

      this.invokeOperatorTasksDelete(httpPostProxy);
    }
    return httpPostProxy.asObservable();
  }

  private createEventProxies(): void {
    // Operator Tasks changes can be notified for:

    // notifyChangeOfTasks    -     for any change in operator tasks

    // not supported by Flex client yet..
    // notifyOnModifyFilter   -      any change in subscription filter
    // notifyOnRealign        -      for on Realign tasks

    this.hubProxyShared = this.signalRService.getNorisHub();

    this.hubProxyOperatorTasks = new HubProxyEvent<OperatorTaskInfo[]>(
      this.traceService, this.hubProxyShared, 'notifyChangeOfTasks', this.ngZone, this.signalRService);

    this.hubProxyOperatorTasks.eventChanged.subscribe(
      values => this.onNotifyOperatorTasksChanges(values),
      err => this.traceService.error(TraceModules.operatorTasks,
        'onNotifyOperatorTasksChanges() not able to receive subscription : %s', err.toString()
      ));

    this.hubProxyOperatorTasksSubs = new HubProxyEvent<SubscriptionWsiOpTasks>(
      this.traceService, this.hubProxyShared, 'notifySubscriptionStatus', this.ngZone, this.signalRService, 'notifyChangeOfTasks');

    this.hubProxyOperatorTasksSubs.eventChanged.subscribe(subscription => this.onNotifySubscriptions(subscription));
  }

  private onNotifyOperatorTasksChanges(values: OperatorTaskInfo[]): void {
    this._operatorTasksChangeNotification.next(values);
  }

  private onNotifySubscriptions(subscription: SubscriptionWsiOpTasks): void {
    const functionName = 'onNotifySubscriptions()';
    const foundCtx: SubscribeContextChannelizedSingle<boolean> | undefined = this._subscribeRequestsInvoked.get(subscription.RequestId);
    if (foundCtx != undefined) {
      if (this.traceService.isDebugEnabled!) {
        this.traceService.debug(TraceModules.operatorTasks,
          `${functionName}:
           context (requestId): %s; errorCode: %s; requestFor: %s; connectionState: %s`,
          foundCtx.id, subscription.ErrorCode, subscription.RequestFor,
          this.hubProxyShared?.hubConnection?.connectionStateValueText);
      }
      const isSucceeded: boolean = subscription.ErrorCode === 0;

      foundCtx.setReply(isSucceeded);
      // reply every single subscription request as the API is Request-MultiReply
      foundCtx.postSubject.next(isSucceeded);
      if (foundCtx.checkAllRepliesDone() === true) {
        this.traceService.info(TraceModules.operatorTasks,
          `${functionName}: all subscribe notifies retrieved for context (requestId): %s`, foundCtx.id);
        foundCtx.postSubject.complete();
        this._subscribeRequestsInvoked.delete(foundCtx.id);
      }
    } else {
      this.traceService.error(TraceModules.operatorTasks,
        `${functionName}: invalid context (requestId): %s, requestFor: %s;`,
        subscription.RequestId, subscription.RequestFor);
    }

    if (this.traceService.isDebugEnabled!) {
      this.traceService.debug(TraceModules.operatorTasks,
        `${functionName}: outstanding subscribe notifications on number of subscribe requests: %s`,
        this._subscribeRequestsInvoked.size);

      this.traceService.debug(TraceModules.operatorTasks,
        `${functionName}: pending subscribe requests (due to disconnected): %s`,
        this._subscribeRequestsPending.size);
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
    this.traceService.error(TraceModules.operatorTasks, 'onSignalRDisconnectedError(): %s', error.toString());
  }

  private onSignalRDisconnected(value: boolean): void {
    if (value === true) {
      if (this.hubProxyShared?.hubConnection?.connectionStateValue === SignalR.ConnectionState.Disconnected) {
        this.traceService.info(TraceModules.operatorTasks, 'onSignalRDisconnected(): starting again the connection');
        this.hubProxyShared.hubConnection.startHubConnection();
      }
    }
  }

  private invokeOperatorTasksSubscription(ctx: SubscribeContextChannelizedSingle<boolean>,
    httpPostProxy: Subject<boolean>, filter: TaskFilterBody, isSuspended: boolean): void {

    const functionName = 'invokeOperatorTasksSubscription()';
    const headers: HttpHeaders = this.wsiUtilityService.httpPostDefaultHeader(this.authenticationServiceBase.userToken);
    const url: string = this.wsiEndpointService.entryPoint + this.operatorTasksSubscriptionsChannelizeUrl + ctx.id + '/' + this.hubProxyShared?.connectionId;
    let params: HttpParams = new HttpParams();
    params = params.append('isSuspended', String(isSuspended));

    const httpPost: Observable<boolean> = this.httpClient.post(url, filter, { params, headers }).pipe(
      map((response: HttpResponse<any> | any) => {
        if (response) {
          this.wsiUtilityService.extractData(response, TraceModules.operatorTasks, functionName);
        }
      }),
      catchError((response: HttpResponse<any>) =>
        this.wsiUtilityService.handleError(response, TraceModules.operatorTasks, functionName, this.errorService)));

    httpPost.subscribe(value => this.onSubscribeServiceNext(value, httpPostProxy),
      error => this. onSubscribeServiceNextError(error, ctx, httpPostProxy));

    this._subscribeRequestsInvoked.set(ctx.id, ctx);
  }

  private invokeOperatorTasksDelete(httpPostProxy: Subject<boolean>): void {
    const functionName = 'invokeOperatorTasksDelete()';
    const headers: HttpHeaders = this.wsiUtilityService.httpDeleteDefaultHeader(this.authenticationServiceBase.userToken);

    const url: string = this.wsiEndpointService.entryPoint + this.operatorTasksSubscriptionsUrl + this.hubProxyShared?.connectionId;
    const httpPost: Observable<boolean> = this.httpClient.delete(url, { headers, observe: 'response' }).pipe(
      map((response: HttpResponse<any>) =>
        this.wsiUtilityService.extractData(response, TraceModules.operatorTasks, functionName)),
      catchError((response: HttpResponse<any>) => this.wsiUtilityService.handleError(response, TraceModules.operatorTasks,
        functionName, this.errorService)));
    httpPost.subscribe(value => this.onUnsubscribeOperatorTasksNext(value, httpPostProxy),
      error => this.onUnsubscribeOperatorTasksError(error, httpPostProxy));
  }

  private onSubscribeServiceNext(value: boolean, httpPostProxy: Subject<boolean>): void {
    this.traceService.info(TraceModules.operatorTasks,
      'onSubscribeServiceNext() done: success=%s', value);
  }

  private onSubscribeServiceNextError(error: any, ctx: SubscribeContextChannelizedSingle<boolean>, httpPostProxy: Subject<boolean>): void {
    this.traceService.warn(TraceModules.operatorTasks,
      'onSubscribeTasksError(); http post returned an error; %s', error);
    this._subscribeRequestsInvoked.delete(ctx.id);
    httpPostProxy.error(error);
  }

  private onUnsubscribeOperatorTasksNext(value: boolean, httpPostProxy: Subject<boolean>): void {
    httpPostProxy.next(value);
    httpPostProxy.complete();
  }

  private onUnsubscribeOperatorTasksError(error: any, httpPostProxy: Subject<boolean>): void {
    this.traceService.warn(TraceModules.operatorTasks,
      'onUnsubscribeOperatorTasksError(); http post returned an error; %s', error);
    httpPostProxy.error(error);
  }
}
