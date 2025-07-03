import { Observable } from 'rxjs';

import { ValidationInput } from '../shared';
import {
  ActivityLogDataRepresentation,
  AddOperatorTaskNote, LogMessage,
  OperatorTaskInfo, OperatorTasksFilter,
  OperatorTaskStatus, OperatorTaskTemplatesResponse,
  SaveOperatorTaskData,
  TaskTemplateFilter
} from './data.model';

export abstract class OperatorTasksServiceBase {
  public abstract getOperatorTaskTemplateList(filter: TaskTemplateFilter): Observable<OperatorTaskTemplatesResponse[]>;
  public abstract getOperatorTasks(filter: OperatorTasksFilter): Observable<OperatorTaskInfo[]>;
  public abstract readOperatorTask(taskId: string, systemId?: number): Observable<OperatorTaskInfo>;
  public abstract saveOperatorTasks(modifiedOperatorTask: any, systemId?: number): Observable<any>;
  public abstract checkTaskName(taskName: string, systemId?: number): Observable<string>;
  public abstract getTaskStatus(): Observable<OperatorTaskStatus[]>;
  public abstract deleteOperatorTask(taskId: string, systemId?: number): Observable<any>;
  public abstract sendCommand(validationDetails: ValidationInput, taskCommand: number, taskId: string, 
    newTime?: string, systemNumber?: number): Observable<any>;
  public abstract getTaskNode(systemNumber: number): Observable<string>;
  public abstract startClientNode(): Observable<boolean>;
  public abstract addNote(note: AddOperatorTaskNote, taskId: string, systemNumber: number): Observable<number>;
  public abstract updateTask(task: SaveOperatorTaskData, systemId: number): Observable<any>;
  public abstract auditLog(taskId: string, activityLogData: ActivityLogDataRepresentation, logMessage: LogMessage, systemNumber: number): Observable<number>;
  public abstract getOverridableParameters(cnsPath: string, objectIds: string[], 
    systemNumber: number, taskId?: string): Observable<any[]>;
  public abstract sendCloseCommand(validationDetails: ValidationInput, taskId: string, systemNumber: number): Observable<any>;
}