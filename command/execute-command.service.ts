import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthenticationServiceBase, ErrorNotificationServiceBase, TraceService } from '@gms-flex/services-common';
import { Observable, throwError as observableThrowError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { TraceModules } from '../shared/trace-modules';
import { WsiUtilityService } from '../shared/wsi-utility.service';
import { WsiEndpointService } from '../wsi-endpoint/wsi-endpoint.service';
import { BulkCommandInput, BulkCommandInput2, BulkCommandResponse, CommandInput } from '../wsi-proxy-api/command/data.model';
import { ExecuteCommandServiceBase } from '../wsi-proxy-api/command/execute-command.service.base';

const executeCommandServiceUrl = '/api/commands/';
const executeCommandValidateServiceUrl = '/api/commands/validateproperty/';

/**
 * GMS WSI Execute Command Service implementation.
 * @extends ExecuteCommandServiceBase
 */
@Injectable({
  providedIn: 'root'
})
export class ExecuteCommandService extends ExecuteCommandServiceBase {

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
   * Command the value of a single propertyId.
   * See WSI API specification for details.
   *
   * @param {string } propertyId The Property to command
   * @param {string } commandId The specific command to execute
   * @param {CommandInput } commandInput Command parameter details, if required
   *
   * @memberOf ExecuteCommandService
   */
  public executeCommand(propertyId: string, commandId: string, commandInput: CommandInput[]): Observable<void> {
    if (propertyId == undefined || commandId == undefined) {
      return observableThrowError(WsiUtilityService.createNewInvalidArgumentsError());
    }
    this.traceService.debug(TraceModules.command, 'executeCommand() called; propertyId: %s; commandId: %s; commandInput: %s',
      propertyId,
      commandId,
      commandInput ? commandInput.toString() : undefined);

    const headers: HttpHeaders = this.wsiUtilityService.httpPostDefaultHeader(this.authenticationServiceBase.userToken);
    const propertyIdTripleEncoded: string = encodeURIComponent(encodeURIComponent(encodeURIComponent(propertyId)));
    const url: string = this.wsiEndpoint.entryPoint + executeCommandServiceUrl + propertyIdTripleEncoded + '/' + commandId;
    const body: any = JSON.stringify(commandInput);

    return this.httpClient.post(url, body, { headers, observe: 'response' }).pipe(
      map((response: HttpResponse<any>) =>
        this.wsiUtilityService.extractData(response, TraceModules.command, 'executeCommand()')),
      catchError((response: HttpResponse<any>) =>
        this.wsiUtilityService.handleError(response, TraceModules.command, 'executeCommand()', this.errorService)));
  }

  /**
   * Execute the same command on multiple properties of the same data point type.
   * See WSI API specification for details.
   *
   * @param {string } commandId The specific command to execute
   * @param {BulkCommandInput } bulkCommandInput Command parameter details and a list of PropertyIds
   * @returns {Observable<BulkCommandResponse> } An Array of Command Responses, one for each command
   *
   * @memberOf ExecuteCommandService
   */
  public executeCommands(commandId: string, bulkCommandInput: BulkCommandInput): Observable<BulkCommandResponse> {
    if (commandId == undefined || bulkCommandInput == undefined) {
      return observableThrowError(WsiUtilityService.createNewInvalidArgumentsError());
    }
    this.traceService.debug(TraceModules.command, 'executeCommands() called; commandId: %s; commandInput: %s; propertyIds: %s',
      commandId, bulkCommandInput.CommandInputForExecution.toString(), bulkCommandInput.PropertyIds.toString());

    const headers: HttpHeaders = this.wsiUtilityService.httpPostDefaultHeader(this.authenticationServiceBase.userToken);
    const url: string = this.wsiEndpoint.entryPoint + executeCommandServiceUrl + commandId;
    const body: any = JSON.stringify(bulkCommandInput);

    return this.httpClient.post(url, body, { headers, observe: 'response' }).pipe(
      map((response: HttpResponse<any>) => this.wsiUtilityService.extractData(response, TraceModules.command, 'executeCommands()')),
      catchError((response: HttpResponse<any>) =>
        this.wsiUtilityService.handleError(response, TraceModules.command, 'executeCommands()', this.errorService)));
  }

  /**
   * Execute the same command on multiple properties of the same data point type.
   * See WSI API specification for details.
   *
   * @param {string } commandId The specific command to execute
   * @param {BulkCommandInput2 } bulkCommandInput Command parameter details, list of PropertyIds and validation object values
   * @returns {Observable<BulkCommandResponse> } An Array of Command Responses, one for each command
   *
   * @memberOf ExecuteCommandService
   */
  public executeCommands2(commandId: string, bulkCommandInput: BulkCommandInput2): Observable<BulkCommandResponse> {
    if (commandId == undefined || bulkCommandInput == undefined) {
      return observableThrowError(WsiUtilityService.createNewInvalidArgumentsError());
    }
    this.traceService.debug(TraceModules.command, 'executeCommands() called; commandId: %s; commandInput: %s; propertyIds: %s',
      commandId, bulkCommandInput.CommandInputForExecution.toString(), bulkCommandInput.PropertyIds.toString());

    const headers: HttpHeaders = this.wsiUtilityService.httpPostDefaultHeader(this.authenticationServiceBase.userToken);
    const url: string = this.wsiEndpoint.entryPoint + executeCommandValidateServiceUrl + commandId;
    const body: any = JSON.stringify(bulkCommandInput);

    return this.httpClient.post(url, body, { headers, observe: 'response' }).pipe(
      map((response: HttpResponse<any>) => this.wsiUtilityService.extractData(response, TraceModules.command, 'executeCommands()')),
      catchError((response: HttpResponse<any>) =>
        this.wsiUtilityService.handleError(response, TraceModules.command, 'executeCommands()', this.errorService)));
  }

}
