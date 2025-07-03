import { HttpClient, HttpHeaders, HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthenticationServiceBase, ErrorNotificationServiceBase, TraceService } from '@gms-flex/services-common';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { ValidationInput } from '../public-api';
import { TraceModules } from '../shared/trace-modules';
import { WsiUtilityService } from '../shared/wsi-utility.service';
import { WsiEndpointService } from '../wsi-endpoint/wsi-endpoint.service';
import { BorderTimeRange, GeneralSetings, TrendAggregatedDataResult, TrendDataResult, TrendSeriesInfo,
  TrendViewDefinition, TrendViewDefinitionUpdate } from '../wsi-proxy-api/trend/data.model';
import { TrendServiceBase } from '../wsi-proxy-api/trend/trend.service.base';

const trendsSeriesInfoUrl = '/api/trendseriesinfo/';
const trendsSeriesUrl = '/api/trendseries/';
const trendGetTrendViewDefinitionTag = 'tvd/';
const trendDeleteOnlineTrendLogTag = 'tsdOnline/';
const putTrendViewDefinitionTag = 'tvd';
const borderTag = '/borders';
const tablesGetUrl = '/api/tables/local/';
const getGeneralSettingUrl = '/api/settings/';
const trendAggregatedDataUrl = '/api/trendseriesinfo/';
const trueConstant = 'true';
const falseConstant = 'false';

@Injectable({
  providedIn: 'root'
})
export class TrendService extends TrendServiceBase {

  public constructor(
    private readonly traceService: TraceService,
    private readonly httpClient: HttpClient,
    private readonly authenticationServiceBase: AuthenticationServiceBase,
    private readonly wsiEndpointService: WsiEndpointService,
    private readonly wsiUtilityService: WsiUtilityService,
    private readonly errorService: ErrorNotificationServiceBase) {
    super();
    this.traceService.debug(TraceModules.trends, 'Trend Service created.');
  }

  public getBorderTimeRangeForTrend(trendSeriesId: string): Observable<BorderTimeRange> | any {
    this.traceService.info(TraceModules.trends, 'TrendService.getTrendData() called, trendSeriesId: %s', trendSeriesId);
    const headers: HttpHeaders = this.wsiUtilityService.httpGetDefaultHeader(this.authenticationServiceBase.userToken);
    let url: string = this.wsiEndpointService.entryPoint + trendsSeriesUrl;
    const objectIdTripleEncoded: string = this.tripleEncodeObjectIds(trendSeriesId);
    url = url + objectIdTripleEncoded + borderTag;
    return this.httpClient.get(url, { headers, observe: 'response' }).pipe(
      map((response: HttpResponse<any>) => {
        return this.retrieveTrendSeriesBorders(response);
      }),
      catchError((response: HttpResponse<any>) => this.wsiUtilityService.handleError(response, TraceModules.trends, 'getTrendData()', this.errorService)));
  }

  public getTrendSeriesInfo(objectOrPropertyId: string): Observable<TrendSeriesInfo[]> | any {
    const headers: HttpHeaders = this.wsiUtilityService.httpGetDefaultHeader(this.authenticationServiceBase.userToken);
    let url: string = this.wsiEndpointService.entryPoint + trendsSeriesInfoUrl;
    const objectOrPropertyIdTripleEncoded: string = this.tripleEncodeObjectIds(objectOrPropertyId);
    url = url + objectOrPropertyIdTripleEncoded;
    this.traceService.info(TraceModules.trends, 'trend.service.getTrendSeriesInfo()-formed url is: ', url);

    return this.httpClient.get(url, { headers, observe: 'response' }).pipe(
      map((response: HttpResponse<any>) => {
        return this.retrieveTrendSeriesInfo(response);
      }),
      catchError((response: HttpResponse<any>) => this.wsiUtilityService.handleError(response, TraceModules.trends,
        'getTrendSeriesInfo()', this.errorService)));
  }

