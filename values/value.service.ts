import { HttpClient, HttpHeaders, HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthenticationServiceBase, ErrorNotificationServiceBase, TraceService } from '@gms-flex/services-common';
import { Observable, throwError as observableThrowError, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { TraceModules } from '../shared/trace-modules';
import { WsiUtilityService } from '../shared/wsi-utility.service';
import { WsiEndpointService } from '../wsi-endpoint/wsi-endpoint.service';
import { ValueDetails } from '../wsi-proxy-api/shared/data.model';
import { ValueServiceBase } from './value.service.base';

const valueServiceUrl = '/api/values/';

/**
 * GMS WSI value implementation.
 * @extends ValuerBase
 */
@Injectable({
  providedIn: 'root'
})
export class ValueService extends ValueServiceBase {

  /**
   * Constructor
   * @param {TraceService } traceService The trace service
   * @param {HttpClient } httpClient The Angular 2 http service
   * @param {WsiEndpointService } wsiEndpoint The WSI endpoint service.
   * @param {AuthenticationBase } authenticationBase The WSI authentication service
   * @param {WsiUtilityService}
   * @param {ErrorNotificationServiceBase}
   */
  public constructor(traceService: TraceService, httpClient: HttpClient, protected wsiEndpoint: WsiEndpointService,
    private readonly authenticationServiceBase: AuthenticationServiceBase,
    private readonly wsiUtilityService: WsiUtilityService,
    private readonly errorService: ErrorNotificationServiceBase) {
    super(traceService, httpClient);
    this.traceService.info(TraceModules.values, 'Values service created.');
  }

  /**
   * Reads the value, based on the objectId or propertyId.
   * See WSI API specification for details.
   *
   * @param {string } objectOrPropertyId
   * @returns {Observable<ValueDetails[]>}
   *
   * @memberOf ValueService
   */
  public readValue(objectOrPropertyId: string, booleansAsNumericText?: boolean): Observable<ValueDetails[]> {
    if (objectOrPropertyId == undefined) {
      return observableThrowError(WsiUtilityService.createNewInvalidArgumentsError());
    } else {
      this.traceService.debug(TraceModules.values, 'readValue() called; objectOrPropertyId: %s', objectOrPropertyId);

      const headers: HttpHeaders = this.wsiUtilityService.httpGetDefaultHeader(this.authenticationServiceBase.userToken);
      const objectOrPropertyIdTripleEncoded: string = encodeURIComponent(encodeURIComponent(encodeURIComponent(objectOrPropertyId)));
      const url: string = this.wsiEndpoint.entryPoint + valueServiceUrl + objectOrPropertyIdTripleEncoded;
      const methodName = 'ValueService.readValue()';

      if (typeof booleansAsNumericText === 'undefined') {
        return this.httpClient.get(url, { headers, observe: 'response' }).pipe(
          map((response: HttpResponse<any>) => this.wsiUtilityService.extractData(response, TraceModules.values, methodName)),
          catchError((response: HttpResponse<any>) => this.wsiUtilityService.handleError(response, TraceModules.values, methodName, this.errorService)));
      } else {
        let params: HttpParams = new HttpParams();
        params = params.set('booleansAsNumericText', booleansAsNumericText);
        /*
        let params: HttpParams = new HttpParams();
      if (booleansAsNumericText != null) {
        params = params.set('booleansAsNumericText', String(booleansAsNumericText));
      }
      */
        return this.httpClient.get(url, { headers, params, observe: 'response' }).pipe(
          map((response: HttpResponse<any>) => this.wsiUtilityService.extractData(response, TraceModules.values, methodName)),
          catchError((response: HttpResponse<any>) => this.wsiUtilityService.handleError(response, TraceModules.values, methodName, this.errorService)));
      }
    }
  }

  /**
   * Reads multiple values, based on the objectIds or propertyIds.
   * See WSI API specification for details.
   *
   * @param {string[] } objectOrPropertyIds
   * @returns {Observable<ValueDetails[]>}
   *
   * @memberOf ValueService
   */
  public readValues(objectOrPropertyIds: string[], booleansAsNumericText?: boolean): Observable<ValueDetails[]> {
    if ((objectOrPropertyIds == undefined) || (objectOrPropertyIds.length === 0)) {
      this.traceService.error(TraceModules.values, 'Invalid arguments in readValues()');
      return of([]);
    }
    this.traceService.debug(TraceModules.values, 'readValue() called; objectOrPropertyId: %s', objectOrPropertyIds.toString());

    const methodName = 'ValueService.readValues()';
    const headers: HttpHeaders = this.wsiUtilityService.httpPostDefaultHeader(this.authenticationServiceBase.userToken);
    const url: string = this.wsiEndpoint.entryPoint + valueServiceUrl;
    const body: any = JSON.stringify(objectOrPropertyIds);

    let params: HttpParams = new HttpParams();
    if (booleansAsNumericText != null) {
      params = params.set('booleansAsNumericText', String(booleansAsNumericText));
    }

    return this.httpClient.post(url, body, { headers, params, observe: 'response' }).pipe(
      map((response: HttpResponse<any>) => this.wsiUtilityService.extractData(response, TraceModules.values, methodName)),
      catchError((response: HttpResponse<any>) => this.wsiUtilityService.handleError(response, TraceModules.values, methodName, this.errorService)));
  }
}
