import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthenticationServiceBase, ErrorNotificationServiceBase, TraceService } from '@gms-flex/services-common';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { TraceModules } from '../shared/trace-modules';
import { WsiQueryEncoder } from '../shared/wsi-query-encoder';
import { WsiUtilityService } from '../shared/wsi-utility.service';
import { ValueServiceBase } from '../values/value.service.base';
import { WsiEndpointService } from '../wsi-endpoint/wsi-endpoint.service';
import { FilesServiceBase } from '../wsi-proxy-api/files';
import { CreateDocumentData, DeleteDocumentData, ReportCancelResult, ReportDeleteResult,
  ReportDocumentData, ReportHistoryResult, ReportStartResult, ReportUrl } from '../wsi-proxy-api/report/data.model';
import { ReportServiceBase } from '../wsi-proxy-api/report/report.service.base';
import { ValueDetails } from '../wsi-proxy-api/shared';

const historyLogsUrl = '/api/historylogs/';
const reportsDocumentUrl = '/api/historylogs/reports';
const reportHistory = '/api/historylogs/reports/history';

@Injectable({
  providedIn: 'root'
})
export class ReportService extends ReportServiceBase {

  public constructor(
    private readonly httpClient: HttpClient,
    private readonly authenticationServiceBase: AuthenticationServiceBase,
    private readonly wsiEndpointService: WsiEndpointService,
    private readonly wsiUtilityService: WsiUtilityService,
    private readonly errorService: ErrorNotificationServiceBase,
    private readonly traceService: TraceService,
    private readonly valueService: ValueServiceBase,
    private readonly filesService: FilesServiceBase,
    private readonly http: HttpClient) {
    super();
    this.traceService.debug(TraceModules.trends, 'Report Service created.');
  }

  public getFilePath(message: any): Observable<ValueDetails[]> {
    const propertyId: string = message.ObjectId + '.' + message.Attributes.DefaultProperty;
    return this.valueService.readValue(propertyId);
  }

  public openTab(path: string): void {
    window.open(path, '_blank');
  }

  public getWhitelist(): Observable<any> {
    return this.http.get('./config/whitelist.settings.json').
      pipe(catchError((err: HttpErrorResponse) => {
        this.traceService.warn('Error getting whitelist configuration: ' + err);
        return of({ 'whitelist': [] });
      }));
  }

  public async isInWhitelist(url: any): Promise<boolean> {
    let isInWhitelist = false;
    await this.getWhitelist().toPromise().then(res => {
      if (res.whitelist.find((x: any) => x === url) !== undefined) {
        isInWhitelist = true;
      } else {
        isInWhitelist = false;
      }
    });
    return isInWhitelist;
  }

  public async getDocument(systemId: number, documentData: ReportDocumentData): Promise<ReportUrl> {

    let fileUrl: any;
    let relativePath: string;
    let type: string | undefined;
    let path: string | undefined;

    // get a file from documents folder
    if (documentData != undefined && documentData != null) {
      relativePath = documentData.DocumentPath.substring(documentData.DocumentPath.indexOf('FlexReports'));
      await this.filesService.getFile(systemId, relativePath).toPromise().then(resp => {
        path = 'file://' + documentData.DocumentDisplayName;
        fileUrl = resp;
        type = 'file';
      }).catch(err => {
        type = undefined;
        fileUrl = undefined;
      });
    } else {
      fileUrl = path;
      type = 'url';
    }
    return { type, path, url: fileUrl };
  }

  public getCreatedDocuments(createDocumentData: CreateDocumentData): Observable<ReportDocumentData[]> {
    this.traceService.info(TraceModules.files, 'getCreatedDocuments() called');
    const headers: HttpHeaders = this.wsiUtilityService.httpGetDefaultHeader(this.authenticationServiceBase.userToken);

    // Set up query parameter size
    let params: HttpParams = new HttpParams({
      encoder: new WsiQueryEncoder()
    });

    params = this.setHttpParams(createDocumentData, params);

    const url: string = this.wsiEndpointService.entryPoint + reportsDocumentUrl + '/' + createDocumentData.SystemId;

    return this.httpClient.get(url, { headers, params, observe: 'response' }).pipe(
      map((response: HttpResponse<ReportDocumentData[]> | any) => {
        return response.body;
      }),
      catchError((response: HttpResponse<any>) => this.wsiUtilityService.handleError(response, TraceModules.trends,
        'getCreatedDocuments()', this.errorService)));
  }

