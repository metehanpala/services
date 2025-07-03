import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthenticationServiceBase, ErrorNotificationServiceBase, TraceService } from '@gms-flex/services-common';
import { Observable, throwError as observableThrowError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { TraceModules } from '../shared/trace-modules';
import { WsiUtilityService } from '../shared/wsi-utility.service';
import { WsiEndpointService } from '../wsi-endpoint/wsi-endpoint.service';
import { PropertyServiceBase } from '../wsi-proxy-api/properties/property.service.base';
import { PropertyDetails, PropertyInfo } from '../wsi-proxy-api/shared/data.model';
import { PropertyInfoUtility } from '../wsi-proxy-api/shared/property-info-utility';

const propertiesServiceUrl = '/api/properties/';

/**
 * GMS WSI value implementation.
 * @extends ValuerBase
 */
@Injectable({
  providedIn: 'root'
})
export class PropertyService extends PropertyServiceBase {

  /**
   * Constructor
   * @param {TraceService } trace The trace service
   * @param {httpClient } httpClient The Angular 2 httpClient service
   * @param {WsiEndpointService } wsiEndpoint The WSI endpoint service.
   * @param {AuthenticationBase } authenticationBase The WSI authentication service
   * @param {WsiUtilityService}
   * @param {ErrorNotificationServiceBase}
   */
  public constructor(private readonly traceService: TraceService, private readonly httpClient: HttpClient, protected wsiEndpoint: WsiEndpointService,
    private readonly authenticationServiceBase: AuthenticationServiceBase,
    private readonly wsiUtilityService: WsiUtilityService,
    private readonly errorService: ErrorNotificationServiceBase) {
    super();
    this.traceService.info(TraceModules.property, 'Property service created.');
  }

  /**
   * Retrieves property names of an Object
   *
   * @param {string } objectOrPropertyId The ObjectId OR the Object.PropertyId.
   * Note, that all property names are returned no matter if the ObjectId or the Object.PropertyId is handed over.
   * Also imortant to note: the reply contains a field ObjectId. The content of this files matches the parameter handed over on the request.
   * @returns {Observable<PropertyInfo<string>>}
   *
   * @memberOf PropertyService
   */
  public readPropertyNames(objectOrPropertyId: string | null): Observable<PropertyInfo<string>> {
    if (objectOrPropertyId == null) {
      return null!;
    }
    this.traceService.debug(TraceModules.property, 'readPropertyNames() called; objectOrPropertyId: %s', objectOrPropertyId);

    const headers: HttpHeaders = this.wsiUtilityService.httpGetDefaultHeader(this.authenticationServiceBase.userToken);
    const objectOrPropertyIdDoubleEncoded: string = encodeURIComponent(encodeURIComponent(objectOrPropertyId));
    const url: string = this.wsiEndpoint.entryPoint + propertiesServiceUrl + objectOrPropertyIdDoubleEncoded;

    // Initialize Params Object
    let params: HttpParams = new HttpParams();
    // Begin assigning parameters
    params = params.set('requestType', '0');
    return this.httpClient.get<PropertyInfo<string>>(url, { headers, params }).pipe(
      map((response: PropertyInfo<string>) => this.extractDataForPropertyInfoNames(response, 'readPropertyNames()')!),
      catchError(response => this.wsiUtilityService.handleError(response, TraceModules.property, 'readPropertyNames()', this.errorService)));
  }

  /**
   * Retrieves properties (meta data) without any runtime values for an object or property
   * See WSI API specification (Property Service) for details.
   *
   * @param {string } objectOrPropertyId The ObjectId OR PropertyId
   * @param {number } requestType See WSI documentation.
   * requestType = 1: returns attributes only; the parameter "readAllProperties" has no effect for this request type;
   * the attributes are always returned no matter if an ObjectId or PropertyId is handed over.
   * requestType = 2: returns full property information without attributes,
   * If an ObjectId and the parameter "readAllProperties" equals false, the property information of the "Main Property" is returned!
   * If an ObjectId and the parameter "readAllProperties" equals true, the property information of all properties is returned!
   * If a PropertyId and the parameter "readAllProperties" equals false, the property information of the specified PropertyId is returned!
   * If a PropertyId and the parameter "readAllProperties" equals true, the property information of all properties of the object is returned!
   * requestType = 3: returns full property information and always attributes; otherwise the same specification as for requestType 2
   * @param {boolean } readAllProperties, appies only for requestType 2 and 3;
   * @returns {Observable<PropertyInfo<PropertyDetails>[]>}
   *
   * @memberOf PropertyService
   */
  public readProperties(objectOrPropertyId: string, requestType: number, readAllProperties: boolean,
    booleansAsNumericText?: boolean, bitsInReverseOrder?: boolean): Observable<PropertyInfo<PropertyDetails>[]> {
    if ((objectOrPropertyId == null) || (requestType < 1) || (requestType > 3)) {
      this.traceService.error(TraceModules.property, 'readProperties() called with invalid arguments');
      return observableThrowError(WsiUtilityService.createNewInvalidArgumentsError());
    }
    this.traceService.info(TraceModules.property, 'readProperties() called; objectOrPropertyId: %s', objectOrPropertyId);

    const headers: HttpHeaders = this.wsiUtilityService.httpGetDefaultHeader(this.authenticationServiceBase.userToken);
    const objectOrPropertyIdDoubleEncoded: string = encodeURIComponent(encodeURIComponent(objectOrPropertyId));
    const url: string = this.wsiEndpoint.entryPoint + propertiesServiceUrl + objectOrPropertyIdDoubleEncoded;

    const params: HttpParams = new HttpParams()
      .set('requestType', String(requestType))
      .set('readAllProperties', String(readAllProperties))
      .set('booleansAsNumericText', String(booleansAsNumericText))
      .set('bitsInReverseOrder', String(bitsInReverseOrder));
    return this.httpClient.get<PropertyInfo<PropertyDetails>[]>(url, { headers, params }).pipe(
      map((response: PropertyInfo<PropertyDetails>[]) => this.extractDataForPropertyInfos(response, 'readProperties()')!),
      catchError(response => this.wsiUtilityService.handleError(response, TraceModules.property, 'readProperties()', this.errorService)));
  }

  /**
   * Retrieves properties (meta data) without any runtime values for multiple objects OR properties.
   * This is the bulk version of "readProperties"
   * See WSI API specification (Property Service) for details.
   *
   * @param {string[] } objectOrPropertyIds ObjectIds OR Property Ids
   * @param {number } requestType See WSI documentation.
   * requestType = 1: returns attributes only; the parameter "readAllProperties" has no effect for this request type;
   * the attributes are always returned no matter if an ObjectId or PropertyId is handed over.
   * requestType = 2: returns full property information without attributes,
   * If an ObjectId and the parameter "readAllProperties" equals false, the property information of the "Main Property" is returned!
   * If an ObjectId and the parameter "readAllProperties" equals true, the property information of all properties is returned!
   * If a PropertyId and the parameter "readAllProperties" equals false, the property information of the specified PropertyId is returned!
   * If a PropertyId and the parameter "readAllProperties" equals true, the property information of all properties of the object is returned!
   * requestType = 3: returns full property information and always attributes; otherwise the same specification as for requestType 2
   * @param {boolean } readAllProperties, appies only for requestType 2 and 3;
   * @returns {Observable<PropertyInfo<PropertyDetails>[]>}
   *
   * @memberOf PropertyService
   */
  public readPropertiesMulti(objectOrPropertyIds: string[], requestType: number, readAllProperties: boolean,
    booleansAsNumericText?: boolean, bitsInReverseOrder?: boolean): Observable<PropertyInfo<PropertyDetails>[]> {
    if ((objectOrPropertyIds == null) || (objectOrPropertyIds.length === 0) || (requestType < 1) || (requestType > 3)) {
      this.traceService.error(TraceModules.property, 'readPropertiesMulti() called with invalid arguments');
      return observableThrowError(WsiUtilityService.createNewInvalidArgumentsError());
    }
    this.traceService.info(TraceModules.property, 'readPropertiesMulti() called; number of objectOrPropertyIds: %s', objectOrPropertyIds.length);
    if (this.traceService.isDebugEnabled(TraceModules.property)) {
      this.traceService.debug(TraceModules.property, 'readPropertiesMulti(): for objectOrPropertyIds:\n%s', objectOrPropertyIds.join('\n'));
    }

    const headers: HttpHeaders = this.wsiUtilityService.httpPostDefaultHeader(this.authenticationServiceBase.userToken);
    const url: string = this.wsiEndpoint.entryPoint + propertiesServiceUrl;
    const body: any = JSON.stringify(objectOrPropertyIds);

    const params: HttpParams = new HttpParams()
      .set('requestType', String(requestType))
      .set('readAllProperties', String(readAllProperties))
      .set('booleansAsNumericText', String(booleansAsNumericText))
      .set('bitsInReverseOrder', String(bitsInReverseOrder));

    return this.httpClient.post<PropertyInfo<PropertyDetails>[]>(url, body, { headers, params }).pipe(
      map((response: PropertyInfo<PropertyDetails>[]) => this.extractDataForPropertyInfos(response, 'readPropertiesMulti()')!),
      catchError(response => this.wsiUtilityService.handleError(response, TraceModules.property, 'readPropertiesMulti()', this.errorService)));
  }

  public readPropertyImage(propertyId: string): Observable<string> {
    if (propertyId == null) {
      return observableThrowError(WsiUtilityService.createNewInvalidArgumentsError());
    }
    this.traceService.debug(TraceModules.property, 'readPropertyImage() called; propertyId: %s', propertyId);

    const headers: HttpHeaders = this.wsiUtilityService.httpGetDefaultHeader(this.authenticationServiceBase.userToken);
    const propertyIdDoubleEncoded: string = encodeURIComponent(encodeURIComponent(propertyId));
    const url: string = this.wsiEndpoint.entryPoint + propertiesServiceUrl + propertyIdDoubleEncoded + '/icon';

    return this.httpClient.get(url, { headers, responseType: 'text' }).pipe(
      map((response: string) => this.extractDataForPropertyIcon(response, propertyId, 'readPropertyImage()')!),
      catchError(response => this.wsiUtilityService.handleError(response, TraceModules.property, 'readPropertyImage()', this.errorService)));
  }

  private extractDataForPropertyIcon(response: string, propertyId: string, method: string): string | undefined {
    try {
      const body: string = response;
      return body;
    } catch (exc) {
      this.traceService.warn(TraceModules.property, method, 'HttpResponse<string> not handled properly; exception caught: ', (exc as Error).message.toString());
    }
  }

  private extractDataForPropertyInfoNames(res: PropertyInfo<string>, method: string): PropertyInfo<string> | undefined {
    try {
      this.tracePropertyInfoNames(res, method);
      return res;
    } catch (exc) {
      this.traceService.warn(TraceModules.property, method,
        'HttpResponse<PropertyInfo<string>> not handled properly; exception caught: ', res, '; url=', (exc as Error).message.toString());
    }
  }

  private extractDataForPropertyInfos(res: PropertyInfo<PropertyDetails>[], method: string): PropertyInfo<PropertyDetails>[] | undefined {
    try {
      this.tracePropertyInfos(res, method);
      return res;
    } catch (exc) {
      this.traceService.warn(TraceModules.property, method,
        'HttpResponse<PropertyInfo<PropertyDetails>[]> not handled properly; exception caught: ', res, '; url=', (exc as Error).message.toString());
    }
  }

  private tracePropertyInfoNames(propinfo: PropertyInfo<string>, method: string): void {
    if (this.traceService.isDebugEnabled(TraceModules.property)) {
      this.traceService.debug(TraceModules.property, method, 'returned:\n', PropertyInfoUtility.getTrace7(propinfo));
    }
  }

  private tracePropertyInfos(propinfos: PropertyInfo<PropertyDetails>[], method: string): void {
    if (this.traceService.isDebugEnabled(TraceModules.property)) {
      this.traceService.debug(TraceModules.property, method, 'returned:\n', PropertyInfoUtility.getTrace2(propinfos));
    }
  }
}
