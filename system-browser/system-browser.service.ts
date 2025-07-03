import { HttpClient, HttpHeaders, HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable, NgZone } from '@angular/core';
import { AuthenticationServiceBase, ErrorNotificationServiceBase, TraceService } from '@gms-flex/services-common';
import { Observable, throwError as observableThrowError, Subject, Subscription } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { TraceModules } from '../shared/trace-modules';
import { WsiQueryEncoder } from '../shared/wsi-query-encoder';
import { WsiUtilityService } from '../shared/wsi-utility.service';
import { HubProxyEvent } from '../signalr/hub-proxy-event';
import { HubProxyShared } from '../signalr/hub-proxy-shared';
import { SignalRService } from '../signalr/signalr.service';
import { WsiEndpointService } from '../wsi-endpoint/wsi-endpoint.service';
import { BrowserObject, ObjectNode, Page, SearchOption,
  SystemBrowserSubscription, SystemBrowserSubscriptionKey, ViewNode } from '../wsi-proxy-api/system-browser/data.model';
import { SystemBrowserServiceBase } from '../wsi-proxy-api/system-browser/system-browser.service.base';

const systemBrowserUrl = '/api/systembrowser/';
const systemBrowserSubscriptionUrl = '/api/sr/systembrowsersubscriptions/';

/**
 * GMS WSI system browser implementation.
 * @extends SystemBrowserBase
 */
@Injectable({
  providedIn: 'root'
})
export class SystemBrowserService extends SystemBrowserServiceBase {

  private hubProxyShared: HubProxyShared | undefined;
  private hubProxyEventCns: HubProxyEvent<SystemBrowserSubscription> | undefined;
  private readonly _cnsEvents: Subject<SystemBrowserSubscription> = new Subject<SystemBrowserSubscription>();

