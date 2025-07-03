import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthenticationServiceBase, ChangePasswordModel, ErrorNotificationServiceBase,
  PasswordPolicyModel,
  TraceService, UserAccountType, UserInfo, UsersServiceBase } from '@gms-flex/services-common';
import { Observable, throwError as observableThrowError } from 'rxjs';
import { catchError, map, takeUntil } from 'rxjs/operators';

import { TraceModules } from '../shared/trace-modules';
import { WsiUtilityService } from '../shared/wsi-utility.service';
import { WsiEndpointService } from '../wsi-endpoint/wsi-endpoint.service';

const usersPasswordServiceUrl = '/api/users/password';
const getLoginInfoUrl = '/api/users/logininfo/';
const getPasswordPolicyUrl = '/api/users/password/policy';

/**
 * GMS WSI Users implementation.
 * @extends UsersServiceBase
 */
@Injectable({
  providedIn: 'root'
})
export class UsersService extends UsersServiceBase {
  /**
   * Constructor
   * @param {TraceService } traceService The trace service
   * @param {HttpClient } httpClient The Angular 2 http service
   * @param {WsiEndpointService } wsiEndpoint The WSI endpoint service.
   * @param {AuthenticationBase } authenticationBase The WSI authentication service
   * @param {WsiUtilityService}
   * @param {ErrorNotificationServiceBase}
   */
  public constructor(private readonly traceService: TraceService,
    private readonly httpClient: HttpClient,
    private readonly wsiEndpoint: WsiEndpointService,
    private readonly authenticationServiceBase: AuthenticationServiceBase,
    private readonly wsiUtilityService: WsiUtilityService,
    private readonly errorService: ErrorNotificationServiceBase) {
    super();

    this.traceService.info(TraceModules.users, 'Users service created');
  }

  /**
   * Changes a user password.
   * See WSI API specification for details.
   *
   * @param { ChangePasswordModel } changePasswordModel
   * @returns {Observable<void>}
   *
   * @memberOf UsersService
   */
  public changePassword(changePasswordModel: ChangePasswordModel): Observable<void> {
    if ((changePasswordModel === undefined) ||
            (changePasswordModel.username === undefined) || (changePasswordModel.username === null) || (changePasswordModel.username.length === 0) ||
            (changePasswordModel.currentPassword === undefined) || (changePasswordModel.currentPassword === null) ||
            (changePasswordModel.currentPassword.length === 0) ||
            (changePasswordModel.newPassword === undefined) || (changePasswordModel.newPassword === null) || (changePasswordModel.newPassword.length === 0)) {
      return observableThrowError(WsiUtilityService.createNewInvalidArgumentsError());
    }

    this.traceService.debug(TraceModules.users, 'changePassword() called');

    const headers: HttpHeaders = this.wsiUtilityService.httpPostDefaultHeader(this.authenticationServiceBase.userToken);
    const url: string = this.wsiEndpoint.entryPoint + usersPasswordServiceUrl;
    const body: any = JSON.stringify(changePasswordModel);

    return this.httpClient.put(url, body, { headers }).pipe(
      map((response: HttpResponse<any> | any) => this.onChangePassword()),
      catchError((response: HttpResponse<any>) =>
        this.wsiUtilityService.handleError(response, TraceModules.users, 'changePassword()', this.errorService)));
  }

  /**
   * Retrieve the user account login information.
   */
  public getLoginInfo(userName: string): Observable<UserInfo> {
    if ((userName === undefined) || (userName === null) || (userName.length === 0)) {
      this.traceService.info(TraceModules.users, 'getLoginInfo() invalid parameter');
      return observableThrowError(WsiUtilityService.createNewInvalidArgumentsError());
    }

    this.traceService.debug(TraceModules.users, 'getLoginInfo() for username %s', userName);

    const headers: HttpHeaders = this.wsiUtilityService.httpGetDefaultHeader(this.authenticationServiceBase.userToken);
    const url: string = this.wsiEndpoint.entryPoint + getLoginInfoUrl + userName;

    return this.httpClient.get(url, { headers, observe: 'response' }).pipe(
      map((response: HttpResponse<any>) =>
        this.wsiUtilityService.extractData(response, TraceModules.objects, 'getLoginInfo()')),
      catchError((response: HttpResponse<any>) =>
        this.wsiUtilityService.handleError(response, TraceModules.objects, 'getLoginInfo()', this.errorService)));
  }

  /**
   * Retrieve the user account login information.
   */
  public getPasswordPolicy(): Observable<PasswordPolicyModel> {

    const headers: HttpHeaders = this.wsiUtilityService.httpGetDefaultHeader(this.authenticationServiceBase.userToken);
    const url: string = this.wsiEndpoint.entryPoint + getPasswordPolicyUrl;

    return this.httpClient.get(url, { headers, observe: 'response' }).pipe(
      map((response: HttpResponse<any>) =>
        this.wsiUtilityService.extractData(response, TraceModules.objects, 'getPasswordPolicy()')),
      catchError((response: HttpResponse<any>) =>
        this.wsiUtilityService.handleError(response, TraceModules.objects, 'getPasswordPolicy()', this.errorService)));
  }

  /**
   * Returns if the account password can be changed.
   */
  public allowPasswordChange(userName: string): Observable<boolean> {
    return this.getLoginInfo(userName).pipe(
      map((resp: UserInfo) => {
        const allowed: boolean = resp.AccountType === UserAccountType.DesigoCC;
        this.traceService.debug(TraceModules.users, 'allowPasswordChange for username %s is %s', resp.UserName, allowed);
        return allowed;
      }
      ));
  }

  private onChangePassword(): void {
    this.traceService.info(TraceModules.users, 'onChangePassword(): Password change successful');
  }

}
