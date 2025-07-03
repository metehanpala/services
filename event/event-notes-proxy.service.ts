import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthenticationServiceBase, ErrorNotificationServiceBase, TraceService } from '@gms-flex/services-common';
import { Observable, Subject } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { TraceModules } from '../shared/trace-modules';
import { WsiUtilityService } from '../shared/wsi-utility.service';
import { HubProxyShared } from '../signalr/hub-proxy-shared';
import { WsiEndpointService } from '../wsi-endpoint/wsi-endpoint.service';
import { WsiEventNote } from '../wsi-proxy-api/event/data.model';
import { EventNotesProxyServiceBase } from '../wsi-proxy-api/event/event-notes-proxy.service.base';

const eventNotesUrl = '/api/events/eventnotes/';

/**
 * Implementation for the WSI EventNotes service.
 * See the WSI documentation for details.
 *
 * @export
 * @class EventNotesService
 * @extends {EventNotesServiceBase}
 */
@Injectable({
  providedIn: 'root'
})
export class EventNotesProxyService extends EventNotesProxyServiceBase {
  public hubProxyShared: HubProxyShared | undefined;
  // public hubProxyEventSound: HubProxyEvent<WsiEventNote>;

  public constructor(
    private readonly traceService: TraceService,
    private readonly httpClient: HttpClient,
    private readonly authenticationServiceBase: AuthenticationServiceBase,
    private readonly wsiEndpointService: WsiEndpointService,
    private readonly wsiUtilityService: WsiUtilityService,
    private readonly errorService: ErrorNotificationServiceBase) {
    super();
    this.traceService.info(TraceModules.events, 'EventNotes proxy service created.');
  }

  /**
   * Gets the saved event notes via WSI.
   * See WSI documentation for more details.
   *
   * @param {string } eventID
   * @returns {Observable<WsiEventNote>}
   *
   * @memberOf EventNotesService
   */
  public getEventNotes(eventID: string): Observable<WsiEventNote> {
    this.traceService.info(TraceModules.events, 'EventNotesProxyService:getEventNotes() called with Event ID: %s', eventID);
    const headers: HttpHeaders = this.wsiUtilityService.httpGetDefaultHeader(this.authenticationServiceBase.userToken);
    const url: string = this.wsiEndpointService.entryPoint + eventNotesUrl + eventID;

    return this.httpClient.get(url, { headers, observe: 'response' }).pipe(
      map((response: HttpResponse<any>) => this.wsiUtilityService.extractData(response, TraceModules.events, 'EventNotesProxyService:getEventNotes()')),
      catchError((response: HttpResponse<any>) =>
        this.wsiUtilityService.handleError(response, TraceModules.events, 'EventNotesProxyService:getEventNotes()', this.errorService)));
  }

  /**
   * Sets the event notes via WSI.
   * See WSI documentation for more details.
   *
   * @param {string } eventID
   * @param {string } eventNotes
   *
   * @memberOf EventNotesService
   */
  public setEventNote(eventID: string, eventNotes: string): void {
    this.traceService.info(TraceModules.events, 'EventNotesProxyService:setEventNote() called with Event ID: %s', eventID);
    const headers: HttpHeaders = this.wsiUtilityService.httpPutDefaultHeader(this.authenticationServiceBase.userToken);
    const url: string = this.wsiEndpointService.entryPoint + eventNotesUrl + eventID;
    const body: any = JSON.stringify(eventNotes);
    const httpPostProxy: Subject<boolean> = new Subject<boolean>();

    const httpPost: Observable<boolean> = this.httpClient.post(url, body, { headers, observe: 'response' }).pipe(
      map((response: HttpResponse<any>) =>
        this.wsiUtilityService.extractData(response, TraceModules.events, 'EventNotesProxyService.setEventNote()')),
      catchError((response: HttpResponse<any>) =>
        this.wsiUtilityService.handleError(response, TraceModules.events, 'EventNotesProxyService.setEventNote()', this.errorService)));
    this.traceService.debug(TraceModules.events, 'EventNotesProxyService.setEventNote(); http post can be issued now (after connecting)...');

    httpPost.subscribe(value => this.onEventNotesNext(value, httpPostProxy),
      error => this.onEventNotesError(error, httpPostProxy));
  }

  private onEventNotesNext(value: boolean, httpPostProxy: Subject<boolean>): void {
    httpPostProxy.next(value);
    httpPostProxy.complete();
  }

  private onEventNotesError(error: any, httpPostProxy: Subject<boolean>): void {
    this.traceService.warn(TraceModules.events, 'onEventNotesError(); http post returned this error; %s', error);
    httpPostProxy.error(error);
  }
}
