import { HttpClient, HttpHeaders, HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthenticationServiceBase, ErrorNotificationServiceBase, TraceService } from '@gms-flex/services-common';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { ValidationInput } from '../public-api';
import { TraceModules } from '../shared/trace-modules';
import { WsiQueryEncoder } from '../shared/wsi-query-encoder';
import { WsiUtilityService } from '../shared/wsi-utility.service';
import { WsiEndpointService } from '../wsi-endpoint/wsi-endpoint.service';
import { AppRights } from '../wsi-proxy-api/app-rights';
import {
  ActiviyEnumValues,
  DetailPane,
  FlexUpdateLogViewDefinition,
  HistLogColumnDescription,
  HistLogEnumValues,
  HistoryApiParams,
  HistoryLogKind,
  HistoryLogMetaData,
  HistoryLogTable,
  LogViewDefinitionFilters,
  ReportDefination,
  TextGroup } from '../wsi-proxy-api/log-viewer/data.model';
import { LogViewerServiceBase } from '../wsi-proxy-api/log-viewer/log-viewer.service.base';

@Injectable({
  providedIn: 'root'
})
export class LogViewerService extends LogViewerServiceBase {
  public constructor(
    private readonly traceService: TraceService,
    private readonly httpClient: HttpClient,
    private readonly authenticationServiceBase: AuthenticationServiceBase,
    private readonly wsiEndpointService: WsiEndpointService,
    private readonly wsiUtilityService: WsiUtilityService,
    private readonly errorService: ErrorNotificationServiceBase) {
    super();
    this.traceService.debug(TraceModules.historyLog, 'History Log Service created');
  }

  private readonly accessRightsUrl = '/api/accessrights';
  private readonly historyBaseUrl = '/api/historylogs/';
  private readonly settingsUrl = '/api/settings/';
  private readonly getParametersBaseUrl = '/api/historylogs/ReportParam/';
  private readonly tableBaseUrl = '/api/tables/local/';

  // ----------------------------------------------------------------------------------------------------------------

  /**
   * Sets the saved settings in WSI.
   * See WSI documentation for more details.
   * @param {string } settingID
   * @param {string | JSON } settingValue
   * @returns {Observable<string>}
   * @memberOf LogViewerService
   */
  public putSettings(settingID: string, settingValue: string | JSON): Observable<boolean> {
    this.traceService.info(TraceModules.settings, 'putSettings() called, Setting ID: %s', settingID);
    const headers: HttpHeaders = this.wsiUtilityService.httpPutDefaultHeader(this.authenticationServiceBase.userToken);
    const url = this.wsiEndpointService.entryPoint + this.settingsUrl + settingID;

    return this.httpClient.put(url, settingValue, { headers, observe: 'response' }).pipe(
      map((response: HttpResponse<any>) => this.extractUpdate(response)),
      catchError((response: HttpResponse<any>) => this.wsiUtilityService.handleError(response, TraceModules.settings, 'putSettings()', this.errorService)));
  }
  public getTextGroupSelection(systemId: number, tableName: string): Observable<TextGroup[]> {

    const functionName = 'getTextGroupSelection()';
    this.traceService.info(TraceModules.historyLog, `${functionName}: http get called`);

    const headers: HttpHeaders = this.wsiUtilityService.httpGetDefaultHeader(this.authenticationServiceBase.userToken);
    const url = `${this.wsiEndpointService.entryPoint}${this.tableBaseUrl}${systemId}/${tableName}/langText`;

    // Execute http GET request
    return this.httpClient.get(url, { headers, observe: 'response' }).pipe(
      map((response: HttpResponse<any>) =>
        this.wsiUtilityService.extractData(response, TraceModules.tables, `${functionName}: http get response`)),
      catchError((response: HttpResponse<any>) =>
        this.wsiUtilityService.handleError(response, TraceModules.tables, `${functionName}: http get response`, this.errorService)));
  }

  /**
   * This method returns the access rights for log viewer.
   * i.e. refer to WSI documentation for more details.
   */
  public getAccessRightsForLogViewer(): Observable<AppRights> {
    const functionName = 'getAccessRightsForLogViewer()';
    this.traceService.info(TraceModules.historyLog, `${functionName}: http get called`);
    const headers: HttpHeaders = this.wsiUtilityService.httpGetDefaultHeader(this.authenticationServiceBase.userToken);
    const url = this.wsiEndpointService.entryPoint + this.accessRightsUrl;
    // Execute http GET request
    return this.httpClient.get<any>(url, { headers, observe: 'response' }).pipe(
      map((response: HttpResponse<any>) =>
        this.wsiUtilityService.extractData(response, TraceModules.historyLog, `${functionName}: http get response`)),
      catchError((response: HttpResponse<any>) =>
        this.wsiUtilityService.handleError(response, TraceModules.historyLog, `${functionName}: http get response`, this.errorService)));
  }