  public getTrendSeriesId(objectOrPropertyId: string, collectorId: string): Observable<string[]> | any {
    this.traceService.info(TraceModules.trends, 'trend.service.getTrendSeriesId() called, object Id: %s, collector Id: %s', objectOrPropertyId, collectorId);
    const headers: HttpHeaders = this.wsiUtilityService.httpGetDefaultHeader(this.authenticationServiceBase.userToken);
    let url: string = this.wsiEndpointService.entryPoint + trendsSeriesInfoUrl;
    const objectOrPropertyIdTripleEncoded: string = this.tripleEncodeObjectIds(objectOrPropertyId);
    url = url + objectOrPropertyIdTripleEncoded;
    this.traceService.info(TraceModules.trends, 'trend.service.getTrendSeriesId()-formed url is: ', url);

    return this.httpClient.get(url, { headers, observe: 'response' }).pipe(
      map((response: HttpResponse<any>) => {
        return this.retrieveTrendSeriesId(response, collectorId);
      }),
      catchError((response: HttpResponse<any>) => this.wsiUtilityService.handleError(response, TraceModules.trends, 'getTrendSeriesId()', this.errorService)));
  }

  public getTrendViewDefinition(objectId: string): Observable<TrendViewDefinition> | any {
    this.traceService.info(TraceModules.trends, 'trend.service.getTrendViewDefinition() called, trendViewDefinition DpId: %s', objectId);
    const headers: HttpHeaders = this.wsiUtilityService.httpGetDefaultHeader(this.authenticationServiceBase.userToken);
    let url: string = this.wsiEndpointService.entryPoint + trendsSeriesInfoUrl;
    const objectIdTripleEncoded: string = this.tripleEncodeObjectIds(objectId);
    url = url + trendGetTrendViewDefinitionTag + objectIdTripleEncoded;

    return this.httpClient.get(url, { headers, observe: 'response' }).pipe(
      map((response: HttpResponse<any>) => {
        return this.retrieveTrendViewDefinition(response);
      }),
      catchError((response: HttpResponse<any>) =>
        this.wsiUtilityService.handleError(response, TraceModules.trends, 'getTrendViewDefinition()', this.errorService)
      )
    );
  }

  public getTrendData(trendSeriesId: string, fromDate: string, toDate: string, interval: string): Observable<TrendDataResult> {

    this.traceService.info(TraceModules.trends, 'trend.service.getTrendData() called, trendSeriesId: %s', trendSeriesId);
    const headers: HttpHeaders = this.wsiUtilityService.httpGetDefaultHeader(this.authenticationServiceBase.userToken);
    let url: string = this.wsiEndpointService.entryPoint + trendsSeriesUrl;
    const objectIdTripleEncoded: string = this.tripleEncodeObjectIds(trendSeriesId);
    url = url + objectIdTripleEncoded;

    if (!this.isNullOrEmpty(fromDate) || !this.isNullOrEmpty(toDate) || !this.isNullOrEmpty(interval)) {
      url = url + '?';
    }
    let isAnyParameterAdded = false;
    if (!this.isNullOrEmpty(fromDate)) {
      url = url + 'from=' + fromDate;
      isAnyParameterAdded = true;
    }
    if (!this.isNullOrEmpty(toDate)) {
      if (isAnyParameterAdded) {
        url = url + '&';
      }
      url = url + 'to=' + toDate;
      isAnyParameterAdded = true;
    }
    if (!this.isNullOrEmpty(interval)) {
      if (isAnyParameterAdded) {
        url = url + '&';
      }
      url = url + 'intervals=' + interval;
    }

    return this.httpClient.get(url, { headers, observe: 'response' }).pipe(
      map((response: HttpResponse<any>) => {
        return this.retrieveTrendData(response);
      }),
      catchError((response: HttpResponse<any>) => this.wsiUtilityService.handleError(response, TraceModules.trends, 'getTrendData()', this.errorService)));

  }

