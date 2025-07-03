import { HttpClient, HttpHeaders, HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable, NgZone } from '@angular/core';
import { AuthenticationServiceBase, ErrorNotificationServiceBase, isNullOrUndefined, TraceService } from '@gms-flex/services-common';
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
import { CommandSubscriptionProxyServiceBase } from '../wsi-proxy-api/command/command-subscription-proxy.service.base';
import { PropertyCommand, SubscriptionGmsCmd, SubscriptionWsiCmd } from '../wsi-proxy-api/command/data.model';
import { ConnectionState, SubscriptionDeleteWsi } from '../wsi-proxy-api/shared/data.model';
import { FormatHelper } from './format-helper';

const commandSubscriptionChannelizeUrl = '/api/sr/commandssubscriptions/channelize/';
const commandSubscriptionWithbodyUrl = '/api/sr/commandssubscriptions/withbody/';

const reconnectTimeout = 5000;

/**
 * GMS WSI command subscription implementation.
 * @extends CommandSubscriptionProxyServiceBase
 */
@Injectable({
  providedIn: 'root'
})
export class CommandSubscriptionProxyService extends CommandSubscriptionProxyServiceBase {

  public hubProxyShared: HubProxyShared | undefined;
  public hubProxyEventCmds: HubProxyEvent<PropertyCommand[]> | undefined;
  public hubProxyEventSubs: HubProxyEvent<SubscriptionWsiCmd> | undefined;

  private readonly _notifyConnectionState: Subject<ConnectionState> = new Subject<ConnectionState>();
  private readonly _subscribeRequestsInvoked: Map<string, SubscribeContextChannelized<SubscriptionGmsCmd>> =
    new Map<string, SubscribeContextChannelized<SubscriptionGmsCmd>>();
  private readonly _subscribeRequestsPending: Map<string, SubscribeContextChannelized<SubscriptionGmsCmd>> =
    new Map<string, SubscribeContextChannelized<SubscriptionGmsCmd>>();
  private readonly _cmdEvents: Subject<PropertyCommand[]> = new Subject<PropertyCommand[]>();

  /**
   * Constructor
   * @param {TraceService} traceService The trace service
   * @param {HttpClient} httpClient The Angular 2 http service
   * @param {WsiEndpointService} wsiEndpoint The WSI endpoint service.
   * @param {AuthenticationBase} authenticationBprivate errorService: WsiErrorServicease The WSI authentication service
   */
  public constructor(private readonly traceService: TraceService, private readonly httpClient: HttpClient, private readonly wsiEndpoint: WsiEndpointService,
    private readonly authenticationServiceBase: AuthenticationServiceBase, private readonly signalRService: SignalRService,
    private readonly wsiUtilityService: WsiUtilityService,
    private readonly errorService: ErrorNotificationServiceBase,
    private readonly ngZone: NgZone) {
    super();

    // Check If the user token is valid
    this.signalRService.getNorisHubConnectionStatus().subscribe((isConnected: boolean) => {
      if (isConnected) {
        this.createEventProxies();
        this.hubProxyShared?.hubConnection?.connectionState.subscribe((value: any) => this.onSignalRConnectionState(value));
        this.hubProxyShared?.hubConnection?.disconnected.pipe(delay(reconnectTimeout)).subscribe(
          value => this.onSignalRDisconnected(value), error => this.onSignalRDisconnectedError(error));
        this.traceService.info(TraceModules.command, 'CommandSubscriptionProxyService created.');
      } else {
        this.traceService.info(TraceModules.command, 'Access token for the user is blank, cannot create the signalR connection');
      }
    });
  }

