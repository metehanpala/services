import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { AuthenticationServiceBase, ErrorNotificationServiceBase, TraceService } from '@gms-flex/services-common';
import { Observable, Subject, Subscription } from 'rxjs';
import { catchError, delay, map } from 'rxjs/operators';

import { ConnectionState, HubProxyShared, SignalRService, UserAccount, UserRole, WsiUserRolesRes } from '../public-api';
import { SubscribeContextChannelizedSingle, SubscriptionUtility, TraceModules, WsiUtilityService } from '../shared';
import { HubProxyEvent } from '../signalr/hub-proxy-event';
import { WsiEndpointService } from '../wsi-endpoint';
import { UserRolesServiceProxyBase } from '../wsi-proxy-api';

const userRoles = '/api/accessrights/roles';
const userRolesUpdate = '/api/accessrights/updateuserroles';
const subscriptionChannelizeUrl = '/api/sr/accessrightssubscriptions/channelize/';
const subDeleteUrl = '/api/sr/accessrightssubscriptions/';
const textUnsubscribeUserRoles = 'unsubscribeUserRoles()';

const reconnectTimeout = 5000;

@Injectable({
  providedIn: 'root'
})
export class UserRolesServiceProxy implements UserRolesServiceProxyBase, OnDestroy {

  public hubProxyShared: HubProxyShared;
  public httpPostProxy: Subject<boolean>;
  public ctx: SubscribeContextChannelizedSingle<boolean>;

  private readonly _notifyConnectionState: Subject<ConnectionState> = new Subject<ConnectionState>();
  private readonly _subscribeRequestsInvoked: Map<string, SubscribeContextChannelizedSingle<boolean>> =
    new Map<string, SubscribeContextChannelizedSingle<boolean>>();
  private readonly _subscribeRequestsPending: Map<string, SubscribeContextChannelizedSingle<boolean>> =
    new Map<string, SubscribeContextChannelizedSingle<boolean>>();
  private readonly hubProxyEventUserRoles: HubProxyEvent<any[]>;
  private readonly subscriptions: Subscription[] | undefined = [];
  private readonly userRolesNotificationWSI: Subject<void> = new Subject<void>();

  constructor(
    private readonly traceService: TraceService,
    private readonly httpClient: HttpClient,
    private readonly authenticationServiceBase: AuthenticationServiceBase,
    private readonly wsiEndpointService: WsiEndpointService,
    private readonly wsiUtilityService: WsiUtilityService,
    private readonly errorService: ErrorNotificationServiceBase,
    private readonly signalRService: SignalRService,
    private readonly ngZone: NgZone
  ) {
    this.httpPostProxy = new Subject<boolean>();
    this.ctx = new SubscribeContextChannelizedSingle<boolean>(this.httpPostProxy);
    this.hubProxyShared = this.signalRService.getNorisHub();
    this.hubProxyEventUserRoles = new HubProxyEvent<any[]>(
      this.traceService, this.hubProxyShared, 'notifyAccessRights', this.ngZone, this.signalRService);

    this.hubProxyEventUserRoles.eventChanged.subscribe(() => this.onUserRolesNotification());

    this.subscriptions?.push(this.hubProxyShared?.hubConnection?.connectionState?.subscribe((value: any) =>
      this.onSignalRConnectionState(value)));

    const disconnectedObservable: Observable<boolean> | undefined = this.hubProxyShared?.hubConnection?.disconnected;
    if (disconnectedObservable !== undefined) {
      disconnectedObservable.pipe(delay(reconnectTimeout)).subscribe(
        value => this.onSignalRDisconnected(value), error => this.onSignalRDisconnectedError(error));
    }
    this.traceService.info(TraceModules.roles, 'UserRoles service created.');
  }

  public ngOnDestroy(): void {
    this.subscriptions?.forEach(element => element.unsubscribe());
  }

  public userRolesNotification(): Observable<void> {
    return this.userRolesNotificationWSI.asObservable();
  }

  public getUserRoles(): Observable<WsiUserRolesRes> {
    this.traceService.info(TraceModules.roles, 'getUserRoles() called.');
    const headers: HttpHeaders = this.wsiUtilityService.httpGetDefaultHeader(this.authenticationServiceBase.userToken);
    const url: string = this.wsiEndpointService.entryPoint + userRoles;

    return this.httpClient.get(url, { headers, observe: 'response' }).pipe(
      map((response: HttpResponse<any>) => this.wsiUtilityService.extractData(response, TraceModules.roles, 'getUserRoles()')),
      catchError((response: HttpResponse<any>) =>
        this.wsiUtilityService.handleError(response, TraceModules.roles, 'getUserRoles()', this.errorService)));
  }