  public getStates(textGroupName: string, systemId: any, unitIndex: any): Observable<any> {
    const headers: HttpHeaders = this.wsiUtilityService.httpGetDefaultHeader(this.authenticationServiceBase.userToken);
    const textGroupNameDoubleEncoded: string = encodeURIComponent(textGroupName);
    let url: string = this.wsiEndpointService.entryPoint + tablesGetUrl + systemId + '/' + textGroupNameDoubleEncoded + '/text';
    if (unitIndex != undefined) {
      url = url + '/' + unitIndex;
    }
    return this.httpClient.get(url, { headers, observe: 'response' }).pipe(
      map((response: HttpResponse<any>) => {
        return this.wsiUtilityService.extractData(response, TraceModules.trends, 'getStates()');
      }),
      catchError((response: HttpResponse<any>) =>
        this.wsiUtilityService.handleError(response, TraceModules.trends, 'getStates()', this.errorService)
      ));
  }

  public putTrendViewDefinition(tvdUpdate: TrendViewDefinitionUpdate): Observable<TrendViewDefinition> | any {
    if (!tvdUpdate) {
      return undefined!;
    }
    this.traceService.info(TraceModules.trends, 'trend.service.putTrendViewDefinition() called, trendViewDefinition DpId: %s', tvdUpdate.TvdObjectId);
    const headers: HttpHeaders = this.wsiUtilityService.httpGetDefaultHeader(this.authenticationServiceBase.userToken);
    const url: string = this.wsiEndpointService.entryPoint + trendsSeriesInfoUrl + putTrendViewDefinitionTag;
    return this.httpClient.put(url, tvdUpdate, { headers, observe: 'response' }).pipe(
      map((response: HttpResponse<any>) => {
        return this.retrieveObjectId(response);
      }),
      catchError((response: HttpResponse<any>) =>
        this.wsiUtilityService.handleError(response, TraceModules.trends, 'putTrendViewDefinition()', this.errorService)
      )
    );
  }

  public deleteTrendViewDefinition(objectId: string, validationInput: ValidationInput): Observable<boolean> {
    this.traceService.info(TraceModules.trends, 'trend.service.deleteTrendViewDefinition() called');

    const headers: HttpHeaders = this.wsiUtilityService.httpDeleteDefaultHeader(this.authenticationServiceBase.userToken);
    let url: string = this.wsiEndpointService.entryPoint + trendsSeriesInfoUrl;
    const objectIdTripleEncoded: string = this.tripleEncodeObjectIds(objectId);
    const methodName = 'TrendService.deleteTrendViewDefinition()';
    url = url + trendGetTrendViewDefinitionTag + objectIdTripleEncoded;
    return this.httpClient.delete(url, { headers, observe: 'response', body: validationInput }).pipe(
      map((response: HttpResponse<any>) =>
        this.wsiUtilityService.extractData(response, TraceModules.trends, methodName)),
      catchError((response: HttpResponse<any>) =>
        this.wsiUtilityService.handleError(response, TraceModules.trends, methodName, this.errorService)));
  }

  public deleteOnlineTrendLog(objectId: string, validationInput: ValidationInput): Observable<boolean> {
    this.traceService.info(TraceModules.trends, 'rend.service.deleteOnlineTrendLog() called');

    const headers: HttpHeaders = this.wsiUtilityService.httpDeleteDefaultHeader(this.authenticationServiceBase.userToken);
    let url: string = this.wsiEndpointService.entryPoint + trendsSeriesInfoUrl;
    const objectIdTripleEncoded: string = this.tripleEncodeObjectIds(objectId);
    const methodName = 'TrendService.deleteOnlineTrendLog()';
    url = url + trendDeleteOnlineTrendLogTag + objectIdTripleEncoded;
    return this.httpClient.delete(url, { headers, observe: 'response', body: validationInput }).pipe(
      map((response: HttpResponse<any>) =>
        this.wsiUtilityService.extractData(response, TraceModules.trends, methodName)),
      catchError((response: HttpResponse<any>) =>
        this.wsiUtilityService.handleError(response, TraceModules.trends, methodName, this.errorService)));
  }