  // ----------------------------------------------------------------------------------------------------------------

  /**
   * This method returns the history log meta data for a specified system or all systems (system number = 0).
   * i.e. refer to WSI documentation for more details.
   */
  public getHistoryLogMetaData(systemId: number): Observable<HistoryLogMetaData[]> | any {
    return null;
  }

  // ----------------------------------------------------------------------------------------------------------------

  /**
   * This method returns history logs for either of the log kinds ActivityLogTable, AlarmLogTable, EventLogTable or
   * LogViewTable. The number of records to be retrieved and the kinds of columns to be fetched can be specified.
   * The time range (fromDate, toDate) can also be provided.
   * i.e. refer to WSI documentation for more details.
   */
  public getHistoryLogs(data: HistoryApiParams): Observable<HistoryLogTable> {
    const functionName = 'getHistoryLogs()';
    this.traceService.info(TraceModules.historyLog, `${functionName}: http post called`);
    const headers: HttpHeaders = this.wsiUtilityService.httpPostDefaultHeader(this.authenticationServiceBase.userToken);
    const url = this.wsiEndpointService.entryPoint + this.historyBaseUrl + data.systemId + '/' + data.historyLogKind;

    // Set up query parameter size
    let params: HttpParams = new HttpParams({
      encoder: new WsiQueryEncoder()
    });

    params = this.setHttpParams(data, params);

    // Set up body parameters with the requested parent and child column names
    /* eslint-disable @typescript-eslint/naming-convention */
    type ColumList = { Parent: string[] | null; Child: string[] | null };
    const columList = {};
    /* eslint-disable @typescript-eslint/naming-convention */

    const body = JSON.stringify(columList);

    // Execute http post request
    return this.httpClient.post(url, body, { headers, params, observe: 'response' }).pipe(
      map((response: HttpResponse<any>) =>
        this.wsiUtilityService.extractData(response, TraceModules.historyLog, `${functionName}: http post response`)),
      catchError((response: HttpResponse<any>) =>
        this.wsiUtilityService.handleError(response, TraceModules.historyLog, `${functionName}: http post response`, this.errorService)));
  }

  // ----------------------------------------------------------------------------------------------------------------

  /**
   * This method returns the history log column descriptons for either of the log kinds ActivityLogTable, AlarmLogTable,
   * EventLogTable or LogViewTable.
   */
  public getHistoryLogColumnDescripton(systemId: number, historyLogKind: HistoryLogKind): Observable<HistLogColumnDescription[]> {

    const functionName = 'getHistoryLogColumnDescripton()';
    this.traceService.info(TraceModules.historyLog, `${functionName}: http get called`);

    const headers: HttpHeaders = this.wsiUtilityService.httpGetDefaultHeader(this.authenticationServiceBase.userToken);
    const url = this.wsiEndpointService.entryPoint + this.historyBaseUrl + systemId + '/' + historyLogKind;

    // Execute http GET request
    return this.httpClient.get(url, { headers, observe: 'response' }).pipe(
      map((response: HttpResponse<any>) =>
        this.wsiUtilityService.extractData(response, TraceModules.historyLog, `${functionName}: http get response`)),
      catchError((response: HttpResponse<any>) =>
        this.wsiUtilityService.handleError(response, TraceModules.historyLog, `${functionName}: http get response`, this.errorService)));
  }

