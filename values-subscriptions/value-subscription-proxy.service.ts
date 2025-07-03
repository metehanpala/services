import { HttpClient, HttpHeaders, HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable, NgZone } from '@angular/core';
import { AuthenticationServiceBase, ErrorNotificationServiceBase, TraceService } from '@gms-flex/services-common';
import { Observable, throwError as observableThrowError, Subject, Subscription } from 'rxjs';
import { catchError, delay, map } from 'rxjs/operators';

import { SubscribeContextChannelized } from '../shared/subscription/subscribe-context-channelized';
import { SubscriptionUtility } from '../shared/subscription/subscription-utility';
import { TraceModules } from '../shared/trace-modules';
import { WsiUtilityService } from '../shared/wsi-utility.service';
import { HubProxyEvent } from '../signalr/hub-proxy-event';
import { HubProxyShared } from '../signalr/hub-proxy-shared';
import { SignalRService } from '../signalr/signalr.service';
import { WsiEndpointService } from '../wsi-endpoint/wsi-endpoint.service';
import { ConnectionState, SubscriptionDeleteWsi, SubscriptionGmsVal, SubscriptionWsiVal, ValueDetails } from '../wsi-proxy-api/shared/data.model';
import { ValueSubscriptionProxyServiceBase } from '../wsi-proxy-api/values-subscriptions/value-subscription-proxy.service.base';

const valuesSubscriptionChannelizeUrl = '/api/sr/valuessubscriptions/channelize/';
const valuesSubscriptionWithbodyUrl = '/api/sr/valuessubscriptions/withbody/';

const reconnectTimeout = 5000;

/**
 * GMS WSI value subscription implementation.
 * @extends ValuerBase
 */
@Injectable({
  providedIn: 'root'
})
export class ValueSubscriptionProxyService extends ValueSubscriptionProxyServiceBase {

  public hubProxyShared: HubProxyShared | undefined;
  public hubProxyEventValues: HubProxyEvent<ValueDetails[]> | undefined;
  public hubProxyEventSubs: HubProxyEvent<SubscriptionWsiVal> | undefined;

  private readonly _notifyConnectionState: Subject<ConnectionState> = new Subject<ConnectionState>();
  private readonly _subscribeRequestsInvoked: Map<string, SubscribeContextChannelized<SubscriptionGmsVal>> =
    new Map<string, SubscribeContextChannelized<SubscriptionGmsVal>>();
  private readonly _subscribeRequestsPending: Map<string, SubscribeContextChannelized<SubscriptionGmsVal>> =
    new Map<string, SubscribeContextChannelized<SubscriptionGmsVal>>();
  private readonly _valueEvents: Subject<ValueDetails[]> = new Subject<ValueDetails[]>();

  /**
   * Constructor
   * @param {TraceService } traceService The trace service
   * @param {HttpClient } httpClient The Angular 2 http service
   * @param {WsiEndpointService } wsiEndpoint The WSI endpoint service.
   * @param {AuthenticationBase } authenticationBprivate errorService: WsiErrorServicease The WSI authentication service
   */
  public constructor(private readonly traceService: TraceService, private readonly httpClient: HttpClient, private readonly wsiEndpoint: WsiEndpointService,
    private readonly authenticationServiceBase: AuthenticationServiceBase, private readonly signalRService: SignalRService,
    private readonly wsiUtilityService: WsiUtilityService,
    private readonly errorService: ErrorNotificationServiceBase,
    private readonly ngZone: NgZone) {
    super();
    this.signalRService.getNorisHubConnectionStatus().subscribe((isConnected: boolean) => {
      if (isConnected) {
        this.createEventProxies();
        this.hubProxyShared?.hubConnection?.connectionState.subscribe((value: any) => this.onSignalRConnectionState(value));
        this.hubProxyShared?.hubConnection?.disconnected.pipe(delay(reconnectTimeout)).subscribe(
          value => this.onSignalRDisconnected(value), error => this.onSignalRDisconnectedError(error));
        this.traceService.info(TraceModules.values, 'ValueSubscriptionProxyService created.');
      } else {
        this.traceService.info(TraceModules.values, 'NorisHub connection is not established!');
      }
    });
  }