  /**
   * Subscribes the specified object ids. See WSI API for details.
   *
   * @param {string[]} propertyIds
   * @returns {Observable<SubscriptionCmdWsi[]>}
   *
   * @memberOf CommandSubscriptionProxyService
   */
  public subscribeCommands(propertyIds: string[], booleansAsNumericText?: boolean): Observable<SubscriptionGmsCmd[]> {

    if ((propertyIds == null) || (propertyIds.length === 0)) {
      this.traceService.error(TraceModules.command, 'CommandSubscriptionProxyService.subscribeCommands() called with invalid arguments!');
      return observableThrowError(new Error('CommandSubscriptionProxyService.subscribeCommands(): Invalid arguments!'));
    }
    this.traceService.info(TraceModules.command,
      'CommandSubscriptionProxyService.subscribeCommands() called; number of propertyIds:%s', propertyIds.length);
    if (this.traceService.isDebugEnabled(TraceModules.command)) {
      this.traceService.debug(TraceModules.command,
        'CommandSubscriptionProxyService.subscribeCommands(): propertyIds to subscribe:\n%s', propertyIds.join('\n'));
    }

    const httpPostProxy: Subject<SubscriptionGmsCmd[]> = new Subject<SubscriptionGmsCmd[]>();
    const ctx: SubscribeContextChannelized<SubscriptionGmsCmd> = new SubscribeContextChannelized<SubscriptionGmsCmd>(propertyIds, httpPostProxy);

    if (this.hubProxyShared?.hubConnection?.isConnected === false) {
      this._subscribeRequestsPending.set(ctx.id, ctx);
      this.traceService.debug(TraceModules.command,
        `CommandSubscriptionProxyService.subscribeCommands(): signalr connection not established;
          need to wait (and postpone http calls) until established in order to get connection id.`);
      const connectedSubscription: Subscription = this.hubProxyShared.hubConnection.connected.subscribe(started => {
        if (started === true) {
          this.traceService.debug(TraceModules.command,
            'CommandSubscriptionProxyService.subscribeCommands(): connected event triggered: connection is now established.');
          // connection ID is available now, we can setup the 'post observable' now and not earlier
          // (=> due to this we cannot use rxjs merge stream functionality such as 'concat'!!)
          if (connectedSubscription !== undefined) {
            connectedSubscription.unsubscribe();
          } else {
            this.traceService.error(TraceModules.command,
              'CommandSubscriptionProxyService.subscribeCommands(); Implementation error, we should not reach this!');
          }
          this.traceService.debug(TraceModules.command,
            'CommandSubscriptionProxyService.subscribeCommands(); http post can be issued now (connection is finally established)');

          if (!isNullOrUndefined(booleansAsNumericText)) {
            this.invokeHttpPostCommandSubscription(httpPostProxy, propertyIds, ctx, booleansAsNumericText);
          } else {
            this.invokeHttpPostCommandSubscription(httpPostProxy, propertyIds, ctx);
          }
          this._subscribeRequestsInvoked.set(ctx.id, ctx);
          this._subscribeRequestsPending.delete(ctx.id);
        }
      });
      this.hubProxyShared.hubConnection.startHubConnection();
    } else {
      this.traceService.debug(TraceModules.command,
        'CommandSubscriptionProxyService.subscribeCommands(); http post can be issued immediately (connection is already established)');

      if (!isNullOrUndefined(booleansAsNumericText)) {
        this.invokeHttpPostCommandSubscription(httpPostProxy, propertyIds, ctx, booleansAsNumericText);
      } else {
        this.invokeHttpPostCommandSubscription(httpPostProxy, propertyIds, ctx);
      }
      this._subscribeRequestsInvoked.set(ctx.id, ctx);
    }
    return httpPostProxy.asObservable();
  }

  /**
   * Event for the command notifications.
   *
   * @returns {Observable<PropertyCommand[]>}
   * @memberOf CommandSubscriptionProxyService
   */
  public commandChangeNotification(): Observable<PropertyCommand[]> {
    return this._cmdEvents;
  }

  /**
   * Event for connection state changes
   *
   * @returns {Observable<ConnectionState>}
   * @memberof CommandSubscriptionProxyService
   */
  public notifyConnectionState(): Observable<ConnectionState> {
    return this._notifyConnectionState.asObservable();
  }

