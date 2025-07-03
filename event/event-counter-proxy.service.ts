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
import { EventCounter, EventCounterList, SubscriptionWsiEventCounters } from '../wsi-proxy-api/event/data.model';
import { EventCounterProxyServiceBase } from '../wsi-proxy-api/event/event-counter-proxy.service.base';
import { ConnectionState } from '../wsi-proxy-api/shared/data.model';

const eventCountersUrl = '/api/eventcounters/';
const eventCountersSubscriptionUrl = '/api/sr/eventcounterssubscriptions/';
const eventCountersSubscriptionChannelizeUrl = '/api/sr/eventcounterssubscriptions/channelize/';
const unSubscribeEventCountersTrace = 'unSubscribeEventCounters()';

const reconnectTimeout = 5000;

/**
 * Implementation for the WSI event counter service.
 * See the WSI API documentation for details.
 *
 * @export
 * @class EventCounterProxyService
 * @extends {EventCounterProxyServiceBase}
 */
@Injectable({
  providedIn: 'root'
})
export class EventCounterProxyService extends EventCounterProxyServiceBase {

  public hubProxyShared: HubProxyShared | undefined;
  public hubProxyEventEventCounters: HubProxyEvent<EventCounterList> | undefined;
  public hubProxyEventSubs: HubProxyEvent<SubscriptionWsiEventCounters> | undefined;

  private readonly _notifyConnectionState: Subject<ConnectionState> = new Subject<ConnectionState>();
  private readonly _subscribeRequestsInvoked: Map<string, SubscribeContextChannelizedSingle<boolean>> =
    new Map<string, SubscribeContextChannelizedSingle<boolean>>();
  private readonly _subscribeRequestsPending: Map<string, SubscribeContextChannelizedSingle<boolean>> =
    new Map<string, SubscribeContextChannelizedSingle<boolean>>();

