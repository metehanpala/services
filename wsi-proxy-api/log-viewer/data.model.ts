/* eslint-disable @typescript-eslint/naming-convention */

import { ValidationInput } from "../shared";
import { CNSNode } from "../trend/data.model";

// ------------------------------------------------ General Log Types ---------------------------------------------

export enum HistoryLogKind {
  ActivityLog = 'ActivityLogTable',
  AlarmLog = 'AlarmLogTable',
  EventLog = 'EventLogTable',
  LogView = 'LogViewTable',
  ActivityFeed = 'ActivityFeedTable',
  MeterConfigurationReport = 'MeterConfigurationReport'
}

export interface LinkLog {
  Rel: string;
  Href: string;
  IsTemplated: boolean;
}

export interface HistoryLogTable {
  TableName: string;
  Size: number;
  Page: number;
  // Result type depends from the history log kind
  Result: LogViewResult[];
  SnapshotId: string;
  Total: number;
  ErrorInfo: string[];
  _links: LinkLog[];
}

// ------------------------------------------------ LogViewTable --------------------------------------------------
export interface LogViewResult {
  Index?: number;
  Id: number;
  EventId?: number;
  Time: string;
  LogType?: string;
  RecordType: string;
  AuditFlag?: string;
  UserName: string;
  Workstation?: string;
  Action?: string;
  Status?: string;
  Name: string;
  Description: string;
  InternalName: string;
  HiddenInternalName: string;
  DefaultViewDesignation: string;
  DefaultViewLocation: string;
  CurrentViewDesignation: string;
  CurrentViewLocation: string;
  ManagementDesignation: string;
  ManagementLocation: string;
  SystemName: string;
  Discipline: string;
  SubDiscipline: string;
  Type: string;
  SubType: string;
  ValProf: string;
  EventCatPrio?: number;
  EventCause?: string;
  AlertId?: string;
  AlarmCategory?: string;
  AlertMode?: string;
  EventMessageText?: string;
  AlertTime?: string;
  AlertState?: string;
  ObjectPropertyLogView?: string;
  ObserverObjectPropertyLogView?: string;
  LogicalDesignation?: string;
  LogicalLocation?: string;
  ObserverName?: string;
  ObserverDescription?: string;
  ObserverNameInternal?: string;
  ObserverDefaultHierarchyDesignation?: string;
  ObserverDefaultHierarchyLocation2?: string;
  DeviceEventText?: string;
  ValueDurationTicks?: number;
  Value?: string;
  ApplicationDesignation?: string;
  ApplicationLocation?: string;
  PrevValueDurationTicks?: number;
  PrevValue?: string;
  MessageText?: string;
  Error?: string;
  RecordTypeId?: string;
  EventStateId?: string;
}

// ------------------------------------------------ HistoryLogMetaData --------------------------------------------

/**
 * The data model of histroy log meta data is returned by getHistoryLogMetaData().
 * i.e. GET GET /api/historylogs/{systemId}
 */
export interface HistoryLogMetaData {
  Name: string;
  Descriptor: string;
  Description: string;
  HasChildColumns: boolean;
  HasConditionFilter: boolean;
  HasNameFilter: boolean;
  HasTimeFilter: boolean;
  HasTimeFilterDefinedBySource: boolean;
  HasAndOperatorOnly: boolean;
  HasMaxAge: boolean;
  HasSingleNameFilter: boolean;
  SupportedTypes: string[];
}

// --------------------------------------------- HistLogColumnDescripton ------------------------------------------

export interface HistLogColumnDescription {
  Name: string;
  Descriptor: string;
  DataType: string;
  ErrorSupport: boolean;
  IsArray: boolean;
  IsDefault: boolean;
  IsHidden: boolean;
  IsSortable: boolean;
  IsEnum: boolean;
  IsFilterable: boolean;
}

// ---------------------------------------------- RowDataOnSelection ----------------------------------------------

export interface LogViewRowData {
  // Not displayed in UX
  id: number;
  // Not displayed in UX
  eventId: number | undefined;
  dateTime: Date | undefined;
  localeDateTimeString: string;
  utcMilliseconds: number;
  logKind: string;
  sourceDescription: string;
  sourceProperty: string;
  messageText: string;
  eventCategory: string;
}

// ---------------------------------------------- Log View Definition Filters ----------------------------------------------
export interface LogViewDefinitionFilters {
  ErrorInfo?: string;
  LogViewDefinationInfo: LogViewDefinitionInfo;
}
export interface Filter {
  Name: string;
  Label: string;
  Operator: string;
  Value: string[];
}

