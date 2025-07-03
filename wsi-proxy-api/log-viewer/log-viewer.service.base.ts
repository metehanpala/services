import { Observable } from 'rxjs';

import { ValidationInput } from '../shared';
import {
  ActiviyEnumValues,
  DetailPane,
  FlexUpdateLogViewDefinition,
  HistLogColumnDescription,
  HistLogEnumValues,
  HistoryApiParams,
  HistoryLogKind,
  HistoryLogMetaData,
  HistoryLogTable,
  LogViewDefinitionFilters,
  ReportDefination,
  TextGroup
} from './data.model';
/**
 * Base class for the WSI trends service.
 * See the WSI documentation for details.
 */
export abstract class LogViewerServiceBase {
  /**
   * Gets the TrendViewDefinition from WSI.
   * i.e. refer to WSI documentation for more details.
   */
  public abstract getAccessRightsForLogViewer(): Observable<any>;

  /**
   * This method returns history log meta data for a specified system or all systems (system number = 0).
   * i.e. refer to WSI documentation for more details.
   */
  public abstract getHistoryLogMetaData(systemId: number): Observable<HistoryLogMetaData[]>;

  /**
   * This method returns history logs for either of the log kinds ActivityLogTable, AlarmLogTable, EventLogTable or
   * LogViewTable. The number of records to be retrieved and the kinds of columns to be fetched can be specified.
   * The time range (fromDate, toDate) can also be provided.
   * i.e. refer to WSI documentation for more details.
   */
  public abstract getHistoryLogs(data: HistoryApiParams): Observable<HistoryLogTable>;
   
  /**
   * This method returns the applied filters for the given log view definition objectId.
   */

  public abstract getLogViewDefinition(systemId: number, objectId: string): Observable<LogViewDefinitionFilters>;

  /**
   * This method returns the history log column descriptons for either of the log kinds ActivityLogTable, AlarmLogTable,
   * EventLogTable or LogViewTable.
   */
  public abstract createUpdateLogViewDefinition(systemId: number,
    flexUpdateLogViewDefinition: FlexUpdateLogViewDefinition): Observable<LogViewDefinitionFilters>;

  public abstract deleteLogViewDefinition(systemId: number, objectId: string, validationInput: ValidationInput): Observable<boolean>;

  public abstract getHistoryLogColumnDescripton(systemId: number, historyLogKind: HistoryLogKind): Observable<HistLogColumnDescription[]>;

  /**
   * This method returns the history log enum values for a given column that is identified by the column name and belonging to either of
   * the histroy log tables ActivityLogTable, AlarmLogTable, EventLogTable or LogViewTable.
   */
  public abstract getHistoryLogEnumValues(systemId: number, historyLogKind: HistoryLogKind, columnName: string): Observable<HistLogEnumValues>;

  /**
   * This method saves the settings for log-viewer snapin.
   */
  public abstract putSettings(settingID: string, settingValue: string | JSON): Observable<boolean>;

  /**
   * This method discard existing snapshot for log-viewer snapin.
   */
  public abstract discardSnapshot(systemId: number, tableName: string, snapshotId: string): Observable<any>;

  /**
   * This method will give us Activity Icon Json File.
   */
  public abstract getActivityIconJson(): Observable<DetailPane>;

  /**
   * This method will give us report defination information for report.
   */
  public abstract getReportDefination(systemId: number, reportDefinitionId: string): Observable<ReportDefination>;
  public abstract getHistoryLogColumnEnums(systemId: number, historyLogKind: HistoryLogKind, columns: string[]): Observable<ActiviyEnumValues> 

  public abstract getTextGroupSelection(systemId: number, tableName: string): Observable<TextGroup[]>;
}
