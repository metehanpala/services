import { HttpClient, HttpHeaders, HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthenticationServiceBase, ErrorNotificationServiceBase, TraceService } from '@gms-flex/services-common';
import { Observable, throwError as observableThrowError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { TraceModules } from '../shared/trace-modules';
import { WsiUtilityService } from '../shared/wsi-utility.service';
import { WsiEndpointService } from '../wsi-endpoint/wsi-endpoint.service';
import { PropertyValuesServiceBase } from '../wsi-proxy-api/property-values/property-values.service.base';
import { PropertyDetails, PropertyInfo } from '../wsi-proxy-api/shared/data.model';
import { PropertyInfoUtility } from '../wsi-proxy-api/shared/property-info-utility';

const propertiesValueServiceUrl = '/api/propertyvalues/';

/**
 * GMS WSI value implementation.
 * @extends ValuerBase
 */
@Injectable({
  providedIn: 'root'
})
export class PropertyValuesService extends PropertyValuesServiceBase {

  /**
   * Constructor
   * @param {TraceService } trace The trace service
   * @param {HttpClient } HttpClient The Angular 2 http service
   * @param {WsiEndpointService } wsiEndpoint The WSI endpoint service.
   * @param {AuthenticationBase } authenticationBase The WSI authentication service
   * @param {WsiUtilityService}
   * @param {ErrorNotificationServiceBase}
   */
  public constructor(private readonly trace: TraceService, private readonly httpClient: HttpClient, protected wsiEndpoint: WsiEndpointService,
    private readonly authenticationServiceBase: AuthenticationServiceBase,
    private readonly wsiUtilityService: WsiUtilityService,
    private readonly errorService: ErrorNotificationServiceBase) {
    super();
    this.trace.info(TraceModules.property, 'PropertyValues service created.');
  }

  /**
   * Retrieves properties with runtime values and attributes for an object or property.
   * See WSI API specification (Property Value Service) for details.
   *
   * @param {string } objectOrPropertyId The ObjectId OR PropertyId
   * @param {boolean } readAllProperties If true then all the properties for the requested objectId (or propertyId) will be returned;
   * If false, the main property will be returned if an objectId has been given; or the requested property will be returned if a propertyId has been given.
   * @returns {Observable<PropertyInfo<PropertyDetails>>}
   *
   * @memberOf PropertyService
   */
  public readPropertiesAndValue(objectOrPropertyId: string, readAllProperties: boolean,
    booleansAsNumericText?: boolean, bitsInReverseOrder?: boolean): Observable<PropertyInfo<PropertyDetails>> {
    if (objectOrPropertyId == null) {
      return observableThrowError(WsiUtilityService.createNewInvalidArgumentsError());
    }
    this.trace.debug(TraceModules.property, 'readPropertiesAndValue() called; objectOrPropertyId: %s', objectOrPropertyId);

    const headers: HttpHeaders = this.wsiUtilityService.httpGetDefaultHeader(this.authenticationServiceBase.userToken);
    const objectOrPropertyIdDoubleEncoded: string = encodeURIComponent(encodeURIComponent(objectOrPropertyId));
    const url: string = this.wsiEndpoint.entryPoint + propertiesValueServiceUrl + objectOrPropertyIdDoubleEncoded;
    // Initialize Params Object
    let params: HttpParams = new HttpParams();
    if (readAllProperties != null) {
      params = params.append('readAllProperties', String(readAllProperties));
    }
    if (booleansAsNumericText != null) {
      params = params.append('booleansAsNumericText', String(booleansAsNumericText));
    }
    if (bitsInReverseOrder != null) {
      params = params.append('bitsInReverseOrder', String(bitsInReverseOrder));
    }

    return this.httpClient.get(url, { headers, params }).pipe(
      map((response: PropertyInfo<PropertyDetails> | any) =>
        this.extractDataForPropertyInfo(response, 'readPropertiesAndValue()')),
      catchError((response: HttpResponse<any>) =>
        this.wsiUtilityService.handleError(response, TraceModules.property, 'readPropertiesAndValue()', this.errorService)));
  }

  private extractDataForPropertyInfo(res: PropertyInfo<PropertyDetails>, method: string): PropertyInfo<PropertyDetails> | any {
    try {
      this.tracePropertyInfo(res, method);
      return res;
    } catch (exc) {
      this.trace.warn(TraceModules.property, method, 'Response not handled properly; exception caught: ', res, '; url=', (exc as Error).message.toString());
    }
  }

  private tracePropertyInfo(propinfo: PropertyInfo<PropertyDetails>, method: string): void {
    if (this.trace.isDebugEnabled(TraceModules.property)) {
      this.trace.debug(TraceModules.property, method, 'returned:\n', PropertyInfoUtility.getTrace1(propinfo));
    }
  }
}