  /**
   * Subscribes the specified object ids. See WSI API for details.
   *
   * @param {string[] } objectOrPropertyIds
   * @param {boolean } [details=false]
   * If not specified, the subscription runs on the "defaultClient".
   * @returns {Observable<SubscriptionWsi[]>}
   *
   * @memberOf ValueSubscriptionService
   */
  public subscribeValues(objectOrPropertyIds: string[], details = false, booleansAsNumericText?: boolean,
    bitsInReverseOrder?: boolean): Observable<SubscriptionGmsVal[]> {

    if ((objectOrPropertyIds == null) || (objectOrPropertyIds.length === 0)) {
      this.traceService.error(TraceModules.values, 'ValueSubscriptionProxyService.subscribeValues() called with invalid arguments!');
      return observableThrowError(WsiUtilityService.createNewInvalidArgumentsError());
    }
    this.traceService.info(TraceModules.values,
      'ValueSubscriptionProxyService.subscribeValues() called; number of objectOrPropertyIds:%s', objectOrPropertyIds.length);
    if (this.traceService.isDebugEnabled(TraceModules.values)) {
      this.traceService.debug(TraceModules.values,
        'ValueSubscriptionProxyService.subscribeValues(): objectOrPropertyIds to subscribe:\n%s', objectOrPropertyIds.join('\n'));
    }

    const headers: HttpHeaders = this.wsiUtilityService.httpPostDefaultHeader(this.authenticationServiceBase.userToken);
    const body: any = JSON.stringify(objectOrPropertyIds);
    // Initialize Params Object
    let params: HttpParams = new HttpParams();
    // Begin assigning parameters
    params = params.set('detailsRequired', String(details));
    if (typeof booleansAsNumericText !== 'undefined' && booleansAsNumericText === true) {
      params = params.set('booleansAsNumericText', true);
    }
    if (typeof bitsInReverseOrder !== 'undefined' && bitsInReverseOrder === true) {
      params = params.set('bitsInReverseOrder', true);
    }
    /*
    if (details != null) {
      params = params.append('detailsRequired', String(details));
    }
    if (booleansAsNumericText != null) {
      params = params.append('booleansAsNumericText', String(booleansAsNumericText));
    }
    */
    const httpPostProxy: Subject<SubscriptionGmsVal[]> = new Subject<SubscriptionGmsVal[]>();
    const ctx: SubscribeContextChannelized<SubscriptionGmsVal> = new SubscribeContextChannelized<SubscriptionGmsVal>(objectOrPropertyIds, httpPostProxy);

    if (this.hubProxyShared?.hubConnection?.isConnected === false) {
      this._subscribeRequestsPending.set(ctx.id, ctx);
      this.traceService.debug(TraceModules.values,
        `ValueSubscriptionProxyService.subscribeValues(): signalr connection not established;
          need to wait (and postpone http calls) until established in order to get connection id.`);
      const connectedSubscription: Subscription = this.hubProxyShared.hubConnection.connected.subscribe(started => {
        if (started === true) {
          this.traceService.debug(TraceModules.values,
            'ValueSubscriptionProxyService.subscribeValues(): connected event triggered: connection is now established.');
          // connection ID is available now, we can setup the "post observable" now and not earlier
          // (=> due to this we cannot use rxjs merge stream functionality such as "concat"!!)
          if (connectedSubscription !== undefined) {
            connectedSubscription.unsubscribe();
          } else {
            this.traceService.error(TraceModules.values, 'ValueSubscriptionProxyService.subscribeValues(); Implementation error, we should not reach this!');
          }
          const url: string = this.wsiEndpoint.entryPoint + valuesSubscriptionChannelizeUrl + ctx.id + '/' + this.hubProxyShared?.connectionId;
          const httpPost: Observable<boolean> = this.httpClient.post(url, body, { headers, params }).pipe(
            map((response: HttpResponse<any> | any) => this.extractData(response)),
            catchError((response: HttpResponse<any>) => this.wsiUtilityService.handleError(response, TraceModules.values,
              'ValueSubscriptionProxyService.subscribeValues()', this.errorService)));
          this.traceService.debug(TraceModules.values, 'ValueSubscriptionProxyService.subscribeValues(); http post can be issued now (after connecting)...');
          httpPost.subscribe(value => this.onSubscribeValues(value, objectOrPropertyIds, httpPostProxy),
            error => this.onSubscribeValuesError(error, ctx, httpPostProxy));
          this._subscribeRequestsInvoked.set(ctx.id, ctx);
          this._subscribeRequestsPending.delete(ctx.id);
        }
      });
      this.hubProxyShared.hubConnection.startHubConnection();
    } else {
      const url: string = this.wsiEndpoint.entryPoint + valuesSubscriptionChannelizeUrl + ctx.id + '/' + this.hubProxyShared?.connectionId;
      const httpPost: Observable<boolean> = this.httpClient.post(url, body, { headers, params }).pipe(
        map((response: HttpResponse<any> | any) => this.extractData(response)),
        catchError((response: HttpResponse<any>) => this.wsiUtilityService.handleError(response, TraceModules.values,
          'ValueSubscriptionProxyService.subscribeValues()', this.errorService)));
      this.traceService.debug(TraceModules.values, 'ValueSubscriptionProxyService.subscribeValues(); http post can be issued immediately...');
      httpPost.subscribe(value => this.onSubscribeValues(value, objectOrPropertyIds, httpPostProxy),
        error => this.onSubscribeValuesError(error, ctx, httpPostProxy));
      this._subscribeRequestsInvoked.set(ctx.id, ctx);
    }

    return httpPostProxy.asObservable();
  }