  public updateUserRoles(userRolesInfo: WsiUserRolesRes): Observable<UserAccount> {
    this.traceService.info(TraceModules.roles, 'updateUserRoles() called.');
    const headers: HttpHeaders = this.wsiUtilityService.httpPutDefaultHeader(this.authenticationServiceBase.userToken);
    const url: string = this.wsiEndpointService.entryPoint + userRolesUpdate;
    const body: WsiUserRolesRes = userRolesInfo;

    return this.httpClient.put(url, body, { headers, observe: 'response' }).pipe(
      map((response: HttpResponse<any>) => this.wsiUtilityService.extractData(response, TraceModules.roles, 'updateUserRoles()')),
      catchError((response: HttpResponse<any>) =>
        this.wsiUtilityService.handleError(response, TraceModules.roles, 'updateUserRoles()', this.errorService)));
  }

  public subscribeUserRoles(): Observable<any> {
    this.traceService.info(TraceModules.roles, 'UserRolesProxyService.subscribeUserRoles() called.');
    const startTime = performance.now();

    if (this.hubProxyShared.hubConnection?.isConnected === false) {
      this._subscribeRequestsPending.set(this.ctx.id, this.ctx);
      this.traceService.debug(TraceModules.roles,
        'subscribeUserRoles(): signalr connection not established; need to wait (postpone http calls) until established in order to get connection id.');
      const connectedSubscription: Subscription = this.hubProxyShared.hubConnection.connected.subscribe(started => {
        if (started === true) {
          this.traceService.debug(TraceModules.roles, 'subscribeUserRoles(): connected event triggered; conection is now established.');
          // connection ID is available now, we can setup the "post observable" now and not earlier
          // (=> due to this we cannot use rxjs merge stream functionality such as "concat"!!)
          if (connectedSubscription !== undefined) {
            connectedSubscription.unsubscribe();
          }

          this.subscribeWsiUserRoles(startTime, '(after connecting)...');
        }
      });
      this.hubProxyShared.hubConnection.startHubConnection();
    } else {
      this.subscribeWsiUserRoles(startTime, 'immediately...');
    }
    return this.httpPostProxy.asObservable();
  }

  public unsubscribeUserRoles(): Observable<boolean> {
    this.traceService.info(TraceModules.roles, `UserRolesProxyService.${textUnsubscribeUserRoles} called`);

    if (this.hubProxyShared.hubConnection?.isConnected === false) {
      this.traceService.debug(TraceModules.roles,
        textUnsubscribeUserRoles + ': signalr connection not established; need to wait (postpone http calls) until established in order to get connection id.');
      const connectedSubscription: Subscription = this.hubProxyShared.hubConnection.connected.subscribe(started => {
        if (started === true) {
          this.traceService.debug(TraceModules.roles, textUnsubscribeUserRoles + ': connected event triggered: connection is now established.');
          // connection ID is available now, we can setup the "post observable" now and not earlier
          // => due to this we cannot use rxjs merge stream functionality such as "concat"!!
          if (connectedSubscription !== undefined) {
            connectedSubscription.unsubscribe();
          }

          this.unsubscribeWsiUserRoles('(after connecting)...');
        }
      });
      this.hubProxyShared.hubConnection.startHubConnection();
    } else {
      this.unsubscribeWsiUserRoles('immediately...');
    }
    return this.httpPostProxy.asObservable();
  }

  private userRolesUnsubscribeDelete(url: string, headers: HttpHeaders): Observable<boolean> {
    return this.httpClient.delete(url, { headers, observe: 'response' }).pipe(
      map((response: HttpResponse<any>) =>
        this.wsiUtilityService.extractData(response, TraceModules.roles, textUnsubscribeUserRoles)),
      catchError((response: HttpResponse<any>) =>
        this.wsiUtilityService.handleError(response, TraceModules.roles, textUnsubscribeUserRoles, this.errorService)));
  }