  /**
   * Unsubscribes objectOrPropertyIds (associated with the subscription keys). See WSI API for details
   *
   * @param {number[]} keys
   * @returns {Observable<SubscriptionDeleteWsi[]>}
   *
   * @memberOf CommandSubscriptionProxyService
   */
  public unSubscribeCommands(keys: number[]): Observable<SubscriptionDeleteWsi[]> {

    if ((keys == null) || (keys.length === 0)) {
      this.traceService.error(TraceModules.command, 'CommandSubscriptionProxyService.unSubscribeCommands() called with invalid arguments!');
      return observableThrowError(new Error('CommandSubscriptionProxyService.unSubscribeCommands(): Invalid arguments!'));
    }
    const index: number = keys.findIndex(item => {
      return (item == undefined) ? true : false;
    });
    if (index !== -1) {
      this.traceService.error(TraceModules.command, 'Invalid keys!');
      keys = keys.filter(item => {
        return (item != undefined) ? true : false;
      });
    }
    if (keys.length === 0) {
      return observableThrowError(new Error('CommandSubscriptionProxyService.unSubscribeCommands(): Invalid arguments!'));
    }

    this.traceService.info(TraceModules.command, 'CommandSubscriptionProxyService.unSubscribeCommands() called; number of keys:\n%s', keys.length);
    if (this.traceService.isDebugEnabled(TraceModules.command)) {
      this.traceService.debug(TraceModules.command, 'CommandSubscriptionProxyService.unSubscribeCommands():\nKeys: %s', keys.toString());
    }

    const httpDeleteProxy: Subject<SubscriptionDeleteWsi[]> = new Subject<SubscriptionDeleteWsi[]>();
    if (this.hubProxyShared?.hubConnection?.isConnected === false) {
      this.traceService.debug(TraceModules.command,
        `CommandSubscriptionProxyService.unSubscribeCommands(): signalr connection not established;
        need to wait (postpone http calls) until established in order to get connection id.`);
      const connectedSubscription: Subscription = this.hubProxyShared.hubConnection.connected.subscribe(started => {
        if (started === true) {
          this.traceService.debug(TraceModules.command,
            'CommandSubscriptionProxyService.unSubscribeCommands(): connected event triggered: connection is now established.');
          // connection ID is available now, we can setup the 'post observable' now and not earlier
          // => due to this we cannot use rxjs merge stream functionality such as 'concat'!!
          if (connectedSubscription !== undefined) {
            connectedSubscription.unsubscribe();
          } else {
            this.traceService.error(TraceModules.command,
              'CommandSubscriptionProxyService.unSubscribeCommands(); Implementation error, we should not reach this!');
          }
          this.traceService.debug(TraceModules.command,
            'CommandSubscriptionProxyService.unSubscribeCommands(); http delete can be issued (connection is finally established)');
          this.invokeHttpDeleteCommandSubscription(httpDeleteProxy, keys);
        }
      });
      this.hubProxyShared.hubConnection.startHubConnection();
    } else {
      this.traceService.debug(TraceModules.command,
        'CommandSubscriptionProxyService.unSubscribeCommands(); http delete can be issued immediately (connection is already established)');
      this.invokeHttpDeleteCommandSubscription(httpDeleteProxy, keys);
    }
    return httpDeleteProxy.asObservable();
  }

  private invokeHttpPostCommandSubscription(httpPostProxy: Subject<SubscriptionGmsCmd[]>, propertyIds: string[],
    ctx: SubscribeContextChannelized<SubscriptionGmsCmd>, booleansAsNumericText?: boolean): void {
    const methodName = 'CommandSubscriptionProxyService.subscribeCommands()';
    const headers: HttpHeaders = this.wsiUtilityService.httpPostDefaultHeader(this.authenticationServiceBase.userToken);
    const body: any = JSON.stringify(propertyIds);

    let params: HttpParams = new HttpParams();
    if (booleansAsNumericText != null) {
      params = params.set('booleansAsNumericText', String(booleansAsNumericText));
    }
    const url: string = this.wsiEndpoint.entryPoint + commandSubscriptionChannelizeUrl + ctx.id + '/' + this.hubProxyShared?.connectionId;
    const httpPost: Observable<boolean> = this.httpClient.post(url, body, { headers, params }).pipe(
      map((response: HttpResponse<any> | any) => this.extractData(response)),
      catchError((response: HttpResponse<any>) => this.wsiUtilityService.handleError(response, TraceModules.command,
        methodName, this.errorService)));
    httpPost.subscribe(value => this.onSubscribeCommands(value, propertyIds, httpPostProxy),
      error => this.onSubscribeCommandsError(error, ctx, httpPostProxy));
  }