  /**
   * Event for the value notifications.
   *
   * @returns {Observable<ValueDetails[]>}
   *
   * @memberOf ValueSubscriptionService
   */
  public valueChangeNotification(): Observable<ValueDetails[]> {
    return this._valueEvents;
  }

  public notifyConnectionState(): Observable<ConnectionState> {
    return this._notifyConnectionState.asObservable();
  }

  /**
   * Unsubscribes objectOrPropertyIds (associated with the subscription keys). See WSI API for details
   *
   * @param {number[] } keys
   * @returns {Observable<SubscriptionDeleteWsi[]>}
   *
   * @memberOf ValueSubscriptionService
   */
  public unsubscribeValues(keys: number[]): Observable<SubscriptionDeleteWsi[]> {

    if ((keys == null) || (keys.length === 0)) {
      this.traceService.error(TraceModules.values, 'ValueSubscriptionProxyService.unSubscribeValues() called with invalid arguments!');
      return observableThrowError(WsiUtilityService.createNewInvalidArgumentsError());
    }
    const index: number = keys.findIndex(item => {
      return (item == undefined) ? true : false;
    });
    if (index !== -1) {
      this.traceService.error(TraceModules.values, 'Invalid keys!');
      keys = keys.filter(item => {
        return (item != undefined) ? true : false;
      });
    }
    if (keys.length === 0) {
      return observableThrowError(WsiUtilityService.createNewInvalidArgumentsError());
    }

    this.traceService.info(TraceModules.values, 'ValueSubscriptionProxyService.unSubscribeValues() called; number of keys:\n%s', keys.length);
    if (this.traceService.isDebugEnabled(TraceModules.values)) {
      this.traceService.debug(TraceModules.values, 'ValueSubscriptionProxyService.unSubscribeValues():\nKeys: %s', keys.toString());
    }

    const headers: HttpHeaders = this.wsiUtilityService.httpPostDefaultHeader(this.authenticationServiceBase.userToken);
    const body: any = JSON.stringify(keys);
    // Initialize Params Object
    const params: HttpParams = new HttpParams();
    // Begin assigning parameters
    // params = params.set("subscriptionKey", keysJson);

    const methodName = 'ValueSubscriptionProxyService.unSubscribeValues()';
    const httpPostProxy: Subject<SubscriptionDeleteWsi[]> = new Subject<SubscriptionDeleteWsi[]>();
    if (this.hubProxyShared?.hubConnection?.isConnected === false) {
      this.traceService.debug(TraceModules.values,
        `ValueSubscriptionProxyService.unSubscribeValues(): signalr connection not established;
        need to wait (postpone http calls) until established in order to get connection id.`);
      const connectedSubscription: Subscription = this.hubProxyShared.hubConnection.connected.subscribe(started => {
        if (started === true) {
          this.traceService.debug(TraceModules.values,
            'ValueSubscriptionProxyService.unSubscribeValues(): connected event triggered: connection is now established.');
          // connection ID is available now, we can setup the "post observable" now and not earlier
          // => due to this we cannot use rxjs merge stream functionality such as "concat"!!
          if (connectedSubscription !== undefined) {
            connectedSubscription.unsubscribe();
          } else {
            this.traceService.error(TraceModules.values, 'ValueSubscriptionProxyService.unSubscribeValues(); Implementation error, we should not reach this!');
          }
          this.traceService.debug(TraceModules.values, 'ValueSubscriptionProxyService.unSubscribeValues(); http delete can be issued (after connecting)...');
          const url: string = this.wsiEndpoint.entryPoint + valuesSubscriptionWithbodyUrl + this.hubProxyShared?.connectionId;
          const httpDelete: Observable<SubscriptionDeleteWsi[]> =
            this.httpClient.request('DELETE', url, { body, headers, params, observe: 'response' }).pipe(
              map((response: HttpResponse<any>) =>
                this.wsiUtilityService.extractData(response, TraceModules.values, methodName)),
              catchError((response: HttpResponse<any>) =>
                this.wsiUtilityService.handleError(response, TraceModules.values, methodName, this.errorService)));
          httpDelete.subscribe(value => this.onUnsubscribeValues(value, keys, httpPostProxy),
            error => this.onUnsubscribeValuesError(error, httpPostProxy));
        }
      });
      this.hubProxyShared.hubConnection.startHubConnection();
    } else {
      this.traceService.debug(TraceModules.values, 'ValueSubscriptionProxyService.unSubscribeValues(); http delete can be issued immediately');
      const url: string = this.wsiEndpoint.entryPoint + valuesSubscriptionWithbodyUrl + this.hubProxyShared?.connectionId;
      const httpDelete: Observable<SubscriptionDeleteWsi[]> =
        this.httpClient.request('DELETE', url, { body, headers, params, observe: 'response' }).pipe(
          map((response: HttpResponse<any>) =>
            this.wsiUtilityService.extractData(response, TraceModules.values, methodName)),
          catchError((response: HttpResponse<any>) =>
            this.wsiUtilityService.handleError(response, TraceModules.values, methodName, this.errorService)));
      httpDelete.subscribe(value => this.onUnsubscribeValues(value, keys, httpPostProxy),
        error => this.onUnsubscribeValuesError(error, httpPostProxy));
    }
    return httpPostProxy.asObservable();
  }

