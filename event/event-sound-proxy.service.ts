/* eslint-disable @typescript-eslint/member-ordering */
import { HttpClient, HttpHeaders, HttpParams, HttpRequest, HttpResponse } from '@angular/common/http';
import { Injectable, NgZone } from '@angular/core';
import { AuthenticationServiceBase, ErrorNotificationServiceBase, isNullOrUndefined, TraceService } from '@gms-flex/services-common';
import { Observable, Observer, Subject, Subscription } from 'rxjs';
import { catchError, delay, map } from 'rxjs/operators';

import { SubscribeContextChannelizedSingle } from '../shared/subscription/subscribe-context-channelized-single';
import { SubscriptionUtility } from '../shared/subscription/subscription-utility';
import { TraceModules } from '../shared/trace-modules';
import { WsiUtilityService } from '../shared/wsi-utility.service';
import { HubProxyEvent } from '../signalr/hub-proxy-event';
import { HubProxyShared } from '../signalr/hub-proxy-shared';
import { SignalRService } from '../signalr/signalr.service';
import { WsiEndpointService } from '../wsi-endpoint/wsi-endpoint.service';
import { EventSoundWsi, ResoundCategory, SubscriptionWsiEventSound } from '../wsi-proxy-api/event/data.model';
import { EventSoundProxyServiceBase } from '../wsi-proxy-api/event/event-sound-proxy.service.base';
import { ConnectionState } from '../wsi-proxy-api/shared/data.model';

const eventCategorySoundUrl = '/api/eventcategorysounds';
const eventCategorySoundSubscriptionUrl = '/api/sr/eventcategorysoundssubscriptions/';
const eventCategorySoundSubscriptionChannelizeUrl = '/api/sr/eventcategorysoundssubscriptions/channelize/';
const eventCategoryResetResoundTimerUrl = '/api/sr/eventcategorysoundssubscriptions/resetResoundTimer/';

const reconnectTimeout = 5000;

/**
 * Event Sound Proxy service.eventCategorySoundUrl
 * Provides the proxy functionality to read and subscribe to sound files for events.
 *
 * @export
 * @class EventSoundProxyService
 * @extends {EventSoundProxyServiceBase}
 */
@Injectable({
  providedIn: 'root'
})
export class EventSoundProxyService extends EventSoundProxyServiceBase {

  public hubProxyShared: HubProxyShared | undefined;
  public hubProxyEventSound: HubProxyEvent<EventSoundWsi> | undefined;
  public hubProxyEventSubs: HubProxyEvent<SubscriptionWsiEventSound> | undefined;

  private readonly _notifyConnectionState: Subject<ConnectionState> = new Subject<ConnectionState>();
  private readonly _subscribeRequestsInvoked: Map<string, SubscribeContextChannelizedSingle<boolean>> =
    new Map<string, SubscribeContextChannelizedSingle<boolean>>();
  private readonly _subscribeRequestsPending: Map<string, SubscribeContextChannelizedSingle<boolean>> =
    new Map<string, SubscribeContextChannelizedSingle<boolean>>();