  private invokeHttpDeleteCommandSubscription(httpDeleteProxy: Subject<SubscriptionDeleteWsi[]>, keys: number[]): void {
    const methodName = 'CommandSubscriptionProxyService.unSubscribeCommands()';
    const headers: HttpHeaders = this.wsiUtilityService.httpPostDefaultHeader(this.authenticationServiceBase.userToken);
    const body: any = JSON.stringify(keys);
    const url: string = this.wsiEndpoint.entryPoint + commandSubscriptionWithbodyUrl + this.hubProxyShared?.connectionId;

    const httpDelete: Observable<SubscriptionDeleteWsi[]> =
      this.httpClient.request('DELETE', url, { body, headers, observe: 'response' }).pipe(
        map((response: HttpResponse<any>) =>
          this.wsiUtilityService.extractData(response, TraceModules.command, methodName)),
        catchError((response: HttpResponse<any>) =>
          this.wsiUtilityService.handleError(response, TraceModules.command, methodName, this.errorService)));
    httpDelete.subscribe(value => this.onUnsubscribeCommands(value, keys, httpDeleteProxy),
      error => this.onUnsubscribeCommandsError(error, httpDeleteProxy));
  }

  private extractData(response: HttpResponse<any>): boolean {
    // Note: subscribe call just returns Status Code 200 if okay
    return true;
  }

  private onSubscribeCommands(success: boolean, requestedIds: string[], httpPostProxy: Subject<SubscriptionGmsCmd[]>): void {
    this.traceService.info(TraceModules.command, 'CommandSubscriptionProxyService.onSubscribeCommands() done: success=%s', success);
    // nothing to do if okay! we need to wait of the subscription notification over signalR
  }

  private onSubscribeCommandsError(error: any, ctx: SubscribeContextChannelized<SubscriptionGmsCmd>, httpPostProxy: Subject<SubscriptionGmsCmd[]>): void {
    this.traceService.warn(TraceModules.command, 'CommandSubscriptionProxyService.onSubscribeCommandsError(); http post returned not okay; %s', error);
    this._subscribeRequestsInvoked.delete(ctx.id);
    httpPostProxy.error(error);
  }

  private onUnsubscribeCommands(values: SubscriptionDeleteWsi[], requestedKeys: number[], httpPostProxy: Subject<SubscriptionDeleteWsi[]>): void {
    this.traceService.info(TraceModules.command, 'CommandSubscriptionProxyService.onUnsubscribeCommands() done!');
    httpPostProxy.next(values);
    httpPostProxy.complete();
  }

  private onUnsubscribeCommandsError(error: any, httpPostProxy: Subject<SubscriptionDeleteWsi[]>): void {
    this.traceService.warn(TraceModules.command, 'CommandSubscriptionProxyService.onUnsubscribeCommandsError(); http post returned an error; %s', error);
    httpPostProxy.error(error);
  }

  private createEventProxies(): void {
    this.hubProxyShared = this.signalRService.getNorisHub();
    this.hubProxyEventCmds = new HubProxyEvent<PropertyCommand[]>(
      this.traceService, this.hubProxyShared, 'notifyCommands', this.ngZone, this.signalRService);
    this.hubProxyEventCmds.eventChanged.subscribe(values => this.onNotifyCommands(values));
    this.hubProxyEventSubs = new HubProxyEvent<SubscriptionWsiCmd>(
      this.traceService, this.hubProxyShared, 'notifySubscriptionStatus', this.ngZone, this.signalRService, 'notifyCommands');
    this.hubProxyEventSubs.eventChanged.subscribe(subscription => this.onNotifySubscriptions(subscription));
  }