  private unsubscribeWsiUserRoles(stateMsg: string): void {
    const headers: HttpHeaders = this.wsiUtilityService.httpDeleteDefaultHeader(this.authenticationServiceBase.userToken);

    const url: string = this.wsiEndpointService.entryPoint + (subDeleteUrl + this.hubProxyShared.connectionId) + '/userroles';
    this.traceService.debug(TraceModules.roles, textUnsubscribeUserRoles + '; http delete can be issued ' + stateMsg);

    const httpPost: Observable<boolean> = this.userRolesUnsubscribeDelete(url, headers);
    httpPost.subscribe(value => this.onUnsubscribeUserRolesNext(value, this.httpPostProxy),
      error => this.onUnsubscribeUserRolesError(error, this.httpPostProxy));
  }

  private subscribeWsiUserRoles(startTime: number, stateMsg: string): void {
    const headers: HttpHeaders = this.wsiUtilityService.httpPostDefaultHeader(this.authenticationServiceBase.userToken);

    const url: string = this.wsiEndpointService.entryPoint + subscriptionChannelizeUrl + this.ctx.id + '/' + this.hubProxyShared.connectionId;

    // eslint-disable-next-line @typescript-eslint/naming-convention
    const body: any = JSON.stringify({ });
    const httpPost = this.userRolesSubscriptionPost(url, body, headers);
    this.traceService.debug(TraceModules.roles,
      'UserRolesProxyService.subscribeUserRoles(); http post can be issued ' + stateMsg);
    httpPost.subscribe(value => this.onSubscribeUserRolesNext(value, this.httpPostProxy, startTime),
      error => this.onSubscribeUserRolesError(error, this.ctx, this.httpPostProxy));
    this._subscribeRequestsInvoked.set(this.ctx.id, this.ctx);
    this._subscribeRequestsPending.delete(this.ctx.id);
  }

  private userRolesSubscriptionPost(url: string, body: any, headers: HttpHeaders): Observable<boolean> {
    return this.httpClient.post(url, body, { headers }).pipe(
      map((response: HttpResponse<any> | any) =>
        this.extractData(response)),
      catchError((response: HttpResponse<any>) =>
        this.wsiUtilityService.handleError(response, TraceModules.roles, 'subscribeUserRoles()', this.errorService)));
  }

  private onSignalRDisconnectedError(error: any): void {
    this.traceService.error(TraceModules.roles, 'UserRolesProxyService.onSignalRDisconnectedError(): %s', error.toString());
  }

  private onSignalRDisconnected(value: boolean): void {
    if (value === true) {
      if (this.hubProxyShared.hubConnection?.connectionStateValue === SignalR.ConnectionState.Disconnected) {
        this.traceService.info(TraceModules.roles, 'UserRolesProxyService.onSignalRDisconnected(): starting again the connection');
        this.hubProxyShared.hubConnection.startHubConnection();
      }
    }
  }

  private extractData(res: HttpResponse<any>): boolean {
    return true;
  }

  private onSubscribeUserRolesNext(value: boolean, httpPostProxy: Subject<boolean>, startTime: number): void {
    this.traceService.info(TraceModules.roles, 'UserRolesProxyService.onSubscribeUserRoles() done: success=%s', value);
    this.traceService.info(TraceModules.roles, 'UserRolesProxyService.onSubscribeUserRoles() done: success=%s, time=%sms',
      value, performance.now() - startTime);
    // nothing to do if okay! we need to wait of the subscription notification over signalR
  }

  private onUnsubscribeUserRolesNext(value: boolean, httpPostProxy: Subject<boolean>): void {
    httpPostProxy.next(value);
    httpPostProxy.complete();
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

  private onSubscribeUserRolesError(error: any, ctx: SubscribeContextChannelizedSingle<boolean>, httpPostProxy: Subject<boolean>): void {
    this.traceService.warn(TraceModules.roles, 'UserRolesProxyService.onSubscribeUserRolesError(); http post returned an error; %s', error);
    this._subscribeRequestsInvoked.delete(ctx.id);
    httpPostProxy.error(error);
  }

  private onUnsubscribeUserRolesError(error: any, httpPostProxy: Subject<boolean>): void {
    this.traceService.warn(TraceModules.roles, 'UserRolesProxyService.onUnsubscribeUserRolesError(); http post returned an error; %s', error);
    httpPostProxy.error(error);
  }

  private onUserRolesNotification(): void {
    this.userRolesNotificationWSI.next();
  }
}
