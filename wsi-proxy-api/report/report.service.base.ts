import { Observable } from 'rxjs';

import { ValueDetails } from '../shared';
import { CreateDocumentData, DeleteDocumentData, ReportCancelResult, ReportDeleteResult,
  ReportDocumentData, ReportHistoryResult, ReportStartResult, ReportUrl } from './data.model';

/**
 * Base class for the WSI trends service.
 * See the WSI documentation for details.
 */
export abstract class ReportServiceBase {

  /**
   * Test WSI API
   * See WSI documentation for more details.
   *
   * @abstract
   *
   * @returns {Observable<string>}
   *
   * @memberOf ReportServiceBase
   */

  public abstract getFilePath(message: any): Observable<ValueDetails[]>;

  public abstract openTab(path: string): void;

  public abstract getWhitelist(): Observable<any>;

  public abstract isInWhitelist(url: any): Promise<boolean>;

  public abstract getDocument(systemId: number, documentData: ReportDocumentData): Promise<ReportUrl>;

  public abstract getCreatedDocuments(createDocumentData: CreateDocumentData): Observable<ReportDocumentData[]>;

  public abstract getReportHistory(systemId: number, reportId: string): Observable<ReportHistoryResult>;

  public abstract deleteReportDocuments(deleteDocumentData: DeleteDocumentData): Observable<ReportDeleteResult>;

  public abstract startReportExecution(createDocumentData: CreateDocumentData): Observable<ReportStartResult>;

  public abstract cancelReportExecution(systemId: number, reportExecutionId: string): Observable<ReportCancelResult>;

}