  public getLogViewDefinition(systemId: number, objectId: string): Observable<LogViewDefinitionFilters> {

    const functionName = 'getLogViewDefinition()';
    this.traceService.info(TraceModules.historyLog, `${functionName}: http get called`);

    const headers: HttpHeaders = this.wsiUtilityService.httpGetDefaultHeader(this.authenticationServiceBase.userToken);
    const url = this.wsiEndpointService.entryPoint + this.historyBaseUrl + systemId + '/logs/logviewdefinition/' + objectId;

    // Execute http GET request
    return this.httpClient.get(url, { headers, observe: 'response' }).pipe(
      map((response: HttpResponse<any>) =>
        this.wsiUtilityService.extractData(response, TraceModules.historyLog, `${functionName}: http get response`)),
      catchError((response: HttpResponse<any>) =>
        this.wsiUtilityService.handleError(response, TraceModules.historyLog, `${functionName}: http get response`, this.errorService)));
  }
  public getHistoryLogColumnEnums(systemId: number, historyLogKind: HistoryLogKind, columns: string[]): Observable<ActiviyEnumValues> {

    const functionName = 'getHistoryLogColumnEnums()';
    this.traceService.info(TraceModules.historyLog, `${functionName}: http get called`);

    const headers: HttpHeaders = this.wsiUtilityService.httpGetDefaultHeader(this.authenticationServiceBase.userToken);
    const url = `${this.wsiEndpointService.entryPoint}${this.historyBaseUrl}${systemId}/${historyLogKind}/enumvalues`;
    let params = new HttpParams();
    columns.forEach(col => {
      params = params.append('columns', col); // Append multiple values
    });
    // Execute http GET request
    return this.httpClient.get(url, { headers, params, observe: 'response' }).pipe(
      map((response: HttpResponse<any>) =>
        this.wsiUtilityService.extractData(response, TraceModules.historyLog, `${functionName}: http get response`)),
      catchError((response: HttpResponse<any>) =>
        this.wsiUtilityService.handleError(response, TraceModules.historyLog, `${functionName}: http get response`, this.errorService)));
  }
  public createUpdateLogViewDefinition(systemId: number, flexUpdateLogViewDefinition: FlexUpdateLogViewDefinition): Observable<LogViewDefinitionFilters> {

    const functionName = 'createUpdateLogViewDefinition()';
    this.traceService.info(TraceModules.historyLog, `${functionName}: http put called`);

    const headers: HttpHeaders = this.wsiUtilityService.httpGetDefaultHeader(this.authenticationServiceBase.userToken);
    const url = this.wsiEndpointService.entryPoint + this.historyBaseUrl + systemId + '/logs/logviewdefinition';
    //  headers.set('Content-Type', 'application/json; charset=utf-8');
    //  const body = JSON.stringify(flexUpdateLogViewDefinition);
    return this.httpClient.put(url, flexUpdateLogViewDefinition, { headers, observe: 'response' }).pipe(
      map((response: HttpResponse<any>) =>
        this.wsiUtilityService.extractData(response, TraceModules.historyLog, `${functionName}: http put response`)),
      catchError((response: HttpResponse<any>) =>
        this.wsiUtilityService.handleError(response, TraceModules.historyLog, `${functionName}: http put response`, this.errorService)));
  }

  public deleteLogViewDefinition(systemId: number, objectId: string, validationInput: ValidationInput): Observable<boolean> {

    const functionName = 'deleteLogViewDefinition()';
    this.traceService.info(TraceModules.historyLog, `${functionName}: http get called`);

    const headers: HttpHeaders = this.wsiUtilityService.httpGetDefaultHeader(this.authenticationServiceBase.userToken);
    const url = this.wsiEndpointService.entryPoint + this.historyBaseUrl + systemId + '/logs/logviewdefinition/' + objectId;

    return this.httpClient.delete(url, { headers, observe: 'response', body: validationInput }).pipe(
      map((response: HttpResponse<any>) =>
        this.wsiUtilityService.extractData(response, TraceModules.historyLog, `${functionName}: http delete response`)),
      catchError((response: HttpResponse<any>) =>
        this.wsiUtilityService.handleError(response, TraceModules.historyLog, `${functionName}: http delete response`, this.errorService)));
  }

  // ----------------------------------------------------------------------------------------------------------------

  /**
   * This method discard existing snapshot for user if node refreshes
   */
  public discardSnapshot(systemId: number, tableName: string, snapshotId: string): Observable<boolean> {
    const functionName = 'discardSnapshot()';
    this.traceService.info(TraceModules.historyLog, `${functionName}: http get called`);

    const headers: HttpHeaders = this.wsiUtilityService.httpDeleteDefaultHeader(this.authenticationServiceBase.userToken);
    const snapshotIdEncodedDoubleEncoded: string = encodeURIComponent(encodeURIComponent(encodeURIComponent(JSON.stringify(snapshotId))));
    const url = this.wsiEndpointService.entryPoint + this.historyBaseUrl + systemId + '/' + tableName + '/' + snapshotIdEncodedDoubleEncoded;
    // Execute http delete request
    return this.httpClient.delete(url, { headers, observe: 'response' }).pipe(
      map((response: HttpResponse<any>) =>
        this.wsiUtilityService.extractData(response, TraceModules.historyLog, `${functionName}: http delete response`)),
      catchError((response: HttpResponse<any>) =>
        this.wsiUtilityService.handleError(response, TraceModules.historyLog, `${functionName}: http delete response`, this.errorService)));
  }

  // ---------------------------------------------------------------------------------------------------------------

