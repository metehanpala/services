import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthenticationServiceBase, ErrorNotificationServiceBase, TraceService } from '@gms-flex/services-common';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { TraceModules } from '../shared/trace-modules';
import { WsiUtilityService } from '../shared/wsi-utility.service';
import { WsiEndpointService } from '../wsi-endpoint/wsi-endpoint.service';
import { ScheduleServiceBase } from '../wsi-proxy-api/scheduler';

const schedulerGetServiceUrl = '/api/scheduler/schedule/';
const schedulerGetCalendarList = '/api/scheduler/calendarList/';
const schedulerCalendarExceptions = '/api/scheduler/calendarExceptions/';
const scheduleSaveUrl = '/api/scheduler/schedule/save';
const scheduleSaveOptionsUrl = '/api/scheduler/schedule/saveOptions';
const tablesGetUrl = '/api/tables/local/';
const cnsGetDesignation = '/api/systembrowser/';
const exceptionSaveUrl = '/api/scheduler/exception/save';

@Injectable({
  providedIn: 'root'
})
export class ScheduleService extends ScheduleServiceBase {

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
    this.traceService.info(TraceModules.diagnostics, 'scheduler service created.');
  }

  public getSchedules(objectId: string): Observable<any> {

    this.traceService.info(TraceModules.scheduler, 'getSchedules() called for: ' + objectId);

    const headers: HttpHeaders = this.wsiUtilityService.httpGetDefaultHeader(this.authenticationServiceBase.userToken);
    const objectIdTriplEncoded: string = this.urlIdTripleEncode(objectId);
    const url: string = this.wsiEndpointService.entryPoint + schedulerGetServiceUrl + objectIdTriplEncoded;

    return this.httpClient.get(url, { headers, observe: 'response' }).pipe(
      map((response: HttpResponse<any>) => {
        return this.wsiUtilityService.extractData(response, TraceModules.scheduler, 'getSchedules()');
      }),
      catchError((response: HttpResponse<any>) =>
        this.wsiUtilityService.handleError(response, TraceModules.scheduler, 'getSchedules()', this.errorService)
      )
    );
  }
  public getCalendarList(objectId: string): Observable<any> {

    this.traceService.info(TraceModules.scheduler, 'getCalendarList() called for: ' + objectId);

    const headers: HttpHeaders = this.wsiUtilityService.httpGetDefaultHeader(this.authenticationServiceBase.userToken);
    const objectIdTriplEncoded: string = this.urlIdTripleEncode(objectId);
    const url: string = this.wsiEndpointService.entryPoint + schedulerGetCalendarList + objectIdTriplEncoded;

    return this.httpClient.get(url, { headers, observe: 'response' }).pipe(
      map((response: HttpResponse<any>) => {
        return this.wsiUtilityService.extractData(response, TraceModules.scheduler, 'getCalendarList()');
      }),
      catchError((response: HttpResponse<any>) =>
        this.wsiUtilityService.handleError(response, TraceModules.scheduler, 'getCalendarList()', this.errorService)
      )
    );
  }

  public getCalendarExceptions(calendarObjectIds: string[]): Observable<any> {

    this.traceService.info(TraceModules.scheduler, 'getCalendarExceptions() called');

    const headers: HttpHeaders = this.wsiUtilityService.httpGetDefaultHeader(this.authenticationServiceBase.userToken);
    const url: string = this.wsiEndpointService.entryPoint + schedulerCalendarExceptions;

    return this.httpClient.post(url, calendarObjectIds, { headers, observe: 'response' }).pipe(
      map((response: HttpResponse<any>) => {
        return this.wsiUtilityService.extractData(response, TraceModules.scheduler, 'getCalendarExceptions()');
      }),
      catchError((response: HttpResponse<any>) =>
        this.wsiUtilityService.handleError(response, TraceModules.scheduler, 'getCalendarExceptions()', this.errorService)
      ));
  }

  public saveSchedule(schedule: any): Observable<any> {

    this.traceService.info(TraceModules.scheduler, 'saveSchedule() called for: ' + schedule.Name);

    const headers: HttpHeaders = this.wsiUtilityService.httpGetDefaultHeader(this.authenticationServiceBase.userToken);

    const url: string = this.wsiEndpointService.entryPoint + scheduleSaveUrl;

    return this.httpClient.post(url, schedule, { headers, observe: 'response' }).pipe(
      map((response: HttpResponse<any>) => {
        return this.wsiUtilityService.extractData(response, TraceModules.scheduler, 'saveSchedule()');
      }),
      catchError((response: HttpResponse<any>) =>
        this.wsiUtilityService.handleError(response, TraceModules.scheduler, 'saveSchedule()', this.errorService)));
  }

  public saveExceptions(schedule: any): Observable<any> {

    this.traceService.info(TraceModules.scheduler, 'saveExceptions() called for: ' + schedule.Name);

    const headers: HttpHeaders = this.wsiUtilityService.httpGetDefaultHeader(this.authenticationServiceBase.userToken);

    const url: string = this.wsiEndpointService.entryPoint + exceptionSaveUrl;

    return this.httpClient.post(url, schedule, { headers, observe: 'response' }).pipe(
      map((response: HttpResponse<any>) => {
        return this.wsiUtilityService.extractData(response, TraceModules.scheduler, 'saveExceptions()');
      }),
      catchError((response: HttpResponse<any>) =>
        this.wsiUtilityService.handleError(response, TraceModules.scheduler, 'saveExceptions()', this.errorService)));
  }

  public saveScheduleOptions(schedule: any): Observable<any> {
    this.traceService.info(TraceModules.scheduler, 'saveScheduleOptions() called for: ' + schedule.Name);
    const headers: HttpHeaders = this.wsiUtilityService.httpGetDefaultHeader(this.authenticationServiceBase.userToken);
    const url: string = this.wsiEndpointService.entryPoint + scheduleSaveOptionsUrl;
    return this.httpClient.post(url, schedule, { headers, observe: 'response' }).pipe(
      map((response: HttpResponse<any>) => {
        return this.wsiUtilityService.extractData(response, TraceModules.scheduler, 'saveScheduleOptions()');
      }),
      catchError((response: HttpResponse<any>) =>
        this.wsiUtilityService.handleError(response, TraceModules.scheduler, 'saveScheduleOptions()', this.errorService)));
  }

  private urlIdTripleEncode(parameter: string): string {
    return encodeURIComponent(encodeURIComponent(encodeURIComponent(parameter)));
  }
}