  private extractData(response: HttpResponse<any>): boolean {
    // Note: subscribe call just returns Status Code 200 if okay
    return true;
  }

  private onSubscribeValues(success: boolean, requestedIds: string[], httpPostProxy: Subject<SubscriptionGmsVal[]>): void {
    this.traceService.info(TraceModules.values, 'ValueSubscriptionProxyService.onSubscribeValues() done: success=%s', success);
    // nothing to do if okay! we need to wait of the subscription notification over signalR
  }

  private onSubscribeValuesError(error: any, ctx: SubscribeContextChannelized<SubscriptionGmsVal>, httpPostProxy: Subject<SubscriptionGmsVal[]>): void {
    this.traceService.warn(TraceModules.values, 'ValueSubscriptionProxyService.onSubscribeValuesError(); http post returned not okay; %s', error);
    this._subscribeRequestsInvoked.delete(ctx.id);
    httpPostProxy.error(error);
  }

  private onUnsubscribeValues(values: SubscriptionDeleteWsi[], requestedKeys: number[], httpPostProxy: Subject<SubscriptionDeleteWsi[]>): void {

    this.traceService.info(TraceModules.values, 'ValueSubscriptionProxyService.onUnsubscribeValues() done!');

    httpPostProxy.next(values);
    httpPostProxy.complete();
  }

  private onUnsubscribeValuesError(error: any, httpPostProxy: Subject<SubscriptionDeleteWsi[]>): void {
    this.traceService.warn(TraceModules.values, 'ValueSubscriptionProxyService.onUnsubscribeValuesError(); http post returned an error; %s', error);
    httpPostProxy.error(error);
  }

