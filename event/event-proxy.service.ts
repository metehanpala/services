/* eslint-disable @typescript-eslint/naming-convention */
import { HttpClient, HttpHeaders, HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable, NgZone } from '@angular/core';
import { AuthenticationServiceBase, ErrorNotificationServiceBase, isNullOrUndefined, TraceService } from '@gms-flex/services-common';
import { Observable, of, Subject, Subscription } from 'rxjs';
import { catchError, delay, map, tap } from 'rxjs/operators';

import { SubscribeContextChannelizedSingle } from '../shared/subscription/subscribe-context-channelized-single';
import { SubscriptionUtility } from '../shared/subscription/subscription-utility';
import { TraceModules } from '../shared/trace-modules';
import { WsiUtilityService } from '../shared/wsi-utility.service';
import { HubProxyEvent } from '../signalr/hub-proxy-event';
import { HubProxyShared } from '../signalr/hub-proxy-shared';
import { SignalRService } from '../signalr/signalr.service';
import { WsiEndpointService } from '../wsi-endpoint/wsi-endpoint.service';
import { SubscriptionWsiEvent, WSIEvent } from '../wsi-proxy-api/event/data.model';
import { EventProxyServiceBase } from '../wsi-proxy-api/event/event-proxy.service.base';
import { ConnectionState, ValidationInput } from '../wsi-proxy-api/shared/data.model';

const eventsUrl = '/api/events';
const eventsSubscriptionUrl = '/api/sr/eventssubscriptions/';
const eventsSubscriptionChannelizeUrl = '/api/sr/eventssubscriptions/channelize/';
const eventsCommandUrl = '/api/eventscommands/';
const serverOffsetUrl = '/api/diagnostics';
const noConnectionTrace = 'signalr connection not established; need to wait (postpone http calls) until established in order to get connection id.';
const unSubscribeEventsTrace = 'EventProxyService.unSubscribeEvents()';
const postCommand2EventsTrace = 'EventProxyService.postCommand2Events()';

const reconnectTimeout = 5000;

const defaultComment = 'Default Comment';
/**
 * Event proxy service.
 * Provides the functionality to read events from WSI.
 *
 * @export
 * @class EventService
 * @extends {EventBase}
 */
@Injectable({
  providedIn: 'root'
})
export class EventProxyService extends EventProxyServiceBase {

  public hubProxyShared: HubProxyShared | undefined;
  public hubProxyEventEvents: HubProxyEvent<WSIEvent[]> | undefined;
  public hubProxyEventSubs: HubProxyEvent<SubscriptionWsiEvent> | undefined;

  private readonly _notifyConnectionState: Subject<ConnectionState> = new Subject<ConnectionState>();
  private readonly _subscribeRequestsInvoked: Map<string, SubscribeContextChannelizedSingle<boolean>> =
    new Map<string, SubscribeContextChannelizedSingle<boolean>>();
  private readonly _subscribeRequestsPending: Map<string, SubscribeContextChannelizedSingle<boolean>> =
    new Map<string, SubscribeContextChannelizedSingle<boolean>>();

  private readonly _eventsWsi: Subject<WSIEvent[]> = new Subject<WSIEvent[]>();

