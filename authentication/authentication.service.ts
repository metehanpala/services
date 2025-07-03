import { PlatformLocation } from '@angular/common';
import { HttpClient, HttpHeaders, HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthenticationServiceBase, Credentials, isNullOrUndefined, SessionCookieStorage,
  TraceService, UserAccountType, UserInfo, UserInfoStorage } from '@gms-flex/services-common';
import { CookieService } from 'ngx-cookie-service';
import { BehaviorSubject, interval, Observable, throwError as observableThrowError, Subject, Subscription } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { TraceModules } from '../shared/trace-modules';
import { WsiUtilityService } from '../shared/wsi-utility.service';
import { WsiEndpointService } from '../wsi-endpoint/wsi-endpoint.service';

const getUserInfo = '/api/users/logininfo/';
const apiTokenUrl = '/api/token';
const loginPage = '/loginpage';
const authString = 'known in the session. User token will be reused.';

/**
 * Service for managing user authentication and session maintenance.
 */
@Injectable({
  providedIn: 'root'
})
export class AuthenticationService implements AuthenticationServiceBase {

  private static readonly maxRenewTimeout: number = 60; // 30s
  /**
   * Stores the current user token, undefined if no user is logged.
   */
  private _userToken: string | undefined | null;
  private _userName: string | undefined | null;
  private _userDescriptor: string | undefined | null;
  private _userProfile: string | undefined | null;
  private _personallyUsed: string | undefined | null;
  private _clientId: string | undefined;
  private _openIdLoginUri: string | undefined;
  private _openIdLogoutUri: string | undefined;
  private _openIdRedirectUri: string | undefined;
  private _userInactivity: string | undefined | null;
  private _isDefaultUserLoggedIn = false;

  // eslint-disable-next-line @typescript-eslint/prefer-readonly
  private loginSubject: Subject<boolean> = new Subject<boolean>();
  // eslint-disable-next-line @typescript-eslint/member-ordering
  public loginObservable: Observable<boolean> = this.loginSubject.asObservable();

  private heartBeatTimer: any = undefined;

  private pathName: string | undefined;
  private domainName: string | undefined;
  private readonly sub: Subscription;