  private createEventProxies(): void {
    this.hubProxyShared = this.signalRService.getNorisHub();
    this.hubProxyEventValues = new HubProxyEvent<ValueDetails[]>(
      this.traceService, this.hubProxyShared, 'notifyValues', this.ngZone, this.signalRService);
    this.hubProxyEventValues.eventChanged.subscribe(values => this.onNotifyValues(values));
    this.hubProxyEventSubs = new HubProxyEvent<SubscriptionWsiVal>(
      this.traceService, this.hubProxyShared, 'notifySubscriptionStatus', this.ngZone, this.signalRService, 'notifyValues');
    this.hubProxyEventSubs.eventChanged.subscribe(subscription => this.onNotifySubscriptions(subscription));
  }

  private onSignalRDisconnectedError(error: any): void {
    this.traceService.error(TraceModules.values, 'ValueSubscriptionProxyService.onSignalRDisconnectedError(): %s', error.toString());
  }

  private onSignalRDisconnected(value: boolean): void {
    if (value === true) {
      if (this.hubProxyShared?.hubConnection?.connectionStateValue === SignalR.ConnectionState.Disconnected) {
        this.traceService.info(TraceModules.values, 'ValueSubscriptionProxyService.onSignalRDisconnected(): starting again the connection');
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

  private onNotifyValues(values: ValueDetails[]): void {
    if (this.traceService.isDebugEnabled(TraceModules.valueNotifications)) {
      let valStr = 'ValueSubscriptionProxyService:onNotifyValues() called:';
      values.forEach(value => {
        valStr = valStr + '\n' +
        `SubscriptionKey= ${value.SubscriptionKey}, Value= ${value.Value.DisplayValue}`;
      });
      this.traceService.debug(TraceModules.valueNotifications, valStr);
    }
    this._valueEvents.next(values);
  }

  private onNotifySubscriptions(subscription: SubscriptionWsiVal): void {
    const gmsSubscription: SubscriptionGmsVal = new SubscriptionGmsVal(subscription);
    const foundCtx: SubscribeContextChannelized<SubscriptionGmsVal> | undefined = this._subscribeRequestsInvoked.get(subscription.RequestId);
    if (foundCtx != undefined) {
      if (this.traceService.isInfoEnabled!) {
        this.traceService.info(TraceModules.values,
          `ValueSubscriptionProxyService.onNotifySubscriptions():
           context (requestId): %s; objectOrPropertyId: %s; wsiKey: %s; errorCode: %s; requestFor: %s; connectionState: %s`,
          foundCtx.id, subscription.OriginalObjectOrPropertyId, subscription.Key, subscription.ErrorCode, subscription.RequestFor,
          this.hubProxyShared?.hubConnection?.connectionStateValueText);
      }

      foundCtx.setReply(subscription.OriginalObjectOrPropertyId, gmsSubscription);
      // reply every single subscription request as the API is Request-MultiReply
      foundCtx.postSubject.next([gmsSubscription]);
      if (foundCtx.checkAllRepliesDone() === true) {
        if (this.traceService.isDebugEnabled!) {
          this.traceService.debug(TraceModules.values,
            'ValueSubscriptionProxyService.onNotifySubscriptions(), all subscribe notifies retrieved for context (requestId): %s', foundCtx.id);
        }
        foundCtx.postSubject.complete();
        this._subscribeRequestsInvoked.delete(foundCtx.id);
      }
    } else {
      this.traceService.error(TraceModules.values,
        'ValueSubscriptionProxyService.onNotifySubscriptions(), invalid context (requestId): %s, requestFor: %s; wsiKey: %s',
        subscription.RequestId, subscription.RequestFor, subscription.Key);
    }

    if (this.traceService.isDebugEnabled!) {
      this.traceService.debug(TraceModules.values,
        'ValueSubscriptionProxyService.onNotifySubscriptions(), outstanding subscribe notifications on number of subscribe requests: %s',
        this._subscribeRequestsInvoked.size);

      this.traceService.debug(TraceModules.values,
        'ValueSubscriptionProxyService.onNotifySubscriptions(), pending subscribe requests (due to disconnected): %s',
        this._subscribeRequestsPending.size);
    }
  }
}
