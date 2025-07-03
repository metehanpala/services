import { HttpClient, HttpHeaders, HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthenticationServiceBase, ErrorNotificationServiceBase, isNullOrUndefined, TraceService } from '@gms-flex/services-common';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { TraceModules } from '../shared/trace-modules';
import { WsiUtilityService } from '../shared/wsi-utility.service';
import { WsiEndpointService } from '../wsi-endpoint/wsi-endpoint.service';
import { MultiMonitorConfigurationData, StationData, StationDataPerUser } from '../wsi-proxy-api/multi-monitor/data.model';
import { MultiMonitorConfigurationServiceBase } from '../wsi-proxy-api/multi-monitor/multi-monitor-configuration.service.base';

const multiMonitorsUrl = '/api/multimonitors';
const multiMonitorsUrlPerUser = '/api/multimonitors/user';

/**
 * Implementation for the WSI Multi monitor configuration service.
 * See the WSI documentation for details.
 *
 * @export
 * @class MultiMonitorConfigurationService
 * @extends {MultiMonitorConfigurationServiceBase}
 */
@Injectable({
  providedIn: 'root'
})
export class MultiMonitorConfigurationService extends MultiMonitorConfigurationServiceBase {

  public constructor(
    private readonly traceService: TraceService,
    private readonly httpClient: HttpClient,
    private readonly authenticationServiceBase: AuthenticationServiceBase,
    private readonly wsiEndpointService: WsiEndpointService,
    private readonly wsiUtilityService: WsiUtilityService,
    private readonly errorService: ErrorNotificationServiceBase) {
    super();
    this.traceService.info(TraceModules.multiMonitor, 'Service created.');
  }

  /**
   * Gets the stored multi monitor configuration from WSI.
   * See WSI documentation for more details.
   *
   * @param {string} stationIdentifier
   * @returns {Observable<any>}
   *
   * @memberOf MultiMonitorConfigurationService
   */
  public getMultiMonitorConfiguration(stationIdentifier: string): Observable<any> {
    this.traceService.info(TraceModules.multiMonitor, 'getMultiMonitorConfiguration() called, stationIdentifier: %s', stationIdentifier);
    const headers: HttpHeaders = this.wsiUtilityService.httpGetDefaultHeader(this.authenticationServiceBase.userToken);
    const url: string = this.wsiEndpointService.entryPoint + multiMonitorsUrl;
    let params: HttpParams = new HttpParams();
    if (!isNullOrUndefined(stationIdentifier)) {
      params = params.set('stationIdentifier', stationIdentifier);
    }

    return this.httpClient.get(url, { headers, params, observe: 'response' }).pipe(
      map((response: HttpResponse<any>) => this.wsiUtilityService.extractData(response, TraceModules.multiMonitor, 'getMultiMonitorConfiguration()')),
      catchError((response: HttpResponse<any>) => this.wsiUtilityService.handleError(response, TraceModules.multiMonitor,
        'getMultiMonitorConfiguration()', this.errorService)));
  }

  /**
   * Gets the stored multi monitor configuration per user from WSI.
   * See WSI documentation for more details.
   *
   * @param {string} stationIdentifier
   * @returns {Observable<any>}
   *
   * @memberOf MultiMonitorConfigurationService
   */
  public getMultiMonitorConfigurationPerUser(stationIdentifier: string): Observable<any> {
    this.traceService.info(TraceModules.multiMonitor, 'getMultiMonitorConfigurationPerUser() called, SstationIdentifier: %s', stationIdentifier);
    const headers: HttpHeaders = this.wsiUtilityService.httpGetDefaultHeader(this.authenticationServiceBase.userToken);
    const url: string = this.wsiEndpointService.entryPoint + multiMonitorsUrlPerUser;
    let params: HttpParams = new HttpParams();
    if (!isNullOrUndefined(stationIdentifier)) {
      params = params.set('stationIdentifier', stationIdentifier);
    }

    return this.httpClient.get(url, { headers, params, observe: 'response' }).pipe(
      map((response: HttpResponse<any>) => this.wsiUtilityService.extractData(response, TraceModules.multiMonitor, 'getMultiMonitorConfigurationPerUser()')),
      catchError((response: HttpResponse<any>) => this.wsiUtilityService.handleError(response, TraceModules.multiMonitor,
        'getMultiMonitorConfigurationPerUser()', this.errorService)));
  }

