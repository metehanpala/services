/* eslint-disable @typescript-eslint/naming-convention */

enum TraceModulesEn {
  gmsServices_AppRights,
  gmsServices_Authentication,
  gmsServices_AdvanceReporting,
  gmsServices_CnsHelper,
  gmsServices_Diagnostics,
  gmsServices_Events,
  gmsServices_EventsTiming,
  gmsServices_EventsSound,
  gmsServices_EventNotifications,
  gmsServices_EventCounterTiming,
  gmsServices_EventCounterNotifications,
  gmsServices_EventSoundNotifications,
  gmsServices_Image,
  gmsServices_Instrumentation,
  gmsServices_Language,
  gmsServices_LightEvents,
  gmsServices_Product,
  gmsServices_Property,
  gmsServices_SignalR,
  gmsServices_SystemBrowser,
  gmsServices_SystemBrowserNotification,
  gmsServices_Tables,
  gmsServices_Trends,
  gmsServices_Utilities,
  gmsServices_Values,
  gmsServices_ValueNotifications,
  gmsServices_SubscriptionNotification,
  gmsServices_Command,
  gmsServices_CommandNotifications,
  gmsServices_Graphics,
  gmsServices_Schedule,
  gmsServices_Calendar,
  gmsServices_Files,
  gmsServices_Settings,
  gmsServices_Systems,
  gmsServices_SystemsNotification,
  gmsServices_Timer,
  gmsServices_Notification,
  gmsServices_Document,
  gmsServices_ItemProcessing,
  gmsServices_RelatedItems,
  gmsServices_AssistedTreatment,
  gmsServices_Users,
  gmsServices_Objects,
  gmsServices_License,
  gmsServices_Roles,
  gmsServices_HistoryLog,
  gmsServices_MultiMonitor,
  gmsServices_Ownership,
  gmsServices_OperatorTasks,
  gmsServices_Sessions
}

/* eslint-enable @typescript-eslint/naming-convention */

export class TraceModules {
  public static appRights: string = TraceModulesEn[TraceModulesEn.gmsServices_AppRights];
  public static authentication: string = TraceModulesEn[TraceModulesEn.gmsServices_Authentication];
  public static advanceReporting: string = TraceModulesEn[TraceModulesEn.gmsServices_AdvanceReporting];
  public static diagnostics: string = TraceModulesEn[TraceModulesEn.gmsServices_Diagnostics];
  public static events: string = TraceModulesEn[TraceModulesEn.gmsServices_Events];
  public static eventsTiming: string = TraceModulesEn[TraceModulesEn.gmsServices_EventsTiming];
  public static eventsSound: string = TraceModulesEn[TraceModulesEn.gmsServices_EventsSound];
  public static eventCounterTiming: string = TraceModulesEn[TraceModulesEn.gmsServices_EventCounterTiming];
  public static eventNotifications: string = TraceModulesEn[TraceModulesEn.gmsServices_EventNotifications];
  public static eventCounterNotifications: string = TraceModulesEn[TraceModulesEn.gmsServices_EventCounterNotifications];
  public static eventSoundNotifications: string = TraceModulesEn[TraceModulesEn.gmsServices_EventSoundNotifications];
  public static files: string = TraceModulesEn[TraceModulesEn.gmsServices_Files];
  public static image: string = TraceModulesEn[TraceModulesEn.gmsServices_Image];
  public static language: string = TraceModulesEn[TraceModulesEn.gmsServices_Language];
  public static lightEvents: string = TraceModulesEn[TraceModulesEn.gmsServices_LightEvents];
  public static product: string = TraceModulesEn[TraceModulesEn.gmsServices_Product];
  public static property: string = TraceModulesEn[TraceModulesEn.gmsServices_Property];
  public static utilities: string = TraceModulesEn[TraceModulesEn.gmsServices_Utilities];
  public static signalR: string = TraceModulesEn[TraceModulesEn.gmsServices_SignalR];
  public static sysBrowser: string = TraceModulesEn[TraceModulesEn.gmsServices_SystemBrowser];
  public static sysBrowserNotification: string = TraceModulesEn[TraceModulesEn.gmsServices_SystemBrowserNotification];
  public static tables: string = TraceModulesEn[TraceModulesEn.gmsServices_Tables];
  public static trends: string = TraceModulesEn[TraceModulesEn.gmsServices_Trends];
  public static values: string = TraceModulesEn[TraceModulesEn.gmsServices_Values];
  public static valueNotifications: string = TraceModulesEn[TraceModulesEn.gmsServices_ValueNotifications];
  public static subscriptionNotifications: string = TraceModulesEn[TraceModulesEn.gmsServices_SubscriptionNotification];
  public static cnsHelper: string = TraceModulesEn[TraceModulesEn.gmsServices_CnsHelper];
  public static instrumentation: string = TraceModulesEn[TraceModulesEn.gmsServices_Instrumentation];
  public static command: string = TraceModulesEn[TraceModulesEn.gmsServices_Command];
  public static commandNotifications: string = TraceModulesEn[TraceModulesEn.gmsServices_CommandNotifications];
  public static graphics: string = TraceModulesEn[TraceModulesEn.gmsServices_Graphics];
  public static scheduler: string = TraceModulesEn[TraceModulesEn.gmsServices_Schedule];
  public static calendar: string = TraceModulesEn[TraceModulesEn.gmsServices_Calendar];
  public static settings: string = TraceModulesEn[TraceModulesEn.gmsServices_Settings];
  public static systems: string = TraceModulesEn[TraceModulesEn.gmsServices_Systems];
  public static systemsNotification: string = TraceModulesEn[TraceModulesEn.gmsServices_SystemsNotification];
  public static timer: string = TraceModulesEn[TraceModulesEn.gmsServices_Timer];
  public static notification: string = TraceModulesEn[TraceModulesEn.gmsServices_Notification];
  public static document: string = TraceModulesEn[TraceModulesEn.gmsServices_Document];
  public static itemProcessing: string = TraceModulesEn[TraceModulesEn.gmsServices_ItemProcessing];
  public static relatedItems: string = TraceModulesEn[TraceModulesEn.gmsServices_RelatedItems];
  public static assistedTreatment: string = TraceModulesEn[TraceModulesEn.gmsServices_AssistedTreatment];
  public static users: string = TraceModulesEn[TraceModulesEn.gmsServices_Users];
  public static objects: string = TraceModulesEn[TraceModulesEn.gmsServices_Objects];
  public static license: string = TraceModulesEn[TraceModulesEn.gmsServices_License];
  public static roles: string = TraceModulesEn[TraceModulesEn.gmsServices_Roles];
  public static historyLog: string = TraceModulesEn[TraceModulesEn.gmsServices_HistoryLog];
  public static multiMonitor: string = TraceModulesEn[TraceModulesEn.gmsServices_MultiMonitor];
  public static ownership: string = TraceModulesEn[TraceModulesEn.gmsServices_Ownership];
  public static operatorTasks: string = TraceModulesEn[TraceModulesEn.gmsServices_OperatorTasks];
  public static sessions: string = TraceModulesEn[TraceModulesEn.gmsServices_Sessions];
}