  private readonly _soundEvents: Subject<EventSoundWsi> = new Subject<EventSoundWsi>();

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
        this.traceService.info(TraceModules.eventsSound, 'EventSoundProxyService created.');
      } else {
        this.traceService.info(TraceModules.eventsSound, 'NorisHub connection is not established!');
      }
    });
  }

  public notifyConnectionState(): Observable<ConnectionState> {
    return this._notifyConnectionState.asObservable();
  }

  public getCurrentSound(): Observable<EventSoundWsi> {
    this.traceService.info(TraceModules.eventsSound, 'EventSoundProxyService.getCurrentSound() called.');

    const headers: HttpHeaders = this.wsiUtilityService.httpGetDefaultHeader();
    const url: string = this.wsiEndpointService.entryPoint + eventCategorySoundUrl;

    return new Observable((observer: Observer<EventSoundWsi>) => {
      this.httpClient.get<EventSoundWsi>(url, { headers })
        .toPromise()
        .then((response: EventSoundWsi | any) => this.extractDataEventSound(response, observer),
          reason => this.errorOnGet(reason));
    });
  }

  public subscribeEventSound(disableCategories?: string[], resoundData?: ResoundCategory[]): Observable<boolean> {
    this.traceService.info(TraceModules.eventsSound, 'EventSoundProxyService.subscribeEventSound() called.');

    const headers: HttpHeaders = this.wsiUtilityService.httpPostDefaultHeader(this.authenticationServiceBase.userToken);
    const httpPostProxy: Subject<boolean> = new Subject<boolean>();
    const ctx: SubscribeContextChannelizedSingle<boolean> = new SubscribeContextChannelizedSingle<boolean>(httpPostProxy);

    // disable category
    let catString = '';
    if (disableCategories) {
      catString = '[' + disableCategories.join(',') + ']';
    } else {
      catString = '[]';
    }

    // resoundData
    let body = '';
    if (resoundData) {
      body = '{"ResoundData":' + JSON.stringify(resoundData) + '}';
    }

    const params: HttpParams = new HttpParams().set('disableCategories', catString);

    if (this.hubProxyShared?.hubConnection?.isConnected === false) {
      this._subscribeRequestsPending.set(ctx.id, ctx);
      this.traceService.debug(TraceModules.eventsSound, 'EventSoundProxyService.subscribeEventSound(): signalr connection not established; ' +
        'need to wait (postpone http calls) until established in order to get connection id.');
      const connectedSubscription: Subscription = this.hubProxyShared.hubConnection.connected.subscribe(started => {
        if (started === true) {
          this.traceService.debug(TraceModules.eventsSound,
            'EventSoundProxyService.subscribeEventSound(): connected event triggered; conection is now established.');
          // connection ID is available now, we can setup the "post observable" now and not earlier
          // (=> due to this we cannot use rxjs merge stream functionality such as "concat"!!)
          if (connectedSubscription !== undefined) {
            connectedSubscription.unsubscribe();
          }
          const url: string = this.wsiEndpointService.entryPoint + eventCategorySoundSubscriptionChannelizeUrl + ctx.id +
            '/' + this.hubProxyShared?.connectionId;
          const httpPost: Observable<boolean> = this.httpClient.post(url, body, { headers, params }).pipe(
            map((response: HttpResponse<any> | any) => this.extractData(response)),
            catchError((response: HttpResponse<any>) =>
              this.wsiUtilityService.handleError(response, TraceModules.eventsSound, 'subscribeEventSound()', this.errorService)));
          this.traceService.debug(TraceModules.eventsSound,
            'EventSoundProxyService.subscribeEventSound(); http post can be issued now (after connecting)...');
          httpPost.subscribe(value => this.onSubscribeEventSoundsNext(value, httpPostProxy),
            error => this.onSubscribeEventSoundsError(error, ctx, httpPostProxy));
          this._subscribeRequestsInvoked.set(ctx.id, ctx);
          this._subscribeRequestsPending.delete(ctx.id);
        }
      });
      this.hubProxyShared.hubConnection.startHubConnection();
    } else {
      const url: string = this.wsiEndpointService.entryPoint + eventCategorySoundSubscriptionChannelizeUrl + ctx.id +
        '/' + this.hubProxyShared?.connectionId;
      const httpPost: Observable<boolean> = this.httpClient.post(url, body, { headers, params }).pipe(
        map((response: HttpResponse<any> | any) => this.extractData(response)),
        catchError((response: HttpResponse<any>) =>
          this.wsiUtilityService.handleError(response, TraceModules.eventsSound, 'subscribeEventSound()', this.errorService)));
      this.traceService.debug(TraceModules.eventsSound,
        'EventSoundProxyService.subscribeEventSound(); http post can be issued now (after connecting)...');
      httpPost.subscribe(value => this.onSubscribeEventSoundsNext(value, httpPostProxy),
        error => this.onSubscribeEventSoundsError(error, ctx, httpPostProxy));
      this._subscribeRequestsInvoked.set(ctx.id, ctx);
    }
    return httpPostProxy.asObservable();
  }

  public unSubscribeEventSound(): Observable<boolean> {
    this.traceService.info(TraceModules.eventsSound, 'EventSoundProxyService.unSubscribeEventSound() called');

    const headers: HttpHeaders = this.wsiUtilityService.httpDeleteDefaultHeader(this.authenticationServiceBase.userToken);
    const httpPostProxy: Subject<boolean> = new Subject<boolean>();

    if (this.hubProxyShared?.hubConnection?.isConnected === false) {
      this.traceService.debug(TraceModules.eventsSound,
        'unSubscribeEventSound(): signalr connection not established; need to wait ' +
        '(postpone http calls) until established in order to get connection id.');
      const connectedSubscription: Subscription = this.hubProxyShared.hubConnection.connected.subscribe(started => {
        if (started === true) {
          this.traceService.debug(TraceModules.eventsSound, 'unSubscribeEventCounters(): connected event triggered: connection is now established.');
          // connection ID is available now, we can setup the "post observable" now and not earlier
          // => due to this we cannot use rxjs merge stream functionality such as "concat"!!
          if (connectedSubscription !== undefined) {
            connectedSubscription.unsubscribe();
          }
          this.traceService.debug(TraceModules.eventsSound, 'unSubscribeEventCounters(); http delete can be issued (after connecting)...');
          const url: string = this.wsiEndpointService.entryPoint + (eventCategorySoundSubscriptionUrl + this.hubProxyShared?.connectionId);
          const httpPost: Observable<boolean> = this.httpClient.delete(url, { headers, observe: 'response' }).pipe(
            map((response: HttpResponse<any>) =>
              this.wsiUtilityService.extractData(response, TraceModules.eventsSound, 'unSubscribeEvents()')),
            catchError((response: HttpResponse<any>) =>
              this.wsiUtilityService.handleError(response, TraceModules.eventsSound, 'unSubscribeEvents()', this.errorService)));
          httpPost.subscribe(value => this.onUnsubscribeEventSoundsNext(value, httpPostProxy),
            error => this.onUnsubscribeEventSoundsError(error, httpPostProxy));
        }
      });
      this.hubProxyShared.hubConnection.startHubConnection();
    } else {
      this.traceService.debug(TraceModules.eventsSound, 'EventSoundProxyService.unSubscribeEventSound(); http delete can be issued immediately');
      const url: string = this.wsiEndpointService.entryPoint + (eventCategorySoundSubscriptionUrl + this.hubProxyShared?.connectionId);
      const httpPost: Observable<boolean> = this.httpClient.delete(url, { headers, observe: 'response' }).pipe(
        map((response: HttpResponse<any>) =>
          this.wsiUtilityService.extractData(response, TraceModules.eventsSound, 'unSubscribeEventSound()')),
        catchError((response: HttpResponse<any>) =>
          this.wsiUtilityService.handleError(response, TraceModules.eventsSound, 'unSubscribeEventSound()', this.errorService)));
      httpPost.subscribe(value => this.onUnsubscribeEventSoundsNext(value, httpPostProxy),
        error => this.onUnsubscribeEventSoundsError(error, httpPostProxy));
    }
    return httpPostProxy.asObservable();
  }

  public resetResoundTimer(): Observable<boolean> {
    this.traceService.info(TraceModules.eventsSound, 'EventSoundProxyService.resetResoundTimer() called');

    const headers: HttpHeaders = this.wsiUtilityService.httpPostDefaultHeader(this.authenticationServiceBase.userToken);
    const httpPostProxy: Subject<boolean> = new Subject<boolean>();

    if (this.hubProxyShared?.hubConnection?.isConnected === false) {
      this.traceService.debug(TraceModules.eventsSound,
        'resetResoundTimer(): signalr connection not established; need to wait ' +
        '(postpone http calls) until established in order to get connection id.');
      const connectedSubscription: Subscription = this.hubProxyShared.hubConnection.connected.subscribe(started => {
        if (started === true) {
          this.traceService.debug(TraceModules.eventsSound, 'resetResoundTimer(): connected event triggered: connection is now established.');
          // connection ID is available now, we can setup the "post observable" now and not earlier
          // => due to this we cannot use rxjs merge stream functionality such as "concat"!!
          if (connectedSubscription !== undefined) {
            connectedSubscription.unsubscribe();
          }
          this.traceService.debug(TraceModules.eventsSound, 'resetResoundTimer(); http post can be issued (after connecting)...');

          const url: string = this.wsiEndpointService.entryPoint + (eventCategoryResetResoundTimerUrl + this.hubProxyShared?.connectionId);

          const httpPost: Observable<boolean> = this.httpClient.post(url, '', { headers, observe: 'response' }).pipe(
            map((response: HttpResponse<any>) =>
              this.wsiUtilityService.extractData(response, TraceModules.eventsSound, 'resetResoundTimer()')),
            catchError((response: HttpResponse<any>) =>
              this.wsiUtilityService.handleError(response, TraceModules.eventsSound, 'resetResoundTimer()', this.errorService)));

          httpPost.subscribe(value => this.onResetResoundTimerNext(value, httpPostProxy),
            error => this.onResetResoundTimerError(error, httpPostProxy));
        }
      });
      this.hubProxyShared.hubConnection.startHubConnection();
    } else {
      this.traceService.debug(TraceModules.eventsSound, 'EventSoundProxyService.resetResoundTimer(); http post can be issued immediately');

      const url: string = this.wsiEndpointService.entryPoint + (eventCategoryResetResoundTimerUrl + this.hubProxyShared?.connectionId);
      const httpPost: Observable<boolean> = this.httpClient.post(url, '', { headers, observe: 'response' }).pipe(
        map((response: HttpResponse<any>) =>
          this.wsiUtilityService.extractData(response, TraceModules.eventsSound, 'resetResoundTimer()')),
        catchError((response: HttpResponse<any>) =>
          this.wsiUtilityService.handleError(response, TraceModules.eventsSound, 'resetResoundTimer()', this.errorService)));
      httpPost.subscribe(value => this.onResetResoundTimerNext(value, httpPostProxy),
        error => this.onResetResoundTimerError(error, httpPostProxy));
    }
    return httpPostProxy.asObservable();
  }

  public eventSoundNotification(): Observable<EventSoundWsi> {
    return this._soundEvents.asObservable();
  }

  private createEventProxies(): void {
    this.hubProxyShared = this.signalRService.getNorisHub();
    this.hubProxyEventSound = new HubProxyEvent<EventSoundWsi>(
      this.traceService, this.hubProxyShared, 'notifySounds', this.ngZone, this.signalRService);
    this.hubProxyEventSound.eventChanged.subscribe(values => this.onEventSoundsNotification(values));
    this.hubProxyEventSubs = new HubProxyEvent<SubscriptionWsiEventSound>(
      this.traceService, this.hubProxyShared, 'notifySubscriptionStatus', this.ngZone, this.signalRService, 'notifySounds');
    this.hubProxyEventSubs.eventChanged.subscribe(subscription => this.onNotifySubscriptions(subscription));
  }

  private onSignalRDisconnectedError(error: any): void {
    this.traceService.error(TraceModules.eventsSound, 'EventSoundProxyService.onSignalRDisconnectedError(): %s', error.toString());
  }

  private onSignalRDisconnected(value: boolean): void {
    if (value === true) {
      if (this.hubProxyShared?.hubConnection?.connectionStateValue === SignalR.ConnectionState.Disconnected) {
        this.traceService.info(TraceModules.eventsSound, 'EventSoundProxyService.onSignalRDisconnected(): starting again the connection');
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

  private errorOnGet(error: any): void {
    this.traceService.info(TraceModules.eventsSound, 'EventSoundProxyService.errorOnGet(): Error on get current sound: %s', error);
  }

  private extractDataEventSound(res: EventSoundWsi, observer: Observer<EventSoundWsi>): void | null {
    try {
      this.traceService.info(TraceModules.eventsSound, 'EventSoundProxyService: Successful response for getCurrentSound()');
      const eventSound: EventSoundWsi = res;
      eventSound.Visibility = (res as any).eventSound.Visibility || 0;
      observer.next(eventSound);
      observer.complete();
    } catch (exc) {
      this.traceService.warn(TraceModules.eventsSound,
        'EventSoundProxyService: Response not handled properly; url: %s; exception caught: %s', res, (exc as Error).message.toString());
      return null;
    }
  }

  private onEventSoundsNotification(eventSoundFromWSI: EventSoundWsi): void {
    if (this.traceService.isDebugEnabled(TraceModules.eventSoundNotifications)) {
      this.traceService.debug(TraceModules.eventSoundNotifications,
        'EventSoundProxyService.onEventSoundsNotification(): File=%s', eventSoundFromWSI.FileName);
    }
    this._soundEvents.next(eventSoundFromWSI);
  }

  private onSubscribeEventSoundsNext(value: boolean, httpPostProxy: Subject<boolean>): void {
    this.traceService.info(TraceModules.eventsSound, 'EventSoundProxyService.onSubscribeValues() done: success=%s', value);
    // nothing to do if okay! we need to wait of the subscription notification over signalR
  }

  private onSubscribeEventSoundsError(error: any, ctx: SubscribeContextChannelizedSingle<boolean>, httpPostProxy: Subject<boolean>): void {
    this.traceService.warn(TraceModules.eventsSound, 'EventSoundProxyService.onSubscribeEventSoundsError(); http post returned an error; %s', error);
    this._subscribeRequestsInvoked.delete(ctx.id);
    httpPostProxy.error(error);
  }

  private onUnsubscribeEventSoundsNext(value: boolean, httpPostProxy: Subject<boolean>): void {
    httpPostProxy.next(value);
    httpPostProxy.complete();
  }

  private onUnsubscribeEventSoundsError(error: any, httpPostProxy: Subject<boolean>): void {
    this.traceService.warn(TraceModules.eventsSound, 'EventSoundProxyService.onUnsubscribeEventSoundsError(); http post returned an error; %s', error);
    httpPostProxy.error(error);
  }

  private onResetResoundTimerNext(value: boolean, httpPostProxy: Subject<boolean>): void {
    this.traceService.info(TraceModules.eventsSound, 'EventSoundProxyService.onResetResoundTimer() done: success=%s', value);
    // nothing to do if okay! we need to wait of the subscription notification over signalR
  }

  private onResetResoundTimerError(error: any, httpPostProxy: Subject<boolean>): void {
    this.traceService.warn(TraceModules.eventsSound, 'EventSoundProxyService.onResetResoundTimerError(); http post returned an error; %s', error);
    httpPostProxy.error(error);
  }

  private extractData(response: HttpResponse<any>): boolean {
    // Note: subscribe call just returns Status Code 200 if okay
    return true;
  }

  private onNotifySubscriptions(subscription: SubscriptionWsiEventSound): void {
    const foundCtx: SubscribeContextChannelizedSingle<boolean> | undefined = this._subscribeRequestsInvoked.get(subscription.RequestId);
    if (foundCtx != undefined) {
      if (this.traceService.isInfoEnabled!) {
        this.traceService.info(TraceModules.eventsSound,
          `EventSoundProxyService.onNotifySubscriptions():
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
          this.traceService.debug(TraceModules.eventsSound,
            'EventSoundProxyService.onNotifySubscriptions(), all subscribe notifies retrieved for context (requestId): %s', foundCtx.id);
        }
        foundCtx.postSubject.complete();
        this._subscribeRequestsInvoked.delete(foundCtx.id);
      }
    } else {
      this.traceService.error(TraceModules.eventsSound,
        'EventSoundProxyService.onNotifySubscriptions(), invalid context (requestId): %s, requestFor: %s;',
        subscription.RequestId, subscription.RequestFor);
    }

    if (this.traceService.isDebugEnabled!) {
      this.traceService.debug(TraceModules.eventsSound,
        'EventSoundProxyService.onNotifySubscriptions(), outstanding subscribe notifications on number of subscribe requests: %s',
        this._subscribeRequestsInvoked.size);

      this.traceService.debug(TraceModules.eventsSound,
        'EventSoundProxyService.onNotifySubscriptions(), pending subscribe requests (due to disconnected): %s',
        this._subscribeRequestsPending.size);
    }
  }
}
