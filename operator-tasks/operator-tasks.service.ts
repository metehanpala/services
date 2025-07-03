import { HttpClient, HttpHeaders, HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  AuthenticationServiceBase,
  ErrorNotificationServiceBase,
  TraceService
} from '@gms-flex/services-common';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { ValidationInput } from '../public-api';
import { TraceModules } from '../shared/trace-modules';
import { WsiUtilityService } from '../shared/wsi-utility.service';
import { WsiEndpointService } from '../wsi-endpoint/wsi-endpoint.service';
import {
  ActivityLogDataRepresentation,
  AddOperatorTaskNote, LogMessage,
  OperatorTaskInfo, OperatorTasksFilter,
  OperatorTasksServiceBase, OperatorTaskStatus,
  OperatorTaskTemplatesResponse, SaveOperatorTaskData, TaskTemplateFilter
} from '../wsi-proxy-api/operator-tasks';

@Injectable({
  providedIn: 'root'
})
export class OperatorTasksService extends OperatorTasksServiceBase {
  public constructor(
    private readonly traceService: TraceService,
    private readonly httpClient: HttpClient,
    private readonly authenticationServiceBase: AuthenticationServiceBase,
    private readonly wsiEndpointService: WsiEndpointService,
    private readonly wsiUtilityService: WsiUtilityService,
    private readonly errorService: ErrorNotificationServiceBase) {
    super();
  }

  private readonly operatorTaskTemplateUrl = '/api/OperatorTasks/GetTemplate';
  private readonly operatorGetTasksUrl = '/api/OperatorTasks/GetTasks';
  private readonly readOperatorTaskUrl = '/api/OperatorTasks/ReadOperatorTask';
  private readonly saveOperatorTaskUrl = '/api/OperatorTasks/SaveTask';
  private readonly checkTaskNameUrl = '/api/OperatorTasks/CheckTaskName';
  private readonly getTaskStatusUrl = '/api/OperatorTasks/GetTaskStatus/';
  private readonly deleteOperatorTaskUrl = '/api/OperatorTasks/DeleteTask';
  private readonly sendCommandUrl = '/api/OperatorTasks/SendCommand';
  private readonly getTaskNodeUrl = '/api/OperatorTasks/GetOperatorTaskNode';
  private readonly startClientNodeUrl = '/api/OperatorTasks/StartClientNode';
  private readonly addNoteUrl = '/api/OperatorTasks/AddNote';
  private readonly auditLogUrl = '/api/OperatorTasks/AuditLog';
  private readonly updateTaskUrl = '/api/OperatorTasks/UpdateTask';
  private readonly getOverridableUrl = '/api/OperatorTasks/GetOverridableParameters';
  private readonly sendCloseCommandUrl = '/api/OperatorTasks/SendCloseCommand';

  public getOperatorTaskTemplateList(filter: TaskTemplateFilter): Observable<OperatorTaskTemplatesResponse[]> {
    const functionName = 'getOperatorTaskList()';
    this.traceService.info(TraceModules.operatorTasks, `${functionName}: http post called`);
    if (filter.TemplateCnsPath == undefined) {
      filter.TemplateCnsPath = '';
    }
    if (filter.TargetObjectModels == undefined) {
      filter.TargetObjectModels = [];
    }
    if (filter.TargetDpIds == undefined) {
      filter.TargetDpIds = [];
    }
    const headers: HttpHeaders = this.wsiUtilityService.httpGetDefaultHeader(this.authenticationServiceBase.userToken);
    const url = this.wsiEndpointService.entryPoint + this.operatorTaskTemplateUrl;
    return this.httpClient.post(url, filter, { headers, observe: 'response' }).pipe(
      map((response: HttpResponse<any>) =>
        this.wsiUtilityService.extractData(response, TraceModules.operatorTasks, functionName)),
      catchError((response: HttpResponse<any>) =>
        this.wsiUtilityService.handleError(response, TraceModules.operatorTasks, functionName, this.errorService)));
  }

  public getOperatorTasks(filter: OperatorTasksFilter): Observable<OperatorTaskInfo[]> {
    const functionName = 'getOperatorTasks()';
    this.traceService.info(TraceModules.operatorTasks, `${functionName}: http get called`);
    const headers: HttpHeaders = this.wsiUtilityService.httpGetDefaultHeader(this.authenticationServiceBase.userToken);
    const url = this.wsiEndpointService.entryPoint + this.operatorGetTasksUrl;
    return this.httpClient.post(url, filter, { headers, observe: 'response' }).pipe(
      map((response: HttpResponse<any>) =>
        this.wsiUtilityService.extractData(response, TraceModules.operatorTasks, functionName)),
      catchError((response: HttpResponse<any>) =>
        this.wsiUtilityService.handleError(response, TraceModules.operatorTasks, functionName, this.errorService)));

  }