  /**
   * Constructor
   * @param {TraceService } trace The trace service
   * @param {HttpClient } HttpClient The Angular 2 http service
   * @param {SignalRService } SignalR service
   * @param {WsiUtilityService } wsiUtilityService A utility service for WSI calls.
   */
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
        this.hubProxyShared?.hubConnection?.connected.subscribe(value => this.onSignalRConnection(value), error => this.onSignalRConnectionError(error));
        this.traceService.info(TraceModules.sysBrowser, 'System browser service created.');
      } else {
        this.traceService.info(TraceModules.sysBrowser, 'NorisHub connection is not established!');
      }
    });
  }

  /**
   * Gets views from the system.
   * See also WSI API specification.
   *
   * @param {number } systemId? Optional system Id. If specified, views from this system are returned only.
   * If not specified, views from all systems are returned.
   * @returns An observable with an array of {ViewNode } objects.
   *
   * @memberOf SystemBrowserService
   */
  public getViews(systemId?: number): Observable<ViewNode[]> {
    this.traceService.debug(TraceModules.sysBrowser, 'getViews() called; systemId: %s; searchString: %s', systemId);
    const headers: HttpHeaders = this.wsiUtilityService.httpGetDefaultHeader(this.authenticationServiceBase.userToken);
    const url: string = this.wsiEndpointService.entryPoint + systemBrowserUrl;
    let params: HttpParams = new HttpParams();
    if (systemId) {
      params = params.set('systemId', systemId.toString());
    }

    return this.httpClient.get(url, { headers, params, observe: 'response' }).pipe(
      map((response: HttpResponse<any>) => this.wsiUtilityService.extractData(response, TraceModules.sysBrowser, 'getViews()')),
      catchError((response: HttpResponse<any>) => this.wsiUtilityService.handleError(response, TraceModules.sysBrowser, 'getViews()', this.errorService)));
  }

  /**
   * Gets the child nodes of the specified parent node.
   * See also WSI API specification.
   *
   * @param {number } systemId
   * @param {number } viewId
   * @param {string } parentNode, the designation of the parent node.
   * @param {boolean} sortByName
   * @returns {Observable<BrowserObject[]>}
   *
   * @memberOf SystemBrowserService
   */
  public getNodes(systemId: number, viewId: number, parentNode: string, sortByName = false): Observable<BrowserObject[]> {
    if ((systemId == undefined) || (viewId == undefined) || (parentNode == undefined)) {
      return observableThrowError(WsiUtilityService.createNewInvalidArgumentsError());
    }
    this.traceService.debug(TraceModules.sysBrowser, 'getNodes() called; systemId: %s; viewId: %s; parentNode: %s; sortByName: %s',
      systemId.toString(), viewId.toString(), parentNode, sortByName);

    const headers: HttpHeaders = this.wsiUtilityService.httpGetDefaultHeader(this.authenticationServiceBase.userToken);
    const parentNodeTripleEncoded: string = encodeURIComponent(encodeURIComponent(encodeURIComponent(parentNode)));

    let searchOption: SearchOption = SearchOption.description; // sort by description (default)

    if (sortByName === true) {
      searchOption = SearchOption.designation; // get by designation (name)
    }

    let params: HttpParams = new HttpParams({ encoder: new WsiQueryEncoder() });

    params = params.append('searchOption', String(searchOption.valueOf()));

    const url: string = this.wsiEndpointService.entryPoint + (systemBrowserUrl + systemId + '/' + viewId + '/' + parentNodeTripleEncoded);
    return this.httpClient.get(url, { headers, params, observe: 'response' }).pipe(
      map((response: HttpResponse<any>) => this.wsiUtilityService.extractData(response, TraceModules.sysBrowser, 'getNodes()')),
      catchError((response: HttpResponse<any>) => this.wsiUtilityService.handleError(response, TraceModules.sysBrowser, 'getNodes()', this.errorService)));
  }

  /**
   * Searches for nodes.
   * For details see WSI specification.
   *
   * @param {number } systemId
   * @param {string } searchString
   * @param {number } [viewId=undefined]
   * @param {SearchOption } [searchOption=undefined]
   * @param {boolean } [caseSensitive=undefined]
   * @param {boolean } [groupByParent=undefined]
   * @param {number } [size=undefined]
   * @param {number } [page=undefined]
   * @param {string } [disciplineFilter=undefined]
   * @param {string } [objectTypeFilter=undefined]
   * @param {boolean } [alarmSuppression=undefined]
   * @param {string } [aliasFilter=undefined]
   * @returns {Observable<Page>}
   *
   * @memberOf SystemBrowserService
   */
  public searchNodes(systemId: number, searchString: string, viewId?: number, searchOption = SearchOption.designation,
    caseSensitive = true, groupByParent = false, size?: number, page?: number,
    disciplineFilter?: string, objectTypeFilter?: string, alarmSuppression?: boolean,
    aliasFilter?: string): Observable<Page> {

    if ((systemId == undefined) || (searchString == undefined)) {
      return observableThrowError(WsiUtilityService.createNewInvalidArgumentsError());
    }
    this.traceService.debug(TraceModules.sysBrowser, 'searchNodes() called; systemId: %s; searchString: %s', systemId.toString(), searchString);

    const headers: HttpHeaders = this.wsiUtilityService.httpGetDefaultHeader(this.authenticationServiceBase.userToken);
    let url: string = this.wsiEndpointService.entryPoint + (systemBrowserUrl + systemId);
    if (viewId != undefined) {
      url = url + '/' + viewId;
    }

    const params: HttpParams = this.buildSearchParams(searchString, searchOption, caseSensitive, groupByParent,
      size, page, disciplineFilter, objectTypeFilter, alarmSuppression, aliasFilter);

    return this.httpClient.get(url, { headers, params, observe: 'response' }).pipe(
      map((response: HttpResponse<any>) => this.wsiUtilityService.extractData(response, TraceModules.sysBrowser, 'searchNodes()')),
      catchError((response: HttpResponse<any>) => this.wsiUtilityService.handleError(response, TraceModules.sysBrowser, 'searchNodes()', this.errorService)));
  }

  /**
   * Searches for nodes.
   * For details see WSI specification.
   *
   * @param {number } systemId
   * @param {string } searchString
   * @param {boolean } [groupByParent=undefined]
   * @returns {Observable<Page>}
   *
   * @memberOf SystemBrowserService
   */
  public searchNodeMultiple(systemId: number, searchString: string[], groupByParent = false): Observable<ObjectNode[]> {
    if ((systemId == undefined) || (searchString == undefined)) {
      return observableThrowError(WsiUtilityService.createNewInvalidArgumentsError());
    }
    this.traceService.debug(TraceModules.sysBrowser, 'searchNodesMultiple() called; systemId: %s; searchString: %s', systemId.toString(), searchString);

    const headers: HttpHeaders = this.wsiUtilityService.httpPostDefaultHeader(this.authenticationServiceBase.userToken);
    const url: string = this.wsiEndpointService.entryPoint + (systemBrowserUrl + systemId);
    let params: HttpParams = new HttpParams({
      encoder: new WsiQueryEncoder()
    });
    if (groupByParent !== undefined) {
      params = params.append('groupByParent', String(groupByParent));
    }

    const objectIds: string = JSON.stringify(searchString);

    return this.httpClient.post(url, objectIds, { headers, params, observe: 'response' }).pipe(
      map((response: HttpResponse<any>) => this.wsiUtilityService.extractData(response, TraceModules.sysBrowser,
        'searchNodesMultiple()')),
      catchError((response: HttpResponse<any>) => this.wsiUtilityService.handleError(response, TraceModules.sysBrowser,
        'searchNodesMultiple()', this.errorService)));
  }

  /**
   * Subscribes for system browser node changes
   * For details see WSI specification.
   *
   * @param {string[] } designations
   * @returns {Observable<SystemBrowserSubscriptionKey>}
   *
   * @memberOf SystemBrowserService
   */
  public subscribeNodeChanges(designations: string[]): Observable<SystemBrowserSubscriptionKey> {
    if ((designations == null) || (designations.length === 0)) {
      this.traceService.error(TraceModules.sysBrowser, 'subscribeNodeChanges() called with invalid arguments');
      return observableThrowError(WsiUtilityService.createNewInvalidArgumentsError());
    }
    this.traceService.debug(TraceModules.sysBrowser, 'subscribeNodeChanges() called; designations: %s', designations.toString());

    const headers: HttpHeaders = this.wsiUtilityService.httpPostDefaultHeader(this.authenticationServiceBase.userToken);
    const body: any = JSON.stringify(designations);

    const methodName = 'SystemBrowserService.subscribeNodeChanges()';
    const httpPostProxy: Subject<SystemBrowserSubscriptionKey> = new Subject<SystemBrowserSubscriptionKey>();
    if (this.hubProxyShared?.hubConnection?.isConnected === false) {
      this.traceService.debug(TraceModules.sysBrowser,
        'subscribeNodeChanges(): signalr connection not established; need to wait (postpone http calls) until established in order to get connection id.');
      const connectedSubscription: Subscription = this.hubProxyShared.hubConnection.connected.subscribe(started => {
        if (started === true) {
          this.traceService.debug(TraceModules.sysBrowser, 'subscribeNodeChanges(): connected event triggered; conection is now established.');
          // connection ID is available now, we can setup the "post observable" now and not earlier
          // (=> due to this we cannot use rxjs merge stream functionality such as "concat"!!)
          if (connectedSubscription !== undefined) {
            connectedSubscription.unsubscribe();
          } else {
            this.traceService.error(TraceModules.sysBrowser, 'subscribeNodeChanges(); Implementation error, we should not reach this!');
          }
          const url: string = this.wsiEndpointService.entryPoint + (systemBrowserSubscriptionUrl + this.hubProxyShared?.connectionId);
          const httpPost: Observable<SystemBrowserSubscriptionKey> = this.httpClient.post(url, body, { headers, observe: 'response' }).pipe(
            map((response: HttpResponse<any>) =>
              this.wsiUtilityService.extractData(response, TraceModules.sysBrowser, methodName)),
            catchError((response: HttpResponse<any>) =>
              this.wsiUtilityService.handleError(response, TraceModules.sysBrowser, methodName, this.errorService)));
          this.traceService.debug(TraceModules.sysBrowser, 'subscribeNodeChanges(); http post can be issued now (after connecting)...');
          httpPost.subscribe(value => this.onSubscribeNodeChangesNext(value, httpPostProxy),
            error => this.onSubscribeNodeChangesError(error, httpPostProxy));
        }
      });
      this.hubProxyShared.hubConnection.startHubConnection();
    } else {
      const url: string = this.wsiEndpointService.entryPoint + (systemBrowserSubscriptionUrl + this.hubProxyShared?.connectionId);
      const httpPost: Observable<SystemBrowserSubscriptionKey> = this.httpClient.post(url, body, { headers, observe: 'response' }).pipe(
        map((response: HttpResponse<any>) =>
          this.wsiUtilityService.extractData(response, TraceModules.sysBrowser, methodName)),
        catchError((response: HttpResponse<any>) =>
          this.wsiUtilityService.handleError(response, TraceModules.sysBrowser, methodName, this.errorService)));
      this.traceService.debug(TraceModules.sysBrowser, 'subscribeNodeChanges(); http post can be issued now (after connecting)...');
      httpPost.subscribe(value => this.onSubscribeNodeChangesNext(value, httpPostProxy),
        error => this.onSubscribeNodeChangesError(error, httpPostProxy));
    }
    return httpPostProxy.asObservable();
  }

  public nodeChangeNotification(): Observable<SystemBrowserSubscription> {
    return this._cnsEvents;
  }

  public searchViewNodeMultiple(systemId: any, viewId: any, deviceIdArr: string[]): Observable<any> {

    this.traceService.info(TraceModules.sysBrowser, 'searchViewNodeMultiple() called for: ' + systemId);

    const headers: HttpHeaders = this.wsiUtilityService.httpGetDefaultHeader(this.authenticationServiceBase.userToken);
    const url: string = this.wsiEndpointService.entryPoint + systemBrowserUrl + systemId + '/' + viewId;

    return this.httpClient.post(url, deviceIdArr, { headers, observe: 'response' }).pipe(
      map((response: HttpResponse<any>) => {
        return this.wsiUtilityService.extractData(response, TraceModules.sysBrowser, 'searchViewNodeMultiple()');
      }),
      catchError((response: HttpResponse<any>) =>
        this.wsiUtilityService.handleError(response, TraceModules.sysBrowser, 'searchViewNodeMultiple()', this.errorService)
      ));
  }

  private onSubscribeNodeChangesNext(value: SystemBrowserSubscriptionKey, httpPostProxy: Subject<SystemBrowserSubscriptionKey>): void {
    httpPostProxy.next(value);
    httpPostProxy.complete();
  }

  private onSubscribeNodeChangesError(error: any, httpPostProxy: Subject<SystemBrowserSubscriptionKey>): void {
    this.traceService.warn(TraceModules.sysBrowser, 'subscribeNodeChanges(); http post returned an error; %s', error);
    httpPostProxy.error(error);
  }

  private createEventProxies(): void {
    this.hubProxyShared = this.signalRService.getNorisHub();
    this.hubProxyEventCns = new HubProxyEvent<SystemBrowserSubscription>(
      this.traceService, this.hubProxyShared, 'notifySystemBrowserChanges', this.ngZone, this.signalRService);
    this.hubProxyEventCns.eventChanged.subscribe(values => this.onNotifyCnsChanges(values));
  }

  private onNotifyCnsChanges(cnsChanges: SystemBrowserSubscription): void {
    if (this.traceService.isDebugEnabled(TraceModules.sysBrowserNotification)) {
      this.traceService.debug(TraceModules.sysBrowserNotification, 'SystemBrowserService:onNotifyCnsChanges() called.');
      this.traceService.debug(TraceModules.sysBrowserNotification, 'ViewName = %s, Designation = %s, Action = %s, Change = %s',
        cnsChanges.View.Name, cnsChanges.Node.Designation, cnsChanges.Action, cnsChanges.Change);
    }
    this._cnsEvents.next(cnsChanges);
  }

  private onSignalRConnectionError(error: any): void {
    this.traceService.error(TraceModules.sysBrowser, 'onConnectionError(): %s', error.toString());
  }

  private onSignalRConnection(value: boolean): void {
    // to do
  }

  private buildSearchParams(searchString: string, searchOption: SearchOption,
    caseSensitive: boolean, groupByParent: boolean, size?: number, page?: number,
    disciplineFilter?: string, objectTypeFilter?: string, alarmSuppression?: boolean,
    aliasFilter?: string): HttpParams {

    let params: HttpParams = new HttpParams({
      encoder: new WsiQueryEncoder()
    });

    // encode search string
    const searchStringEncoded: string = encodeURIComponent(searchString);
    params = params.append('searchString', searchStringEncoded);

    if (searchOption != undefined) {
      params = params.append('searchOption', String(searchOption.valueOf()));
    }
    if (caseSensitive != undefined) {
      params = params.append('caseSensitive', String(caseSensitive));
    }
    if (groupByParent != undefined) {
      params = params.append('groupByParent', String(groupByParent));
    }
    if (size != undefined) {
      params = params.append('size', String(size));
    }
    if (page != undefined) {
      params = params.append('page', String(page));
    }
    if (disciplineFilter != undefined) {
      params = params.append('disciplineFilter', disciplineFilter);
    }
    if (objectTypeFilter != undefined) {
      params = params.append('objectTypeFilter', objectTypeFilter);
    }
    if (aliasFilter != undefined) {
      params = params.append('aliasFilter', aliasFilter);
    }
    if (alarmSuppression != undefined) {
      params = params.append('alarmSuppression', String(alarmSuppression));
    }

    return params;
  }
}
