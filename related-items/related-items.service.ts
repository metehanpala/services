import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthenticationServiceBase, ErrorNotificationServiceBase, TraceService } from '@gms-flex/services-common';
import { Observable, throwError as observableThrowError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { TraceModules } from '../shared/trace-modules';
import { WsiUtilityService } from '../shared/wsi-utility.service';
import { WsiEndpointService } from '../wsi-endpoint/wsi-endpoint.service';
import { RelatedObjects } from '../wsi-proxy-api/related-items/data.model';
import { RelatedItemsServiceBase } from '../wsi-proxy-api/related-items/related-items.service.base';

const relatedItemsServiceUrl = '/api/relateditems/';

/**
 * @extends RelatedItemsServiceBase
 */
@Injectable({
  providedIn: 'root'
})
export class RelatedItemsService extends RelatedItemsServiceBase {
  public constructor(private readonly traceService: TraceService,
    private readonly httpClient: HttpClient,
    private readonly authenticationServiceBase: AuthenticationServiceBase,
    private readonly wsiEndpointService: WsiEndpointService,
    private readonly errorService: ErrorNotificationServiceBase,
    private readonly wsiUtilityService: WsiUtilityService) {
    super();

    this.traceService.info(TraceModules.relatedItems, 'Related Items service created');
  }

  /**
   * Gets a list of objects which are "related" to the provided object
   * @param objectId the object of interest for which related objects will be returned
   *
   * @returns {Observable<string>}
   *
   * @memberOf RelatedItemsServiceBase
   */
  public getRelatedItems(objectIds: string[]): Observable<RelatedObjects> {
    if ((objectIds == null) || (objectIds.length === 0)) {
      this.traceService.error(TraceModules.relatedItems, 'getRelatedItems() called with invalid arguments');
      return observableThrowError(WsiUtilityService.createNewInvalidArgumentsError());
    }

    this.traceService.info(TraceModules.relatedItems, 'getRelatedItems() called; number of objectIds: %s', objectIds.length);
    if (this.traceService.isDebugEnabled(TraceModules.relatedItems)) {
      this.traceService.debug(TraceModules.relatedItems, 'getRelatedItems(): for objectIds:\n%s', objectIds.join('\n'));
    }

    const headers: HttpHeaders = this.wsiUtilityService.httpPostDefaultHeader(this.authenticationServiceBase.userToken);
    const url: string = this.wsiEndpointService.entryPoint + relatedItemsServiceUrl;
    const body: any = JSON.stringify(objectIds);

    return this.httpClient.post(url, body, { headers, observe: 'response' }).pipe(
      map((response: HttpResponse<any>) =>
        this.wsiUtilityService.extractData(response, TraceModules.relatedItems, 'getRelatedItems()')),
      catchError((response: HttpResponse<any>) =>
        this.wsiUtilityService.handleError(response, TraceModules.relatedItems, 'getRelatedItems()', this.errorService)));
  }

  /**
   * Handles received HTTP response for a related items request
   * @param response
   */
  private handleRelatedItemsContent(response: string): string {
    const content: string = response;

    return content;
  }
}