  public readOperatorTask(taskId: string, systemNumber?: number): Observable<OperatorTaskInfo> {
    const functionName = 'readOperatorTask()';
    this.traceService.info(TraceModules.operatorTasks, `${functionName}: http get called`);
    const headers: HttpHeaders = this.wsiUtilityService.httpGetDefaultHeader(this.authenticationServiceBase.userToken);
    const url = this.wsiEndpointService.entryPoint + this.readOperatorTaskUrl;
    let params: HttpParams = new HttpParams();
    params = params.append('taskId', taskId);
    if (systemNumber !== undefined) {
      params = params.append('systemNumber', String(systemNumber));
    }

    return this.httpClient.get<OperatorTaskInfo>(url, { headers, params, observe: 'response' }).pipe(
      map((response: HttpResponse<any>) =>
        this.wsiUtilityService.extractData(response, TraceModules.operatorTasks, functionName)),
      catchError((response: HttpResponse<any>) =>
        this.wsiUtilityService.handleError(response, TraceModules.operatorTasks, functionName, this.errorService)));
  }

  public saveOperatorTasks(modifiedOperatorTask: any, systemNumber?: number): Observable<any> {
    const functionName = 'saveOperatorTasks()';
    this.traceService.info(TraceModules.operatorTasks, `${functionName}: http post called`);
    const headers: HttpHeaders = this.wsiUtilityService.httpGetDefaultHeader(this.authenticationServiceBase.userToken);
    const url = this.wsiEndpointService.entryPoint + this.saveOperatorTaskUrl;
    let params: HttpParams = new HttpParams();
    if (systemNumber !== undefined) {
      params = params.append('systemNumber', String(systemNumber));
    }
    return this.httpClient.post(url, modifiedOperatorTask, { headers, params, observe: 'response' }).pipe(
      map((response: HttpResponse<any>) =>
        this.wsiUtilityService.extractData(response, TraceModules.operatorTasks, functionName)),
      catchError((response: HttpResponse<any>) =>
        this.wsiUtilityService.handleError(response, TraceModules.operatorTasks, functionName, this.errorService)));
  }

  public checkTaskName(taskName: string, systemNumber?: number): Observable<string> {
    const functionName = 'checkTaskName()';
    this.traceService.info(TraceModules.operatorTasks, `${functionName}: http get called`);
    const headers: HttpHeaders = this.wsiUtilityService.httpGetDefaultHeader(this.authenticationServiceBase.userToken);
    const url = this.wsiEndpointService.entryPoint + this.checkTaskNameUrl;

    let params: HttpParams = new HttpParams();
    params = params.append('taskName', taskName);

    if (systemNumber !== undefined) {
      params = params.append('systemNumber', String(systemNumber));
    }

    return this.httpClient.get<any>(url, { headers, params }).pipe(
      map((response: HttpResponse<any>) => response),
      catchError((response: HttpResponse<any>) =>
        this.wsiUtilityService.handleError(response, TraceModules.operatorTasks, functionName, this.errorService)));
  }

  public getTaskStatus(): Observable<OperatorTaskStatus[]> {
    const functionName = 'getTaskStatus()';
    this.traceService.info(TraceModules.operatorTasks, `${functionName}: http get called`);
    const headers: HttpHeaders = this.wsiUtilityService.httpGetDefaultHeader(this.authenticationServiceBase.userToken);
    const url = this.wsiEndpointService.entryPoint + this.getTaskStatusUrl;

    return this.httpClient.get(url, { headers, observe: 'response' }).pipe(
      map((response: HttpResponse<any>) =>
        this.wsiUtilityService.extractData(response, TraceModules.operatorTasks, functionName)),
      catchError((response: HttpResponse<any>) =>
        this.wsiUtilityService.handleError(response, TraceModules.operatorTasks, functionName, this.errorService)));
  }

