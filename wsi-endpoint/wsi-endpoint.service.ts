import { HttpClient, HttpResponse } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { isNullOrUndefined, WsiSettings } from '@gms-flex/services-common';
import { BehaviorSubject, Observable, throwError as observableThrowError, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

/* eslint-disable no-console, no-restricted-syntax */

/**
 * Service for managing WSI .
 */
@Injectable({
  providedIn: 'root'
})
export class WsiEndpointService {

  /**
   * Stores Wsi settings.
   */
  protected wsiSettings: WsiSettings | undefined;

  private readonly _wsiSettingFilePath: string;

  private readonly _settingsRead: BehaviorSubject<any> = new BehaviorSubject<any>(undefined);

  public constructor(protected httpClient: HttpClient,
    @Inject('wsiSettingFilePath') wsiSettingFilePath: string) {
    this._wsiSettingFilePath = wsiSettingFilePath;
    // This service is called during APP_INITIALIZATION so it does not make use of trace service
    console.info('gmsServices_Utilities: WsiEndpointService created. wsiSettingFilePath: %s', this._wsiSettingFilePath);
  }

  public get settingsRead(): Observable<WsiSettings> {
    return this._settingsRead.asObservable();
  }

  public readEntryPointFile(): Observable<WsiSettings> {
    if (this.wsiSettings != null) {
      console.info('gmsServices_Utilities: WsiEndpointService.readEntryPointFile() wsi-endpoint-settings.json already read, returning saved values.');
      return of(this.wsiSettings);
    } else {
      console.info('gmsServices_Utilities: WsiEndpointService.readEntryPointFile() reading wsi-endpoint-settings.json file.');
      return this.httpClient.get(this._wsiSettingFilePath, { observe: 'response' }).pipe(
        map((response: HttpResponse<any>) => this.extractData(response)),
        catchError((response: HttpResponse<any>) => this.handleError(response)));
    }
  }

  /**
   * Gets the WSI entry point: scheme + domain + port.
   */
  public get entryPoint(): string | undefined {
    if (this.wsiSettings != null) {
      if (this.isRelative) {
        if (this.wsiSettings.site != null) {
          return this.wsiSettings.site;
        } else {
          console.error('gmsServices_Utilities: Wsi endpoint settings (field site) not properly defined.');
          return undefined;
        }
      } else {
        if (this.wsiSettings.protocol != null && this.wsiSettings.host != null) {

          if (this.wsiSettings.port != null && this.wsiSettings.site != null) {
            return this.wsiSettings.protocol + '://' + this.wsiSettings.host + ':' + this.wsiSettings.port + '/' + this.wsiSettings.site;
          } else {
            return this.returnPortOrSiteOrHost();
          }
        } else {
          console.error('gmsServices_Utilities: Wsi endpoint settings not properly defined.');
          return undefined;
        }
      }

    } else {
      console.error('gmsServices_Utilities: Wsi endpoint settings is undefined.');
      return undefined;
    }
  }

  /**
   * Gets the renrew timeout.
   */
  public get renewTimeOut(): number | undefined {
    if (this.wsiSettings?.renewTimeOut != null) {
      return this.wsiSettings.renewTimeOut;
    } else {
      console.error('gmsServices_Utilities: RenewTimeOut is undefined.');
      return undefined;
    }
  }

  public get isRelative(): boolean {
    if (((this.wsiSettings?.protocol === undefined) || (this.wsiSettings?.protocol === null) || (this.wsiSettings?.protocol === '')) &&
        ((this.wsiSettings?.host === undefined) || (this.wsiSettings.host === null) || (this.wsiSettings.host === '')) &&
        ((this.wsiSettings?.port === undefined) || (this.wsiSettings.port === null) || (this.wsiSettings.port === ''))) {
      return true;
    } else {
      return false;
    }
  }

  private returnPortOrSiteOrHost(): string | undefined {
    if (this.wsiSettings?.port != null) {
      return this.wsiSettings.protocol + '://' + this.wsiSettings.host + ':' + this.wsiSettings.port;
    } else {
      if (this.wsiSettings?.site != null) {
        return this.wsiSettings.protocol + '://' + this.wsiSettings.host + '/' + this.wsiSettings.site;
      } else {
        if (this.wsiSettings != null) {
          return this.wsiSettings.protocol + '://' + this.wsiSettings.host;
        }
      }
    }
  }

  private extractData(res: HttpResponse<any>): WsiSettings {
    const body: any = res.body;
    this.wsiSettings = body;
    this._settingsRead.next(this.wsiSettings);
    console.info('gmsServices_Utilities: WsiEndpointService wsi-endpoint-settings.json has been read.');
    return body;
  }

  private handleError(error: HttpResponse<any> | any): Observable<any> {
    try {
      console.error('gmsServices_Utilities: handleError(): Reading endpoint settings file failed: %s', error.toString());
      return observableThrowError(error.toString());
    } catch (exc) {
      const endpointError = 'Endpoint file reading reply error! See trace.';
      console.error('gmsServices_Utilities: Exception caught: %s', (exc as Error).message.toString());
      return observableThrowError(endpointError);
    }
  }
}

/* eslint-enable no-console, no-restricted-syntax */