export interface LogViewDefinitionInfo {
  LogViewDefinitionId: string,
  LogViewDefinitionName: string,
  ConditionFilter: Filter[],
  TimeRangeFilter: TimeRangeFilter
}
export interface FlexUpdateLogViewDefinition {
  FlexLogViewDefinition: LogViewDefinitionInfo,
  Designation: string,
  CNSNode: CNSNode,
  LvdObjectId: string,
  ValidationInput: ValidationInput
}
export interface TimeRangeFilter {
  Label: string,
  TimeRangeSelectionType: TimeRangeSelectionEnum,
  Relative?: Relative,
  Absolute?: Absolute
}
export interface Relative {
  Current: boolean,
  Unit: number,
  Option: RelativeTimeUnitEnum
}
export interface Absolute {
  From: string
  To?: string
  Operator?: string
}
export enum TimeRangeSelectionEnum {
  None = 0,
  Absolute = 1,
  Relative = 2,
  DefinedBySource = 3,
  Null = 4,
  Exact = 5
}
export enum RelativeTimeUnitEnum {
  Minutes = 1,
  Hours = 2,
  Days = 3,
  Weeks = 4,
  Months = 5,
  Years = 6
}

// ------------------------------------------------ Selected Row Details -------------------------------------------

export interface RowDetailsDescription {
  logViewResult: LogViewResult;
  columnDescriptionMap: Map<string, HistLogColumnDescription>;
}

// ------------------------------------------------ HistLogEnumValues ---------------------------------------------

export interface HistLogEnumValues {
  EnumValues?: string[];
  ErrorInfo?: string[];
}

// -----------------------------------------------------------------------------------------------------------------
// ------------------------------------------------ActivityEnumValues-----------------------------------------------
export interface ActiviyEnumValues {
  ColumnEnumValues?: EnumVals[];
}
// -------------------------------------------------------------------------------------------------------------------
export interface EnumVals {
  ColumnName: string;
  SupportedEnumValues?: string[];
}
export interface SortColumnData {
  Name: string;
  SortType: string;
}

// -------------------------------------------HistoryLogDataParameters--------------------------------------------

export interface HistoryApiParams {
  systemId: number;
  historyLogKind: HistoryLogKind;
  conditionFilter?: string;
  fromDate?: Date;
  toDate?: Date;
  size?: number;
  snapshotSize?: number;
  parentColumns?: string[];
  childColumns?: string[];
  sortColumnData?: SortColumnData[];
  nameFilter?: string[];
  pageNumber?: number;
  snapshotId?: string;
  additionalInfo?: string;
}

export interface SendSelectionForHistoryLogs {
  designation: string,
  alertId: string,
  recordType: string,
  internalName: string,
  pageSize: number,
}

export interface FinalSection {
  sectionLabel?: string;
  sectionKey?: string;
  column1?: Control[];
  column2?: Control[];
}
export interface DetailPane {
  sections?: Sections;
  controls?: Controls;
  actions?: Action;
  events?: Action;
  hiddenColumns?: string[];
}
export interface Action {
  sections?: Sections;
  activityIcons?: ActivityIcons;
}
export interface Sections {
  [key: string]: Section;
}
export interface Section {
  detailPaneControls?: DetailPaneControls;
  veryDetailPaneControls?: string[];
}
export interface DetailPaneControls {
  column1?: string[];
  column2?: string[];
}
export interface Controls {
  [key: string]: Control;
}
export interface Control {
  label?: string;
  icon?: string;
  columnName?: string;
  veryDetailPane?: boolean;
  extraCssClasses?: string;
}
export interface ActivityIcons {
  [key: string]: ActivityIcon;
}
export interface ActivityIcon {
  descriptor: string;
  icon: string;
  locationColumnName: string;
  sections?: Sections;
  hideMasterLocation?: boolean;
}
export interface ReportDefination {
  ErrorInfo: string;
  ReportDefinationInfo: ReportDefinationInfo;
}
export interface ReportDefinationInfo {
  layoutDefination: layoutDefination;
}
export interface layoutDefination {
  pageContentSection: pageContentSection;
}
export interface pageContentSection {
  Controls: definationControls[];
}
export interface definationControls {
  ControlId: number;
  ControlName: string;
  AssociatedElementId: number;
  AssociatedContentDefinitionId: string;
  ViewElement: boolean;
  TextGroupName: string;
}

export interface TextGroup {
  Value: number;
  LangText: string[];
}

/* eslint-disable @typescript-eslint/naming-convention */