  public deleteOperatorTask(taskId: string, systemNumber?: number): Observable<any> {
    const functionName = 'deleteOperatorTask()';
    this.traceService.info(TraceModules.operatorTasks, `${functionName}: http delete called`);
    const headers: HttpHeaders = this.wsiUtilityService.httpDeleteDefaultHeader(this.authenticationServiceBase.userToken);
    const url = this.wsiEndpointService.entryPoint + this.deleteOperatorTaskUrl;
    let params: HttpParams = new HttpParams();
    params = params.append('taskId', taskId);
    if (systemNumber !== undefined) {
      params = params.append('systemNumber', String(systemNumber));
    }
    return this.httpClient.delete(url, { headers, params, observe: 'response' }).pipe(
      map((response: HttpResponse<any>) =>
        this.wsiUtilityService.extractData(response, TraceModules.operatorTasks, `${functionName}: http delete response`)),
      catchError((response: HttpResponse<any>) =>
        this.wsiUtilityService.handleError(response, TraceModules.operatorTasks, `${functionName}: http delete response`, this.errorService)));
  }

  public sendCommand(validationDetails: ValidationInput, taskCommand: number, taskId: string, newTime?: string, systemNumber?: number): Observable<any> {
    const functionName = 'sendCommand()';
    this.traceService.info(TraceModules.operatorTasks, `${functionName}: http post called`);
    const headers: HttpHeaders = this.wsiUtilityService.httpGetDefaultHeader(this.authenticationServiceBase.userToken);
    const url = this.wsiEndpointService.entryPoint + this.sendCommandUrl;
    let params: HttpParams = new HttpParams();

    params = params.append('taskCommand', String(taskCommand));
    params = params.append('taskId', taskId);   

    if (newTime && newTime.length > 0) {
      params = params.append('newTime', newTime);
    }
    
    if (systemNumber !== undefined) {
      params = params.append('systemNumber', String(systemNumber));
    }

    return this.httpClient.post(url, validationDetails, { headers, params, observe: 'response' }).pipe(
      map((response: HttpResponse<any>) =>
        this.wsiUtilityService.extractData(response, TraceModules.operatorTasks, `${functionName}: http post response`)),
      catchError((response: HttpResponse<any>) =>
        this.wsiUtilityService.handleError(response, TraceModules.operatorTasks, functionName, this.errorService)));
  }

  public sendCloseCommand(validationDetails: ValidationInput, taskId: string, systemNumber: number): Observable<any> {
    const functionName = 'sendCloseCommand()';
    this.traceService.info(TraceModules.operatorTasks, `${functionName}: http post called`);
    const headers: HttpHeaders = this.wsiUtilityService.httpGetDefaultHeader(this.authenticationServiceBase.userToken);
    const url = this.wsiEndpointService.entryPoint + this.sendCloseCommandUrl;
    let params: HttpParams = new HttpParams();

    params = params.append('taskId', taskId);

    if (systemNumber !== undefined) {
      params = params.append('systemNumber', String(systemNumber));
    }

    return this.httpClient.post(url, validationDetails, { headers, params, observe: 'response' }).pipe(
      map((response: HttpResponse<any>) =>
        this.wsiUtilityService.extractData(response, TraceModules.operatorTasks, `${functionName}: http post response`)),
      catchError((response: HttpResponse<any>) =>
        this.wsiUtilityService.handleError(response, TraceModules.operatorTasks, functionName, this.errorService)));
  }
  
  public getTaskNode(systemNumber?: number): Observable<string> {
    const functionName = 'getTaskNode()';
    this.traceService.info(TraceModules.operatorTasks, `${functionName}: http post called`);
    const headers: HttpHeaders = this.wsiUtilityService.httpGetDefaultHeader(this.authenticationServiceBase.userToken);
    const url = this.wsiEndpointService.entryPoint + this.getTaskNodeUrl;
    let params: HttpParams = new HttpParams();
    if (systemNumber !== undefined) {
      params = params.append('systemNumber', String(systemNumber));
    }
    return this.httpClient.get<string>(url, { headers, params, observe: 'response' }).pipe(
      map((response: HttpResponse<string>) =>
        this.wsiUtilityService.extractData(response, TraceModules.operatorTasks, functionName)),
      catchError((response: HttpResponse<any>) =>
        this.wsiUtilityService.handleError(response, TraceModules.operatorTasks, functionName, this.errorService)));
  }