  public getReportHistory(systemId: number, reportId: string): Observable<any> {
    this.traceService.info(TraceModules.files, 'getReportHistory() called');
    const headers: HttpHeaders = this.wsiUtilityService.httpGetDefaultHeader(this.authenticationServiceBase.userToken);
    const url: string = this.wsiEndpointService.entryPoint + historyLogsUrl + systemId + '/reports/history/' + reportId;

    return this.httpClient.get(url, { headers, observe: 'response' }).pipe(
      map((response: HttpResponse<ReportHistoryResult> | any) => {
        return response.body;
      }),
      catchError((response: HttpResponse<any>) => this.wsiUtilityService.handleError(response, TraceModules.trends,
        'getReportHistory()', this.errorService)));

  }

  public deleteReportDocuments(deleteDocumentData: DeleteDocumentData): Observable<ReportDeleteResult> {
    this.traceService.info(TraceModules.files, 'deleteReportDocuments() called');
    const headers: HttpHeaders = this.wsiUtilityService.httpGetDefaultHeader(this.authenticationServiceBase.userToken);
    const url: string = this.wsiEndpointService.entryPoint + historyLogsUrl + deleteDocumentData.SystemId + '/reports/delete/documentNames';

    return this.httpClient.delete(url, { headers, body: deleteDocumentData.DeleteFilters, observe: 'response' }).pipe(
      map((response: HttpResponse<ReportDeleteResult> | any) => {
        return response.body;
      }),
      catchError((response: HttpResponse<any>) => this.wsiUtilityService.handleError(response, TraceModules.trends,
        'deleteReportDocuments()', this.errorService)));

  }

  public startReportExecution(createDocumentData: CreateDocumentData): Observable<ReportStartResult> {
    this.traceService.info(TraceModules.files, 'startReportExecution() called');
    const headers: HttpHeaders = this.wsiUtilityService.httpPostDefaultHeader(this.authenticationServiceBase.userToken);
    const url: string = this.wsiEndpointService.entryPoint + historyLogsUrl + createDocumentData.SystemId + '/reports/start';

    return this.httpClient.post(url, createDocumentData.ReportExecutionParams, { headers, observe: 'response' }).pipe(
      map((response: HttpResponse<ReportDocumentData[]> | any) => {
        return response.body;
      }),
      catchError((response: HttpResponse<any>) => this.wsiUtilityService.handleError(response, TraceModules.trends,
        'startReportExecution()', this.errorService)));
  }

  public cancelReportExecution(systemId: number, reportExecutionId: string): Observable<ReportCancelResult> {
    this.traceService.info(TraceModules.files, 'cancelReportExecution() called');
    const headers: HttpHeaders = this.wsiUtilityService.httpGetDefaultHeader(this.authenticationServiceBase.userToken);
    const url: string = this.wsiEndpointService.entryPoint + historyLogsUrl + systemId + '/reports/cancel/' + reportExecutionId;

    return this.httpClient.put(url, '', { headers, observe: 'response' }).pipe(
      map((response: HttpResponse<ReportCancelResult> | any) => {
        return response.body;
      }),
      catchError((response: HttpResponse<any>) => this.wsiUtilityService.handleError(response, TraceModules.trends,
        'cancelReportExecution()', this.errorService)));
  }

  private setHttpParams(createDocData: CreateDocumentData, params: HttpParams): HttpParams {
    if (createDocData?.ReportExecutionParams) {
      params = params.append('reportExecutionParams', JSON.stringify(createDocData?.ReportExecutionParams));
    }

    return params;
  }

}
