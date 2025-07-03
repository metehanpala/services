import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthenticationServiceBase, ErrorNotificationServiceBase, TraceService } from '@gms-flex/services-common';
import { Observable } from 'rxjs';
import { catchError, delay, map } from 'rxjs/operators';

import { TraceModules } from '../shared/trace-modules';
import { WsiUtilityService } from '../shared/wsi-utility.service';
import { WsiEndpointService } from '../wsi-endpoint/wsi-endpoint.service';
import { EventCategoryWsi } from '../wsi-proxy-api/event/data.model';
import { EventCategoriesProxyServiceBase } from '../wsi-proxy-api/event/event-categories-proxy.service.base';

const eventCategoriesUrl = '/api/events/eventcategories/';

/**
 * Implementation for the WSI event counter service.
 * See the WSI API documentation for details.
 *
 * @export
 * @class EventCategoriesProxyService
 * @extends {EventCategoriesProxyServiceBase}
 */
@Injectable({
  providedIn: 'root'
})
export class EventCategoriesProxyService extends EventCategoriesProxyServiceBase {

  public constructor(
    private readonly traceService: TraceService,
    private readonly httpClient: HttpClient,
    private readonly authenticationServiceBase: AuthenticationServiceBase,
    private readonly wsiEndpointService: WsiEndpointService,
    private readonly wsiUtilityService: WsiUtilityService,
    private readonly errorService: ErrorNotificationServiceBase) {
    super();
    this.traceService.info(TraceModules.events, 'Event categories service created.');
  }

  /**
   * Gets all event categories for the current user
   *
   * @returns {Observable<EventCategoryWSI[]>}
   *
   * @memberOf EventCategoriesProxyService
   */
  public getEventCategories(): Observable<EventCategoryWsi[]> {
    this.traceService.info(TraceModules.events, 'getEventCategories() called.');
    const headers: HttpHeaders = this.wsiUtilityService.httpGetDefaultHeader(this.authenticationServiceBase.userToken);
    const url: string = this.wsiEndpointService.entryPoint + eventCategoriesUrl;

    return this.httpClient.get(url, { headers, observe: 'response' }).pipe(
      map((response: HttpResponse<any>) => this.wsiUtilityService.extractData(response, TraceModules.events, 'getEventCategories()')),
      catchError((response: HttpResponse<any>) =>
        this.wsiUtilityService.handleError(response, TraceModules.events, 'getEventCategories()', this.errorService)));
  }
}
