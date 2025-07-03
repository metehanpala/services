import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  AuthenticationServiceBase,
  ErrorNotificationServiceBase,
  isNullOrUndefined,
  TraceModules,
  TraceService,
  UserAccountType,
  UserInfo
} from '@gms-flex/services-common';
import { first, forkJoin, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { WsiUtilityService } from '../shared/wsi-utility.service';
import { WsiEndpointService } from '../wsi-endpoint/wsi-endpoint.service';
import { BrowserObject } from "../wsi-proxy-api";
import { CommentRule } from "./comment.rule";
import { ReAuthentication } from "./re-authentication";
import { ValidateOpInfo } from "./validate-op.info";
import { ValidateOpResponse } from "./validate-op.response";
import { ValidationCommandOpRepresentation } from "./validation-command-op.representation";
import { ValidationCredentialRepresentation } from "./validation-credential.representation";
import { ValidationEditOpRepresentation } from "./validation-edit-op.representation";

@Injectable({
  providedIn: 'root'
})
export class ValidationHelperService {
  private readonly getCommandValidationOperationUrl = '/api/validation/getCommandValidationOperation';
  private readonly getEditValidationOperationUrl = '/api/validation/getEditValidationOperation';
  private readonly validateCredentialUrl = '/api/validation/validateCredential';

  public constructor(
    public readonly traceService: TraceService,
    public readonly httpClient: HttpClient,
    private readonly authenticationServiceBase: AuthenticationServiceBase,
    private readonly wsiEndpointService: WsiEndpointService,
    private readonly errorService: ErrorNotificationServiceBase,
    private readonly wsiUtilityService: WsiUtilityService
  ) {
    this.traceService.info(TraceModules.utilities, 'Validation Helper Service created.');
  }

  public handleResponse(response: HttpResponse<any>): any {
    if (response.ok) {
      return response.body;
    } else {
      return undefined;
    }
  }

  public canAccountsUseValidation(userName: string, superName: string): Observable<Map<string, boolean>> {
    const accountNames: string[] = [userName, superName];
    const tasks: Observable<Map<string, boolean>>[] = accountNames.map((name: string): Observable<Map<string, boolean>> => {
      const validationTaskMap: Map<string, boolean> = new Map();
      if (isNullOrUndefined(name)) {
        validationTaskMap.set(name, true);
        return of(validationTaskMap);
      }

      return this.getCanUseValidation(name).pipe(
        map((canUseValidation: boolean) => {
          validationTaskMap.set(name, canUseValidation);
          return validationTaskMap;
        }));
    });

    if (tasks.length !== 0) {
      return forkJoin(tasks).pipe(
        map((canUseValidationMapArr: Map<string, boolean>[]): Map<string, boolean> => {
          const resultMap: Map<string, boolean> = new Map<string, boolean>();
          for (const canUseValidationMap of canUseValidationMapArr) {
            for (const [key, value] of canUseValidationMap) {
              resultMap.set(key, value);
            }
          }
          return resultMap;
        }),
        catchError(() => {
          const errorMap: Map<string, boolean> = new Map<string, boolean>();
          errorMap.set(userName, false);
          errorMap.set(superName, false);
          return of(errorMap);
        })
      );
    }

    const successMap: Map<string, boolean> = new Map<string, boolean>();
    successMap.set(userName, true);
    successMap.set(superName, true);
    return of(successMap);
  }

  public getCanUseValidation(userName: string): Observable<boolean> {
    return this.authenticationServiceBase
      .getUserInfo(userName)
      .pipe(
        first(),
        map((userInfo: UserInfo): boolean => {
          return userInfo.AccountType !== UserAccountType.OpenID && userInfo.AccountType !== UserAccountType.Software;
        }),
        catchError((response: HttpResponse<any>) =>
          this.wsiUtilityService.handleError(response, TraceModules.utilities, 'canUseValidation()', this.errorService))
      );
  }

  public getCommandValidationOperation(validateCommandOpRepresentation: ValidationCommandOpRepresentation): Observable<ValidateOpResponse> {
    const url: string = this.wsiEndpointService.entryPoint + this.getCommandValidationOperationUrl;
    const headers: HttpHeaders = this.wsiUtilityService.httpGetDefaultHeader(this.authenticationServiceBase.userToken);
    return this.httpClient.post(url, validateCommandOpRepresentation, { headers, observe: 'response' }).pipe(
      map((response: HttpResponse<any>) =>
        this.handleResponse(response)),
      catchError((response: HttpResponse<any>) =>
        this.wsiUtilityService.handleError(response, TraceModules.utilities, 'getCommandValidationOperation()', this.errorService)));
  }

  public getRequiresValidation(browserObjArr: BrowserObject[]): Observable<boolean> {
    const objectIdArr: string[] = [];
    for (const browserObj of browserObjArr) {
      objectIdArr.push(browserObj.Attributes.ObjectId);
    }

    const validationEditOpRepresentation: ValidationEditOpRepresentation = {
      ObjectIds: objectIdArr
    }

    return this.getEditValidationOperation(validationEditOpRepresentation).pipe(
      map((response: ValidateOpResponse) => {
        return this.calculateRequiresValidation(response);
      }),
      catchError((response: HttpResponse<any>) =>
        this.wsiUtilityService.handleError(response, TraceModules.utilities, 'getRequiresValidation()', this.errorService)));
  }

  public getEditValidationOperation(validationEditOpRepresentation: ValidationEditOpRepresentation): Observable<ValidateOpResponse> {
    const url: string = this.wsiEndpointService.entryPoint + this.getEditValidationOperationUrl;
    const headers: HttpHeaders = this.wsiUtilityService.httpGetDefaultHeader(this.authenticationServiceBase.userToken);
    return this.httpClient.post(url, validationEditOpRepresentation, { headers, observe: 'response' }).pipe(
      map((response: HttpResponse<any>) =>
        this.handleResponse(response)),
      catchError((response: HttpResponse<any>) =>
        this.wsiUtilityService.handleError(response, TraceModules.utilities, 'getEditValidationOperation()', this.errorService)));
  }

  public validateCredential(validationCredentialRepresentation: ValidationCredentialRepresentation): Observable<any> {
    const url: string = this.wsiEndpointService.entryPoint + this.validateCredentialUrl;
    const headers: HttpHeaders = this.wsiUtilityService.httpGetDefaultHeader(this.authenticationServiceBase.userToken);
    return this.httpClient.post(url, validationCredentialRepresentation, { headers, observe: 'response' }).pipe(
      map((response: HttpResponse<any>) => {
        return response;
      },
      catchError((response: HttpResponse<any>) =>
        this.wsiUtilityService.handleError(response, TraceModules.utilities, 'validateCredential()', this.errorService))));
  }

  private calculateRequiresValidation(validateOpResponse: ValidateOpResponse): boolean {
    if (isNullOrUndefined(validateOpResponse)) {
      return false;
    }

    const validateOpInfo: ValidateOpInfo = new ValidateOpInfo(validateOpResponse);
    return validateOpInfo?.IsModalRequired === true;
  }
}
