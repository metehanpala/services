import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { TraceService } from '@gms-flex/services-common';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { TraceModules } from '../shared/trace-modules';
import { WsiUtilityService } from '../shared/wsi-utility.service';
import { WsiEndpointService } from '../wsi-endpoint/wsi-endpoint.service';
import { DiagnosticsServiceBase } from '../wsi-proxy-api/diagnostics/diagnostics.service.base';

const systemDiagnosticsUrl = '/api/diagnostics/';

/**
 * GMS WSI diagnostics service.
 * @extends DiagnosticsBase
 */
@Injectable({
  providedIn: 'root'
})
export class DiagnosticsService extends DiagnosticsServiceBase {

  /**
   * Constructor
   * @param {TraceService } traceService The trace service
   * @param {HttpClient } HttpClient The Angular 2 http service
   * @param {WsiEndpointService } wsiEndpoint The WSI endpoint service.
   */
  public constructor(
    private readonly traceService: TraceService,
    private readonly httpClient: HttpClient,
    private readonly wsiEndpointService: WsiEndpointService,
    private readonly wsiUtilityService: WsiUtilityService) {
    super();
    this.traceService.info(TraceModules.diagnostics, 'Diagnostics service created.');
  }

  public ping(): Observable<boolean> {
    this.traceService.debug(TraceModules.diagnostics, 'ping() WSI called');

    const headers: HttpHeaders = this.wsiUtilityService.httpGetDefaultHeader();
    const url: string = this.wsiEndpointService.entryPoint + systemDiagnosticsUrl;

    return this.httpClient.get(url, { headers, observe: 'response' }).pipe(
      map((response: HttpResponse<any>) => this.extractData(response)),
      catchError((response: HttpResponse<any>) => this.wsiUtilityService.handleError(response, TraceModules.diagnostics, 'ping()')));
  }

  protected extractData(response: HttpResponse<any>): any {
    this.traceService.debug(TraceModules.diagnostics, 'ping() WSI returned');
    return response.body;
  }
}
