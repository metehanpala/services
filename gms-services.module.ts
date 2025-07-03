import { CommonModule } from '@angular/common';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { inject, NgModule, provideAppInitializer } from '@angular/core';
import {
  AuthenticationServiceBase,
  ErrorNotificationServiceBase,
  HFW_TRANSLATION_FILE_TOKEN,
  LanguageServiceBase,
  NotificationServiceBase,
  SettingsServiceBase,
  UsersServiceBase } from '@gms-flex/services-common';
import { CookieService } from 'ngx-cookie-service';

import { AppRightsServiceProxy } from './app-rights/app-rights.service-proxy';
import { AuthenticationService } from './authentication/authentication.service';
import { CommandSubscriptionProxyService } from './command/command-subscription-proxy.service';
import { CommandSubscriptionService } from './command/command-subscription.service';
import { CommandSubscriptionServiceBase } from './command/command-subscription.service.base';
import { ExecuteCommandService } from './command/execute-command.service';
import { ReadCommandService } from './command/read-command.service';
import { DiagnosticsService } from './diagnostics/diagnostics.service';
import { DocumentService } from './document/document.service';
import { DocumentServiceBase } from './document/document.service.base';
import { EventCategoriesProxyService } from './event/event-categories-proxy.service';
import { EventCounterProxyService } from './event/event-counter-proxy.service';
import { EventCounterService } from './event/event-counter.service';
import { EventCounterServiceBase } from './event/event-counter.service.base';
import { EventProxyService } from './event/event-proxy.service';
import { EventSoundProxyService } from './event/event-sound-proxy.service';
import { EventSoundService } from './event/event-sound.service';
import { EventSoundServiceBase } from './event/event-sound.service.base';
import { SuppressedObjectsProxyService } from './event/suppressed-objects-proxy.service';
import { SuppressedObjectsService } from './event/suppressed-objects.service';
import { SuppressedObjectsServiceBase } from './event/suppressed-objects.service.base';
import { FilesService } from './files/files.service';
import { SiIconMapperService } from './icons-mapper/si-icon-mapper.service';
import { httpInterceptorProviders } from './interceptors/index';
import { ItemProcessingService } from './item-processing/item-processing.service';
import { ItemProcessingServiceBase } from './item-processing/item-processing.service.base';
import { LanguageService } from './language/language.service';
import { LicenseOptionsService } from './license/license-options.service';
import { LicenseOptionsServiceProxy } from './license/license-options.service-proxy';
import { LicenseProxyService } from './license/license-proxy.service';
import { LicenseService } from './license/license.service';
import { LicenseServiceBase } from './license/license.service.base';
import { LogViewerService } from './log-viewer/log-viewer.service';
import { MultiMonitorConfigurationService } from './multi-monitor/multi-monitor-configuration.service';
import { NotificationService } from './notification/notification.service';
import { ObjectsService } from './objects/objects.service';
import { OperatorTasksSubscriptionsService } from './operator-tasks/operator-tasks-subscriptions.service';
import { OperatorTasksService } from './operator-tasks/operator-tasks.service';
import { PropertyService } from './properties/property.service';
import { PropertyValuesService } from './property-values/property-values.service';
import { OwnershipService, OwnershipServiceBase, UserRolesServiceProxy, UserRolesServiceProxyBase } from './public-api';
import { RelatedItemsService } from './related-items/related-items.service';
import { ReportSubscriptionService } from './report/report-subscription.service';
import { ReportSubscriptionProxyService } from './report/report-subscription.service-proxy';
import { ReportSubscriptionServiceBase } from './report/report-subscription.service.base';
import { ReportService } from './report/report.service';
import { CalendarService } from './scheduler/calendar.service';
import { ScheduleService } from './scheduler/schedule.service';
import { SessionsService, SessionsSubscriptionsService } from './sessions';
import { SettingsService } from './settings/settings.service';
import { ErrorNotificationService } from './shared/error-notification.service';
import { SystemBrowserSubscriptionProxyService } from './system-browser/system-browser-subscription-proxy.service';
import { SystemBrowserSubscriptionService } from './system-browser/system-browser-subscription.service';
import { SystemBrowserSubscriptionServiceBase } from './system-browser/system-browser-subscription.service.base';
import { SystemBrowserService } from './system-browser/system-browser.service';
import { SystemsProxyService } from './systems/systems-proxy.service';
import { SystemsServicesProxyService } from './systems/systems-services-proxy.service';
import { SystemsServicesService } from './systems/systems-services.service';
import { SystemsServicesServiceBase } from './systems/systems-services.service.base';
import { SystemsService } from './systems/systems.service';
import { SystemsServiceBase } from './systems/systems.service.base';
import { TablesService } from './tables/tables.service';
import { TimerService } from './timer/timer.service';
import { TimerServiceBase } from './timer/timer.service.base';
import { TrendService } from './trend/trend.service';
import { UsersService } from './users/users.service';
import { ValueSubscriptionProxyService } from './values-subscriptions/value-subscription-proxy.service';
import { ValueSubscription2Service } from './values-subscriptions/value-subscription2.service';
import { ValueSubscription2ServiceBase } from './values-subscriptions/value-subscription2.service.base';
import { ValueService } from './values/value.service';
import { ValueServiceBase } from './values/value.service.base';
import { WsiEndpointService } from './wsi-endpoint/wsi-endpoint.service';
import { AppRightsServiceProxyBase } from './wsi-proxy-api/app-rights/app-rights.services-proxy.base';
import { CommandSubscriptionProxyServiceBase } from './wsi-proxy-api/command/command-subscription-proxy.service.base';
import { ExecuteCommandServiceBase } from './wsi-proxy-api/command/execute-command.service.base';
import { ReadCommandServiceBase } from './wsi-proxy-api/command/read-command.service.base';
import { DiagnosticsServiceBase } from './wsi-proxy-api/diagnostics/diagnostics.service.base';
import { EventCategoriesProxyServiceBase } from './wsi-proxy-api/event/event-categories-proxy.service.base';
import { EventCounterProxyServiceBase } from './wsi-proxy-api/event/event-counter-proxy.service.base';
import { EventProxyServiceBase } from './wsi-proxy-api/event/event-proxy.service.base';
import { EventSoundProxyServiceBase } from './wsi-proxy-api/event/event-sound-proxy.service.base';
import { SuppressedObjectsProxyServiceBase } from './wsi-proxy-api/event/suppressed-objects-proxy.service.base';
import { FilesServiceBase } from './wsi-proxy-api/files/files.service.base';
import { LicenseOptionsProxyServiceBase } from './wsi-proxy-api/license/license-options.services-proxy.base';
import { LicenseProxyServiceBase } from './wsi-proxy-api/license/license-proxy.service.base';
import { LogViewerServiceBase } from './wsi-proxy-api/log-viewer/log-viewer.service.base';
import { MultiMonitorConfigurationServiceBase } from './wsi-proxy-api/multi-monitor/multi-monitor-configuration.service.base';
import { ObjectsServiceBase } from './wsi-proxy-api/objects/objects.service.base';
import { OperatorTasksSubscriptionsServiceBase } from './wsi-proxy-api/operator-tasks/operator-tasks-subscriptions.service.base';
import { OperatorTasksServiceBase } from './wsi-proxy-api/operator-tasks/operator-tasks.service.base';
import { PropertyServiceBase } from './wsi-proxy-api/properties/property.service.base';
import { PropertyValuesServiceBase } from './wsi-proxy-api/property-values/property-values.service.base';
import { RelatedItemsServiceBase } from './wsi-proxy-api/related-items/related-items.service.base';
import { ReportSubscriptionProxyServiceBase } from './wsi-proxy-api/report/report-subscription-proxy.service.base';
import { ReportServiceBase } from './wsi-proxy-api/report/report.service.base';
import { CalendarServiceBase } from './wsi-proxy-api/scheduler/calendar.service.base';
import { ScheduleServiceBase } from './wsi-proxy-api/scheduler/schedule.service.base';
import { SessionsServiceBase } from './wsi-proxy-api/sessions';
import {
  SessionsSubscriptionsServiceBase
} from './wsi-proxy-api/sessions/sessions-subscriptions.service.base';
import { SystemBrowserSubscriptionProxyServiceBase } from './wsi-proxy-api/system-browser/system-browser-subscription-proxy.service.base';
import { SystemBrowserServiceBase } from './wsi-proxy-api/system-browser/system-browser.service.base';
import { SystemsProxyServiceBase } from './wsi-proxy-api/systems/systems-proxy.service.base';
import { SystemsServicesProxyServiceBase } from './wsi-proxy-api/systems/systems-services-proxy.service.base';
import { TablesServiceBase } from './wsi-proxy-api/tables/tables.service.base';
import { TrendServiceBase } from './wsi-proxy-api/trend/trend.service.base';
import { ValueSubscriptionProxyServiceBase } from './wsi-proxy-api/values-subscriptions/value-subscription-proxy.service.base';