  /**
   * Stores the default multi monitor configuration into WSI.
   * See WSI documentation for more details.
   *
   * @param {MultiMonitorConfigurationData} data
   * @param {string} stationIdentifier
   * @returns {Observable<StationData>}
   *
   * @memberOf MultiMonitorConfigurationService
   */
  public setMultiMonitorConfiguration(data: MultiMonitorConfigurationData, stationIdentifier: string): Observable<StationData> {
    this.traceService.info(TraceModules.multiMonitor, 'setMultiMonitorConfigurationPer() called, data: %s', JSON.stringify(data));
    const headers: HttpHeaders = this.wsiUtilityService.httpPostDefaultHeader(this.authenticationServiceBase.userToken);
    const url: string = this.wsiEndpointService.entryPoint + multiMonitorsUrl;
    let params: HttpParams = new HttpParams();
    if (!isNullOrUndefined(stationIdentifier)) {
      params = params.append('stationIdentifier', stationIdentifier);
    }

    return this.httpClient.post(url, data, { headers, params, observe: 'response' }).pipe(
      map((response: HttpResponse<any>) => this.wsiUtilityService.extractData(response, TraceModules.multiMonitor, 'setMultiMonitorConfiguration()')),
      catchError((response: HttpResponse<any>) => this.wsiUtilityService.handleError(response, TraceModules.multiMonitor,
        'setMultiMonitorConfiguration()', this.errorService)));
  }

  /**
   * Stores the current multi monitor configuration per user into WSI.
   * See WSI documentation for more details.
   *
   * @param {MultiMonitorConfigurationData} data
   * @param {string} stationIdentifier
   * @returns {Observable<StationDataPerUser>}
   *
   * @memberOf MultiMonitorConfigurationService
   */
  public setMultiMonitorConfigurationPerUser(data: MultiMonitorConfigurationData, stationIdentifier: string): Observable<StationDataPerUser> {
    this.traceService.info(TraceModules.multiMonitor, 'setMultiMonitorConfigurationPerUser() called, data: %s', JSON.stringify(data));
    const headers: HttpHeaders = this.wsiUtilityService.httpPostDefaultHeader(this.authenticationServiceBase.userToken);
    const url: string = this.wsiEndpointService.entryPoint + multiMonitorsUrlPerUser;
    let params: HttpParams = new HttpParams();
    if (!isNullOrUndefined(stationIdentifier)) {
      params = params.append('stationIdentifier', stationIdentifier);
    }

    return this.httpClient.post(url, data, { headers, params, observe: 'response' }).pipe(
      map((response: HttpResponse<any>) => this.wsiUtilityService.extractData(response, TraceModules.multiMonitor, 'setMultiMonitorConfigurationPerUser()')),
      catchError((response: HttpResponse<any>) => this.wsiUtilityService.handleError(response, TraceModules.multiMonitor,
        'setMultiMonitorConfigurationPerUser()', this.errorService)));
  }

  /**
   * Deletes the default multi monitor configuration from WSI.
   * See WSI documentation for more details.
   *
   * @param {string} stationIdentifier
   * @returns {Observable<StationData>}
   *
   * @memberOf MultiMonitorConfigurationService
   */
  public deleteMultiMonitorConfiguration(stationIdentifier: string): Observable<StationData> {
    this.traceService.info(TraceModules.multiMonitor, 'deleteMultiMonitorConfiguration() called, stationIdentifier: %s', stationIdentifier);

    const headers: HttpHeaders = this.wsiUtilityService.httpDeleteDefaultHeader(this.authenticationServiceBase.userToken);
    const url: string = this.wsiEndpointService.entryPoint + multiMonitorsUrl;
    let params: HttpParams = new HttpParams();
    if (!isNullOrUndefined(stationIdentifier)) {
      params = params.append('stationIdentifier', stationIdentifier);
    }

    return this.httpClient.delete(url, { headers, params, observe: 'response' }).pipe(
      map((response: HttpResponse<any>) => this.wsiUtilityService.extractData(response, TraceModules.multiMonitor, 'deleteMultiMonitorConfiguration()')),
      catchError((response: HttpResponse<any>) => this.wsiUtilityService.handleError(response, TraceModules.multiMonitor,
        'deleteMultiMonitorConfiguration()', this.errorService)));
  }

  /**
   * Deletes the stored multi monitor configuration per user from WSI.
   * See WSI documentation for more details.
   *
   * @param {string} stationIdentifier
   * @returns {Observable<StationDataPerUser>}
   *
   * @memberOf MultiMonitorConfigurationService
   */
  public deleteMultiMonitorConfigurationPerUser(stationIdentifier: string): Observable<StationDataPerUser> {
    this.traceService.info(TraceModules.multiMonitor, 'deleteMultiMonitorConfigurationPerUser() called, stationIdentifier: %s', stationIdentifier);

    const headers: HttpHeaders = this.wsiUtilityService.httpDeleteDefaultHeader(this.authenticationServiceBase.userToken);
    const url: string = this.wsiEndpointService.entryPoint + multiMonitorsUrlPerUser;
    let params: HttpParams = new HttpParams();
    if (!isNullOrUndefined(stationIdentifier)) {
      params = params.append('stationIdentifier', stationIdentifier);
    }

    return this.httpClient.delete(url, { headers, params, observe: 'response' }).pipe(
      map((response: HttpResponse<any>) => this.wsiUtilityService.extractData(response, TraceModules.multiMonitor, 'deleteMultiMonitorConfigurationPerUser()')),
      catchError((response: HttpResponse<any>) => this.wsiUtilityService.handleError(response, TraceModules.multiMonitor,
        'deleteMultiMonitorConfigurationPerUser()', this.errorService)));
  }
}