  private readonly _userTokenEvent: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);
  private readonly _userNameEvent: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);
  private readonly _userDescriptorEvent: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);
  private readonly _userProfileEvent: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);
  private readonly _restoreAuthentication: BehaviorSubject<boolean | null> = new BehaviorSubject<boolean | null>(null);
  private readonly _userInactivityEvent: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);

  public constructor(
    protected httpClient: HttpClient,
    protected traceService: TraceService,
    protected wsiEndpointService: WsiEndpointService,
    private readonly wsiUtilityService: WsiUtilityService,
    private readonly cookieService: CookieService,
    private readonly platformLocation: PlatformLocation) {
    this.traceService.info(TraceModules.authentication, 'Authentication service created.');

    const source = interval(1000);
    this.sub = source.subscribe(value => this.reloadLandingPage(value));

    if (this.getStoredUserToken()) {
      this.traceService.info(TraceModules.authentication, 'User \'' + this._userName + '\'' + authString);
      this.startHeartBeat();
      this.notifyNewUserLoggedIn();
    } else {
      this.traceService.info(TraceModules.authentication, 'No user token available in session storage, login page will be displayed...');
    }
  }

  /**
   * Gets the current user token observable
   *
   * @readonly
   * @type {Observable<string>}
   * @memberOf AuthenticationService
   */
  public get userTokenEvent(): Observable<string> | any {
    return this._userTokenEvent.asObservable();
  }

  /**
   * Gets the current authentication kind (via form or via saved token)
   *
   * @readonly
   * @type {Observable<string>}
   * @memberOf AuthenticationService
   */
  public get restoreAuthentication(): Observable<boolean> | any {
    return this._restoreAuthentication.asObservable();
  }

  /**
   * Gets the current user token.
   *
   * @readonly
   * @type {string}
   * @memberOf AuthenticationService
   */
  public get userToken(): string | any {
    return this._userToken;
  }

  /**
   * Gets the current user descriptor observable
   *
   * @readonly
   * @type {Observable<string>}
   * @memberOf AuthenticationService
   */
  public get userDescriptorEvent(): Observable<string> | any {
    return this._userDescriptorEvent.asObservable();
  }

  /**
   * Gets the current user profile observable
   *
   * @readonly
   * @type {Observable<string>}
   * @memberOf AuthenticationService
   */
  public get userProfileEvent(): Observable<string> | any {
    return this._userProfileEvent.asObservable();
  }

  /**
   * Gets the current user descriptor.
   *
   * @readonly
   * @type {string}
   * @memberOf AuthenticationService
   */
  public get userDescriptor(): string | any {
    return this._userDescriptor;
  }

  /**
   * Gets the current user profile.
   *
   * @readonly
   * @type {string}
   * @memberOf AuthenticationService
   */
  public get userProfile(): string | any {
    if (this._userProfile !== '') {
      return this._userProfile;
    } else {
      return 'DEFAULT';
    }
  }

  /**
   * Gets the current user name observable
   *
   * @readonly
   * @type {Observable<string>}
   * @memberOf AuthenticationService
   */
  public get userNameEvent(): Observable<string> | any {
    return this._userNameEvent.asObservable();
  }

  /**
   * Gets the current user name.
   *
   * @readonly
   * @type {string}
   * @memberOf AuthenticationService
   */
  public get userName(): string | any {
    return this._userName;
  }

  /**
   * Gets the current user inactivity observable
   *
   * @readonly
   * @type {Observable<string>}
   * @memberOf AuthenticationService
   */
  public get userInactivityEvent(): Observable<string> | any {
    return this._userInactivityEvent.asObservable();
  }

  /**
   * Gets the current user inactivity.
   *
   * @readonly
   * @type {string}
   * @memberOf AuthenticationService
   */
  public get userInactivity(): string | any {
    return this._userInactivity;
  }

  /**
   * Login the user with its password. If valid, a token is returned.
   *
   * @param {Credentials } credentials
   * @returns {Observable<string>}
   *
   * @memberOf AuthenticationService
   */
  public login(credentials: Credentials): Observable<string> | any {

    if (this.getStoredUserToken()) {
      this.traceService.info(TraceModules.authentication, 'User \'' + this._userName + '\'' + authString);
      this.startHeartBeat();
      this.notifyNewUserLoggedIn();
      return this.sendHeartbeat();
    } else {
      this.traceService.info(TraceModules.authentication, 'No user token available in cookie, a new attempt of login will be done');

      this.traceService.info(TraceModules.authentication, 'login() called: login for user: %s', credentials.username);
      const usernameDoubleEncoded: string = encodeURIComponent(credentials.username);
      const passwordDoubleEncoded: string = encodeURIComponent(credentials.password);
      const creds: string = 'grant_type=password&username=' + usernameDoubleEncoded + '&password=' + passwordDoubleEncoded + '&client_id=LicensedClient';

      const headers: HttpHeaders = this.httpHeadersFormUrlencoded();
      const url: string = this.wsiEndpointService.entryPoint + apiTokenUrl;

      return this.httpClient.post(url, creds, { headers, observe: 'response' }).pipe(
        map((response: HttpResponse<any>) => this.onLogin(response, false)),
        catchError((response: HttpResponse<any>) => this.wsiUtilityService.handleError(response, TraceModules.authentication, 'login()')));
    }
  }

  public loginDefaultUser(): Observable<string> | any {
    if (this.getStoredUserToken()) {
      this.traceService.info(TraceModules.authentication, 'User \'' + this._userName + '\'' + authString);
      this.startHeartBeat();
      this.notifyNewUserLoggedIn();
      return this.sendHeartbeat();
    } else {
      this.traceService.info(TraceModules.authentication, 'Trying login default user.');

      const creds = 'grant_type=client_credentials&Client_Id=LicensedClient&token_endpoint_auth_method=tls_client_auth';

      const headers: HttpHeaders = this.httpHeadersFormUrlencoded();
      const url: string = this.wsiEndpointService.entryPoint + apiTokenUrl;

      return this.httpClient.post(url, creds, { headers, observe: 'response' }).pipe(
        map((response: HttpResponse<any>) => this.onLogin(response, true)),
        catchError((response: HttpResponse<any>) => this.wsiUtilityService.handleError(response, TraceModules.authentication, 'login()')));
    }
  }

  /**
   * Login the user with its password. If valid, a token is returned.
   *
   * @param {Credentials } credentials
   * @returns {Observable<string>}
   * @memberOf AuthenticationService
   */
  public getUserInfo(username: string): Observable<UserInfo> {

    this.traceService.info(TraceModules.authentication, 'getOpenIdConfiguration() called:');
    const userNameDoubleEncoded: string = encodeURIComponent(encodeURIComponent(username));

    const headers: HttpHeaders = this.httpHeadersFormUrlencoded();
    const openIdRedirectUrl = window.location.toString();
    const url: string = this.wsiEndpointService.entryPoint + getUserInfo + userNameDoubleEncoded + "?redirectUri=" + openIdRedirectUrl;

    return this.httpClient.get<UserInfo>(url, { headers, observe: 'response' }).pipe(
      map((response: HttpResponse<UserInfo>) => this.onGetUserInfo(response)),
      catchError((response: HttpResponse<any>) => this.wsiUtilityService.handleError(response, TraceModules.authentication, 'login()')));
  }

  /**
   * Login the user with its password. If valid a token is returned.
   *
   * @abstract
   * @param {code:string}
   * @returns {Observable<string>}
   * @memberOf AuthenticationServiceBase
   */
  /* eslint-disable-next-line @typescript-eslint/naming-convention */
  public LoginUsingAuthorizationCode(code: string): Observable<string> | any {

    if (this.getStoredUserToken()) {
      this.traceService.info(TraceModules.authentication, 'User \'' + this._userName + '\'' + authString);
      this.startHeartBeat();
      this.notifyNewUserLoggedIn();
      return this.sendHeartbeat();
    } else {
      this.traceService.info(TraceModules.authentication, 'No user token available in cookie, a new attempt of login will be done');

      const clientId: string | null = sessionStorage.getItem(UserInfoStorage.ClientIdKey);
      const openIdRedirectUrl: string | null = sessionStorage.getItem(UserInfoStorage.OpenIdRedirectUrlKey);
      const userName: string | null = sessionStorage.getItem(UserInfoStorage.UserNameKey);

      const creds: string = 'grant_type=authorization_code&client_id=' + clientId + '&client_type=LicensedClient'
      + '&login_hint=' + userName +
        '&redirect_uri=' + openIdRedirectUrl + code;

      const headers: HttpHeaders = this.httpHeadersFormUrlencoded();
      const url: string = this.wsiEndpointService.entryPoint + apiTokenUrl;

      return this.httpClient.post(url, creds, { headers, observe: 'response' }).pipe(
        map((response: HttpResponse<WsiToken> | any) => this.onOpenIdLogin(response)),
        catchError((response: HttpResponse<any>) => this.wsiUtilityService.handleError(response, TraceModules.authentication, 'login()')));
    }
  }

  /**
   * Log out the current user.
   *
   * @returns {Observable<HttpResponse>}
   *
   * @memberOf AuthenticationService
   */
  public logout(isInactivityLogout: boolean): Observable<boolean> {

    this.traceService.info(TraceModules.authentication, 'logout() called: logging out session');

    const headers: HttpHeaders = this.wsiUtilityService.httpPostDefaultHeader(this._userToken!);
    const url: string = this.wsiEndpointService.entryPoint + apiTokenUrl;

    let params: HttpParams = new HttpParams();
    if (!isNullOrUndefined(isInactivityLogout)) {
      params = params.set('isInactivityLogout', isInactivityLogout);
    }
    return this.httpClient.delete(url, { headers, params, observe: 'response' }).pipe(
      map((response: HttpResponse<any>) => this.onLogout(response)),
      catchError((response: HttpResponse<any>) => this.wsiUtilityService.handleError(response, TraceModules.authentication, 'logout()')));
  }

  public setDefaultUserLoggedIn(isDefault: boolean): void {
    this._isDefaultUserLoggedIn = isDefault;
  }

  public get defaultUserLoggedIn(): boolean {
    return this._isDefaultUserLoggedIn;
  }

  private httpHeadersFormUrlencoded(): HttpHeaders {
    const headers: HttpHeaders = new HttpHeaders();
    headers.append('Accept', 'application/json ');
    headers.append('Content-Type', 'application/x-www-form-urlencoded');
    return headers;
  }

  private onLogin(res: HttpResponse<any>, isDefaultUser: boolean): string | undefined {

    const body: any = res.body;
    this._userToken = body.access_token;
    this._userName = body.user_name;
    this._userDescriptor = body.user_descriptor;
    this._userProfile = body.flex_user_profile;
    this._userInactivity = body.user_inactivity_timeout;
    this._personallyUsed = body.personally_used;
    this._isDefaultUserLoggedIn = isDefaultUser;

    this.startHeartBeat();
    this.notifyNewUserLoggedIn();
    this.storeUserToken();

    this.cookieService.set('password_reminder_counter', body.password_reminder_counter);
    this.cookieService.set('personally_used', body.personally_used);

    return body.access_token;
  }

  private onOpenIdLogin(res: HttpResponse<WsiToken>): string {

    const body: WsiToken | null = res.body;
    this._userToken = body?.access_token;
    this._userName = body?.user_name;
    this._userDescriptor = body?.user_descriptor;
    this._userProfile = body?.flex_user_profile;
    this._userInactivity = body?.user_inactivity_timeout;
    this._personallyUsed = body?.personally_used;
    this._openIdLogoutUri = body?.logout_uri != null ? body.logout_uri : '';

    this.startHeartBeat();
    this.notifyNewUserLoggedIn();
    this.storeUserToken();
    this.cookieService.set(UserInfoStorage.OpenIdLogoutUriKey, this._openIdLogoutUri, { 'path': this.pathName, 'domain': this.domainName });

    this.traceService.info(TraceModules.authentication, 'OpenId login successful!!');

    if (this._personallyUsed !== undefined) {
      this.cookieService.set('personally_used', this._personallyUsed);
    }

    return body!.access_token!;
  }

  private onGetUserInfo(res: HttpResponse<any>): UserInfo {

    const body: UserInfo = res.body;
    this.traceService.info(TraceModules.authentication, 'onGetOpenIdConfiguration successful!');
    if (body.AccountType !== UserAccountType.OpenID) {
      this.traceService.debug(TraceModules.authentication, 'Entered UserName is not of type OpenID. AccountType=' + body.AccountType);
    } else {
      const httpParams: HttpParams = new HttpParams({ fromString: body.OpenIdLoginUri.split('?')[1] });
      const paramValue: string | null = httpParams.get('client_id');
      this._clientId = paramValue?.split('&')[0];

      this._openIdLoginUri = body.OpenIdLoginUri;
      this._userName = body.UserName;
      this._openIdRedirectUri = window.location.toString();
      this.storeOpenIdConfigData();
    }
    return body;
  }

  private onLogout(res: HttpResponse<any>): boolean {
    if (res.status < 200 || res.status >= 300) {
      throw new Error('Bad response status: ' + res.status);
    } else {
      this.traceService.info(TraceModules.authentication, 'Logout successful!');
    }

    this.stoptHeartBeat();

    this._userToken = null;
    this._userDescriptor = null;
    this._userName = null;
    this._userProfile = null;
    this._userInactivity = null;
    this._personallyUsed = null;
    this.cleanStoredUserToken();
    this.cleanMuteData();
    this.cleanActiveSessionData();

    this.loginSubject.next(false);

    return true;
  }

  private onChangePassword(res: HttpResponse<any>): boolean {
    this.traceService.info(TraceModules.authentication, 'onChangePassword(): Password change successful');
    return true;
  }

  private getStoredUserToken(): boolean {
    let savedToken = '';
    let savedUserName = '';
    let savedUserProfile = '';
    let savedDescriptor = '';
    let savedUserInactivity = '';
    let savedIsDefaultUser = '';
    if (this.cookieService.check(UserInfoStorage.UserTokenKey)) {
      savedToken = this.cookieService.get(UserInfoStorage.UserTokenKey);
    }
    if (this.cookieService.check(UserInfoStorage.UserNameKey)) {
      savedUserName = this.cookieService.get(UserInfoStorage.UserNameKey);
    }
    if (this.cookieService.check(UserInfoStorage.UserProfileKey)) {
      savedUserProfile = this.cookieService.get(UserInfoStorage.UserProfileKey);
    }
    if (this.cookieService.check(UserInfoStorage.UserInactivityKey)) {
      savedUserInactivity = this.cookieService.get(UserInfoStorage.UserInactivityKey);
    }
    if (this.cookieService.check(UserInfoStorage.UserDescriptorKey)) {
      savedDescriptor = this.cookieService.get(UserInfoStorage.UserDescriptorKey);
    }
    if (this.cookieService.check(UserInfoStorage.UserIsDefaultUserKey)) {
      savedIsDefaultUser = this.cookieService.get(UserInfoStorage.UserIsDefaultUserKey);
    }
    if (!isNullOrUndefined(savedToken) &&
      !isNullOrUndefined(savedUserName) &&
      !isNullOrUndefined(savedUserProfile) &&
      !isNullOrUndefined(savedUserInactivity) &&
      !isNullOrUndefined(savedDescriptor) &&
      !isNullOrUndefined(savedIsDefaultUser) &&
      savedToken != '' &&
      savedUserName != '' &&
      savedUserProfile != '' &&
      savedIsDefaultUser != '') {
      this._userToken = savedToken;
      this._userName = savedUserName;
      this._userProfile = savedUserProfile;
      this._userDescriptor = savedDescriptor;
      this._userInactivity = savedUserInactivity;
      this._isDefaultUserLoggedIn = JSON.parse(savedIsDefaultUser);
      return true;
    } else {
      return false;
    }
  }

  private storeUserToken(): void {
    this.sub.unsubscribe();
    sessionStorage.setItem(SessionCookieStorage.TabLogged, SessionCookieStorage.False);
    this.pathName = this.platformLocation.pathname.substring(0, (this.platformLocation.pathname.indexOf(loginPage))) === '' ?
      '/' :
      this.platformLocation.pathname.substring(0, (this.platformLocation.pathname.indexOf(loginPage)));
    this.domainName = (this.platformLocation as any)._location?.hostname;
    this.cookieService.set(SessionCookieStorage.PathName, this.pathName, { 'path': this.pathName, 'domain': this.domainName });
    this.cookieService.set(SessionCookieStorage.DomainName, this.domainName!, { 'path': this.pathName, 'domain': this.domainName });
    this.cookieService.set(UserInfoStorage.UserTokenKey, this.userToken, { 'path': this.pathName, 'domain': this.domainName });
    this.cookieService.set(UserInfoStorage.UserNameKey, this.userName, { 'path': this.pathName, 'domain': this.domainName });
    this.cookieService.set(UserInfoStorage.UserProfileKey, this.userProfile, { 'path': this.pathName, 'domain': this.domainName });
    this.cookieService.set(UserInfoStorage.UserDescriptorKey, this.userDescriptor, { 'path': this.pathName, 'domain': this.domainName });
    this.cookieService.set(UserInfoStorage.UserInactivityKey, this.userInactivity, { 'path': this.pathName, 'domain': this.domainName });
    this.cookieService.set(UserInfoStorage.UserIsDefaultUserKey,
      JSON.stringify(this._isDefaultUserLoggedIn), { 'path': this.pathName, 'domain': this.domainName });
    sessionStorage.setItem(SessionCookieStorage.TabLogged, SessionCookieStorage.True);
  }

  private cleanStoredUserToken(): void {
    this.pathName = this.platformLocation.pathname.substring(0, (this.platformLocation.pathname.indexOf('/main/page'))) === '' ?
      '/' :
      this.platformLocation.pathname.substring(0, (this.platformLocation.pathname.indexOf('/main/page')));
    this.domainName = (this.platformLocation as any)._location?.hostname;

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
    if (this.cookieService.check(UserInfoStorage.UserIsDefaultUserKey)) {
      this.cookieService.delete(UserInfoStorage.UserIsDefaultUserKey, this.pathName, this.domainName);
    }
    sessionStorage.removeItem(SessionCookieStorage.TabLogged);
  }

  private storeOpenIdConfigData(): void {
    sessionStorage.setItem(UserInfoStorage.ClientIdKey, this._clientId!);
    sessionStorage.setItem(UserInfoStorage.OpenIdLoginUriKey, this._openIdLoginUri!);
    sessionStorage.setItem(UserInfoStorage.OpenIdRedirectUrlKey, this._openIdRedirectUri!);
    sessionStorage.setItem(UserInfoStorage.UserNameKey, this._userName!);
  }

  private cleanOpenIdConfigData(): void {
    sessionStorage.removeItem(UserInfoStorage.ClientIdKey);
    sessionStorage.removeItem(UserInfoStorage.OpenIdLoginUriKey);
    sessionStorage.removeItem(UserInfoStorage.OpenIdRedirectUrlKey);
    sessionStorage.removeItem(UserInfoStorage.UserNameKey);

  }

  private cleanActiveSessionData(): void {
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
    if (this.cookieService.check(SessionCookieStorage.PathName)) {
      this.cookieService.delete(SessionCookieStorage.PathName, this.pathName, this.domainName);
    }
    if (this.cookieService.check(SessionCookieStorage.DomainName)) {
      this.cookieService.delete(SessionCookieStorage.DomainName, this.pathName, this.domainName);
    }
  }

  private cleanMuteData(): void {
    sessionStorage.removeItem(SessionCookieStorage.Mute);
    if (this.cookieService.check(SessionCookieStorage.Mute)) {
      this.cookieService.delete(SessionCookieStorage.Mute, this.pathName, this.domainName);
    }
  }

  private notifyNewUserLoggedIn(): void {
    this._userTokenEvent.next(this.userToken);
    this._userInactivityEvent.next(this.userInactivity);
    this._userNameEvent.next(this.userName);
    this._userProfileEvent.next(this.userProfile);
    this._userDescriptorEvent.next(this.userDescriptor);
    if (this._userToken !== this.cookieService.get(UserInfoStorage.UserTokenKey)) {
      this._restoreAuthentication.next(false);
    } else {
      this._restoreAuthentication.next(true);
      this.sub.unsubscribe();
      sessionStorage.setItem(SessionCookieStorage.TabLogged, SessionCookieStorage.False);
    }
    this.loginSubject.next(true);
  }

  private startHeartBeat(): void {
    let timeout: number;
    if (this.wsiEndpointService.renewTimeOut != null) {
      timeout = this.wsiEndpointService.renewTimeOut;
      if (timeout > AuthenticationService.maxRenewTimeout) {
        timeout = AuthenticationService.maxRenewTimeout;
      }
    } else {
      timeout = AuthenticationService.maxRenewTimeout;
    }

    this.traceService.info(TraceModules.authentication, 'Starting the renew timer (renewing session) every ' + timeout + ' seconds.');
    if (this.heartBeatTimer == undefined) {
      this.heartBeatTimer = setInterval(() => this.sendHeartbeat().subscribe(), timeout * 1000);
    }
  }

  private stoptHeartBeat(): void {
    if (this.heartBeatTimer != null) {
      clearInterval(this.heartBeatTimer);
    }
  }

  /**
   * Send the heartbeat to maintain the session alive.
   */
  private sendHeartbeat(): Observable<string> | any {

    if (this._userToken == undefined) {
      this.traceService.warn(TraceModules.authentication, 'Heartbeat cannot be issued, token not available.');
      return observableThrowError(WsiUtilityService.createNewInvalidArgumentsError());
    }

    const headers: HttpHeaders = this.wsiUtilityService.httpPostDefaultHeader(this._userToken);
    const url: string = this.wsiEndpointService.entryPoint + '/api/heartbeat';

    return this.httpClient.post(url, '', { headers }).pipe(
      map((response: HttpResponse<any> | any) => this.onSendHeartbeat()),
      catchError((response: HttpResponse<any>) => this.wsiUtilityService.handleError(response, TraceModules.authentication, 'sendHeartbeat()')));
  }

  private onSendHeartbeat(): string {
    this.traceService.info(TraceModules.authentication, 'onSendHeartbeat(): Renew token successful!');
    return 'successful';
  }

  private reloadLandingPage(value: number): void {

    if (this.cookieService.check(UserInfoStorage.UserTokenKey) &&
    sessionStorage.getItem(SessionCookieStorage.TabLogged) !== SessionCookieStorage.True) {
      sessionStorage.setItem(SessionCookieStorage.TabLogged, SessionCookieStorage.True);
      const pathName: string = this.platformLocation.pathname.substring(0, (this.platformLocation.pathname.indexOf(loginPage))) === '' ?
        '/' :
        this.platformLocation.pathname.substring(0, (this.platformLocation.pathname.indexOf(loginPage)));
      const basUrl: string = (this.platformLocation as any)._location?.origin + pathName;
      window.open(basUrl, '_self', '');
    }
  }
}

/* eslint-disable @typescript-eslint/naming-convention */

interface WsiToken {
  access_token: string;
  expires_in: number;
  token_type: string;
  user_name: string;
  user_descriptor: string;
  user_profile: string;
  flex_user_profile: string;
  user_inactivity_timeout: string;
  personally_used: string;
  logout_uri: string;
}

/* eslint-enable @typescript-eslint/naming-convention */