  public constructor(
    private readonly traceService: TraceService,
    private readonly wsiEndpointService: WsiEndpointService,
    private readonly authenticationServiceBase: AuthenticationServiceBase,
    private readonly wsiUtilityService: WsiUtilityService,
    private readonly signalRService: SignalRService,
    private readonly errorService: ErrorNotificationServiceBase,
    private readonly httpClient: HttpClient,
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
        this.traceService.info(TraceModules.events, 'EventProxyService created.');
      } else {
        this.traceService.info(TraceModules.events, 'NorisHub connection is not established!');
      }
    });
  }

  public getEvents(): Observable<WSIEvent[]> {
    this.traceService.info(TraceModules.events, 'EventProxyService.getEvents() called.');

    const headers: HttpHeaders = this.wsiUtilityService.httpGetDefaultHeader(this.authenticationServiceBase.userToken);
    const url: string = this.wsiEndpointService.entryPoint + eventsUrl;

    return this.httpClient.get<WSIEvent[]>(url, { headers }).pipe(
      tap((res: WSIEvent[]) => { this.traceService.info(TraceModules.events, 'EventProxyService.getEvents() http call returns.'); }),
      catchError(this.handleError<WSIEvent[]>('getEvents', []))
    );
  }

  public eventsNotification(): Observable<WSIEvent[]> {
    return this._eventsWsi.asObservable();
  }

  public notifyConnectionState(): Observable<ConnectionState> {
    return this._notifyConnectionState.asObservable();
  }

  public unsubscribeEvents(): Observable<boolean> {
    this.traceService.info(TraceModules.events, 'EventProxyService.unSubscribeEvents() called');

    const headers: HttpHeaders = this.wsiUtilityService.httpDeleteDefaultHeader(this.authenticationServiceBase.userToken);
    const httpPostProxy: Subject<boolean> = new Subject<boolean>();

    if (this.hubProxyShared?.hubConnection?.isConnected === false) {
      this.traceService.debug(TraceModules.events,
        'EventProxyService.unSubscribeEventCounters(): ' + noConnectionTrace);
      const connectedSubscription: Subscription = this.hubProxyShared.hubConnection.connected.subscribe(started => {
        if (started === true) {
          this.traceService.debug(TraceModules.events,
            'EventProxyService.unSubscribeEventCounters(): connected event triggered: connection is now established.');
          // connection ID is available now, we can setup the "post observable" now and not earlier
          // => due to this we cannot use rxjs merge stream functionality such as "concat"!!
          if (connectedSubscription !== undefined) {
            connectedSubscription.unsubscribe();
          } else {
            this.traceService.error(TraceModules.events, 'EventProxyService.unSubscribeEventCounters(); Implementation error, we should not reach this!');
          }
          this.traceService.debug(TraceModules.events, 'EventProxyService.unSubscribeEventCounters(); http delete can be issued (after connecting)...');
          const url: string = this.wsiEndpointService.entryPoint + eventsSubscriptionUrl + this.hubProxyShared?.connectionId;
          const httpPost: Observable<boolean> = this.httpClient.delete(url, { headers, observe: 'response' }).pipe(
            map((response: HttpResponse<any>) =>
              this.wsiUtilityService.extractData(response, TraceModules.events, unSubscribeEventsTrace)),
            catchError((response: HttpResponse<any>) => this.wsiUtilityService.handleError(response, TraceModules.events,
              unSubscribeEventsTrace, this.errorService)));
          httpPost.subscribe(value => this.onUnsubscribeEventsNext(value, httpPostProxy),
            error => this.onUnsubscribeEventsError(error, httpPostProxy));
        }
      });
      this.hubProxyShared.hubConnection.startHubConnection();
    } else {
      this.traceService.debug(TraceModules.events, 'EventProxyService.unSubscribeEventCounters(); http delete can be issued immediately');
      const url: string = this.wsiEndpointService.entryPoint + eventsSubscriptionUrl + this.hubProxyShared?.connectionId;
      const httpPost: Observable<boolean> = this.httpClient.delete(url, { headers, observe: 'response' }).pipe(
        map((response: HttpResponse<any>) =>
          this.wsiUtilityService.extractData(response, TraceModules.events, unSubscribeEventsTrace)),
        catchError((response: HttpResponse<any>) =>
          this.wsiUtilityService.handleError(response, TraceModules.events, unSubscribeEventsTrace, this.errorService)));
      httpPost.subscribe(value => this.onUnsubscribeEventsNext(value, httpPostProxy),
        error => this.onUnsubscribeEventsError(error, httpPostProxy));
    }
    return httpPostProxy.asObservable();
  }

  // manages bulk commanding when addressing more than 1 event
  public postCommand2Events(evIds: string[], commandId: string, treatmentType?: string, validationInput?: ValidationInput): Observable<boolean> {
    const headers: HttpHeaders = this.wsiUtilityService.httpPostDefaultHeader(this.authenticationServiceBase.userToken);
    const httpPostProxy: Subject<boolean> = new Subject<boolean>();

    let body: any;

    let url: string;

    if (evIds.length === 1) {
      url = this.wsiEndpointService.entryPoint + (eventsCommandUrl + encodeURIComponent(encodeURIComponent(encodeURIComponent(evIds[0]))) + '/' + commandId);
    } else {
      url = this.wsiEndpointService.entryPoint + (eventsCommandUrl + commandId);
    }

    if (treatmentType !== undefined) {
      url = url + '?treatmenttype=' + treatmentType;
    }

    // Set a default comment in the case of null comment insertion to avoid WSI errors
    if (validationInput) {
      if (!isNullOrUndefined(validationInput?.Comments)) {
        if (isNullOrUndefined(validationInput?.Comments.CommonText)) {
          validationInput.Comments = {
            CommonText: defaultComment, // Set default CommonText
            MultiLangText: undefined as unknown as string[] // Set default MultiLangText to undefined, setting it to empty array will return an error from WSI
          };
        }
      }

      if (validationInput?.Comments !== undefined || validationInput?.SuperName !== undefined) {
        if (evIds.length > 1) {
          body = {
            'ValidationInput': {
              'Comments': {
                'CommonText': validationInput?.Comments.CommonText,
                'MultiLangText': [
                  validationInput?.Comments.MultiLangText
                ]
              },
              'Password': validationInput?.Password,
              'SuperName': validationInput?.SuperName,
              'SuperPassword': validationInput?.SuperPassword,
              'SessionKey': validationInput?.SessionKey
            },
            'EventIds': evIds
          };
        } else {
          body = {
            'Comments': {
              'CommonText': validationInput?.Comments.CommonText,
              'MultiLangText': [
                validationInput?.Comments.MultiLangText
              ]
            },
            'Password': validationInput?.Password,
            'SuperName': validationInput?.SuperName,
            'SuperPassword': validationInput?.SuperPassword,
            'SessionKey': validationInput?.SessionKey,
            'EventIds': evIds
          };
        }
      } else {
        body = {
          'EventIds': evIds
        };
      }
    } else {
      body = {
        'EventIds': evIds
      };
    }

    body = JSON.stringify(body);

    if (this.hubProxyShared?.hubConnection?.isConnected === false) {
      this.traceService.debug(TraceModules.events,
        'EventProxyService.postCommand2Events(): ' + noConnectionTrace);
      const connectedSubscription: Subscription = this.hubProxyShared.hubConnection.connected.subscribe(started => {
        if (started === true) {
          this.traceService.debug(TraceModules.events, 'EventProxyService.postCommand2Events(): connected event triggered; connection is now established.');
          if (connectedSubscription !== undefined) {
            connectedSubscription.unsubscribe();
          } else {
            this.traceService.error(TraceModules.events, 'EventProxyService.postCommand2Events(); Implementation error');
          }
          const httpPost: Observable<boolean> = this.httpClient.post(url, body, { headers, observe: 'response' }).pipe(
            map((response: HttpResponse<any>) =>
              this.wsiUtilityService.extractData(response, TraceModules.events, postCommand2EventsTrace)),
            catchError((response: HttpResponse<any>) =>
              this.wsiUtilityService.handleError(response, TraceModules.events, postCommand2EventsTrace, this.errorService)));
          this.traceService.debug(TraceModules.events, 'EventProxyService.postCommand2Events(); http post can be issued now (after connecting)...');

          httpPost.subscribe(value => this.onPostCommand2EventsNext(value, httpPostProxy),
            error => this.onPostCommand2EventsError(error, httpPostProxy));
        }
      });
      this.hubProxyShared.hubConnection.startHubConnection();
    } else {
      const httpPost: Observable<boolean> = this.httpClient.post(url, body, { headers, observe: 'response' }).pipe(
        map((response: HttpResponse<any>) =>
          this.wsiUtilityService.extractData(response, TraceModules.events, postCommand2EventsTrace)),
        catchError((response: HttpResponse<any>) =>
          this.wsiUtilityService.handleError(response, TraceModules.events, postCommand2EventsTrace, this.errorService)));
      this.traceService.debug(TraceModules.events, 'EventProxyService.postCommand2Events(); http post can be issued now (after connecting)...');

      httpPost.subscribe(value => this.onPostCommand2EventsNext(value, httpPostProxy),
        error => this.onPostCommand2EventsError(error, httpPostProxy));
    }
    return httpPostProxy.asObservable();
  }

  public subscribeEvents(hiddenEvents = false): Observable<boolean> {
    this.traceService.info(TraceModules.events, 'EventProxyService.subscribeEvents() called.');
    this.traceService.info(TraceModules.eventsTiming, 'EventProxyService.subscribeEvents() called.');
    const startTime = performance.now();

    const headers: HttpHeaders = this.wsiUtilityService.httpPostDefaultHeader(this.authenticationServiceBase.userToken);
    const httpPostProxy: Subject<boolean> = new Subject<boolean>();
    const ctx: SubscribeContextChannelizedSingle<boolean> = new SubscribeContextChannelizedSingle<boolean>(httpPostProxy);

    // eslint-disable-next-line @typescript-eslint/naming-convention
    const body: any = JSON.stringify({ 'ShowHiddenEvents': hiddenEvents });

    if (this.hubProxyShared?.hubConnection?.isConnected === false) {
      this._subscribeRequestsPending.set(ctx.id, ctx);
      this.traceService.debug(TraceModules.events,
        'EventProxyService.subscribeEvents(): ' + noConnectionTrace);
      const connectedSubscription: Subscription = this.hubProxyShared.hubConnection.connected.subscribe(started => {
        if (started === true) {
          this.traceService.debug(TraceModules.events, 'EventProxyService.subscribeEvents(): connected event triggered; connection is now established.');
          // connection ID is available now, we can setup the "post observable" now and not earlier
          // (=> due to this we cannot use rxjs merge stream functionality such as "concat"!!)
          if (connectedSubscription !== undefined) {
            connectedSubscription.unsubscribe();
          } else {
            this.traceService.error(TraceModules.events, 'EventProxyService.subscribeEvents(); Implementation error, we should not reach this!');
          }
          const url: string = this.wsiEndpointService.entryPoint + eventsSubscriptionChannelizeUrl + ctx.id + '/' + this.hubProxyShared?.connectionId;
          const httpPost: Observable<boolean> = this.httpClient.post(url, body, { headers }).pipe(
            map((response: HttpResponse<any> | any) => this.extractData(response)),
            catchError((response: HttpResponse<any>) =>
              this.wsiUtilityService.handleError(response, TraceModules.events, 'subscribeEvents()', this.errorService)));
          this.traceService.debug(TraceModules.events, 'EventProxyService.subscribeEvents(); http post can be issued now (after connecting)...');
          this.traceService.info(TraceModules.eventsTiming, 'EventProxyService.subscribeEvents(); http post can be issued now (after connecting)...');
          httpPost.subscribe(value => this.onSubscribeEventsNext(value, httpPostProxy, startTime),
            error => this.onSubscribeEventsError(error, ctx, httpPostProxy));
          this._subscribeRequestsInvoked.set(ctx.id, ctx);
          this._subscribeRequestsPending.delete(ctx.id);
        }
      });
      this.hubProxyShared.hubConnection.startHubConnection();
    } else {
      const url: string = this.wsiEndpointService.entryPoint + eventsSubscriptionChannelizeUrl + ctx.id + '/' + this.hubProxyShared?.connectionId;
      const httpPost: Observable<boolean> = this.httpClient.post(url, body, { headers }).pipe(
        map((response: HttpResponse<any> | any) => this.extractData(response)),
        catchError((response: HttpResponse<any>) =>
          this.wsiUtilityService.handleError(response, TraceModules.events, 'EventProxyService.subscribeEvents()', this.errorService)));
      this.traceService.debug(TraceModules.events, 'EventProxyService.subscribeEvents(); http post can be issued immediately...');
      this.traceService.info(TraceModules.eventsTiming, 'EventProxyService.subscribeEvents(); http post can be issued immediately...');
      httpPost.subscribe(value => this.onSubscribeEventsNext(value, httpPostProxy, startTime),
        error => this.onSubscribeEventsError(error, ctx, httpPostProxy));
      this._subscribeRequestsInvoked.set(ctx.id, ctx);
    }
    return httpPostProxy.asObservable();
  }

  public serverClientTimeDiff(isoString: string): Observable<any> {
    this.traceService.info(TraceModules.events, 'serverClientTimeDiff() called. timestamp: %s', isoString);
    const headers: HttpHeaders = this.wsiUtilityService.httpGetDefaultHeader(this.authenticationServiceBase.userToken);
    const url: string = this.wsiEndpointService.entryPoint + serverOffsetUrl;
    let params: HttpParams = new HttpParams();
    if (isoString != null) {
      params = params.append('clientDatetime', isoString);
    }

    return this.httpClient.get(url, { headers, params, observe: 'response' }).pipe(
      map((response: HttpResponse<any>) =>
        this.wsiUtilityService.extractData(response, TraceModules.events, 'serverClientTimeDiff()')),
      catchError((response: HttpResponse<any>) =>
        this.wsiUtilityService.handleError(response, TraceModules.events, 'serverClientTimeDiff()', this.errorService)));
  }

  private createEventProxies(): void {
    this.hubProxyShared = this.signalRService.getNorisHub();
    this.hubProxyEventEvents = new HubProxyEvent<WSIEvent[]>(
      this.traceService, this.hubProxyShared, 'notifyEvents', this.ngZone, this.signalRService);
    this.hubProxyEventEvents.eventChanged.subscribe(events => this.onEventsNotification(events));
    this.hubProxyEventSubs = new HubProxyEvent<SubscriptionWsiEvent>(
      this.traceService, this.hubProxyShared, 'notifySubscriptionStatus', this.ngZone, this.signalRService, 'notifyEvents');
    this.hubProxyEventSubs.eventChanged.subscribe(subscription => this.onNotifySubscriptions(subscription));
  }

  private onSignalRDisconnectedError(error: any): void {
    this.traceService.error(TraceModules.events, 'EventProxyService.onSignalRDisconnectedError(): %s', error.toString());
  }

  private onSignalRDisconnected(value: boolean): void {
    if (value === true) {
      if (this.hubProxyShared?.hubConnection?.connectionStateValue === SignalR.ConnectionState.Disconnected) {
        this.traceService.info(TraceModules.events, 'EventProxyService.onSignalRDisconnected(): starting again the connection');
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

  private onPostCommand2EventsNext(value: boolean, httpPostProxy: Subject<boolean>): void {
    httpPostProxy.next(value);
    httpPostProxy.complete();
  }

  private onPostCommand2EventsError(error: any, httpPostProxy: Subject<boolean>): void {
    this.traceService.warn(TraceModules.events, 'onPostCommand2EventsError(); http post returned an error; %s', error);
    httpPostProxy.error(error);
  }

  private onSubscribeEventsNext(value: boolean, httpPostProxy: Subject<boolean>, startTime: number): void {
    this.traceService.info(TraceModules.events, 'EventsProxyService.onSubscribeEvents() done: success=%s', value);
    this.traceService.info(TraceModules.eventsTiming, 'EventsProxyService.onSubscribeEvents() done: success=%s, time used: %s ms',
      value, performance.now() - startTime);
    // nothing to do if okay! we need to wait of the subscription notification over signalR
  }

  private onSubscribeEventsError(error: any, ctx: SubscribeContextChannelizedSingle<boolean>, httpPostProxy: Subject<boolean>): void {
    this.traceService.warn(TraceModules.events, 'onSubscribeEventsError(); http post returned an error; %s', error);
    this._subscribeRequestsInvoked.delete(ctx.id);
    httpPostProxy.error(error);
  }

  private onUnsubscribeEventsNext(value: boolean, httpPostProxy: Subject<boolean>): void {
    httpPostProxy.next(value);
    httpPostProxy.complete();
  }

  private onUnsubscribeEventsError(error: any, httpPostProxy: Subject<boolean>): void {
    this.traceService.warn(TraceModules.events, 'onUnsubscribeEventsError(); http post returned an error; %s', error);
    httpPostProxy.error(error);
  }

  private onEventsNotification(eventsFromWSI: WSIEvent[]): void {
    this._eventsWsi.next(eventsFromWSI);
  }

  private extractData(response: HttpResponse<any>): boolean {
    // Note: subscribe call just returns Status Code 200 if okay
    return true;
  }

  private onNotifySubscriptions(subscription: SubscriptionWsiEvent): void {
    const foundCtx: SubscribeContextChannelizedSingle<boolean> | undefined = this._subscribeRequestsInvoked.get(subscription.RequestId);
    if (foundCtx != undefined) {
      if (this.traceService.isDebugEnabled!) {
        this.traceService.debug(TraceModules.events,
          `EventsProxyService.onNotifySubscriptions():
           context (requestId): %s; errorCode: %s; requestFor: %s; connectionState: %s`,
          foundCtx.id, subscription.ErrorCode, subscription.RequestFor,
          this.hubProxyShared?.hubConnection?.connectionStateValueText);
      }
      const isSucceeded: boolean = subscription.ErrorCode === 0;

      foundCtx.setReply(isSucceeded);
      // reply every single subscription request as the API is Request-MultiReply
      foundCtx.postSubject.next(isSucceeded);
      if (foundCtx.checkAllRepliesDone() === true) {
        this.traceService.info(TraceModules.events,
          'EventsProxyService.onNotifySubscriptions(), all subscribe notifies retrieved for context (requestId): %s', foundCtx.id);
        this.traceService.info(TraceModules.eventsTiming,
          'EventsProxyService.onNotifySubscriptions(), all subscribe notifications retrieved for context (requestId): %s and requestFor: %s',
          foundCtx.id, subscription.RequestFor);

        foundCtx.postSubject.complete();
        this._subscribeRequestsInvoked.delete(foundCtx.id);
      }
    } else {
      this.traceService.error(TraceModules.events,
        'EventsProxyService.onNotifySubscriptions(), invalid context (requestId): %s, requestFor: %s;',
        subscription.RequestId, subscription.RequestFor);
    }

    if (this.traceService.isDebugEnabled!) {
      this.traceService.debug(TraceModules.events,
        'EventsProxyService.onNotifySubscriptions(), outstanding subscribe notifications on number of subscribe requests: %s',
        this._subscribeRequestsInvoked.size);

      this.traceService.debug(TraceModules.events,
        'EventsProxyService.onNotifySubscriptions(), pending subscribe requests (due to disconnected): %s',
        this._subscribeRequestsPending.size);
    }
  }

  private handleError<T>(operation = 'operation', result?: T): any {
    return (error: any): Observable<T> => {
      this.traceService.error(TraceModules.events, `${operation} failed: ${error.message}`);
      // Let the app keep running by returning an empty result.
      return of(result as T);
    };
  }
}
