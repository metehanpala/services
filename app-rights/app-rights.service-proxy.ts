import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthenticationServiceBase, ErrorNotificationServiceBase, TraceService } from '@gms-flex/services-common';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { TraceModules } from '../shared/trace-modules';
import { WsiUtilityService } from '../shared/wsi-utility.service';
import { WsiEndpointService } from '../wsi-endpoint/wsi-endpoint.service';
import { AppRightsServiceProxyBase } from '../wsi-proxy-api/app-rights/app-rights.services-proxy.base';
import { AppRights } from '../wsi-proxy-api/app-rights/data.model';

const appRightsUrl = '/api/accessrights/';

@Injectable({
  providedIn: 'root'
})
export class AppRightsServiceProxy implements AppRightsServiceProxyBase {

  public constructor(
    private readonly traceService: TraceService,
    private readonly httpClient: HttpClient,
    private readonly authenticationServiceBase: AuthenticationServiceBase,
    private readonly errorService: ErrorNotificationServiceBase,
    private readonly wsiEndpointService: WsiEndpointService,
    private readonly wsiUtilityService: WsiUtilityService) {
    this.traceService.info(TraceModules.appRights, 'Application rights service created.');
  }

  /**
   * Gets all the application rights for the authenticated user.
   * See also WSI API specification.
   *
   * @returns An observable of array { AppRights } objects.
   *
   * @memberOf AppRightsServiceProxy
   */
  public getAppRightsAll(): Observable<AppRights> {
    this.traceService.debug(TraceModules.sysBrowser, 'getAppRightsAll() called');
    const headers: HttpHeaders = this.wsiUtilityService.httpGetDefaultHeader(this.authenticationServiceBase.userToken);
    const url: string = this.wsiEndpointService.entryPoint + appRightsUrl;

    return this.httpClient.get(url, { headers, observe: 'response' }).pipe(
      map((response: HttpResponse<AppRights> | any) => this.wsiUtilityService.extractData(response, TraceModules.appRights, 'getAppRightsAll()')),
      catchError((response: HttpResponse<AppRights>) =>
        this.wsiUtilityService.handleError(response, TraceModules.appRights, 'getAppRightsAll()', this.errorService)));
  }
}
