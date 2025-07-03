import { HttpClient, HttpHeaders, HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthenticationServiceBase, ErrorNotificationServiceBase, TraceService } from '@gms-flex/services-common';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { TraceModules } from '../shared/trace-modules';
import { WsiQueryEncoder } from '../shared/wsi-query-encoder';
import { WsiUtilityService } from '../shared/wsi-utility.service';
import { WsiEndpointService } from '../wsi-endpoint/wsi-endpoint.service';
import { BrowserObject } from '../wsi-proxy-api/system-browser/data.model';
import { GraphicInfo } from './data.model';
import { GraphicsServiceBase } from './graphics.service.base';

const graphicsPreselectServiceUrl = '/api/graphics/';
const graphicsSelectServiceUrl = '/api/graphics/itemIds/';
const graphicsContentLoadServiceUrl = '/api/graphics/items/';
const graphicsDownNavigationUrl = '/api/graphics/children/itemIds/';

@Injectable({
  providedIn: 'root'
})
export class GraphicsService extends GraphicsServiceBase {

  /**
   * Constructor
   * @param {TraceService } traceService The trace service
   * @param {HttpClient } httpClient  The http service
   * @param {WsiEndpointService } wsiEndpoint The WSI endpoint service.
   */
  public constructor(
    traceService: TraceService,
    httpClient: HttpClient,
    private readonly authenticationServiceBase: AuthenticationServiceBase,
    private readonly wsiEndpointService: WsiEndpointService,
    private readonly errorService: ErrorNotificationServiceBase,
    private readonly wsiUtilityService: WsiUtilityService) {

    super(traceService, httpClient);
    this.traceService.info(TraceModules.diagnostics, 'Graphics service created.');
  }

  /**
   * returns true if the object is graphical or it has a graphical item related to it, otherwise false
   *
   * @returns {boolean}
   *
   * @memberOf GraphicsServiceBase
   */
  public hasGraphicalItems(objectId: string): Observable<boolean> {

    this.traceService.info(TraceModules.graphics, 'hasGraphicalItems() called for: ' + objectId);

    const headers: HttpHeaders = this.wsiUtilityService.httpGetDefaultHeader(this.authenticationServiceBase.userToken);
    const objectIdTripleEncoded: string = encodeURIComponent(encodeURIComponent(encodeURIComponent(objectId)));
    const url: string = this.wsiEndpointService.entryPoint + graphicsPreselectServiceUrl + objectIdTripleEncoded;

    return this.httpClient.get(url, { headers, observe: 'response' }).pipe(
      map((response: HttpResponse<any>) =>
        this.handleHasGraphicalItems(response)),
      catchError((response: HttpResponse<any>) =>
        this.wsiUtilityService.handleError(response, TraceModules.graphics, 'hasGraphicalItems()', this.errorService)));
  }

  /**
   * Gets the graphics items based on provided designation
   *
   * @returns {Observable<GraphicInfo[]>}
   *
   * @memberOf GraphicsServiceBase
   */
  public getGraphicsItems(designation: string): Observable<GraphicInfo[]> {

    this.traceService.info(TraceModules.graphics, 'getGraphicsItems() called for: ' + designation);

    const headers: HttpHeaders = this.wsiUtilityService.httpGetDefaultHeader(this.authenticationServiceBase.userToken);
    const designationTripleEncoded: string = encodeURIComponent(encodeURIComponent(encodeURIComponent(designation)));
    const url: string = this.wsiEndpointService.entryPoint + graphicsSelectServiceUrl + designationTripleEncoded;

    return this.httpClient.get(url, { headers, observe: 'response' }).pipe(
      map((response: HttpResponse<any>) =>
        this.wsiUtilityService.extractData(response, TraceModules.graphics, 'getGraphicsItems()')),
      catchError((response: HttpResponse<any>) =>
        this.wsiUtilityService.handleError(response, TraceModules.graphics, 'getGraphicsItems()', this.errorService)));
  }

  /**
   * Gets the graphics content on based on provided objectId
   *
   * @returns {Observable<string>}
   *
   * @memberOf GraphicsServiceBase
   */
  public getGraphicsContent(objectId: string): Observable<string> {

    this.traceService.info(TraceModules.graphics, 'getGraphicsItems() called: ' + objectId);

    const headers: HttpHeaders = this.wsiUtilityService.httpGetDefaultHeader(this.authenticationServiceBase.userToken);
    const objectIdTripleEncoded: string = encodeURIComponent(encodeURIComponent(encodeURIComponent(objectId)));
    const url: string = this.wsiEndpointService.entryPoint + graphicsContentLoadServiceUrl + objectIdTripleEncoded;

    return this.httpClient.get(url, { headers, responseType: 'text' }).pipe(
      map((response: string) =>
        this.handleGetGraphicsContent(response)),
      catchError((response: HttpResponse<any>) =>
        this.wsiUtilityService.handleError(response, TraceModules.graphics, 'getGraphicsContent()', this.errorService)));
  }

  /**
   * Gets the first child of the designation which has graphics.
   *
   * @returns {Observable<BrowserObject>}
   *
   * @memberOf GraphicsServiceBase
   */
  public getChildWithGraphics(designation: string): Observable<BrowserObject> {

    this.traceService.info(TraceModules.graphics, 'getChildWithGraphics() called: ' + designation);

    const headers: HttpHeaders = this.wsiUtilityService.httpGetDefaultHeader(this.authenticationServiceBase.userToken);
    const designationTripleEncoded: string = encodeURIComponent(encodeURIComponent(encodeURIComponent(designation)));
    const url: string = this.wsiEndpointService.entryPoint + graphicsDownNavigationUrl + designationTripleEncoded;
    let params: HttpParams = new HttpParams({ encoder: new WsiQueryEncoder() });
    // graphic | template | viewport
    const types = 7;
    params = params.append('types', String(types));
    return this.httpClient.get(url, { headers, params, observe: 'response' }).pipe(
      map((response: HttpResponse<any>) => this.wsiUtilityService.extractData(response, TraceModules.sysBrowser, 'getChildWithGraphics()')),
      catchError((response: HttpResponse<any>) =>
        this.wsiUtilityService.handleError(response, TraceModules.graphics, 'getChildWithGraphics()', this.errorService)));
  }

  /**
   * Handles received HTTP response for a graphics content request
   * @param response
   */
  private handleGetGraphicsContent(response: string): string {
    const content: string = response;
    return content;
  }

  /**
   * Handles received HTTP response for an object is graphical or it has a graphical item related to it
   * @param response
   */
  private handleHasGraphicalItems(response: HttpResponse<any>): boolean {
    this.logHTTPstatus(response);
    return (response != null && response.status === 200);
  }

  /**
   * Logs HTTP response status
   * @param response
   */
  private logHTTPstatus(response: HttpResponse<any>): void {
    let message = '';
    if (response != null) {
      message = 'HTTP response status: ' + response.status.toString();
      this.traceService.info(TraceModules.graphics, 'handleGetGraphicsContent() called: ' + message);
    }
  }
}
