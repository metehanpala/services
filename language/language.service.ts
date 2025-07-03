import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthenticationServiceBase, ErrorNotificationServiceBase, Language, LanguageServiceBase, TraceService } from '@gms-flex/services-common';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { TraceModules } from '../shared/trace-modules';
import { WsiUtilityService } from '../shared/wsi-utility.service';
import { WsiEndpointService } from '../wsi-endpoint/wsi-endpoint.service';

const languageServiceUrl = '/api/languages/';
const languageServiceDefaultUrl = '/api/languages/default';

/**
 * GMS WSI language service.
 * @extends LanguageBase
 */
@Injectable({
  providedIn: 'root'
})
export class LanguageService implements LanguageServiceBase {

  public constructor(
    private readonly traceService: TraceService,
    private readonly httpClient: HttpClient,
    private readonly authenticationServiceBase: AuthenticationServiceBase,
    private readonly wsiEndpointService: WsiEndpointService,
    private readonly wsiUtilityService: WsiUtilityService,
    private readonly errorService: ErrorNotificationServiceBase) {

    this.traceService.info(TraceModules.product, 'Language service created.');
  }

  /**
   * Gets the user language of the logged in user
   *
   * @returns {Observable<Language>}
   *
   * @memberOf LanguageService
   */
  public getUserLanguage(): Observable<Language> {
    this.traceService.info(TraceModules.language, 'getUserLanguage() called.');
    const headers: HttpHeaders = this.wsiUtilityService.httpGetDefaultHeader(this.authenticationServiceBase.userToken);
    const url: string = this.wsiEndpointService.entryPoint + languageServiceUrl;

    return this.httpClient.get(url, { headers, observe: 'response' }).pipe(
      map((response: HttpResponse<any>) => this.wsiUtilityService.extractData(response, TraceModules.language, 'getUserLanguage()')),
      catchError((response: HttpResponse<any>) => this.wsiUtilityService.handleError(response, TraceModules.language, 'getUserLanguage()', this.errorService)));
  }

  /**
   * Gets the default language of the logged in user
   *
   * @returns {Observable<Language>}
   *
   * @memberOf LanguageService
   */
  public getDefaultLanguage(): Observable<Language> {
    this.traceService.info(TraceModules.language, 'getDefaultLanguage() called.');
    const headers: HttpHeaders = this.wsiUtilityService.httpGetDefaultHeader(this.authenticationServiceBase.userToken);
    const url: string = this.wsiEndpointService.entryPoint + languageServiceDefaultUrl;

    return this.httpClient.get(url, { headers, observe: 'response' }).pipe(
      map((response: HttpResponse<any>) => this.wsiUtilityService.extractData(response, TraceModules.language, 'getDefaultLanguages()')),
      catchError((response: HttpResponse<any>) =>
        this.wsiUtilityService.handleError(response, TraceModules.language, 'getDefaultLanguage()', this.errorService)));
  }
}