  private _eventCounters: Subject<EventCounterList> = new Subject<EventCounterList>();
  private readonly gotDisconnected = false;
  private isSubscribed = false;
  private readonly isFirstInjection = true;

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
        this.traceService.info(TraceModules.events, 'Event counter service created.');
      } else {
        this.traceService.info(TraceModules.events, 'Access token for the user is blank, cannot create the signalR connection');
      }
    });
  }

  public notifyConnectionState(): Observable<ConnectionState> {
    return this._notifyConnectionState.asObservable();
  }

  /**
   * Gets all event counters for all categories of the system.
   *
   * @returns {Observable<EventCounterList>}
   *
   * @memberOf EventCounterProxyService
   */
  public getEventCountersAll(): Observable<EventCounterList> {
    this.traceService.info(TraceModules.events, 'getEventCountersAll() called.');
    const headers: HttpHeaders = this.wsiUtilityService.httpGetDefaultHeader(this.authenticationServiceBase.userToken);
    const url: string = this.wsiEndpointService.entryPoint + eventCountersUrl;

    return this.httpClient.get(url, { headers, observe: 'response' }).pipe(
      map((response: HttpResponse<any>) => this.wsiUtilityService.extractData(response, TraceModules.events, 'getEventCountersAll()')),
      catchError((response: HttpResponse<any>) =>
        this.wsiUtilityService.handleError(response, TraceModules.events, 'getEventCountersAll()', this.errorService)));
  }

  /**
   * Gets the event counters for the specified category Id
   *
   * @param {number } categoryId
   * @returns {Observable<EventCounter>}
   *
   * @memberOf EventCounterProxyService
   */
  public getEventCounters(categoryId: number): Observable<EventCounter> {
    this.traceService.info(TraceModules.events, 'getEventCounters() called. categoryId: %s', categoryId);
    const headers: HttpHeaders = this.wsiUtilityService.httpGetDefaultHeader(this.authenticationServiceBase.userToken);
    let url: string = this.wsiEndpointService.entryPoint + eventCountersUrl;
    if (categoryId != undefined) {
      url += categoryId.toString();
    }

    return this.httpClient.get(url, { headers, observe: 'response' }).pipe(
      map((response: HttpResponse<any>) => this.wsiUtilityService.extractData(response, TraceModules.events, 'getEventCounters()')),
      catchError((response: HttpResponse<any>) => this.wsiUtilityService.handleError(response, TraceModules.events, 'getEventCounters()', this.errorService)));
  }

  /**
   * Subscribes for all event counters of the system.
   *
   * @returns {Observable<void>}
   *
   * @memberOf EventCounterProxyService
   */
  public subscribeEventCounters(hiddenEvents = false): Observable<boolean> {
    this.traceService.info(TraceModules.events, 'EventCounterProxyService.subscribeEventCounters() called.');
    this.traceService.info(TraceModules.eventCounterTiming, 'EventCounterProxyService.subscribeEventCounters() called.');
    const startTime = performance.now();

    this.isSubscribed = true;
    const headers: HttpHeaders = this.wsiUtilityService.httpPostDefaultHeader(this.authenticationServiceBase.userToken);
    const httpPostProxy: Subject<boolean> = new Subject<boolean>();
    const ctx: SubscribeContextChannelizedSingle<boolean> = new SubscribeContextChannelizedSingle<boolean>(httpPostProxy);

    // eslint-disable-next-line @typescript-eslint/naming-convention
    const body: any = JSON.stringify({ 'ShowHiddenEvents': hiddenEvents });

    if (this.hubProxyShared?.hubConnection?.isConnected === false) {
      this._subscribeRequestsPending.set(ctx.id, ctx);
      this.traceService.debug(TraceModules.events,
        'subscribeEventCounters(): signalr connection not established; need to wait (postpone http calls) until established in order to get connection id.');
      const connectedSubscription: Subscription = this.hubProxyShared.hubConnection.connected.subscribe(started => {
        if (started === true) {
          this.traceService.debug(TraceModules.events, 'subscribeEventCounters(): connected event triggered; conection is now established.');
          // connection ID is available now, we can setup the "post observable" now and not earlier
          // (=> due to this we cannot use rxjs merge stream functionality such as "concat"!!)
          if (connectedSubscription !== undefined) {
            connectedSubscription.unsubscribe();
          }
          const url: string = this.wsiEndpointService.entryPoint + eventCountersSubscriptionChannelizeUrl + ctx.id + '/' + this.hubProxyShared?.connectionId;
          const httpPost: Observable<boolean> = this.httpClient.post(url, body, { headers }).pipe(
            map((response: HttpResponse<any> | any) =>
              this.extractData(response)),
            catchError((response: HttpResponse<any>) =>
              this.wsiUtilityService.handleError(response, TraceModules.events, 'subscribeEventCounters()', this.errorService)));
          this.traceService.debug(TraceModules.events,
            'EventCounterProxyService.subscribeEventCounters(); http post can be issued now (after connecting)...');
          this.traceService.info(TraceModules.eventCounterTiming,
            'EventCounterProxyService.subscribeEventCounters(); http post can be issued now (after connecting)...');
          httpPost.subscribe(value => this.onSubscribeEventCountersNext(value, httpPostProxy, startTime),
            error => this.onSubscribeEventCountersError(error, ctx, httpPostProxy));
          this._subscribeRequestsInvoked.set(ctx.id, ctx);
          this._subscribeRequestsPending.delete(ctx.id);
        }
      });
      this.hubProxyShared.hubConnection.startHubConnection();
    } else {
      const url: string = this.wsiEndpointService.entryPoint + eventCountersSubscriptionChannelizeUrl + ctx.id + '/' + this.hubProxyShared?.connectionId;
      const httpPost: Observable<boolean> = this.httpClient.post(url, body, { headers }).pipe(
        map((response: HttpResponse<any> | any) =>
          this.extractData(response)),
        catchError((response: HttpResponse<any>) =>
          this.wsiUtilityService.handleError(response, TraceModules.events, 'subscribeEventCounters()', this.errorService)));
      this.traceService.debug(TraceModules.events,
        'EventCounterProxyService.subscribeEventCounters(); http post can be issued immediately...');
      this.traceService.info(TraceModules.eventCounterTiming,
        'EventCounterProxyService.subscribeEventCounters(); http post can be issued immediately...');
      httpPost.subscribe(value => this.onSubscribeEventCountersNext(value, httpPostProxy, startTime),
        error => this.onSubscribeEventCountersError(error, ctx, httpPostProxy));
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
  public eventCountersNotification(): Observable<EventCounterList> {
    /* if null this one is not called, so no new subject */
    if (this._eventCounters === undefined) {
      this._eventCounters = new Subject<EventCounterList>();
    }
    return this._eventCounters.asObservable();
  }

  public unSubscribeEventCounters(): Observable<boolean> {
    this.traceService.info(TraceModules.events, 'EventCounterProxyService.unSubscribeEventCounters() called');
    this.isSubscribed = false;
    const headers: HttpHeaders = this.wsiUtilityService.httpDeleteDefaultHeader(this.authenticationServiceBase.userToken);
    const httpPostProxy: Subject<boolean> = new Subject<boolean>();

    if (this.hubProxyShared?.hubConnection?.isConnected === false) {
      this.traceService.debug(TraceModules.events,
        'unSubscribeEventCounters(): signalr connection not established; need to wait (postpone http calls) until established in order to get connection id.');
      const connectedSubscription: Subscription = this.hubProxyShared.hubConnection.connected.subscribe(started => {
        if (started === true) {
          this.traceService.debug(TraceModules.events, 'unSubscribeEventCounters(): connected event triggered: connection is now established.');
          // connection ID is available now, we can setup the "post observable" now and not earlier
          // => due to this we cannot use rxjs merge stream functionality such as "concat"!!
          if (connectedSubscription !== undefined) {
            connectedSubscription.unsubscribe();
          }
          this.traceService.debug(TraceModules.events, 'unSubscribeEventCounters(); http delete can be issued (after connecting)...');
          const url: string = this.wsiEndpointService.entryPoint + (eventCountersSubscriptionUrl + this.hubProxyShared?.connectionId);
          const httpPost: Observable<boolean> = this.httpClient.delete(url, { headers, observe: 'response' }).pipe(
            map((response: HttpResponse<any>) =>
              this.wsiUtilityService.extractData(response, TraceModules.events, unSubscribeEventCountersTrace)),
            catchError((response: HttpResponse<any>) =>
              this.wsiUtilityService.handleError(response, TraceModules.events, unSubscribeEventCountersTrace, this.errorService)));
          httpPost.subscribe(value => this.onUnsubscribeEventCountersNext(value, httpPostProxy),
            error => this.onUnsubscribeEventCountersError(error, httpPostProxy));
        }
      });
      this.hubProxyShared.hubConnection.startHubConnection();
    } else {
      this.traceService.debug(TraceModules.events, 'unSubscribeEventCounters(); http delete can be issued immediately');
      const url: string = this.wsiEndpointService.entryPoint + (eventCountersSubscriptionUrl + this.hubProxyShared?.connectionId);
      const httpPost: Observable<boolean> = this.httpClient.delete(url, { headers, observe: 'response' }).pipe(
        map((response: HttpResponse<any>) =>
          this.wsiUtilityService.extractData(response, TraceModules.events, unSubscribeEventCountersTrace)),
        catchError((response: HttpResponse<any>) =>
          this.wsiUtilityService.handleError(response, TraceModules.events, unSubscribeEventCountersTrace, this.errorService)));
      httpPost.subscribe(value => this.onUnsubscribeEventCountersNext(value, httpPostProxy),
        error => this.onUnsubscribeEventCountersError(error, httpPostProxy));
    }
    return httpPostProxy.asObservable();
  }

  private extractData(res: HttpResponse<any>): boolean {
    return true;
  }

  private onSubscribeEventCountersNext(value: boolean, httpPostProxy: Subject<boolean>, startTime: number): void {
    this.traceService.info(TraceModules.events, 'EventCounterProxyService.onSubscribeEventCounters() done: success=%s', value);
    this.traceService.info(TraceModules.eventCounterTiming, 'EventCounterProxyService.onSubscribeEventCounters() done: success=%s, time=%sms',
      value, performance.now() - startTime);
    // nothing to do if okay! we need to wait of the subscription notification over signalR
  }

  private onSubscribeEventCountersError(error: any, ctx: SubscribeContextChannelizedSingle<boolean>, httpPostProxy: Subject<boolean>): void {
    this.traceService.warn(TraceModules.events, 'EventCounterProxyService.onSubscribeEventCountersError(); http post returned an error; %s', error);
    this._subscribeRequestsInvoked.delete(ctx.id);
    httpPostProxy.error(error);
  }

  private onUnsubscribeEventCountersNext(value: boolean, httpPostProxy: Subject<boolean>): void {
    httpPostProxy.next(value);
    httpPostProxy.complete();
  }

  private onUnsubscribeEventCountersError(error: any, httpPostProxy: Subject<boolean>): void {
    this.traceService.warn(TraceModules.events, 'EventCounterProxyService.onUnsubscribeEventCountersError(); http post returned an error; %s', error);
    httpPostProxy.error(error);
  }

  private createEventProxies(): void {
    this.hubProxyShared = this.signalRService.getNorisHub();
    this.hubProxyEventEventCounters = new HubProxyEvent<EventCounterList>(
      this.traceService, this.hubProxyShared, 'notifyEventCounters', this.ngZone, this.signalRService);
    this.hubProxyEventEventCounters.eventChanged.subscribe(
      values => this.onEventCountersNotification(values),
      err => this.traceService.error(TraceModules.events,
        'EventCounterProxyService.onEventCountersNotification() not able to receive subscription : %s', err.toString()
      ));
    this.hubProxyEventSubs = new HubProxyEvent<SubscriptionWsiEventCounters>(
      this.traceService, this.hubProxyShared, 'notifySubscriptionStatus', this.ngZone, this.signalRService, 'notifyEventCounters');
    this.hubProxyEventSubs.eventChanged.subscribe(subscription => this.onNotifySubscriptions(subscription));
  }

  private onEventCountersNotification(eventCounters: EventCounterList): void {
    if (this.traceService.isDebugEnabled(TraceModules.eventCounterNotifications)) {
      let trcStr = `Total counters=${eventCounters.TotalCounters}; Unprocessed counters=${eventCounters.TotalUnprocessedCounters}`;
      eventCounters.EventCategoryCounters.forEach(val => {
        trcStr = trcStr + '\n' + `Category=${val.CategoryDescriptor}; Total count=${val.TotalCount}; Unprocessed count=${val.UnprocessedCount}`;
      });
      this.traceService.debug(TraceModules.eventCounterNotifications, 'EventCounterProxyService:onEventCountersNotification():\n' + trcStr);
    }
    this._eventCounters.next(eventCounters);
  }

  private onSignalRDisconnectedError(error: any): void {
    this.traceService.error(TraceModules.events, 'EventCounterProxyService.onSignalRDisconnectedError(): %s', error.toString());
  }

  private onSignalRDisconnected(value: boolean): void {
    if (value === true) {
      if (this.hubProxyShared?.hubConnection?.connectionStateValue === SignalR.ConnectionState.Disconnected) {
        this.traceService.info(TraceModules.events, 'EventCounterProxyService.onSignalRDisconnected(): starting again the connection');
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

  private onNotifySubscriptions(subscription: SubscriptionWsiEventCounters): void {
    const foundCtx: SubscribeContextChannelizedSingle<boolean> | undefined = this._subscribeRequestsInvoked.get(subscription.RequestId);
    if (foundCtx != undefined) {
      if (this.traceService.isDebugEnabled!) {
        this.traceService.debug(TraceModules.events,
          `EventCounterProxyService.onNotifySubscriptions():
           context (requestId): %s; errorCode: %s; requestFor: %s; connectionState: %s`,
          foundCtx.id, subscription.ErrorCode, subscription.RequestFor,
          this.hubProxyShared?.hubConnection?.connectionStateValueText);
      }

      const isSucceeded: boolean = subscription.ErrorCode === 0;

      foundCtx.setReply(isSucceeded);
      // reply every single subscription request as the API is Request-MultiReply
      foundCtx.postSubject.next(isSucceeded);
      if (foundCtx.checkAllRepliesDone() === true) {
        this.traceService.debug(TraceModules.events,
          'EventCounterProxyService.onNotifySubscriptions(), all subscribe notifies retrieved for context (requestId): %s', foundCtx.id);
        this.traceService.info(TraceModules.eventCounterTiming,
          'EventCounterProxyService.onNotifySubscriptions(), all subscribe notifications retrieved for context (requestId): %s and requestFor: %s',
          foundCtx.id, subscription.RequestFor);

        foundCtx.postSubject.complete();
        this._subscribeRequestsInvoked.delete(foundCtx.id);
      }
    } else {
      this.traceService.error(TraceModules.events,
        'EventCounterProxyService.onNotifySubscriptions(), invalid context (requestId): %s, requestFor: %s;',
        subscription.RequestId, subscription.RequestFor);
    }

    if (this.traceService.isDebugEnabled!) {
      this.traceService.debug(TraceModules.events,
        'EventCounterProxyService.onNotifySubscriptions(), outstanding subscribe notifications on number of subscribe requests: %s',
        this._subscribeRequestsInvoked.size);

      this.traceService.debug(TraceModules.events,
        'EventCounterProxyService.onNotifySubscriptions(), pending subscribe requests (due to disconnected): %s',
        this._subscribeRequestsPending.size);
    }
  }

}