export const initAppWsiSettings = (wsiEndpointService: WsiEndpointService): any => {
  const y: any = () => wsiEndpointService.readEntryPointFile().toPromise();
  return y;
};

export const initGlobalTables = (siIconMapperService: SiIconMapperService): any => {
  const y: any = () => siIconMapperService.getTablesData().toPromise();
  return y;
};

@NgModule({ imports: [CommonModule], providers: [
  { provide: HFW_TRANSLATION_FILE_TOKEN, useValue: './@gms-flex/services/i18n/', multi: true },
  { provide: AppRightsServiceProxyBase, useClass: AppRightsServiceProxy },
  { provide: ErrorNotificationServiceBase, useClass: ErrorNotificationService },
  { provide: LanguageServiceBase, useClass: LanguageService },
  { provide: AuthenticationServiceBase, useClass: AuthenticationService },
  { provide: SystemBrowserServiceBase, useClass: SystemBrowserService },
  { provide: SystemBrowserSubscriptionServiceBase, useClass: SystemBrowserSubscriptionService },
  { provide: SystemBrowserSubscriptionProxyServiceBase, useClass: SystemBrowserSubscriptionProxyService },
  { provide: SystemsProxyServiceBase, useClass: SystemsProxyService },
  { provide: SystemsServicesProxyServiceBase, useClass: SystemsServicesProxyService },
  { provide: SystemsServiceBase, useClass: SystemsService },
  { provide: SystemsServicesServiceBase, useClass: SystemsServicesService },
  { provide: PropertyServiceBase, useClass: PropertyService },
  { provide: PropertyValuesServiceBase, useClass: PropertyValuesService },
  { provide: DiagnosticsServiceBase, useClass: DiagnosticsService },
  { provide: TablesServiceBase, useClass: TablesService },
  { provide: SettingsServiceBase, useClass: SettingsService },
  { provide: EventSoundProxyServiceBase, useClass: EventSoundProxyService },
  { provide: EventSoundServiceBase, useClass: EventSoundService },
  { provide: EventCounterServiceBase, useClass: EventCounterService },
  { provide: EventCounterProxyServiceBase, useClass: EventCounterProxyService },
  { provide: EventCategoriesProxyServiceBase, useClass: EventCategoriesProxyService },
  { provide: SuppressedObjectsServiceBase, useClass: SuppressedObjectsService },
  { provide: SuppressedObjectsProxyServiceBase, useClass: SuppressedObjectsProxyService },
  { provide: EventProxyServiceBase, useClass: EventProxyService },
  { provide: ObjectsServiceBase, useClass: ObjectsService },
  { provide: TimerServiceBase, useClass: TimerService },
  { provide: NotificationServiceBase, useClass: NotificationService },
  { provide: 'wsiSettingFilePath', useValue: 'config/wsi-endpoint.settings.json' },
  { provide: 'tablesDataPath', useValue: 'config/text-groups-and-icons.json' },
  { provide: ValueServiceBase, useClass: ValueService },
  { provide: ValueSubscription2ServiceBase, useClass: ValueSubscription2Service },
  { provide: ReadCommandServiceBase, useClass: ReadCommandService },
  { provide: ValueSubscriptionProxyServiceBase, useClass: ValueSubscriptionProxyService },
  { provide: ExecuteCommandServiceBase, useClass: ExecuteCommandService },
  { provide: CommandSubscriptionProxyServiceBase, useClass: CommandSubscriptionProxyService },
  { provide: CommandSubscriptionServiceBase, useClass: CommandSubscriptionService },
  { provide: FilesServiceBase, useClass: FilesService },
  { provide: DocumentServiceBase, useClass: DocumentService },
  { provide: ItemProcessingServiceBase, useClass: ItemProcessingService },
  httpInterceptorProviders,
  provideAppInitializer(() => {
    const initializerFn = (initAppWsiSettings)(inject(WsiEndpointService));
    return initializerFn();
  }),
  provideAppInitializer(() => {
    const initializerFn = (initGlobalTables)(inject(SiIconMapperService));
    return initializerFn();
  }),
  { provide: TrendServiceBase, useClass: TrendService },
  { provide: RelatedItemsServiceBase, useClass: RelatedItemsService },
  { provide: ScheduleServiceBase, useClass: ScheduleService },
  { provide: CalendarServiceBase, useClass: CalendarService },
  { provide: LicenseServiceBase, useClass: LicenseService },
  { provide: LicenseProxyServiceBase, useClass: LicenseProxyService },
  { provide: LicenseOptionsService, useClass: LicenseOptionsService },
  { provide: LicenseOptionsProxyServiceBase, useClass: LicenseOptionsServiceProxy },
  { provide: ReportServiceBase, useClass: ReportService },
  { provide: ReportSubscriptionServiceBase, useClass: ReportSubscriptionService },
  { provide: ReportSubscriptionProxyServiceBase, useClass: ReportSubscriptionProxyService },
  { provide: LogViewerServiceBase, useClass: LogViewerService },
  { provide: UsersServiceBase, useClass: UsersService },
  { provide: OwnershipServiceBase, useClass: OwnershipService },
  { provide: MultiMonitorConfigurationServiceBase, useClass: MultiMonitorConfigurationService },
  { provide: UserRolesServiceProxyBase, useClass: UserRolesServiceProxy },
  { provide: OperatorTasksServiceBase, useClass: OperatorTasksService },
  { provide: OperatorTasksSubscriptionsServiceBase, useClass: OperatorTasksSubscriptionsService },
  { provide: SessionsServiceBase, useClass: SessionsService },
  { provide: SessionsSubscriptionsServiceBase, useClass: SessionsSubscriptionsService },
  provideHttpClient(withInterceptorsFromDi())
] })

export class GmsServicesModule {}