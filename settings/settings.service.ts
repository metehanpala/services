import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthenticationServiceBase, ErrorNotificationServiceBase, SettingsServiceBase, TraceService } from '@gms-flex/services-common';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { TraceModules } from '../shared/trace-modules';
import { WsiUtilityService } from '../shared/wsi-utility.service';
import { WsiEndpointService } from '../wsi-endpoint/wsi-endpoint.service';

const settingsUrl = '/api/settings/';

/**
 * Implementation for the WSI Settings service.
 * See the WSI documentation for details.
 *
 * @export
 * @class SettingsService
 * @extends {SettingsServiceBase}
 */
@Injectable({
  providedIn: 'root'
})
export class SettingsService extends SettingsServiceBase {

  public constructor(
    private readonly traceService: TraceService,
    private readonly httpClient: HttpClient,
    private readonly authenticationServiceBase: AuthenticationServiceBase,
    private readonly wsiEndpointService: WsiEndpointService,
    private readonly wsiUtilityService: WsiUtilityService,
    private readonly errorService: ErrorNotificationServiceBase) {
    super();
    this.traceService.info(TraceModules.settings, 'Service created.');
  }

  /**
   * Gets the saved settings from WSI.
   * See WSI documentation for more details.
   *
   * @param {string } settingID
   * @returns {Observable<string>}
   *
   * @memberOf SettingsService
   */
  public getSettings(settingID: string): Observable<string> {
    this.traceService.info(TraceModules.settings, 'getSettings() called, Setting ID: %s', settingID);
    const headers: HttpHeaders = this.wsiUtilityService.httpGetDefaultHeader(this.authenticationServiceBase.userToken);
    let url: string = this.wsiEndpointService.entryPoint + settingsUrl;
    url = url + settingID;

    return this.httpClient.get(url, { headers, responseType: 'text' }).pipe(
      map((response: string) => this.extractSettings(response)),
      catchError((response: HttpResponse<any>) => this.wsiUtilityService.handleError(response, TraceModules.settings, 'getSettings()', this.errorService)));
  }

  /**
   * Sets the saved settings in WSI.
   * See WSI documentation for more details.
   *
   * @param {string } settingID
   * @param {string | JSON } settingValue
   * @returns {Observable<string>}
   *
   * @memberOf SettingsService
   */
  public putSettings(settingID: string, settingValue: string | JSON): Observable<boolean> {
    this.traceService.info(TraceModules.settings, 'putSettings() called, Setting ID: %s', settingID);

    if (typeof settingValue === 'object' && settingValue !== null) {
      // This is needed as we are sending a JSON object which needs to be stringified twice to add
      // escape characters '/' , in our case simply appending the string was giving an error, the final string
      // that gets formed is : "{\"pixelsPerSample\":16,\"timeRange\":{\"timeRangeUnit\":\"year\",\"timeRangeValue\":2}}"
      settingValue = JSON.stringify(JSON.stringify(settingValue));
    } else {
      settingValue = '"' + settingValue + '"'; // HTTP Put requires the value within ""
      // Replace escape char (\) with double backslash to make it readable on put request body
      settingValue = settingValue.replace(/\\/g, '\\\\');
    }
    const headers: HttpHeaders = this.wsiUtilityService.httpPutDefaultHeader(this.authenticationServiceBase.userToken);
    let url: string = this.wsiEndpointService.entryPoint + settingsUrl;
    url = url + settingID;

    return this.httpClient.put(url, settingValue, { headers, observe: 'response' }).pipe(
      map((response: HttpResponse<any>) => this.extractUpdate(response)),
      catchError((response: HttpResponse<any>) => this.wsiUtilityService.handleError(response, TraceModules.settings, 'putSettings()', this.errorService)));
  }

  /**
   * Deletes the saved previous settings from WSI.
   * See WSI documentation for more details.
   *
   * @param {string } settingID
   * @returns {Observable<boolean>}
   *
   * @memberOf SettingsService
   */
  public deleteSettings(settingID: string): Observable<boolean> {
    this.traceService.info(TraceModules.settings, 'deleteSettings() called, Setting ID: %s', settingID);

    const headers: HttpHeaders = this.wsiUtilityService.httpDeleteDefaultHeader(this.authenticationServiceBase.userToken);
    let url: string = this.wsiEndpointService.entryPoint + settingsUrl;
    url = url + settingID;

    return this.httpClient.delete(url, { headers, observe: 'response' }).pipe(
      map((response: HttpResponse<any>) => this.extractDeletion(response)),
      catchError((response: HttpResponse<any>) => this.wsiUtilityService.handleError(response, TraceModules.settings, 'deleteSettings()', this.errorService)));
  }

  private extractSettings(res: string): string {
    const settingsStr: string = res; // icon as base64 encoded png image
    this.traceService.info(TraceModules.settings, 'getSettings(): call returned, val=%s', settingsStr);
    return settingsStr;
  }

  private extractDeletion(res: HttpResponse<any>): boolean {
    if (res.status < 200 || res.status >= 300) {
      throw new Error('Bad response status: ' + res.status);
    }
    try {
      if (res.status === 200) {
        this.traceService.info(TraceModules.settings, ' Delete successful.');
        return true;
      } else if (res.status === 204) {
        this.traceService.info(TraceModules.settings, ' Delete successful - no data to delete.');
        return true;
      } else {
        this.traceService.warn(TraceModules.settings, ' Delete not successful.');
        return false;
      }
    } catch (exc) {
      this.traceService.warn(TraceModules.settings, 'Delete: Response not handled properly; url: %s; exception caught: %s',
        res.url, (exc as Error).message.toString());
      return false;
    }
  }

  private extractUpdate(res: HttpResponse<any>): boolean {
    if (res.status < 200 || res.status >= 300) {
      throw new Error('Bad response status: ' + res.status);
    }
    try {
      if (res.status === 200) {
        this.traceService.info(TraceModules.settings, ' Update successful.');
        return true;
      } else if (res.status === 204) {
        this.traceService.info(TraceModules.settings, ' Update successful - created.');
        return true;
      } else {
        this.traceService.warn(TraceModules.settings, ' Update not successful.');
        return false;
      }
    } catch (exc) {
      this.traceService.warn(TraceModules.settings, ' Update: Response not handled properly; url: %s; exception caught: %s',
        res.url, (exc as Error).message.toString());
      return false;
    }
  }
}
