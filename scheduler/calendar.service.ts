import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthenticationServiceBase, ErrorNotificationServiceBase, TraceService } from '@gms-flex/services-common';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { TraceModules } from '../shared/trace-modules';
import { WsiUtilityService } from '../shared/wsi-utility.service';
import { WsiEndpointService } from '../wsi-endpoint/wsi-endpoint.service';
import { CalendarServiceBase } from '../wsi-proxy-api/scheduler';

const calendarGetServiceUrl = '/api/scheduler/calendar/';
const calendarSaveUrl = '/api/scheduler/calendar/save';

@Injectable({
  providedIn: 'root'
})
export class CalendarService extends CalendarServiceBase {

  /**
   * Constructor
   * @param {TraceService } traceService The trace service
   * @param {HttpClient } httpClient  The http service
   * @param {WsiEndpointService } wsiEndpoint The WSI endpoint service.
   */
  public constructor(
    public traceService: TraceService,
    protected httpClient: HttpClient,
    private readonly authenticationServiceBase: AuthenticationServiceBase,
    private readonly wsiEndpointService: WsiEndpointService,
    private readonly errorService: ErrorNotificationServiceBase,
    private readonly wsiUtilityService: WsiUtilityService) {
    super();
    this.traceService.info(TraceModules.diagnostics, 'calendar service created.');
  }

  public getCalendar(objectId: string): Observable<any> {

    this.traceService.info(TraceModules.calendar, 'getCalendar() called for: ' + objectId);

    const headers: HttpHeaders = this.wsiUtilityService.httpGetDefaultHeader(this.authenticationServiceBase.userToken);
    const objectIdTripleEncoded: string = this.urlIdTripleEncode(objectId);
    const url: string = this.wsiEndpointService.entryPoint + calendarGetServiceUrl + objectIdTripleEncoded;

    return this.httpClient.get(url, { headers, observe: 'response' }).pipe(
      map((response: HttpResponse<any>) => {
        return this.wsiUtilityService.extractData(response, TraceModules.calendar, 'getCalendar()');
      }),
      catchError((response: HttpResponse<any>) =>
        this.wsiUtilityService.handleError(response, TraceModules.calendar, 'getCalendar()', this.errorService)));
  }

  public saveCalendar(calendar: any): Observable<any> {
    this.traceService.info(TraceModules.calendar, 'saveCalendar() called');

    const headers: HttpHeaders = this.wsiUtilityService.httpGetDefaultHeader(this.authenticationServiceBase.userToken);

    const url: string = this.wsiEndpointService.entryPoint + calendarSaveUrl;

    return this.httpClient.post(url, calendar, { headers, observe: 'response' }).pipe(
      map((response: HttpResponse<any>) => {
        return this.wsiUtilityService.extractData(response, TraceModules.calendar, 'saveCalendar()');
      }),
      catchError((response: HttpResponse<any>) =>
        this.wsiUtilityService.handleError(response, TraceModules.calendar, 'saveCalendar()', this.errorService)));
  }

  private urlIdTripleEncode(parameter: string): string {
    return encodeURIComponent(encodeURIComponent(encodeURIComponent(parameter)));
  }
}
