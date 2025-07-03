/* eslint-disable @typescript-eslint/naming-convention */

export enum DocumentTypes {
  Pdf,
  Xlsx,
  Both
}

export class ReportView {
  public ProductName: string | undefined;
}

export class FlexReport {
  public FileName: string | undefined;
  public Extension: string | undefined;
  public RelativePath: string | undefined;
  public SystemId: number | undefined;
}

export class ReportUrl {
  public type: string | undefined;
  public path: string | undefined;
  public url: any;
}

export interface CreateDocumentData {
  SystemId: number;
  ReportExecutionParams: ReportExecutionParams;
}

export enum ReportContext {
  Template,
  Single,
  MultiSelection
}

export interface ReportExecutionParams {
  ReportDefinitionId: string;
  DocumentType: DocumentTypes;
  ContextType: ReportContext;
  NameFilter: string[];
  IsAssistedTreatment?: boolean;
  EventId?: string;
  IsForSendToOutput?: boolean;
  FormData?: string;
}

export interface ReportHistoryResult {
  Result: ReportHistoryData[];
  ErrorInfo: string;
  ReportSubscriptionAdditionalValues: ReportSubscriptionAdditionalValues;
}

export interface ReportSubscriptionAdditionalValues {
  ContextTypeOrNameFilter: string;
  ReportDefinitionId: string;
}
export interface ReportHistoryData {
  ReportExecutionDisplayName: string;
  ReportExecutionDateTime: string;
  ReportExecutionStatus: ReportExecutionStatus;
  ReportExecutionId: string;
  PdfPageSize: number;
  ReportDocumentData: ReportDocumentData[];
}
export interface ReportDocumentData {
  DocumentDisplayName: string;
  DocumentPath: string;
  DocumentStatus: string;
  DocumentType: DocumentTypes;
}

export enum ReportExecutionStatus {
  Idle = 'Idle',
  Pending = 'Pending',
  Cancelling = 'Cancelling',
  Cancelled = 'Cancelled',
  Failed = 'Failed',
  Succeeded = 'Succeeded',
  PartiallySucceeded = 'Partially Succeeded'
}

export interface ReportDeleteFilters {
  ReportDefinitionId: string;
  ReportExecutionId: string;
  DocumentList: string[];
}

export interface DeleteDocumentData {
  SystemId: number;
  DeleteFilters: ReportDeleteFilters[];
}

export interface ReportDeleteResult {
  Response: [
    {
      ReportExecutionId: string;
      ReportDefinitionId: string;
      Result: [
        {
          DocumentName: string;
          IsDocumentDeleted: boolean;
        }
      ];
      ErrorInfo: string[];
    }
  ];
}

export interface ReportStartResult {
  ReportExecutionId: string;
  ErrorInfo: string;
}

export interface ReportCancelResult {
  ReportExecutionId: string;
  IsReportExecutionCancelled: boolean;
  ErrorInfo: string;
}

export interface SubscriptionWsiReport {
  ErrorCode: number;
  RequestId: string;
  RequestFor: string;
}
