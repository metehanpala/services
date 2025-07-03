import { HttpClient, HttpErrorResponse, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthenticationServiceBase, ErrorNotificationServiceBase, TraceService } from '@gms-flex/services-common';
import { Observable, throwError as observableThrowError, Subject } from 'rxjs';
import { catchError, map, takeUntil } from 'rxjs/operators';

import { TraceModules } from '../shared/trace-modules';
import { WsiUtilityService } from '../shared/wsi-utility.service';
import { WsiEndpointService } from '../wsi-endpoint/wsi-endpoint.service';
import { FilesServiceBase } from '../wsi-proxy-api/files/files.service.base';
import { Link } from '../wsi-proxy-api/shared/data.model';

const filesUrl = 'api/files/';
const documentsUrl = 'documents/';
const reportsUrl = '/api/historylogs/getflexreport';

/**
 * Implementation for the WSI files service.
 * See the WSI documentation for details.
 *
 * @export
 * @class FilesService
 * @extends {FilesBase}
 */
@Injectable({
  providedIn: 'root'
})
export class FilesService extends FilesServiceBase {

  public stopRequest: Subject<void> = new Subject<void>();

  public constructor(
    private readonly traceService: TraceService,
    private readonly httpClient: HttpClient,
    private readonly authenticationServiceBase: AuthenticationServiceBase,
    private readonly wsiEndpointService: WsiEndpointService,
    private readonly wsiUtilityService: WsiUtilityService,
    private readonly errorService: ErrorNotificationServiceBase) {
    super();
    this.traceService.debug(TraceModules.files, 'Service created.');
  }

  /**
   * Gets the specified file from WSI.
   * See WSI documentation for more details.
   *
   * @param {number } systemId
   * @param {string } relativeFilePath
   * @returns {Observable<Blob>}
   *
   * @memberOf FilesService
   */
  public getFile(systemId: number, relativeFilePath: string): Observable<Blob> {
    this.traceService.info(TraceModules.files, 'getFile() called, path: %s', relativeFilePath);
    const headers: HttpHeaders = this.wsiUtilityService.httpGetDefaultHeader(this.authenticationServiceBase.userToken);
    const relativeFilePathTripleEncoded: string = encodeURIComponent(encodeURIComponent(encodeURIComponent(relativeFilePath)));
    const url: string = this.wsiEndpointService.entryPoint + '/' + filesUrl + systemId + '/' + relativeFilePathTripleEncoded;

    return this.httpClient.get(url, { headers, responseType: 'blob' }).pipe(
      map((response: Blob) => this.extractResponse(response)),
      catchError((response: Blob) => this.wsiUtilityService.handleError(response, TraceModules.files, 'getFile()', this.errorService)));
  }

  /**
   * Gets the specified document from WSI.
   * See WSI documentation for more details.
   *
   * @param {string } designation
   * @returns {Observable<Blob>}
   *
   * @memberOf FilesService
   */
  public getDocument(designation: string): Observable<Blob> {
    this.traceService.info(TraceModules.files, 'getDocument() called');
    const headers: HttpHeaders = this.wsiUtilityService.httpGetDefaultHeader(this.authenticationServiceBase.userToken);
    const relativeFilePathTripleEncoded: string = encodeURIComponent(encodeURIComponent(encodeURIComponent(designation)));
    const url: string = this.wsiEndpointService.entryPoint + '/' + filesUrl + documentsUrl + relativeFilePathTripleEncoded;

    return this.httpClient.get(url, { headers, responseType: 'blob' }).pipe(takeUntil(this.stopRequest)).pipe(
      map((response: Blob) => this.extractResponse(response)),
      catchError((response: Blob) => this.wsiUtilityService.handleError(response, TraceModules.files, 'getDocument()', this.errorService)));
  }

  /**
   * Gets the specified file from WSI.
   * See WSI documentation for more details.
   *
   * @param {Link } link
   * @returns {Observable<Blob>}
   *
   * @memberOf FilesService
   */
  public getFileFromLink(link: Link): Observable<Blob> {
    this.traceService.info(TraceModules.files, 'FilesService.getFileFromLink() called, hRef=%s', link.Href);
    if (link.Href?.startsWith(filesUrl)) {
      const headers: HttpHeaders = this.wsiUtilityService.httpGetDefaultHeader(this.authenticationServiceBase.userToken);
      let url: string | undefined = this.wsiEndpointService.entryPoint;
      url = url + '/' + link.Href;

      return this.httpClient.get(url, { headers, responseType: 'blob' }).pipe(
        map((response: Blob) => this.extractResponse(response)),
        catchError((response: Blob) => this.wsiUtilityService.handleError(response, TraceModules.files, 'getFile()', this.errorService)));
    }
    return observableThrowError(new Error('Bad request in getFileFromLink()'));
  }

  private extractResponse(res: Blob): Blob {
    this.traceService.info(TraceModules.files, 'FilesService:getFileFromLink() call returned.');
    return res;
  }
}
