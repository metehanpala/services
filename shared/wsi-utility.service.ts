import { PlatformLocation } from '@angular/common';
import { HttpErrorResponse, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Injectable, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { ErrorDisplayItem, ErrorDisplayMode, ErrorDisplayState, ErrorNotificationServiceBase,
  SessionCookieStorage, TraceService, UserInfoStorage } from '@gms-flex/services-common';
import { TranslateService } from '@ngx-translate/core';
import { CookieService } from 'ngx-cookie-service';
import { Observable, throwError as observableThrowError } from 'rxjs';

import { TraceModules } from '../shared/trace-modules';
import { WsiError, WsiErrorCmdExecFailed, WsiErrorConnectionFailed, WsiErrorEvtCmdExecFailed,
  WsiErrorGrantFailed, WsiErrorLicenseInvalid, WsiErrorPasswordExpired, WsiErrorTrendFailed } from '../wsi-proxy-api/shared/wsi-error';

/**
 * GMS WSI utility service. Provides som helper functions related to the WSI.
 */
@Injectable({
  providedIn: 'root'
})
export class WsiUtilityService {

  private readonly _licenseErrorItem: ErrorDisplayItem;
  private pathName: string | undefined;
  private domainName: string | undefined;

  /**
   * Constructor
   * @param {TraceService } trace The trace service
   * @param {WsiEndpointService } wsiEndpoint The WSI endpoint service.
   */
  public constructor(
    protected traceService: TraceService, private readonly platformLocation: PlatformLocation,
    private readonly translateService: TranslateService,
    private readonly cookieService: CookieService) {

    this._licenseErrorItem = new ErrorDisplayItem(ErrorDisplayMode.Toast, ErrorDisplayState.Inactive);
    this._licenseErrorItem.setDisplayMessageKey('GMS_SERVICES.LICENSE_ERROR_MSG');
    this._licenseErrorItem.setDisplayTitleKey('GMS_SERVICES.LICENSE_ERROR_TITLE');
    this.traceService.info(TraceModules.utilities, 'WSI Utility service created.');
  }

  public static createNewInvalidArgumentsError(): Error {
    return new Error('Invalid arguments!');
  }

  public extractData(res: HttpResponse<any>, traceModule: string, method: string): any {
    if (res.status < 200 || res.status >= 300) {
      throw new Error('Bad response status: ' + res.status);
    } else {
      try {
        const body: any = res.body;
        if (this.traceService.isDebugEnabled(traceModule)) {
          if (Array.isArray(body) === true) {
            let traceStr = '';
            (body as any[]).forEach(item => {
              traceStr = traceStr + '\n\n' + JSON.stringify(item);
            });
            this.traceService.debug(traceModule, method, 'returned:', traceStr);
          } else {
            this.traceService.debug(traceModule, method, 'returned:\n', JSON.stringify(body));
          }
        }
        return body;
      } catch (exc) {
        this.traceService.warn(traceModule, method, 'Response not handled properly; exception caught: ', res.url, '; url=', (exc as Error).message.toString());
      }
    }
  }

  public handleError(error: HttpResponse<any> | any, traceModule: string, method: string,
    errorService?: ErrorNotificationServiceBase, redirectonFailedAuth = true): Observable<any> {
    try {
      if (error instanceof HttpErrorResponse) {
        if (error.status === 400) {
          return this.handleErrorForStatus400(error, traceModule, method, errorService);
        } else if (error.status === 401) {
          return this.handleErrorForStatus401(error, traceModule, method, errorService, redirectonFailedAuth);
        } else if (error.status === 403) {
          return this.handleErrorForStatus403(error, traceModule, method, errorService);
        } else if (error.status === 404) {
          return this.handleErrorForStatus404(error, traceModule, method, errorService);
        } else if ((error.status === 0) || (error.status >= 500)) {
          return this.handleErrorForStatus0And5XX(error, traceModule, method, errorService);
        } else {
          this.traceReplyError(traceModule, method, this.wsiErrorMessage2(error.status, error.statusText));
          return observableThrowError(new WsiError(error.message, error.status, error.statusText));
        }
      } else {
        const errMsg: string = error.message ? error.message : error.toString();
        this.traceReplyError(traceModule, method, errMsg);
        return observableThrowError(new Error(errMsg));
      }
    } catch (exc) {
      const wsiError: WsiError = new WsiError('WSI reply error! See trace.');
      this.traceService.error(traceModule, method, ' exception caught: ', (exc as Error).message.toString());
      return observableThrowError(wsiError);
    }
  }

  public httpGetDefaultHeader(authToken?: string): HttpHeaders {
    let headers: HttpHeaders = new HttpHeaders();
    headers = headers.append('Accept', 'application/json ');
    if (authToken !== undefined) {
      headers = headers.append('Authorization', 'Bearer ' + authToken);
    }
    return headers;
  }

  public httpPostDefaultHeader(authToken?: string): HttpHeaders {
    let headers: HttpHeaders = this.httpGetDefaultHeader(authToken);
    headers = headers.append('Content-Type', 'application/json; charset=utf-8');
    return headers;
  }

  public httpPutDefaultHeader(authToken?: string): HttpHeaders {
    return this.httpPostDefaultHeader(authToken);
  }

  public httpDeleteDefaultHeader(authToken?: string): HttpHeaders {
    return this.httpGetDefaultHeader(authToken);
  }

  private traceReplyError(traceModule: string, method: string, message: string): void {
    this.traceService.error(traceModule, method, ' http reply error: ', message);
  }

  private wsiErrorMessage1(error: string, id: number, details: string, status: number, statusText: string): string {
    return `wsiError: ${error}; wsiErrorId: ${id}; wsiErrorDetails: ${details}; status: ${status}; statusText: ${statusText}`;
  }

  private wsiErrorMessage2(status: number, statusText: string): string {
    return `status: ${status}; statusText: ${statusText}`;
  }

  private handleErrorForStatus400(errorBody: HttpErrorResponse, traceModule: string, method: string,
    errorService?: ErrorNotificationServiceBase): Observable<any> {

    if (errorBody.status !== 400) {
      return observableThrowError(WsiUtilityService.createNewInvalidArgumentsError());
    }

    let wsiError: WsiError | undefined;
    if (errorBody.error.Id === 2400000) {
      // invalid grant
      this.translateService.get('GMS_SERVICES.INVALID_GRANT').subscribe(
        (value: string) =>
          (wsiError = new WsiErrorGrantFailed(errorBody.error.Details, errorBody.status, value))
      );
    } else if (errorBody.error.Id === 2400398) {
      // cmd execution failed
      wsiError = new WsiErrorCmdExecFailed(errorBody.error.Details, errorBody.status, errorBody.statusText);
    } else if (errorBody.error.Id === 2400798) {
      // evt cmd execution failed
      wsiError = new WsiErrorEvtCmdExecFailed(errorBody.error.Details, errorBody.status, errorBody.statusText);
    } else if (errorBody.error.Id === 2401701) {
      // Trend View Definition object ID name is
      this.translateService.get('GMS_SERVICES.TREND.ERROR_MESSAGES.INVALID_INPUT').subscribe(
        (value: string) =>
          (wsiError = new WsiErrorTrendFailed(errorBody.error.Details, errorBody.status, value))
      );
    } else if (errorBody.error.Id === 2401702) {
      // Trend View Definition already exists
      this.translateService.get('GMS_SERVICES.TREND.ERROR_MESSAGES.DUPLICATE_NODE').subscribe(
        (value: string) =>
          (wsiError = new WsiErrorTrendFailed(errorBody.error.Details, errorBody.status, value))
      );
    } else if (errorBody.error.Id === 240442) {
      // Log View Definition already exists
      this.translateService.get('GMS_SERVICES.LOG_VIEWER.ERROR_MESSAGES.DUPLICATE_NODE').subscribe(
        (value: string) =>
          (wsiError = new WsiErrorTrendFailed(errorBody.error.Details, errorBody.status, value))
      );
    } else if (errorBody.error.Id === 2401703) {
      // when user does not have 'create' and 'delete' scope rights
      this.translateService.get('GMS_SERVICES.TREND.ERROR_MESSAGES.CREAT_DELETE_NO_SCOPE').subscribe(
        (value: string) =>
          (wsiError = new WsiErrorTrendFailed(errorBody.error.Details, errorBody.status, value))
      );
    } else if (errorBody.error.Id === 2401704) {
      // when failed to save or delete trend for validated object
      this.translateService.get('GMS_SERVICES.TREND.ERROR_MESSAGES.VALIDATED_OBJECT_ERROR').subscribe(
        (value: string) =>
          (wsiError = new WsiErrorTrendFailed(errorBody.error.Details, errorBody.status, value))
      );
    } else if (errorBody.error.Id === 2401799) {
      // Generic Error - when failed to save, create or delete trend
      this.translateService.get('GMS_SERVICES.TREND.ERROR_MESSAGES.OPERATION_FAILED').subscribe(
        (value: string) =>
          (wsiError = new WsiErrorTrendFailed(errorBody.error.Details, errorBody.status, value))
      );
    } else if (errorBody.error.Id === 6501001) {
      // when failed to save or delete schedule for validated object
      this.translateService.get('GMS_SERVICES.SCHEDULE.ERROR_MESSAGES.INVALID_SCHEDULE').subscribe(
        (value: string) =>
          (wsiError = new WsiError(errorBody.error.Details, errorBody.status, value))
      );
    } else if (errorBody.error.Id === 6501006) {
      // when failed to save or delete schedule for validated object
      this.translateService.get('GMS_SERVICES.SCHEDULE.ERROR_MESSAGES.INVALID_CALENDAR').subscribe(
        (value: string) =>
          (wsiError = new WsiError(errorBody.error.Details, errorBody.status, value))
      );
    } else if (errorBody.error.Id === 6503005) {
      // when failed to save or delete schedule for validated object
      this.translateService.get('GMS_SERVICES.SCHEDULE.ERROR_MESSAGES.SCHEDULE_FAILURE').subscribe(
        (value: string) =>
          (wsiError = new WsiError(errorBody.error.Details, errorBody.status, value))
      );
    } else if (errorBody.error.Id === 6503001) {
      // when failed to save or delete schedule for validated object
      this.translateService.get('GMS_SERVICES.SCHEDULE.ERROR_MESSAGES.UNKNOWN_SCHEDULE').subscribe(
        (value: string) =>
          (wsiError = new WsiError(errorBody.error.Details, errorBody.status, value))
      );
    } else if (errorBody.error.Id === 6503009) {
      // when failed to save or delete schedule for validated object
      this.translateService.get('GMS_SERVICES.SCHEDULE.ERROR_MESSAGES.UNKNOWN_CALENDAR').subscribe(
        (value: string) =>
          (wsiError = new WsiError(errorBody.error.Details, errorBody.status, value))
      );
    } else if (errorBody.error.Id === 6503011) {
      // when failed to save or delete schedule for validated object
      this.translateService.get('GMS_SERVICES.SCHEDULE.ERROR_MESSAGES.CALENDAR_FAILURE').subscribe(
        (value: string) =>
          (wsiError = new WsiError(errorBody.error.Details, errorBody.status, value))
      );
    } else if (errorBody.error.Id === 6503013) {
      // when failed to save or delete schedule for validated object
      this.translateService.get('GMS_SERVICES.SCHEDULE.ERROR_MESSAGES.VALIDATED_OBJECT_ERROR').subscribe(
        (value: string) =>
          (wsiError = new WsiError(errorBody.error.Details, errorBody.status, value))
      );
    } else if (errorBody.error.Id === 6504005) {
      // when failed to save or delete schedule for validated object
      this.translateService.get('GMS_SERVICES.SCENE.ERROR_MESSAGES.SCENE_FAILURE').subscribe(
        (value: string) =>
          (wsiError = new WsiError(errorBody.error.Details, errorBody.status, value))
      );
    } else if (errorBody.error.Id === 6504001) {
      // when failed to save or delete schedule for validated object
      this.translateService.get('GMS_SERVICES.SCENE.ERROR_MESSAGES.UNKNOWN_SCENE').subscribe(
        (value: string) =>
          (wsiError = new WsiError(errorBody.error.Details, errorBody.status, value))
      );
    } else if (errorBody.error.Id === 6504001) {
      // when failed to save or delete schedule for validated object
      this.translateService.get('GMS_SERVICES.SCENE.ERROR_MESSAGES.UNKNOWN_SCENE').subscribe(
        (value: string) =>
          (wsiError = new WsiError(errorBody.error.Details, errorBody.status, value))
      );
    } else if (errorBody.error.Id === 6504011) {
      // when failed to save or delete schedule for validated object
      this.translateService.get('GMS_SERVICES.SCENE.ERROR_MESSAGES.VALIDATED_OBJECT_ERROR').subscribe(
        (value: string) =>
          (wsiError = new WsiError(errorBody.error.Details, errorBody.status, value))
      );
    } else {
      wsiError = new WsiError(errorBody.error.Details, errorBody.status, errorBody.statusText);
    }
    this.traceReplyError(
      traceModule, method, this.wsiErrorMessage1(errorBody.error.Error, errorBody.error.Id, errorBody.error.Details, errorBody.status, errorBody.statusText));
    return observableThrowError(wsiError);
  }

  private handleErrorForStatus401(errorBody: HttpErrorResponse, traceModule: string, method: string,
    errorService?: ErrorNotificationServiceBase, redirectonFailedAuth = true): Observable<any> {

    if (errorBody.status !== 401) {
      return observableThrowError(WsiUtilityService.createNewInvalidArgumentsError());
    }

    const wsiError = new WsiError('Authentication failed. The user token is invalid.', errorBody.status, errorBody.statusText);
    // do redirect in case redirectonFailedAuth == true
    if (redirectonFailedAuth === true) {
      let pathName: string = this.platformLocation.pathname;
      if ((this.platformLocation.pathname).toString().includes('main/page')) {
        pathName = this.platformLocation.pathname.substring(0, (this.platformLocation.pathname.indexOf('main/page/')));
      }
      const basUrl: string = (this.platformLocation as any)._location?.origin + pathName;
      this.cleanCookiesSessionStorage();

      window.open(basUrl, '_self', '');
    }
    this.traceReplyError(traceModule, method, this.wsiErrorMessage2(errorBody.status, errorBody.statusText));
    return observableThrowError(wsiError);
  }

  private handleErrorForStatus403(errorBody: HttpErrorResponse, traceModule: string, method: string,
    errorService?: ErrorNotificationServiceBase): Observable<any> {

    if (errorBody.status !== 403) {
      return observableThrowError(WsiUtilityService.createNewInvalidArgumentsError());
    }

    let wsiError: WsiError | undefined;
    if (errorBody.error.Id === 2400003) {
      // password_expired
      this.translateService.get('GMS_SERVICES.PASSWORD_EXPIRED').subscribe(
        (value: string) =>
          (wsiError = new WsiErrorPasswordExpired(errorBody.error.Details, errorBody.status, value))
      );
      this.traceReplyError(traceModule, method, this.wsiErrorMessage2(errorBody.status, errorBody.statusText));
    }
    if (errorBody.error.Id === 2400102) {
      // A needed license option is missing or expired
      this._licenseErrorItem.state = ErrorDisplayState.Active;
      if (errorService != undefined) {
        errorService.notifyErrorChange(this._licenseErrorItem);
      }
      this.translateService.get('GMS_SERVICES.LICENSE_OPTION_NOT_AVAILABLE').subscribe(
        (value: string) =>
          (wsiError = new WsiErrorLicenseInvalid(errorBody.error.Details, errorBody.status, value))
      );
      // this error is "reset" automatically!
      this._licenseErrorItem.state = ErrorDisplayState.Inactive;
      if (errorService != undefined) {
        errorService.notifyErrorChange(this._licenseErrorItem);
      }
    } else if (errorBody.error.Id === 2400100) {
      // A needed license is missing or expired
      this.translateService.get('GMS_SERVICES.LICENSE_NOT_AVAILABLE').subscribe(
        (value: string) =>
          (wsiError = new WsiErrorGrantFailed(errorBody.error.Details, errorBody.status, value))
      );
    } else if (errorBody.error.Id === 2400103) {
      this.translateService.get('GMS_SERVICES.PERMISSION_DENIED').subscribe(
        (value: string) =>
          (wsiError = new WsiErrorGrantFailed(errorBody.error.Details, errorBody.status, value))
      );
    } else if (errorBody.error.Id === 2400005) {
      this.translateService.get('GMS_SERVICES.EXCEEDED_BAD_ATTEMPTS').subscribe(
        (value: string) =>
          (wsiError = new WsiErrorGrantFailed(errorBody.error.Details, errorBody.status, value))
      );
    }
    return observableThrowError(wsiError);
  }

  private handleErrorForStatus404(errorBody: HttpErrorResponse, traceModule: string, method: string,
    errorService?: ErrorNotificationServiceBase): Observable<any> {
    // use for Log off error - not in case of GRaphics or Trends error
    if (errorBody.url?.includes('api/token')) {
      this.cleanCookiesSessionStorage();
    }
    if (errorBody.status !== 404) {
      return observableThrowError(WsiUtilityService.createNewInvalidArgumentsError());
    }

    let wsiError: WsiError | undefined;
    if (errorBody.error.Id === 2401700) {
      // CNS couldn't be resolved for DpId
      // DpId Not found, object could not be resolved
      this.translateService.get('GMS_SERVICES.TREND.ERROR_MESSAGES.INVALID_INPUT').subscribe(
        (value: string) =>
          (wsiError = new WsiErrorTrendFailed(errorBody.error.Details, errorBody.status, value))
      );
    } else {
      // WSI_Missing
      this.translateService.get('GMS_SERVICES.WSI_MISS').subscribe(
        (value: string) =>
          (wsiError = new WsiErrorGrantFailed(errorBody.error.Details, errorBody.status, value))
      );
      this.traceReplyError(traceModule, method, this.wsiErrorMessage2(errorBody.status, errorBody.statusText));
    }
    return observableThrowError(wsiError);
  }

  private handleErrorForStatus0And5XX(errorBody: HttpErrorResponse, traceModule: string, method: string,
    errorService?: ErrorNotificationServiceBase): Observable<any> {

    if ((errorBody.status !== 0) && (errorBody.status < 500)) {
      return observableThrowError(WsiUtilityService.createNewInvalidArgumentsError());
    }

    let wsiError: WsiError | undefined;
    this.translateService.get('GMS_SERVICES.CONNECTION_MISS').subscribe((value: string) => {
      wsiError = new WsiErrorConnectionFailed(errorBody.error.Details, errorBody.status, value);
    });
    this.traceReplyError(traceModule, method, this.wsiErrorMessage2(errorBody.status, errorBody.statusText));
    return observableThrowError(wsiError);
  }

  private cleanCookiesSessionStorage(): void {

    this.pathName = this.cookieService.get(SessionCookieStorage.PathName) === '' ? '/' : this.cookieService.get(SessionCookieStorage.PathName);
    this.domainName = this.cookieService.get(SessionCookieStorage.DomainName);

    // remove no more valid user token for the session.
    if (this.cookieService.check(UserInfoStorage.UserTokenKey)) {
      this.cookieService.delete(UserInfoStorage.UserTokenKey, this.pathName, this.domainName);
    }
    if (this.cookieService.check(UserInfoStorage.UserNameKey)) {
      this.cookieService.delete(UserInfoStorage.UserNameKey, this.pathName, this.domainName);
    }
    if (this.cookieService.check(UserInfoStorage.UserProfileKey)) {
      this.cookieService.delete(UserInfoStorage.UserProfileKey, this.pathName, this.domainName);
    }
    if (this.cookieService.check(UserInfoStorage.UserDescriptorKey)) {
      this.cookieService.delete(UserInfoStorage.UserDescriptorKey, this.pathName, this.domainName);
    }
    if (this.cookieService.check(UserInfoStorage.UserInactivityKey)) {
      this.cookieService.delete(UserInfoStorage.UserInactivityKey, this.pathName, this.domainName);
    }
    sessionStorage.removeItem(SessionCookieStorage.TabLogged);

    sessionStorage.removeItem(SessionCookieStorage.Mute);
    if (this.cookieService.check(SessionCookieStorage.Mute)) {
      this.cookieService.delete(SessionCookieStorage.Mute, this.pathName, this.domainName);
    }

    sessionStorage.removeItem(SessionCookieStorage.ActiveState);
    sessionStorage.removeItem(SessionCookieStorage.ShowModal);
    sessionStorage.removeItem(SessionCookieStorage.RefreshTab);
    if (this.cookieService.check(SessionCookieStorage.TabCounter)) {
      this.cookieService.delete(SessionCookieStorage.TabCounter, this.pathName, this.domainName);
    }
    if (this.cookieService.check(SessionCookieStorage.TabCounterActive)) {
      this.cookieService.delete(SessionCookieStorage.TabCounterActive, this.pathName, this.domainName);
    }
    if (this.cookieService.check(SessionCookieStorage.ShowModal)) {
      this.cookieService.delete(SessionCookieStorage.ShowModal, this.pathName, this.domainName);
    }
    if (this.cookieService.check(SessionCookieStorage.SkipDefaultUserAutoLogin)) {
      this.cookieService.delete(SessionCookieStorage.SkipDefaultUserAutoLogin, this.pathName, this.domainName);
    }
    if (this.cookieService.check(SessionCookieStorage.PathName)) {
      this.cookieService.delete(SessionCookieStorage.PathName, this.pathName, this.domainName);
    }
    if (this.cookieService.check(SessionCookieStorage.DomainName)) {
      this.cookieService.delete(SessionCookieStorage.DomainName, this.pathName, this.domainName);
    }

    sessionStorage.removeItem(UserInfoStorage.ClientIdKey);
    sessionStorage.removeItem(UserInfoStorage.OpenIdLoginUriKey);
    sessionStorage.removeItem(UserInfoStorage.OpenIdRedirectUrlKey);
    sessionStorage.removeItem(UserInfoStorage.UserNameKey);
  }

}
