import { HttpClient, HttpHeaders, HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthenticationServiceBase, ErrorNotificationServiceBase, TraceService } from '@gms-flex/services-common';
import { catchError, map, Observable } from 'rxjs';

import { WsiQueryEncoder, WsiUtilityService } from '../shared';
import { TraceModules } from '../shared/trace-modules';
import { WsiEndpointService } from '../wsi-endpoint';
import { AdvanceReportingServiceBase, CascadingOptions, ExecuteApiParams, ParameterDetails } from '../wsi-proxy-api/advance-reporting';

@Injectable({
  providedIn: 'root'
})

export class AdvanceReportingService extends AdvanceReportingServiceBase {

  public constructor(
    private readonly traceService: TraceService,
    private readonly httpClient: HttpClient,
    private readonly authenticationServiceBase: AuthenticationServiceBase,
    private readonly wsiEndpointService: WsiEndpointService,
    private readonly wsiUtilityService: WsiUtilityService,
    private readonly errorService: ErrorNotificationServiceBase) {
    super();
    this.traceService.debug(TraceModules.advanceReporting, 'Advance Reporting Service created');
  }

  private readonly getParametersBaseUrl = '/api/advancedReporting/Parameter/';
  private readonly executeParameterUrl = '/api/advancedReporting/ExecuteFlexAdvanceReport/';

  /**
   * This method returns parameters json for Advance Reports execution.
   */

  public getParameterDetailsJson(systemId: number, fileName: string, selectedNode: string): Observable<ParameterDetails> {
    const functionName = 'getParameterDetailsJson()';
    this.traceService.info(TraceModules.advanceReporting, `${functionName}: http get called`);
    const headers: HttpHeaders = this.wsiUtilityService.httpGetDefaultHeader(this.authenticationServiceBase.userToken);
    const url = this.wsiEndpointService.entryPoint + this.getParametersBaseUrl + systemId + '/' + 'fileName';
    let params: HttpParams = new HttpParams();

    if (fileName?.length) {
      params = params.append('fileName', String(fileName));
    }

    if (selectedNode?.length) {
      params = params.append('selectedNode', String(selectedNode));
    }

    // Execute http GET request
    return this.httpClient.get(url, { headers, params, observe: 'response' }).pipe(
      map((response: HttpResponse<any>) =>
        this.wsiUtilityService.extractData(response, TraceModules.advanceReporting, `${functionName}: http get response`)),
      catchError((response: HttpResponse<any>) =>
        this.wsiUtilityService.handleError(response, TraceModules.advanceReporting, `${functionName}: http get response`, this.errorService)));
  }

  /**
   * This method returns option list based on cascading parameter for Advance Reports execution.
   */
  public getCascadingOptionListByParam(systemId: number, fileName: string, cascadingParamName: string, selectedOption: string): Observable<CascadingOptions> {
    const functionName = 'getCascadingOptionListByParam()';
    this.traceService.info(TraceModules.advanceReporting, `${functionName}: http get called`);
    const headers: HttpHeaders = this.wsiUtilityService.httpGetDefaultHeader(this.authenticationServiceBase.userToken);
    const url = `${this.wsiEndpointService.entryPoint}${this.getParametersBaseUrl}${systemId}/fileName/cascading/${cascadingParamName}/${selectedOption}`;
    let params: HttpParams = new HttpParams();

    if (fileName?.length) {
      params = params.append('fileName', String(fileName));
    }

    // Execute http GET request
    return this.httpClient.get(url, { headers, params, observe: 'response' }).pipe(
      map((response: HttpResponse<any>) =>
        this.wsiUtilityService.extractData(response, TraceModules.advanceReporting, `${functionName}: http get response`)),
      catchError((response: HttpResponse<any>) =>
        this.wsiUtilityService.handleError(response, TraceModules.advanceReporting, `${functionName}: http get response`, this.errorService)));
  }

  /**
   * This method returns saves the pdf/excel or both file at execution of report
   */
  public executeParameters(data: ExecuteApiParams): Observable<any> {
    const functionName = 'executeParameters()';
    this.traceService.info(TraceModules.advanceReporting, `${functionName}: http get called`);
    const headers: HttpHeaders = this.wsiUtilityService.httpPostDefaultHeader(this.authenticationServiceBase.userToken);
    const url = this.wsiEndpointService.entryPoint + this.executeParameterUrl + data.systemId + '/execute';

    let params: HttpParams = new HttpParams({
      encoder: new WsiQueryEncoder()
    });

    if (data.ruleId?.length) {
      params = params.append('ruleId', String(data.ruleId));
    }

    if (data.selectionContext?.length) {
      params = params.append('selectionContext', String(data.selectionContext));
    }

    if (data.fileName?.length) {
      params = params.append('fileName', String(data.fileName));
    }

    if (data.fileExt?.length) {
      params = params.append('fileExt', String(data.fileExt));
    }

    if (data.objectId?.length) {
      params = params.append('objectId', String(data.objectId));
    }
    
    const columList = data.parameters;
    const body = JSON.stringify(columList);

    // Execute http post request
    return this.httpClient.post(url, body, { headers, params, observe: 'response' }).pipe(
      map((response: HttpResponse<any>) =>
        this.wsiUtilityService.extractData(response, TraceModules.historyLog, `${functionName}: http post response`)),
      catchError((response: HttpResponse<any>) =>
        this.wsiUtilityService.handleError(response, TraceModules.historyLog, `${functionName}: http post response`, this.errorService)));
  }
}
