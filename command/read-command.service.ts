import { HttpClient, HttpHeaders, HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthenticationServiceBase, ErrorNotificationServiceBase, TraceService } from '@gms-flex/services-common';
import { Observable, throwError as observableThrowError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { TraceModules } from '../shared/trace-modules';
import { WsiUtilityService } from '../shared/wsi-utility.service';
import { WsiEndpointService } from '../wsi-endpoint/wsi-endpoint.service';
import { PropertyCommand } from '../wsi-proxy-api/command/data.model';
import { ReadCommandServiceBase } from '../wsi-proxy-api/command/read-command.service.base';
import { FormatHelper } from './format-helper';

const readCommandServiceUrl = '/api/commands/';

/**
 * GMS WSI Read Command Service implementation.
 * @extends ReadCommandServiceBase
 */
@Injectable({
  providedIn: 'root'
})
export class ReadCommandService extends ReadCommandServiceBase {

  /**
   * Constructor
   * @param {TraceService } traceService The trace service
   * @param {HttpClient } HttpClient The Angular 2 http service
   * @param {WsiEndpointService } wsiEndpoint The WSI endpoint service.
   * @param {AuthenticationBase } authenticationBase The WSI authentication service
   * @param {WsiUtilityService}
   * @param {ErrorNotificationServiceBase}
   */
  public constructor(private readonly traceService: TraceService, private readonly httpClient: HttpClient, protected wsiEndpoint: WsiEndpointService,
    private readonly authenticationServiceBase: AuthenticationServiceBase,
    private readonly wsiUtilityService: WsiUtilityService,
    private readonly errorService: ErrorNotificationServiceBase) {
    super();
    this.traceService.info(TraceModules.command, 'Read Command service created.');
  }

  /**
   * Reads the list of available commands for a single propertyId.
   * See WSI API specification for details.
   *
   * @param {string } propertyId The Property to read a list of available commands for
   * @param {string } [commandId] Optional filter for a specific commandId
   * @param {boolean } [enabledCommandsOnly=false] If set to True only currently enabled commands will be returned
   * @param {string } [clientType] If set, commands can be filtered for specific clients (All, Headless, Headful)
   * @returns {Observable<PropertyCommand> } List of available commands for the given property
   *
   * @memberOf ReadCommandService
   */
  public readPropertyCommand(
    propertyId: string,
    commandId?: string,
    enabledCommandsOnly = false,
    clientType?: string): Observable<PropertyCommand> {
    if (propertyId == undefined) {
      return observableThrowError(WsiUtilityService.createNewInvalidArgumentsError());
    }
    this.traceService.debug(TraceModules.command, 'readPropertyCommand() called; propertyId: %s', propertyId);

    const headers: HttpHeaders = this.wsiUtilityService.httpGetDefaultHeader(this.authenticationServiceBase.userToken);
    const propertyIdDoubleEncoded: string = encodeURIComponent(encodeURIComponent(propertyId));
    const url: string = this.wsiEndpoint.entryPoint + readCommandServiceUrl + propertyIdDoubleEncoded;
    let params: HttpParams = new HttpParams();
    if (commandId != null) {
      params = params.append('commandId', commandId);
    }
    if (enabledCommandsOnly != null) {
      params = params.append('enabledCommandsOnly', enabledCommandsOnly.toString());
    }
    if (clientType != null) {
      params = params.append('clientType', clientType);
    }

    return this.httpClient.get(url, { headers, params, observe: 'response' }).pipe(
      map((response: HttpResponse<any>) =>
        this.handleResponse(response)),
      catchError((response: HttpResponse<any>) =>
        this.wsiUtilityService.handleError(response, TraceModules.command, 'readPropertyCommand()', this.errorService)));
  }

  /**
   * Reads the list of available commands for multiple propertyIds.
   * See WSI API specification for details.
   *
   * @param {string[] } propertyIds A list of Properties to read a list of available commands for
   * @param {string } [commandId] Optional filter for a specific commandId
   * @param {boolean } [enabledCommandsOnly=false] If set to True only currently enabled commands will be returned
   * @param {string } [clientType] If set, commands can be filtered for specific clients (All, Headless, Headful)
   * @returns {Observable<PropertyCommand[]> } Array of lists of available commands for the given properties
   *
   * @memberOf ReadCommandService
   */
  public readPropertyCommands(
    propertyIds: string[],
    commandId?: string,
    enabledCommandsOnly = false,
    clientType?: string,
    booleansAsNumericText?: boolean): Observable<PropertyCommand[]> {
    if (propertyIds == undefined) {
      return observableThrowError(WsiUtilityService.createNewInvalidArgumentsError());
    }
    this.traceService.debug(TraceModules.command, 'readPropertyCommands() called; propertyIds: %s', propertyIds.toString());

    const headers: HttpHeaders = this.wsiUtilityService.httpPostDefaultHeader(this.authenticationServiceBase.userToken);
    const url: string = this.wsiEndpoint.entryPoint + readCommandServiceUrl;
    let params: HttpParams = new HttpParams();
    if (commandId != null) {
      params = params.append('commandId', commandId);
    }
    if (enabledCommandsOnly != null) {
      params = params.append('enabledCommandsOnly', enabledCommandsOnly.toString());
    }
    if (clientType != null) {
      params = params.append('clientType', clientType);
    }
    if (booleansAsNumericText != null) {
      params = params.append('booleansAsNumericText', String(booleansAsNumericText));
    }
    const body: any = JSON.stringify(propertyIds);

    return this.httpClient.post(url, body, { headers, params, observe: 'response' }).pipe(
      map((response: HttpResponse<any>) =>
        this.handleResponse(response)),
      catchError((response: HttpResponse<any>) =>
        this.wsiUtilityService.handleError(response, TraceModules.command, 'readPropertyCommands()', this.errorService)));
  }

  /**
   * Processes the HTTP response to extract and validate the list of PropertyCommand objects.
   *
   * This method expects the response body to be an array of PropertyCommand objects.
   * It validates each command's parameters using FormatHelper.
   *
   * If the extracted data is not an array (e.g., due to an error response with a different shape),
   * it logs a warning to help diagnose unexpected API responses.
   *
   * @param {HttpResponse<any>} response - The raw HTTP response from the backend API.
   *
   * @returns {PropertyCommand[] | any} Returns an array of PropertyCommand objects if successful.
   * Returns the raw extracted data as-is if it is not an array (to avoid breaking app logic).
   */
  public handleResponse(response: HttpResponse<any>): any {
    // Extract the data from the HTTP response using WsiUtilityService.
    const result: PropertyCommand[] = this.wsiUtilityService.extractData(response, TraceModules.command, 'readPropertyCommands()');

    // Add a type check to prevent calling forEach on non-array values,
    // because some error responses might return a non-array structure.
    // This avoids the "result.forEach is not a function" runtime error.
    if (Array.isArray(result)) {
      // Iterate over each PropertyCommand in the array.
      result.forEach(propertyCommand => {
        if (propertyCommand.Commands) {
          // Iterate over each Command inside the PropertyCommand.
          propertyCommand.Commands.forEach(command => {
            if (command.Parameters) {
              // Validate each Parameter descriptor for correctness.
              command.Parameters.forEach(parameter => {
                FormatHelper.validateParameterDescriptor(parameter);
              });
            }
          });
        }
      });
    } else {
      // Log a warning if the result is not an array as expected.
      this.traceService.warn(TraceModules.command, 'handleResponse() expected an array but received:', result);
    }

    // Return the result regardless of whether it was an array or not,
    // to preserve existing app behavior and avoid breaking changes.
    return result;
  }

}