  /**
  This method is used to get reportdefination information for report defination id
   */
  public getReportDefination(systemId: number, reportDefinitionId: string): Observable<ReportDefination> {

    const functionName = 'getReportDefination()';
    this.traceService.info(TraceModules.historyLog, `${functionName}: http get called`);

    const headers: HttpHeaders = this.wsiUtilityService.httpGetDefaultHeader(this.authenticationServiceBase.userToken);
    const url = `${this.wsiEndpointService.entryPoint}${this.historyBaseUrl}${systemId}/reports/flexReportDefination/${reportDefinitionId}`;

    // Execute http GET request
    return this.httpClient.get(url, { headers, observe: 'response' }).pipe(
      map((response: HttpResponse<any>) =>
        this.wsiUtilityService.extractData(response, TraceModules.historyLog, `${functionName}: http get response`)),
      catchError((response: HttpResponse<any>) =>
        this.wsiUtilityService.handleError(response, TraceModules.historyLog, `${functionName}: http get response`, this.errorService)));
  }

  /**
   * This method returns the history log enum values for a given column that is identified by the column name and belonging to either of
   * the histroy log tables ActivityLogTable, AlarmLogTable, EventLogTable or LogViewTable.
   */
  public getHistoryLogEnumValues(systemId: number, historyLogKind: HistoryLogKind, columnName: string): Observable<HistLogEnumValues> {

    const functionName = 'getHistoryLogEnumValues()';
    this.traceService.info(TraceModules.historyLog, `${functionName}: http get called`);

    const headers: HttpHeaders = this.wsiUtilityService.httpGetDefaultHeader(this.authenticationServiceBase.userToken);
    const url = `${this.wsiEndpointService.entryPoint}${this.historyBaseUrl}${systemId}/${historyLogKind}/enumvalues/${columnName}`;

    // Execute http GET request
    return this.httpClient.get(url, { headers, observe: 'response' }).pipe(
      map((response: HttpResponse<any>) =>
        this.wsiUtilityService.extractData(response, TraceModules.historyLog, `${functionName}: http get response`)),
      catchError((response: HttpResponse<any>) =>
        this.wsiUtilityService.handleError(response, TraceModules.historyLog, `${functionName}: http get response`, this.errorService)));
  }

  // ---------------------------------------------------------------------------------------------------------------
  /**
   * This method returns Activity Icon Json File
   */
  public getActivityIconJson(): Observable<DetailPane> {
    const functionName = 'getActivityIconJson()';
    this.traceService.info(TraceModules.historyLog, `${functionName}: http get called`);
    // Execute http get request
    return this.httpClient.get('@gms-flex/log-viewer/assets/activity-icon.json', { observe: 'response' }).pipe(
      map((response: HttpResponse<any>) =>
        this.wsiUtilityService.extractData(response, TraceModules.historyLog, `${functionName}: http get response`)),
      catchError((response: HttpResponse<any>) =>
        this.wsiUtilityService.handleError(response, TraceModules.historyLog, `${functionName}: http get response`, this.errorService)));
  }

  // ----------------------------------------------------------------------------------------------------------------
  private setHttpParams(data: HistoryApiParams, params: HttpParams): HttpParams {
    if (data?.conditionFilter) {
      params = params.append('conditionFilter', data.conditionFilter);
    }

    if (data?.size) {
      params = params.append('size', String(data?.size));
    }
    if (data?.snapshotSize) {
      params = params.append('snapshotSize', String(data?.snapshotSize));
    }
    // Page number starts from 1
    if (data && data.pageNumber! >= 0) {
      params = params.append('page', String(data?.pageNumber));
    }

    if (data?.fromDate) {
      params = params.append('fromDate', data.fromDate.toISOString());
    }

    if (data?.toDate) {
      params = params.append('toDate', data.toDate.toISOString());
    }

    if (data?.sortColumnData) {
      params = params.append('sortColumnData', JSON.stringify(data.sortColumnData));
    }
    if (data?.nameFilter) {
      params = params.append('nameFilter', JSON.stringify(data.nameFilter));
    }

    if (data?.snapshotId) {
      params = params.append('snapshotId', JSON.stringify(data.snapshotId));
    }
    if (data?.additionalInfo) {
      params = params.append('additionalInfo', JSON.stringify(data.additionalInfo));
    }
    return params;
  }
  private extractUpdate(res: HttpResponse<any>): boolean {
    if (res.status < 200 || res.status >= 300) {
      throw new Error('Bad response status: ' + res.status);
    }
    try {
      let isSuccess = true;
      switch (res.status) {
        case 200:
          this.traceService.info(TraceModules.settings, ' Update successful.');
          break;
        case 204:
          this.traceService.info(TraceModules.settings, ' Update successful - created.');
          break;
        default:
          this.traceService.warn(TraceModules.settings, ' Update not successful.');
          isSuccess = false;
          break;
      }
      return isSuccess;
    } catch (exc) {
      this.traceService.warn(TraceModules.settings, ' Update: Response not handled properly; url: %s; exception caught: %s',
        res.url, (exc as Error).message.toString());
      return false;
    }
  }
}