  public startClientNode(): Observable<boolean> {
    const functionName = 'startClientNode()';
    this.traceService.info(TraceModules.operatorTasks, `${functionName}: http post called`);
    const headers: HttpHeaders = this.wsiUtilityService.httpGetDefaultHeader(this.authenticationServiceBase.userToken);
    const url = this.wsiEndpointService.entryPoint + this.startClientNodeUrl;
    return this.httpClient.get<boolean>(url, { headers, observe: 'response' }).pipe(
      map((response: HttpResponse<any>) =>
        this.wsiUtilityService.extractData(response, TraceModules.operatorTasks, functionName)),
      catchError((response: HttpResponse<any>) =>
        this.wsiUtilityService.handleError(response, TraceModules.operatorTasks, functionName, this.errorService)));
  }

  public addNote(note: AddOperatorTaskNote, taskId: string, systemNumber: number): Observable<number> {
    const functionName = 'addNote()';
    this.traceService.info(TraceModules.operatorTasks, `${functionName}: http put called`);
    const headers: HttpHeaders = this.wsiUtilityService.httpPutDefaultHeader(this.authenticationServiceBase.userToken);
    const url: string = this.wsiEndpointService.entryPoint + this.addNoteUrl;

    let params: HttpParams = new HttpParams();
    params = params.append('taskId', taskId);
    params = params.append('systemNumber', String(systemNumber));

    return this.httpClient.put(url, note, { headers, params, observe: 'response' }).pipe(
      map((response: HttpResponse<any>) => this.wsiUtilityService.extractData(response, TraceModules.operatorTasks, functionName)),
      catchError((response: HttpResponse<any>) =>
        this.wsiUtilityService.handleError(response, TraceModules.operatorTasks, functionName, this.errorService)));
  }

  public updateTask(task: SaveOperatorTaskData, systemId: number): Observable<any> {
    const functionName = 'updateTask()';
    this.traceService.info(TraceModules.operatorTasks, `${functionName}: http put called`);
    const headers: HttpHeaders = this.wsiUtilityService.httpPutDefaultHeader(this.authenticationServiceBase.userToken);
    const url: string = this.wsiEndpointService.entryPoint + this.updateTaskUrl;

    let params: HttpParams = new HttpParams();
    params = params.append('systemNumber', String(systemId));

    return this.httpClient.put(url, task, { headers, params, observe: 'response' }).pipe(
      map((response: HttpResponse<any>) => this.wsiUtilityService.extractData(response, TraceModules.operatorTasks, functionName)),
      catchError((response: HttpResponse<any>) =>
        this.wsiUtilityService.handleError(response, TraceModules.operatorTasks, functionName, this.errorService)));
  }

  public auditLog(taskId: string, activityLogData: ActivityLogDataRepresentation, logMessage: LogMessage, systemNumber: number): Observable<any> {
    const functionName = 'auditLog()';
    this.traceService.info(TraceModules.operatorTasks, `${functionName}: http post called`);
    const headers: HttpHeaders = this.wsiUtilityService.httpGetDefaultHeader(this.authenticationServiceBase.userToken);
    const url = this.wsiEndpointService.entryPoint + this.auditLogUrl;

    let params: HttpParams = new HttpParams();
    params = params.append('taskId', taskId);
    params = params.append('logMessage', logMessage);
    params = params.append('systemNumber', systemNumber);

    return this.httpClient.post(url, activityLogData, { headers, params, observe: 'response' }).pipe(
      map((response: HttpResponse<any>) =>
        this.wsiUtilityService.extractData(response, TraceModules.operatorTasks, functionName)),
      catchError((response: HttpResponse<any>) =>
        this.wsiUtilityService.handleError(response, TraceModules.operatorTasks, functionName, this.errorService)));
  }

  public getOverridableParameters(cnsPath: string, objectIds: string[], systemNumber: number, taskId?: string): Observable<any> {
    const functionName = 'getOverridableParameters()';
    this.traceService.info(TraceModules.operatorTasks, `${functionName}: http post called`);
    const headers: HttpHeaders = this.wsiUtilityService.httpGetDefaultHeader(this.authenticationServiceBase.userToken);
    const url = this.wsiEndpointService.entryPoint + this.getOverridableUrl;

    let params: HttpParams = new HttpParams();
    params = params.append('cnsPath', cnsPath);
    params = params.append('systemNumber', systemNumber);
    if (taskId != null) {
      params = params.append('taskId', taskId);
    }

    return this.httpClient.post(url, objectIds, { headers, params, observe: 'response' }).pipe(
      map((response: HttpResponse<any>) =>
        this.wsiUtilityService.extractData(response, TraceModules.operatorTasks, `${functionName}: http post response`)),
      catchError((response: HttpResponse<any>) =>
        this.wsiUtilityService.handleError(response, TraceModules.operatorTasks, functionName, this.errorService)));
  }
}