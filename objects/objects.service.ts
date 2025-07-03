import { HttpClient, HttpHeaders, HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthenticationServiceBase, ErrorNotificationServiceBase, TraceService } from '@gms-flex/services-common';
import { Observable, throwError as observableThrowError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { TraceModules } from '../shared/trace-modules';
import { WsiQueryEncoder } from '../shared/wsi-query-encoder';
import { WsiUtilityService } from '../shared/wsi-utility.service';
import { WsiEndpointService } from '../wsi-endpoint/wsi-endpoint.service';
import { NewObjectParameters, ObjectCreationInfo, ServiceTextInfo, ServiceTextParameters } from '../wsi-proxy-api/objects/data.model';
import { ObjectsServiceBase } from '../wsi-proxy-api/objects/objects.service.base';
import { BrowserObject } from '../wsi-proxy-api/system-browser/data.model';

const objectsServiceUrl = '/api/Objects/';
const objectsServiceTextServiceUrl = '/api/Objects/servicetext/';

/**
 * @extends ObjectsServiceBase
 */
@Injectable({
  providedIn: 'root'
})
export class ObjectsService extends ObjectsServiceBase {
  public constructor(
    private readonly traceService: TraceService,
    private readonly httpClient: HttpClient,
    private readonly authenticationServiceBase: AuthenticationServiceBase,
    private readonly wsiEndpointService: WsiEndpointService,
    private readonly errorService: ErrorNotificationServiceBase,
    private readonly wsiUtilityService: WsiUtilityService) {
    super();

    this.traceService.info(TraceModules.objects, 'Objects service created');
  }

  /**
   * getObjectCreationInfo
   */
  public getObjectCreationInfo(designation: string, includeChildInfo?: boolean): Observable<ObjectCreationInfo> {
    if ((designation === undefined) || (designation === null) || designation.length === 0) {
      this.traceService.error(TraceModules.objects, 'getObjectCreationInfo() called with invalid arguments');
      return observableThrowError(WsiUtilityService.createNewInvalidArgumentsError());
    }

    this.traceService.info(TraceModules.objects, 'getObjectCreationInfo() called on objectId: %s', designation);
    if (this.traceService.isDebugEnabled(TraceModules.objects)) {
      this.traceService.debug(TraceModules.objects, 'getObjectCreationInfo(): for objectId:\n%s', designation);
    }

    const headers: HttpHeaders = this.wsiUtilityService.httpGetDefaultHeader(this.authenticationServiceBase.userToken);
    const designationDoubleEncoded: string = encodeURIComponent(encodeURIComponent(designation));
    const url: string = this.wsiEndpointService.entryPoint + objectsServiceUrl + designationDoubleEncoded;

    let params: HttpParams = new HttpParams({
      encoder: new WsiQueryEncoder()
    });

    if (includeChildInfo !== undefined) {
      params = params.append('includeChildInfo', String(includeChildInfo));
    }

    return this.httpClient.get(url, { headers, params, observe: 'response' }).pipe(
      map((response: HttpResponse<any>) =>
        this.wsiUtilityService.extractData(response, TraceModules.objects, 'getObjectCreationInfo()')),
      catchError((response: HttpResponse<any>) =>
        this.wsiUtilityService.handleError(response, TraceModules.objects, 'getObjectCreationInfo()', this.errorService)));
  }

  /**
   * createObject
   */
  public createObject(childObject: NewObjectParameters): Observable<BrowserObject> {
    this.traceService.info(TraceModules.authentication, 'createObject() called on objects : %s', childObject);
    const headers: HttpHeaders = this.wsiUtilityService.httpPostDefaultHeader(this.authenticationServiceBase.userToken);
    const url: string = this.wsiEndpointService.entryPoint + objectsServiceUrl;
    const body: any = JSON.stringify(childObject);

    return this.httpClient.post(url, body, { headers, observe: 'response' }).pipe(
      map((response: HttpResponse<any>) =>
        this.wsiUtilityService.extractData(response, TraceModules.objects, 'createObject()')),
      catchError((response: HttpResponse<any>) =>
        this.wsiUtilityService.handleError(response, TraceModules.settings, 'createObject()', this.errorService)));
  }

  /**
   * getServiceText
   */
  public getServiceText(objectId: string): Observable<ServiceTextInfo> {
    if ((objectId === undefined) || (objectId === null) || (objectId.length === 0)) {
      return observableThrowError(WsiUtilityService.createNewInvalidArgumentsError());
    }

    this.traceService.debug(TraceModules.objects, 'getServiceText() called for objectId: %s', objectId);

    const headers: HttpHeaders = this.wsiUtilityService.httpPostDefaultHeader(this.authenticationServiceBase.userToken);
    const objectIdTripleEncoded: string = encodeURIComponent(encodeURIComponent(encodeURIComponent(objectId)));
    const url: string = this.wsiEndpointService.entryPoint + objectsServiceTextServiceUrl + objectIdTripleEncoded;

    return this.httpClient.get(url, { headers, observe: 'response' }).pipe(
      map((response: HttpResponse<any>) =>
        this.wsiUtilityService.extractData(response, TraceModules.objects, 'getObjectServiceText()')),
      catchError((response: HttpResponse<any>) =>
        this.wsiUtilityService.handleError(response, TraceModules.objects, 'getObjectServiceText()', this.errorService)));
  }

  /**
   * setServiceText
   */
  public setServiceText(objectId: string, updatedServiceText: ServiceTextParameters): Observable < void > {
    if ((objectId === undefined) || (objectId === null) || (updatedServiceText === undefined)) {
      return observableThrowError(WsiUtilityService.createNewInvalidArgumentsError());
    }

    this.traceService.debug(TraceModules.objects, 'setServiceText() called for objectId: %s', objectId);

    const headers: HttpHeaders = this.wsiUtilityService.httpPostDefaultHeader(this.authenticationServiceBase.userToken);
    const objectIdTripleEncoded: string = encodeURIComponent(encodeURIComponent(encodeURIComponent(objectId)));
    const url: string = this.wsiEndpointService.entryPoint + objectsServiceTextServiceUrl + objectIdTripleEncoded + '/memo';
    const body: any = JSON.stringify(updatedServiceText);

    return this.httpClient.put(url, body, { headers }).pipe(
      map((response: HttpResponse<any> | any) => this.onChangeServiceText()),
      catchError((response: HttpResponse<any>) =>
        this.wsiUtilityService.handleError(response, TraceModules.objects, 'setServiceText()', this.errorService)));
  }

  private onChangeServiceText(): void {
    this.traceService.info(TraceModules.objects, 'onChangeServiceText(): Engineering Text changed successful');
  }
}
