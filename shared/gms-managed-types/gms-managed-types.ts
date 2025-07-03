export interface GmsManagedType {
  id: number;
  name: string;
}

/* eslint-disable @typescript-eslint/naming-convention */

export class GmsManagedTypes {
  // -------------------------------------------------------------------------------------------------
  // Core managed types
  public static POINT: GmsManagedType = { id: 0, name: 'Point' };
  public static BACNET_POINT: GmsManagedType = { id: 27, name: 'BACnetPoint' };
  public static BACNET_DEVICE: GmsManagedType = { id: 80, name: 'BACnet Device' };
  public static GRAPHIC: GmsManagedType = { id: 1, name: 'Graphic' };
  public static GRAPHIC_PAGE: GmsManagedType = { id: 42, name: 'GraphicPage' };
  public static PROJECT_GRAPHIC_ROOT_FOLDER: GmsManagedType = { id: 43, name: 'ProjectGraphicRootFolder' };
  public static GRAPHIC_TEMPLATE: GmsManagedType = { id: 104, name: 'GraphicTemplate' };

  // schedule managed types
  public static CALENDAR: GmsManagedType = { id: 83, name: 'Calendar' };
  public static SCHEDULE: GmsManagedType = { id: 84, name: 'Schedule' };
  public static SCHEDULE_FOLDER: GmsManagedType = { id: 82, name: 'Schedule Folder' };

  // BACnet Schedule managed types
  public static BACNET_CALENDAR_FOLDER: GmsManagedType = { id: 89, name: 'BACnet Calendar Folder' };
  public static BACNET_SCHEDULE_FOLDER: GmsManagedType = { id: 91, name: 'BACnet Schedule Folder' };
  public static BACNET_SCHEDULE: GmsManagedType = { id: 47, name: 'BACnet Schedule' };
  public static BACNET_CALENDAR: GmsManagedType = { id: 48, name: 'BACnet Calendar' };

  // Management station schedule managed types
  public static WORKSTATION_CALENDAR_FOLDER: GmsManagedType = { id: 92, name: 'Workstation Calendar Folder' };
  public static WORKSTATION_SCHEDULE_FOLDER: GmsManagedType = { id: 94, name: 'Workstation Schedule Folder' };
  public static WORKSTATION_SCHEDULE: GmsManagedType = { id: 192502, name: 'ManagementStation Schedule' };
  public static WORKSTATION_CALENDAR: GmsManagedType = { id: 192504, name: 'ManagementStation Calendar' };
  public static WORKSTATION_SCENE: GmsManagedType = { id: 192503, name: 'ManagementStation Scene' };

  // Apogee p2 zones managed types
  public static APOGEE_ZONE: GmsManagedType = { id: 10008, name: 'Apogee Zone' };
  public static APOGEE_REPLACEMENT_DAY: GmsManagedType = { id: 10014, name: 'Apogee Replacement Day' };
  public static APOGEE_ZONE_FOLDER: GmsManagedType = { id: 10012, name: 'Apogee Zone Folder' };

  // Siclimat schedule managed types
  public static SICLIMAT_SCHEDULE: GmsManagedType = { id: 22101, name: 'SiclimatXSchedule' };
  public static SICLIMAT_CALENDAR: GmsManagedType = { id: 22102, name: 'SiclimatXCalendar' };
  public static SICLIMAT_CALENDAR_FOLDER: GmsManagedType = { id: 22103, name: 'SiclimatXScheduleContainer' };
  public static SICLIMAT_SCENE: GmsManagedType = { id: 22104, name: 'SiclimatXScene' };
  
  // S7-HVAC managed types
  public static S7HVAC_SCHEDULE: GmsManagedType = { id: 24000, name: 'S7Schedule' };
  public static S7HVAC_CALENDAR: GmsManagedType = { id: 24001, name: 'S7Calendar' };

  // Trend manged types
  public static TREND_FOLDER: GmsManagedType = { id: 59, name: 'TrendsFolder' };
  public static TREND_LOG: GmsManagedType = { id: 58, name: 'TrendLog' };
  public static TREND_LOG_ONLINE: GmsManagedType = { id: 60, name: 'TrendLogOnline' };
  public static TREND_LOG_PREDICTED: GmsManagedType = { id: 248, name: 'TrendLogPredicted' };
  public static NEW_TREND: GmsManagedType = { id: 96, name: 'NewTrend' };
  public static TRENDVIEWDEFINITION: GmsManagedType = { id: 57, name: 'TrendViewDefinition' };

  // Document managed types
  public static EXTERNAL_DOCUMENT: GmsManagedType = { id: 78, name: 'External Document' };
  public static FILE_VIEWER: GmsManagedType = { id: 73, name: 'File Viewer' };
  public static OPSTEP_DOCUMENT_VIEWER: GmsManagedType = { id: 138, name: 'OPStepDocumentViewer' };

  // License  managed types
  public static LICENSE: GmsManagedType = { id: 8, name: 'License' }

  // -------------------------------------------------------------------------------------------------
  // EM managed types
  public static TRA_TECHOP: GmsManagedType = { id: 90004, name: 'TechOP' };
  public static GROUP_MASTER: GmsManagedType = { id: 90001, name: 'GroupMaster' };
  // Reports Managed Typees
  public static REPORTS: GmsManagedType = { id: 50, name: 'Reports' };
  public static REPORT_FOLDER: GmsManagedType = { id: 51, name: 'ReportFolder' };
  public static REPORT_DEFINITION: GmsManagedType = { id: 13, name: 'ReportDefinition' };
}

/* eslint-enable @typescript-eslint/naming-convention */
