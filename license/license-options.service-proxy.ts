import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthenticationServiceBase, ErrorNotificationServiceBase, TraceService } from '@gms-flex/services-common';
import { Observable, throwError as observableThrowError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { TraceModules } from '../shared/trace-modules';
import { WsiUtilityService } from '../shared/wsi-utility.service';
import { WsiEndpointService } from '../wsi-endpoint/wsi-endpoint.service';
import { LicencseOptions } from '../wsi-proxy-api/license/data.model';
import { LicenseOptionsProxyServiceBase } from '../wsi-proxy-api/license/license-options.services-proxy.base';

const licenseOptionsUrl = '/api/licenses/licenseoptions';

@Injectable({
  providedIn: 'root'
})
export class LicenseOptionsServiceProxy implements LicenseOptionsProxyServiceBase {

  public constructor(
    private readonly traceService: TraceService,
    private readonly httpClient: HttpClient,
    private readonly authenticationServiceBase: AuthenticationServiceBase,
    private readonly errorService: ErrorNotificationServiceBase,
    private readonly wsiEndpointService: WsiEndpointService,
    private readonly wsiUtilityService: WsiUtilityService) {
    this.traceService.info(TraceModules.license, 'License options service created.');
  }

  /**
   * Gets all the license-options for the authenticated user.
   * See also WSI API specification.
   *
   * @returns An observable of { LicenseOption } array.
   *
   * @memberOf LicenseOptionServiceProxy
   */
  public getLicenseOptionsRightsAll(): Observable<LicencseOptions[]> {
    this.traceService.debug(TraceModules.sysBrowser, 'getLicenseOptionsRightsAll() called');
    const headers: HttpHeaders = this.wsiUtilityService.httpGetDefaultHeader(this.authenticationServiceBase.userToken);
    const url: string = this.wsiEndpointService.entryPoint + licenseOptionsUrl;

    return this.httpClient.get(url, { headers, observe: 'response' }).pipe(
      map((response: HttpResponse<LicencseOptions[]> | any) => { return response.body; }
      ),
      catchError((response: HttpResponse<any>) =>
        this.wsiUtilityService.handleError(response, TraceModules.appRights, 'getLicenseOptionsRightsAll()', this.errorService)));
  }
}
