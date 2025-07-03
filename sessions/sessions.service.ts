import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthenticationServiceBase, ErrorNotificationServiceBase, TraceService } from '@gms-flex/services-common';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { TraceModules } from '../shared';
import { WsiUtilityService } from '../shared/wsi-utility.service';
import { WsiEndpointService } from '../wsi-endpoint/wsi-endpoint.service';
import { SessionsServiceBase } from '../wsi-proxy-api/sessions';

@Injectable({
  providedIn: 'root'
})
export class SessionsService extends SessionsServiceBase {
  private readonly deleteSessionUrl = '/api/sessions/';
  public constructor(
    private readonly traceService: TraceService,
    private readonly httpClient: HttpClient,
    private readonly authenticationServiceBase: AuthenticationServiceBase,
    private readonly wsiEndpointService: WsiEndpointService,
    private readonly wsiUtilityService: WsiUtilityService,
    private readonly errorService: ErrorNotificationServiceBase) {
    super();
  }

  public deleteSession(systemId: number, sessionId: string): Observable<any> {
    if (systemId == null || sessionId == null) {
      return throwError(() => new Error('deleteSession() called with invalid arguments!'));
    }

    const functionName = 'deleteSession()';
    this.traceService.info(TraceModules.sessions, `${functionName}: http delete called`);
    const headers: HttpHeaders = this.wsiUtilityService.httpDeleteDefaultHeader(this.authenticationServiceBase.userToken);
    
    // api/sessions/{systemId}/{sessionId}
    const encodedSysId: string = encodeURIComponent(encodeURIComponent(systemId));
    const encodedsessionId: string = encodeURIComponent(encodeURIComponent(sessionId));
    const url = this.wsiEndpointService.entryPoint + this.deleteSessionUrl + encodedSysId + '/' + encodedsessionId;

    return this.httpClient.delete(url, { headers, observe: 'response' }).pipe(
      map((response: HttpResponse<any>) =>
        this.wsiUtilityService.extractData(response, TraceModules.sessions, `${functionName}: http delete response`)),
      catchError((response: HttpResponse<any>) =>
        this.wsiUtilityService.handleError(response, TraceModules.sessions, `${functionName}: http delete response`, this.errorService)));
  }
}