  public getTrendAggregatedData(objectOrPropertyId: string, aggrigatedUnit: number, fromDate: string, toDate: string, length: number): 
  Observable<TrendAggregatedDataResult> {
    const headers: HttpHeaders = this.wsiUtilityService.httpGetDefaultHeader(this.authenticationServiceBase.userToken);
    let url: string = this.wsiEndpointService.entryPoint + trendsSeriesUrl;
    const objectOrPropertyIdTripleEncoded: string = this.tripleEncodeObjectIds(objectOrPropertyId);
    url = url + objectOrPropertyIdTripleEncoded + '/' + aggrigatedUnit;
    this.traceService.info(TraceModules.trends, 'trendService.getTrendAggregatedData()-formed url is: ', url);
    let params: HttpParams = new HttpParams();
    if (!this.isNullOrEmpty(fromDate) && !this.isNullOrEmpty(toDate) && length) {
      params = params.set('from', fromDate);
      params = params.set('to', toDate);
      params = params.set('length', length);
    }
        
    return this.httpClient.get(url, { headers, observe: 'response', params }).pipe(
      map((response: HttpResponse<any>) => {
        return response.body;
      }),
      catchError((response: HttpResponse<any>) => this.wsiUtilityService.handleError(response, TraceModules.trends,
        'getTrendAggregatedData()', this.errorService)));
  }

  private retrieveTrendData(response: HttpResponse<any>): TrendDataResult {
    const trendData: TrendDataResult = response.body;

    // Defect 1323207:Flex Client Trends on Binary values (GmsBool) are not visible in the chart [Origin PCR - 1312544]  - V5.1
    // Handling special case for data type 'gms-bool' which returns 'true' and 'false'
    // all other binary type gives indexes thus converting this 'true' => '1' and 'false' => '0'.
    if (trendData?.Series?.[0]?.Value !== undefined && trendData.Series.length > 0) {
      const value = trendData?.Series[0]?.Value.toLowerCase();
      if (value === trueConstant || value === falseConstant) {
        for (const data of trendData.Series) {
          let caseValue;
          if (data?.Value) { caseValue = data.Value.toLowerCase(); }
          switch (caseValue) {
            case trueConstant:
              data.Value = '1';
              break;
            case falseConstant:
              data.Value = '0';
              break;
            default:
              break;
          }
        }
      }
    }
    return trendData;
  }

  private tripleEncodeObjectIds(objectId: string): string {
    return encodeURIComponent(encodeURIComponent(encodeURIComponent(objectId)));
  }
  private retrieveTrendViewDefinition(response: HttpResponse<any>): TrendViewDefinition | null {
    if (response.body == undefined) {
      return null;
    }
    const trendViewDefinition: TrendViewDefinition = response.body;
    return trendViewDefinition;
  }

  private retrieveTrendSeriesInfo(response: HttpResponse<any>): TrendSeriesInfo[] | undefined {
    let trendInfoArray: TrendSeriesInfo[] | undefined;
    if (response.body != null) {
      trendInfoArray = response.body;
    }
    return trendInfoArray;
  }

  private retrieveTrendSeriesId(response: HttpResponse<any>, collectorId: string): string[] | undefined {
    if (response.body != null) {
      const trendInfoArray: TrendSeriesInfo[] = response.body;
      const trendSeriesId: string[] = [];
      if (collectorId === '') {
        trendInfoArray.forEach((trendInfo: TrendSeriesInfo) => {
          trendSeriesId.push(trendInfo.TrendseriesId!);
        });
      } else {
        trendInfoArray.forEach((trendInfo: TrendSeriesInfo) => {
          if (trendInfo.CollectorObjectOrPropertyId === collectorId) {
            trendSeriesId.push(trendInfo.TrendseriesId!);
          }
        });
      }
      return trendSeriesId;
    }
  }

  private retrieveTrendSeriesBorders(response: HttpResponse<any>): BorderTimeRange | undefined {
    let borderTimeRange: BorderTimeRange | undefined;
    if (response.body != null) {
      borderTimeRange = response.body;
    }
    return borderTimeRange;
  }

  private retrieveObjectId(response: HttpResponse<any>): TrendViewDefinition | undefined {
    let tvd: TrendViewDefinition | undefined;
    if (response.body != null) {
      tvd = response.body;
    }
    return tvd;
  }

  private isNullOrEmpty(value: string): boolean {
    if (value != null && value.length > 0) {
      return false;
    }
    return true;
  }

}
