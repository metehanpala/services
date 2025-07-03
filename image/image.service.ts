import { HttpClient, HttpHeaders, HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthenticationServiceBase, ErrorNotificationServiceBase, TraceService } from '@gms-flex/services-common';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { TraceModules } from '../shared/trace-modules';
import { WsiQueryEncoder } from '../shared/wsi-query-encoder';
import { WsiUtilityService } from '../shared/wsi-utility.service';
import { WsiEndpointService } from '../wsi-endpoint/wsi-endpoint.service';
import { ImageBase } from './image.service.base';

const imageServiceUrl = '/api/images/';

/**
 * GMS WSI language service.
 * @extends LanguageBase
 */
@Injectable({
  providedIn: 'root'
})
export class ImageService extends ImageBase {

  public constructor(
    traceService: TraceService,
    httpClient: HttpClient,
    private readonly authenticationServiceBase: AuthenticationServiceBase,
    private readonly wsiEndpointService: WsiEndpointService,
    private readonly wsiUtilityService: WsiUtilityService,
    private readonly errorService: ErrorNotificationServiceBase) {
    super(traceService, httpClient);

    this.traceService.info(TraceModules.image, 'Image service created.');
  }

  /**
   * Returns the specified image from WSI
   * See WSI API specification for more details.
   *
   * @param {string } imageId
   * @param {string } libPath
   * @param {string } format
   * @param {number } width
   * @param {number } height
   * @param {boolean } enoceBase64
   * @returns {Observable<string>}
   *
   * @memberOf ImageService
   */
  public getImage(imageId: string, libPath: string, format: string, width: number, height: number, enoceBase64: boolean): Observable<string> {
    this.traceService.info(TraceModules.image, 'getImage() called. Image: %s; path: %s', imageId, libPath);
    const headers: HttpHeaders = this.wsiUtilityService.httpGetDefaultHeader(this.authenticationServiceBase.userToken);
    const url: string = this.wsiEndpointService.entryPoint + imageServiceUrl + imageId;

    let params: HttpParams = new HttpParams({
      encoder: new WsiQueryEncoder()
    });
    params = params.append('path', libPath);
    params = params.append('format', format);
    params = params.append('width', String(width));
    params = params.append('height', String(height));
    params = params.append('encodeAsBase64', String(enoceBase64));

    return this.httpClient.get(url, { headers, params, responseType: 'text' }).pipe(
      map((response: string) => this.extractData(response, imageId)),
      catchError((response: HttpResponse<any>) => this.wsiUtilityService.handleError(response, TraceModules.image, 'getImage()', this.errorService)));
  }

  public extractData(res: string, imageId: string): string {
    this.traceService.info(TraceModules.image, 'getImage() returned for imageId=%s', imageId);
    return res;
  }
}
