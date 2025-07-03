/* eslint-disable @typescript-eslint/naming-convention */

// input
export interface TaskTemplateFilter {
  SystemNumber: number;
  TemplateCnsPath?: string;
  TargetObjectModels?: string[];
  TargetDpIds?: string[];
}
// output
export interface IRevertAction {
  CommandName: string;
  CommandAlias: number;
  Property?: string;
  Parameters?: Parameter[];
}
export interface IRuntimeValue {
  _type: number;
  _originalType?: number;
  b: any;
  a: boolean;  
}
export interface Parameter {
  Name: string;
  SetAtRuntime: boolean;
  UseOriginalValue: boolean;
  IsImplicitCns: boolean;
  Value?: any;
  RuntimeValue?: IRuntimeValue;
}
export interface CommandParametersRepresentation {
  Name: string;
  SetAtRuntime: boolean;
  Value: any;
  RuntimeValue: any;
  UseOriginalValue: boolean;
  IsImplicitCns: boolean;
}

export interface TaskAction {
  ExecutionOrder: number;
  TargetObjectModels: string[];
  Property: string;
  CommandName: string;
  CommandAlias: number;
  Parameters: Parameter[];
  ConditionOperator: string;
  ConditionIndex: number;
  ConditionMaxAge: number;
  ConditionValue: number;
  RevertAction: IRevertAction;
  ObjectModelsExcluded?: string[];
  ConditionProperty?: string;
  ConditionValuePerObjectModel?: any;
  OverridableParameterAction?: CommandParametersRepresentation;
  OverridableParameterRevert?: CommandParametersRepresentation;
}
export interface OperatorTaskTemplatesResponse {
  CnsPath: string;
  Node: string;
  TemplateName: string;
  TemplateNameLocalized: string;
  FileContent: string;
  ScaledValues: boolean;
  TaskName: string;
  TaskNameLocalized: string;
  TaskDescription: string;
  TaskDescriptionLocalized: string;
  Duration: number;
  RevertActionMode: number;
  TimeoutForConditions: number;
  NotesRequired: number;
  TaskActions: TaskAction[];
  ObjectModelsAllowed: string[];
  ObjectModelsNotAllowed: string[];
  HasOverridableParameters: boolean;
}

export interface OperatorTaskNote {
  Date: string;
  User: string;
  Description: string;
  ActionDetailsId: number;
  ActionDetailsText: string;
}
export interface AddOperatorTaskNote {
  Date: string;
  Description: string;
  ActionDetailsId: number;
  ActionDetailsText: string;
}
export interface OperatorTaskInfo {
  Id: string;
  TaskName: string;
  TaskDescription: string;
  Status: number;
  CreatedBy: string;
  TaskDescriptionLocalized: string;
  StartedBy: string;
  SystemId: number;
  IsExpirationConfig: boolean;
  ExpirationTime: string;
  ExpirationTimeRun: string;
  DeferDuration: number;
  DeferTime: string;
  DeferTimeRun: string;
  Deferred: boolean;
  PreviousStatus: number;
  LastModificationTime: string;
  ValidationComment: string;
  TargetDpIds: any;
  ValidRevertParameters: boolean;
  Removed: boolean;
  OperatorTaskNotesRepresentation: OperatorTaskNote[];
  CnsPath: string;
  TemplateNameLocalized: string;
  FileContent: string;
  ScaledValues: boolean;
  TaskNameLocalized: string;
  Duration: number;
  RevertActionMode: number;
  TimeoutForConditions: number;
  NotesRequired: number;
  TaskActions: TaskAction[];
  HasOverridableParameters: boolean;
  ObjectModelsAllowed: string[];
  ObjectModelsNotAllowed: string[];
}
export interface SaveOperatorTaskData {
  Id: string;
  Status: number;
  CreatedBy: string;
  TaskDescriptionLocalized: string;
  StartedBy: string;
  SystemId: number;
  IsExpirationConfig: boolean;
  ExpirationTime: string;
  ExpirationTimeRun: string;
  DeferDuration: number;
  DeferTime: string;
  DeferTimeRun: string;
  Deferred: boolean;
  PreviousStatus: number;
  LastModificationTime: string;
  ValidationComment: string;
  TargetDpIds: any;
  ValidRevertParameters: boolean;
  Removed: boolean;
  OperatorTaskNotesRepresentation: OperatorTaskNote[];
  CnsPath: string;
  TemplateNameLocalized: string;
  FileContent: string;
  ScaledValues: boolean;
  TaskNameLocalized: string;
  Duration: number;
  RevertActionMode: number;
  TimeoutForConditions: number;
  NotesRequired: number;
  ObjectModelsAllowed: string[];
  ObjectModelsNotAllowed: string[];
  HasOverridableParameters: boolean;
}
export interface OperatorTasksFilter {
  IsEnabled: boolean;
  SystemId: number;
  TasksId: string[];
  TaskStatus: number[];
}
export interface OperatorTaskIconPath {
  b: string;
  a: string;
}
export interface OperatorTaskStatus {
  Id: number;
  Name: string;
  NameLocalized: string;
  IconPath: OperatorTaskIconPath;
}
export interface SubscriptionWsiOpTasks {
  ErrorCode: number;
  RequestId: string; // subscription request context
  RequestFor: string; // Notification function name where client will receive further updates
}
export interface TaskFilterBody {
  IsEnabled: boolean;
  SystemId: number;
  TasksId: string[];
  TaskStatus: number[];
}
export interface ClientMessageExRepresentation {
  ResourceId: number;
  BaseName: string;
  SubstitutionText: string;
  AssemblyName: string;
  ResourceName: string;
}
export interface ValueWithQualityRepresentation {
  VariantValue: string;
  Quality: number;
}
export interface ActivityLogDataRepresentation {
  ObjectVersionNumber: number;
  Comment: string;
  AttachmentURL: string;
  GmsLogType: number;
  ErrorCode: ClientMessageExRepresentation;
  SourceDpId2: string;
  SourceDpId: string;
  MessageTextList: string[];
  MessageText: string;
  RefTime: string;
  SourceTime: string;
  WorkStation: string;
  Status: number;
  PreviousValueWithQuality: ValueWithQualityRepresentation;
  ValueWithQuality: ValueWithQualityRepresentation;
  PreviousValue: string;
  Value: string;
  UserName: string;
  GmsAction: number;
  Supervisor: string;
  LogUnconditional: boolean;
}

export enum LogMessage {
  CreateTask = 1,
  SaveTask = 2,
  DuplicateTask = 3,
  DeleteTask = 4,
  StartTask = 20,
  CloseTask = 21,
  ChangeExpiration = 22,
  Revert = 23,
  Abort = 24,
  TaskFailed = 40,
  TaskExpired = 41,
  TaskReadyToBeClosed = 42,
  TaskRunning = 43,
  TaskClosed = 44,
  TaskAborting = 45,
  TaskClosedForMissingLicense = 46,
  TaskWaitingForConditions = 47,
  TaskRunningWithException = 48,
  TaskCheckingPreconditions = 49,
  TaskExecutingCommands = 50,
  TaskRevertingCommands = 51,
  TaskWaitingForDeferTime = 52,
  ExecutingCommand = 100,
  ExecutingRevertCommand = 101,
  ExecutingAutomaticRevertCommand = 102,
  TaskNameLocalized = 150,
  TaskName = 151,
  TaskDescriptionLocalized = 152,
  TaskDescription = 153,
  StartDate = 154,
  DueDate = 155,
  RevertActionMode = 156,
  TargetsRemoved = 157,
  TargetsAdded = 158
}