  private onSignalRDisconnectedError(error: any): void {
    this.traceService.error(TraceModules.command, 'CommandSubscriptionProxyService.onSignalRDisconnectedError(): %s', error.toString());
  }

  private onSignalRDisconnected(value: boolean): void {
    if (value === true) {
      if (this.hubProxyShared?.hubConnection?.connectionStateValue === SignalR.ConnectionState.Disconnected) {
        this.traceService.info(TraceModules.command, 'CommandSubscriptionProxyService.onSignalRDisconnected(): starting again the connection');
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

  private onNotifyCommands(cmds: PropertyCommand[]): void {
    let valStr = 'CommandSubscriptionProxyService:onNotifyCommands() called:';
    cmds.forEach(cmd => {
      if (this.traceService.isDebugEnabled(TraceModules.commandNotifications)) {
        valStr = valStr + '\n' + `PropertyId = ${cmd.PropertyId}, SubscriptionKey = ${cmd.SubscriptionKey}, ErrorCode = ${cmd.ErrorCode}`;
        this.traceService.debug(TraceModules.commandNotifications, valStr);
      }
      cmd.Commands.forEach(c => {
        if (c.Parameters) {
          c.Parameters.forEach(parameter => {
            FormatHelper.validateParameterDescriptor(parameter);
          });
        }
      });
    });
    this._cmdEvents.next(cmds);
  }

  private onNotifySubscriptions(subscription: SubscriptionWsiCmd): void {
    const gmsSubscription: SubscriptionGmsCmd = new SubscriptionGmsCmd(subscription);
    const foundCtx: SubscribeContextChannelized<SubscriptionGmsCmd> | undefined = this._subscribeRequestsInvoked.get(subscription.RequestId);
    if (foundCtx != undefined) {
      if (this.traceService.isInfoEnabled!) {
        this.traceService.info(TraceModules.command,
          `CommandSubscriptionProxyService.onNotifySubscriptions():
           context (requestId): %s; subscriptionId: %s; wsiKey: %s; errorCode: %s; requestFor: %s; connectionState: %s`,
          foundCtx.id, subscription.SubscriptionId, subscription.Key, subscription.ErrorCode, subscription.RequestFor,
          this.hubProxyShared?.hubConnection?.connectionStateValueText);
      }

      foundCtx.setReply(subscription.SubscriptionId, gmsSubscription);
      // reply every single subscription request as the API is Request-MultiReply
      foundCtx.postSubject.next([gmsSubscription]);
      if (foundCtx.checkAllRepliesDone() === true) {
        if (this.traceService.isDebugEnabled!) {
          this.traceService.debug(TraceModules.command,
            'CommandSubscriptionProxyService.onNotifySubscriptions(), all subscribe notifies retrieved for context (requestId): %s', foundCtx.id);
        }
        foundCtx.postSubject.complete();
        this._subscribeRequestsInvoked.delete(foundCtx.id);
      }
    } else {
      this.traceService.error(TraceModules.command,
        'CommandSubscriptionProxyService.onNotifySubscriptions(), invalid context (requestId): %s, requestFor: %s; wsiKey: %s',
        subscription.RequestId, subscription.RequestFor, subscription.Key);
    }

    if (this.traceService.isDebugEnabled!) {
      this.traceService.debug(TraceModules.command,
        'CommandSubscriptionProxyService.onNotifySubscriptions(), outstanding subscribe notifications on number of subscribe requests: %s',
        this._subscribeRequestsInvoked.size);

      this.traceService.debug(TraceModules.command,
        'CommandSubscriptionProxyService.onNotifySubscriptions(), pending subscribe requests (due to disconnected): %s',
        this._subscribeRequestsPending.size);
    }
  }
}
