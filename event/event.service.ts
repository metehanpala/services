import { Injectable, NgZone } from '@angular/core';
import { Action, CustomData, CustomSetting, isNullOrUndefined, NotifConfiguration, Notification,
  NotificationServiceBase, TraceService } from '@gms-flex/services-common';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import _ from 'lodash';
import { asyncScheduler, BehaviorSubject, Observable, Observer, of, Subject, Subscription } from 'rxjs';
import { observeOn, share } from 'rxjs/operators';

import { TablesEx } from '../icons-mapper/data.model';
import { SiIconMapperService } from '../icons-mapper/si-icon-mapper.service';
import { DiagnosticsServiceBase } from '../public-api';
import { EventMessage, EventMessageType, MultiMonitorServiceBase } from '../shared';
import { SubscriptionUtility } from '../shared/subscription/subscription-utility';
import { TraceModules } from '../shared/trace-modules';
import { TimerServiceBase } from '../timer/timer.service.base';
import { EventDetailsList, WSIEvent } from '../wsi-proxy-api/event/data.model';
import { EventProxyServiceBase } from '../wsi-proxy-api/event/event-proxy.service.base';
import { ConnectionState, ValidationInput } from '../wsi-proxy-api/shared/data.model';
import { EventColors, Tables, TextEntry } from '../wsi-proxy-api/tables/data.model';
import { TablesServiceBase } from '../wsi-proxy-api/tables/tables.service.base';
import { CategoryService } from './category.service';
import { AutoTreatStruct, Category, ConsumerInfo, Discipline, Event, EventDateTimeFilterValues, EventFilter, EventStates,
  EventSubscription, SubDiscipline } from './data.model';
import { EventBase } from './event.service.base';

const select = 'select';
const suspend = 'suspend';

const enum OnNewEvent {
  DoNothing = 'DoNothing',
  OpenEventList = 'OpenEventList',
  StartFastTreatment = 'StartFastTreatment',
  StartInvestigativeTreatment = 'StartInvestigativeTreatment',
  StartAssistedTreatment = 'StartAssistedTreatment'
}

const enum CloseTreatmentWhen {
  EventAcknowledged = 'EventAcknowledged',
  SourceToNormal = 'SourceToNormal',
  EventReset = 'EventReset',
  EventClosed = 'EventClosed',
  Timeout = 'Timeout'
}

/**
 * Event service.
 * Provides the functionality to read events from WSI.
 *
 * @export
 * @class EventService
 * @extends {EventBase}
 */
@Injectable({
  providedIn: 'root'
})
export class EventService extends EventBase {
  public manageGroupedEvents = true;
  public lampsCnfg!: string;
  public automaticTreatmentEventObs: Observable<AutoTreatStruct | undefined>;
  public loginTime: any;
  public mmSelectedEventsIds!: Observable<string[]>;

  private readonly mmSelectedEventsIdsSub: BehaviorSubject<string[]> = new BehaviorSubject<string[]>([]);
  private readonly automaticTreatmentEvent: Subject<AutoTreatStruct | undefined > = new Subject<AutoTreatStruct | undefined>();
  private subscribedEvents: BehaviorSubject<Event[] | never[]> = new BehaviorSubject<Event[] | never[]>([]);
  private visibleCategories: number[] = [];
  private defaultCategory = 0;
  private readonly allEvents: Map<string, Event> = new Map<string, Event>();
  private allEventSubscription: Subscription = null!;
  private gotDisconnected = false;
  private categories: Category[] = [];
  private readonly disciplines: Discipline[] = [];
  private eventBlinkObservable!: Observable<boolean>;
  private _snapinsSubscribed = 0;
  private showHiddenEvents = false;
  private readonly _notificationSenderNewEvents = 'newEvents';
  private readonly _notificationSenderBackToNormal = 'backToNormal';
  private _newEventsDescriptionLabel = '';
  private _newEventsToastTitle = '';
  private _backToNormalToastTitle = '';
  private readonly _eventsCounted: Map<string, WSIEvent> = new Map<string, WSIEvent>();
  private _enableNotifications = false;
  private _notificationHideLabel = '';
  private _discardFirstEvents = true;
  private _discardFirstEventsBackToNormal = true;
  private _firstEventDate: Date = undefined!;
  private _configuration!: NotifConfiguration;
  private _configurationBackToNormal!: NotifConfiguration;
  private _notifconfigNameLabel = '';
  private _notifconfigShowLabel = '';
  private _notifconfigSoundLabel = '';
  private _consumersId = 1;
  private readonly _consumersInfo: Map<number, ConsumerInfo> = new Map<number, ConsumerInfo>();
  private _autoRemoveFilter = false;
  private hiddenEventsChanged = false;
  private commandExecutionSubscription: Subscription | null = null;
  private readonly _isAssistedTreatment: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  private readonly selectedEvents: Event[] = [];

  constructor(
    private readonly traceService: TraceService,
    private readonly categoryService: CategoryService,
    private readonly tablesService: TablesServiceBase,
    private readonly iconMapperService: SiIconMapperService,
    private readonly eventProxyService: EventProxyServiceBase,
    private readonly timerService: TimerServiceBase,
    private readonly notificationService: NotificationServiceBase,
    private readonly translateService: TranslateService,
    private readonly multimonitorService: MultiMonitorServiceBase,
    private readonly diagnosticService: DiagnosticsServiceBase,
    private readonly ngZone: NgZone) {
    super();
    this.traceService.info(TraceModules.events, 'EventService created.');
    this.automaticTreatmentEventObs = this.automaticTreatmentEvent.asObservable();

    this.eventProxyService.notifyConnectionState().subscribe(connectionState => this.onNotifyConnectionState(connectionState));
    // create and initialize default consumer info (for EL and SB)
    this.createEventSubscription();

    this.diagnosticService.ping().subscribe((res: any) => {
      const r = res;
      this.loginTime = Date.parse(res.ServerDateTime);
    });

    this.translateService.onLangChange.subscribe((_event: LangChangeEvent) => {
      this.translateService.get([
        'GMS_SERVICES.NEW_EVENT_TOAST_TITLE',
        'GMS_SERVICES.NEW_EVENT_DESCRIPTION',
        'GMS_SERVICES.NOTIFICATION_HIDE_LABEL',
        'GMS_SERVICES.NOTIFICATION_CONFIGURATION.NAME',
        'GMS_SERVICES.NOTIFICATION_CONFIGURATION.CONFIG_SHOW',
        'GMS_SERVICES.NOTIFICATION_CONFIGURATION.CONFIG_SOUND',
        'GMS_SERVICES.BACK_TO_NORMAL_TOAST_TITLE',
        'GMS_SERVICES.WEBCLIENT-INPROCESSBY'
      ]).subscribe(res => {
        this._newEventsToastTitle = res['GMS_SERVICES.NEW_EVENT_TOAST_TITLE'];
        this._newEventsDescriptionLabel = res['GMS_SERVICES.NEW_EVENT_DESCRIPTION'];
        this._notificationHideLabel = res['GMS_SERVICES.NOTIFICATION_HIDE_LABEL'];
        this._notifconfigNameLabel = res['GMS_SERVICES.NOTIFICATION_CONFIGURATION.NAME'];
        this._notifconfigShowLabel = res['GMS_SERVICES.NOTIFICATION_CONFIGURATION.CONFIG_SHOW'];
        this._notifconfigSoundLabel = res['GMS_SERVICES.NOTIFICATION_CONFIGURATION.CONFIG_SOUND'];
        this._backToNormalToastTitle = res['GMS_SERVICES.BACK_TO_NORMAL_TOAST_TITLE'];
        Event.webClientString = res['GMS_SERVICES.WEBCLIENT-INPROCESSBY'];
      });
    });

    this.notificationService.subscribeConfigurations().subscribe(res => {
      this._configuration = res.get(this._notificationSenderNewEvents)!;
    });

    this.notificationService.subscribeConfigurations().subscribe(res => {
      this._configurationBackToNormal = res.get(this._notificationSenderBackToNormal)!;
    });
  }

  public get visibleCategoryLamps(): number[] {
    return this.visibleCategories;
  }

  public set visibleCategoryLamps(visibleLamps: number[]) {
    this.visibleCategories = visibleLamps;
  }

  public get defaultCategoryLamp(): number {
    return this.defaultCategory;
  }

  public set defaultCategoryLamp(defaultLamp: number) {
    this.defaultCategory = defaultLamp;
  }

  public setEnableNotifications(enabled: boolean): void {
    this._enableNotifications = enabled;
  }

  public setDiscardNotifications(): void {
    this._discardFirstEvents = true;
    this._discardFirstEventsBackToNormal = true;
  }

  public addConsumer(): void {
    if (this.snapinsSubscribed != null) {
      if (this.snapinsSubscribed === 0) {
        this.registerNotifications();
      }
      this._snapinsSubscribed++;
    }
  }

  public removeConsumer(): void {
    if (this.snapinsSubscribed != null && this.snapinsSubscribed !== 0) {
      this._snapinsSubscribed--;
      if (this._snapinsSubscribed === 0) {
        this.traceService.info(TraceModules.events, 'No subscribed snapins, unsubscribing from events.');
        this.unSubscribeEvents();
      }
    }
  }

  public createEventSubscription(eventFilter?: EventFilter, newConsumer: boolean = false): EventSubscription {
    if (this._consumersInfo.size > 0 && !newConsumer && (eventFilter == null || (eventFilter.srcDesignations === undefined &&
      eventFilter.categories === undefined && eventFilter.srcPropertyIds === undefined && !eventFilter.empty))) {
      if (this._consumersInfo.get(0) !== undefined && this._consumersInfo.get(0)!.eventsSubject.hasError === false) {
        return this._consumersInfo.get(0)!.subcription;
      } else {
        this.traceService.info(TraceModules.events, 'Default event subscription is undefined, it will be recreated');
        this._consumersInfo.delete(0);
      }
    }

    const info: ConsumerInfo = new ConsumerInfo(new BehaviorSubject<Event[] | null>(null)!, new BehaviorSubject<EventFilter | null>(null), new Subject(), 0,
      new EventSubscription(0, (new BehaviorSubject(this.getAllDefinedEventsAsArray().map(event => {
        event.resetState();
        return event;
      }))).asObservable(), (new BehaviorSubject<EventFilter | null>(eventFilter!)).asObservable(), (new Subject<string>()).asObservable()));

    if (eventFilter == null) {
      info.subcription.id = 0;
      eventFilter = new EventFilter(true);
    } else {
      info.subcription.id = this._consumersId;
      this._consumersId++;
    }

    info.eventsSubject = new BehaviorSubject<Event[] | null>(this.getAllDefinedEventsAsArray().map(event => {
      event.resetState();
      return event;
    }));
    info.filterSubject = new BehaviorSubject<EventFilter | null>(eventFilter);
    info.connectionStateSubject = new Subject();
    info.subcription.events = info.eventsSubject.asObservable();
    info.subcription.filter = info.filterSubject.asObservable();
    info.subcription.connectionState = info.connectionStateSubject.asObservable();
    this._consumersInfo.set(info.subcription.id, info);
    this.realignEventsWithFilter(info.subcription.id);

    return info.subcription;
  }

  public destroyEventSubscription(id?: number): void {
    if (id != null && id > 0) {
      if (this._consumersInfo.has(id)) {
        this._consumersInfo.delete(id);
      }
    } else {
      const consumer: ConsumerInfo = this._consumersInfo.get(0)!;

      consumer.referenceCounter--;
    }
  }

  public setEventsFilter(eventFilter: EventFilter, id?: number, forceEventFilter = false): void {
    eventFilter.empty = !((eventFilter.categories !== undefined && eventFilter.categories.length > 0) ||
      (eventFilter.disciplines !== undefined && eventFilter.disciplines.length > 0) ||
      (eventFilter.states !== undefined && eventFilter.states.length > 0) ||
      (eventFilter.srcState !== undefined && eventFilter.srcState.length > 0) ||
      (eventFilter.srcDescriptor !== undefined && eventFilter.srcDescriptor.length > 0) ||
      (eventFilter.srcAlias !== undefined && eventFilter.srcAlias.length > 0) ||
      (eventFilter.srcName !== undefined && eventFilter.srcName.length > 0) ||
      (eventFilter.srcSystem !== undefined && eventFilter.srcSystem.length > 0) ||
      (eventFilter.hiddenEvents !== undefined && eventFilter.hiddenEvents !== false) ||
      (eventFilter.srcDesignations !== undefined && eventFilter.srcDesignations.length > 0) ||
      (eventFilter.creationDateTime !== undefined && eventFilter.creationDateTime !== EventDateTimeFilterValues.None));

    if (this.defaultCategory > 0 && eventFilter.categories !== undefined && eventFilter.categories.length > 0 &&
         eventFilter.categories.includes(this.defaultCategory)) {
      this.categories.forEach(c => {
        if (this.visibleCategories.includes(c.id) === false) {
          eventFilter.categories!.push(c.id);
        }
      });
    }

    if (id == null) {
      id = 0;
    }
    if (this._consumersInfo.has(id)) {
      this._consumersInfo.get(id)!.filterSubject.next(eventFilter);
    }
  }

  public realignEventsWithFilter(id?: number): void {
    if (id == null) {
      id = 0;
    }
    if (this._consumersInfo.has(id)) {
      (this._consumersInfo.get(id)!.eventsSubject.next(this.getAllDefinedEventsAsArray().map(event => {
        event.resetState();
        return event;
      }).filter(event => this.eventsFilterPredicate(event, id!))));
    }
  }

  public get snapinsSubscribed(): number {
    if (this._snapinsSubscribed != null) {
      return this._snapinsSubscribed;
    } else {
      this.traceService.info(TraceModules.events, 'not able to retrieve number of Snapin\'s subscribed');
      return 0;
    }
  }

  public getCategories(): Category[] {
    return this.categories;
  }

  public getDisciplines(): Discipline[] {
    return this.disciplines;
  }

  public getCategory(categoryId: number): Category {
    const foundCategory: Category = this.categories.find((category: Category) => category.id === categoryId)!;
    if (foundCategory !== undefined) {
      return foundCategory;
    }
    return null!;
  }

  public getDiscipline(disciplineId: number): Discipline {
    const foundDiscipline: Discipline = this.disciplines.find((discipline: Discipline) => discipline.id === disciplineId)!;
    if (foundDiscipline !== undefined) {
      return foundDiscipline;
    }
    return null!;
  }

  public getSubDiscipline(disciplineId: number, subDisciplineId: number): SubDiscipline {
    const foundDiscipline: Discipline = this.disciplines.find((discipline: Discipline) => discipline.id === disciplineId)!;
    if (foundDiscipline !== undefined) {
      const foundSubDiscipline: SubDiscipline = foundDiscipline.subDisciplines!.find((subDiscipline: SubDiscipline) => subDiscipline.id === subDisciplineId)!;
      if (foundSubDiscipline !== undefined) {
        return foundSubDiscipline;
      }
    }
    return null!;
  }

  public getIcon(disciplineId: number, subDisciplineId: number): string {
    const foundDiscipline: Discipline = this.disciplines.find((discipline: Discipline) => discipline.id === disciplineId)!;
    if (foundDiscipline !== undefined) {
      const foundSubDiscipline: SubDiscipline = foundDiscipline.subDisciplines!.find((subDiscipline: SubDiscipline) => subDiscipline.id === subDisciplineId)!;
      if (foundSubDiscipline?.icon !== undefined && foundSubDiscipline.icon !== '') {
        return foundSubDiscipline.icon;
      }
      return foundDiscipline.icon!;
    }
    return null!;
  }

  public getHiddenEvents(): boolean {
    return this.showHiddenEvents;
  }

  public setHiddenEvents(hiddenEvents: boolean): void {
    if (!isNullOrUndefined(hiddenEvents) && hiddenEvents !== this.showHiddenEvents) {
      this.showHiddenEvents = hiddenEvents;
      this.subscribeEvents(hiddenEvents);
    }
  }

  public filteredEventsNotification(): Observable<Event[]> {
    this.subscribedEvents = new BehaviorSubject(this.getAllDefinedEventsAsArray().map(event => {
      event.resetState();
      return event;
    }));
    return this.subscribedEvents.asObservable();
  }

  public setAutoRemoveEventFilter(enable: boolean): void {
    this._autoRemoveFilter = enable;
  }

  public unSubscribeEvents(): Observable<boolean> {
    if (this.allEventSubscription !== null) {
      this.allEventSubscription.unsubscribe();
      this.allEventSubscription = null!;
    }
    return this.eventProxyService.unsubscribeEvents();
  }

  public eventCommandById(eventToCommand: string, commandId: string, treatmentType?: string, validationInput?: ValidationInput): void {
    if (treatmentType === 'investigativetreatment') {
      const updateSelections = commandId === select || commandId === suspend;

      if (updateSelections) {
        const addEventId = commandId === select;

        this.updateSelectedEventsArray(new Event(), addEventId, eventToCommand);
      }
    }
    this.eventProxyService.postCommand2Events([eventToCommand], commandId, treatmentType, validationInput);
  }

  public setMmSelectedEventsIds(eventsToCommand: string[]): void {
    if (!this.mmSelectedEventsIds) {
      this.mmSelectedEventsIds = this.mmSelectedEventsIdsSub.asObservable();
    }
    this.mmSelectedEventsIdsSub.next(eventsToCommand);
  }

  public getMmSelectedEventsIds(): Observable<string[]> {
    return this.mmSelectedEventsIdsSub.asObservable();
  }

  // manages bulk commanding when addressing more than 1 event
  public eventCommand(eventsToCommand: Event[], commandId: string, treatmentType?: string, validationInput?: ValidationInput): Observable<any> {

    const reply: Subject<any> = new Subject<any>();
    const updateSelections = commandId === select || commandId === suspend;

    if (updateSelections) {
      const addEventId = commandId === select;

      eventsToCommand.forEach(ev => {
        this.updateSelectedEventsArray(ev, addEventId);
      });
    }

    if (this.commandExecutionSubscription) {
      this.commandExecutionSubscription.unsubscribe();
    }

    if (updateSelections) {
      const addEventId = commandId === select;

      eventsToCommand.forEach(ev => {
        this.updateSelectedEventsArray(ev, addEventId);
      });
    }

    if (eventsToCommand?.length > 0) {
      const array = _(eventsToCommand).groupBy('srcSystemId').map((a: any) => { return a; }).value();
      array.forEach((groupBySystem: any) => {
        const eventIds: string[] = groupBySystem.map((e: any) => e.id);
        this.commandExecutionSubscription = this.eventProxyService.postCommand2Events(eventIds, commandId, treatmentType, validationInput)
          .subscribe(
            value => reply.next({ value }),
            error => reply.next(error)
          );
      });
    }

    return reply.asObservable();
  }

  public updateSelectedEventsArray(event: Event, add: boolean, eventId?: string): void {
    let filteredSelections = [];
    if (!isNullOrUndefined(eventId)) {
      filteredSelections = this.selectedEvents.filter(ev => ev.id === eventId);
    } else {
      filteredSelections = this.selectedEvents.filter(ev => ev.id === event.id);
    }

    if (add) {
      if (filteredSelections.length === 0) {
        this.selectedEvents.push(event);
      }
    } else {
      if (filteredSelections.length > 0) {
        const indexToRemove = this.selectedEvents.findIndex(ev => ev.id === event.id || ev.id === eventId);
        this.selectedEvents.splice(indexToRemove, 1);
      }
    }
  }

  public getBlinker(): Observable<boolean> {
    if (this.eventBlinkObservable) {
      return this.eventBlinkObservable;
    }
    this.eventBlinkObservable = new Observable((observer: Observer<boolean>) => {
      this.timerService.getTimer(500).subscribe(value => {
        this.onTimerTick(value, observer);
      });
    }).pipe(share());
    return this.eventBlinkObservable;
  }

  public async serverClientTimeDiff(): Promise<number> {
    const t0: Date = new Date();
    let t1 = 0;
    let offset = 0;
    await this.eventProxyService.serverClientTimeDiff(t0.toISOString()).toPromise().then(res => {
      if (res !== null) {
        t1 = new Date().getTime();
        offset = parseInt(res.NTPt1t0, 10);
      }
    });
    const t2: number = t1 - t0.getTime();
    return offset + t2;
  }

  public getAllDefinedEventsAsArray(): Event[] {
    return Array.from(this.allEvents.values()).filter(event => {
      if (event !== undefined) {
        return true;
      }
      return false;
    });
  }

  public getAllEventsFilteredByCategory(): Event[] {
    const events: Event[] = this.getAllDefinedEventsAsArray().filter(event => this.filterByCategory(event));
    return events;
  }

  public notificationActionFilter(filter: any): void {
    if (!isNullOrUndefined(filter) && this._consumersInfo.has(0)) {
      this._consumersInfo.get(0)!.filterSubject.next(filter);
    }
  }

  public get assistedTreatmentMode(): Observable<boolean> {
    return this._isAssistedTreatment.asObservable();
  }

  public getAssistedTreatmentMode(): boolean {
    return this._isAssistedTreatment.getValue();
  }

  public setAssistedTreatmentMode(value: boolean): void {
    if (value !== this._isAssistedTreatment.getValue()) {
      this._isAssistedTreatment.next(value);
    }
  }

  private filterByCategory(ev: Event): boolean {
    const filter: EventFilter = this._consumersInfo.get(0)!.filterSubject.getValue()!;

    if (filter.categories !== undefined && filter.categories.length > 0) {
      if (filter.categories.find((value: number) => value === ev.categoryId) === undefined) {
        return false;
      }
    }
    return true;
  }

  private subscribeEvents(showHiddenEvents: boolean = undefined!): void {
    this.setDiscardNotifications();

    if (this.allEventSubscription !== null) {
      this.allEventSubscription.unsubscribe();
    }

    this.allEventSubscription = this.eventProxyService.eventsNotification().subscribe(wsiEvents => this.onEventsNotification(wsiEvents));

    this.traceService.info(TraceModules.events, 'EventService.subscribeEvents() called.');

    this.allEvents.clear();
    this.eventProxyService.subscribeEvents(this.showHiddenEvents);

    if (!isNullOrUndefined(showHiddenEvents)) {
      this.hiddenEventsChanged = true;
    }
  }

  // private removeUndefinedEvents(): Event[] {
  //   return Array.from(this.allEvents.values()).filter(event => {
  //     if (event !== undefined) {
  //       return true;
  //     }
  //     return false;
  //   });
  // }

  private registerNotifications(): void {
    this.categoryService.getCategories().toPromise().then(getCategoriesResponse => {
      this.categories = getCategoriesResponse!;
      const visible: number[] = this.visibleCategories;
      const customData: CustomData[] = [];

      this.categories.forEach(category => {
        if (visible === undefined || visible.length === 0) {
          customData.push({
            name: category.descriptor,
            label: category.descriptor,
            id: category.id,
            color: `rgb(${category.colors!.get(EventColors.ButtonGradientDark)})`,
            override: false,
            data: [
              {
                name: 'toast',
                label: 'toast',
                value: 'banner' // none - banner - alert
              },
              {
                name: 'show',
                label: this._notifconfigShowLabel,
                value: true
              },
              {
                name: 'sound',
                label: this._notifconfigSoundLabel,
                value: true
              },
              {
                name: 'toNormal',
                label: 'toNormalLabel',
                value: false
              }
            ]
          });
        } else if (visible !== undefined && visible.findIndex(x => x === category.id) !== -1) {
          customData.push({
            name: category.descriptor,
            label: category.descriptor,
            color: `rgb(${category.colors!.get(EventColors.ButtonGradientDark)})`,
            override: false,
            data: [
              {
                name: 'toast',
                label: 'toast',
                value: 'banner' // none - banner - alert
              },
              {
                name: 'show',
                label: this._notifconfigShowLabel,
                value: true
              },
              {
                name: 'sound',
                label: this._notifconfigSoundLabel,
                value: true
              },
              {
                name: 'toNormal',
                label: 'toNormalLabel',
                value: false
              }
            ]
          });
        }
      });

      const customSettings: CustomSetting[] = [{
        name: 'toNormal',
        label: 'toNormalLabel',
        value: false
      }];

      this.iconMapperService.getGlobalIcon(TablesEx.ObjectTypes, 5300).toPromise()
        .then(imageStr => {
          const notifConfiguration: NotifConfiguration = new NotifConfiguration(this._newEventsDescriptionLabel)
            .setIcon(imageStr!)
            .setShow(true)
            .setSound(true)
            .setToast('none')
            .setCustomSound(true)
            .setCustomData(customData)
            .setCustomSettings(customSettings);

          this.notificationService.register(this._notificationSenderNewEvents, notifConfiguration);
          this.notificationService.cancelAll(this._notificationSenderNewEvents);
        });

      this.tablesService.getGlobalText(Tables.Disciplines, true).toPromise().then(async getGlobalTextsResponse => {
        await this.onGetDisciplineTexts(getGlobalTextsResponse!);

        this.subscribeEvents();
      });
    });
  }

  private onTimerTick(value: number, observer: Observer<boolean>): void {
    const remainder: number = value % 3;
    if (remainder === 0) {
      observer.next(false);
    } else if (remainder === 1) {
      observer.next(true);
    }
  }

  private onEventsNotification(eventsFromWSI: WSIEvent[]): void {
    let start: number;
    let newEventsAdded = false;
    let eventStr: string = 'EventService.onEventsNotification():\n' +
      `Create/update event model for new/changed wsi events: ${eventsFromWSI.length}; Total no. of current events: ${this.allEvents.size}`;
    this.traceService.info(TraceModules.eventsTiming, eventStr);

    if (this.traceService.isDebugEnabled(TraceModules.eventNotifications)) {
      eventsFromWSI.forEach(event => {
        eventStr = eventStr + '\n' + `Source=${event.SrcDesignation}; State=${event.State}; Text=${event.MessageText}`;
      });
      this.traceService.debug(TraceModules.eventNotifications, eventStr);
    }
    start = performance.now();

    // do not send first batch of events into the notification center
    const evtTimestamp = Date.parse(eventsFromWSI[eventsFromWSI.length - 1]?.CreationTime);
    if ((this._discardFirstEvents || this._discardFirstEventsBackToNormal) &&
        evtTimestamp > this.loginTime) {
      this._discardFirstEvents = false;
      this._discardFirstEventsBackToNormal = false;
    }

    const eventsToNotify: Event[] = [];
    eventsFromWSI.forEach((value: WSIEvent) => {
      let processedEvent: Event;
      const eventId: string = value.Id;
      const foundEvent: Event = this.allEvents.get(eventId)!;

      if (foundEvent !== undefined) {
        processedEvent = this.processExistingEvent(eventsToNotify, foundEvent, value, eventId);
      } else {
        processedEvent = this.processNewEvent(value, eventId, eventsToNotify);
        newEventsAdded = true;
      }

      const olderThanSelected = this.selectedEvents.findIndex(ev =>
        ((ev.originalCreationTime?.getTime() ?? 0) > (processedEvent.originalCreationTime?.getTime() ?? 0)));

      if ((processedEvent.originalCreationTime?.getTime() ?? 0) > this.loginTime && !foundEvent && olderThanSelected === -1) {
        this.checkAutomaticTreatment(eventsToNotify);
      }
    });

    eventStr = `EventService.onEventsNotification(): Create/update event model done; time used: ${performance.now() - start} ms`;
    this.traceService.info(TraceModules.eventsTiming, eventStr);
    if (this.traceService.isDebugEnabled(TraceModules.eventNotifications)) {
      this.traceService.debug(TraceModules.eventNotifications, eventStr);
      start = performance.now();
    }

    if (this.subscribedEvents === undefined) {
      this.subscribedEvents = new BehaviorSubject(this.getAllDefinedEventsAsArray().map(event => {
        event.resetState();
        return event;
      }));
    }

    this.subscribedEvents.next(eventsToNotify);

    for (const consInfo of this._consumersInfo.entries()) {
      consInfo[1].eventsSubject.next(eventsToNotify.filter(currEvent => {
        if (currEvent !== undefined) {
          return true;
        }
        return false;
      }).map(event => {
        event.resetState();
        return event;
      }).filter(event => this.eventsFilterPredicate(event, consInfo[1].subcription.id)));
    }

    // Handle the AutoRemoveFilter option
    const currFilterSubj: BehaviorSubject<EventFilter | null> = this._consumersInfo.get(0)!.filterSubject;

    if (newEventsAdded && this._autoRemoveFilter && !currFilterSubj.getValue()!.empty && !this.hiddenEventsChanged) {
      const resetFilter: EventFilter = new EventFilter(true);
      resetFilter.hiddenEvents = false;
      currFilterSubj.next(resetFilter);
    }

    if (this.hiddenEventsChanged) {
      this.hiddenEventsChanged = false;
    }

    eventStr = `EventService.onEventsNotification(): Notify clients on created/updated events; time used: ${performance.now() - start} ms`;
    this.traceService.info(TraceModules.eventsTiming, eventStr);
    if (this.traceService.isDebugEnabled(TraceModules.eventNotifications)) {
      this.traceService.debug(TraceModules.eventNotifications, eventStr);
    }
  }

  private checkAutomaticTreatment(eventsToNotify: Event[]): void {
    const newEvent = eventsToNotify[eventsToNotify.length - 1];

    if (newEvent.automaticTreatmentData) {
      const autoTreatStruct: AutoTreatStruct = { event: newEvent,
        isEventSelectedInEL: this.selectedEvents!.length > 0,
        isHigherPrio: this.selectedEvents.length === 0 ||
        (this.selectedEvents.length > 0 && (this.selectedEvents.findIndex(ev => ev.categoryId! < newEvent.categoryId!) === -1)) };

      this.automaticTreatmentEvent.next(autoTreatStruct); // notify Summary Bar
    }
  }

  private processNewEvent(value: WSIEvent, eventId: string, eventsToNotify: Event[]): Event {
    const eventCategory: Category = this.getCategory(value.CategoryId);
    const eventIcon: string = this.getIcon(value.SrcDisciplineId, value.SrcSubDisciplineId);
    const event: Event = new Event();
    event.setInitialValuesFromWSIEvent(value, eventCategory, eventIcon);

    if (value.State !== 'Closed') {
      this.allEvents.set(eventId, event);
      eventsToNotify.push(event);
      if (this.eventsFilterPredicate(event, 0) === false) {
        event.markAsClosed();
      }
      // send notification
      if (this._enableNotifications === true && !this._discardFirstEvents) {
        this.notifyForNewEvents(value.Cause, event.originalCreationTime!, value.EventId, event.icon!, event.category!, false);
        if (this._firstEventDate === undefined) {
          this._firstEventDate = event.originalCreationTime!;
        }
      }
    } else {
      this.notificationService.cancel(this._notificationSenderNewEvents, value.EventId);
    }
    return event;
  }

  private processExistingEvent(eventsToNotify: Event[], foundEvent: Event, value: WSIEvent, eventId: string): Event {
    // eventsToNotify.push(foundEvent);

    // update the notification only if the source state changes,
    // or if the source state is not changed, but the cause has changed (the CoHo have set the went text)
    const sendBackToNormalNotif: boolean = value.SrcState === 'Quiet' && foundEvent.srcState === 'Active' ||
      (value.SrcState === 'Quiet' && value.SrcState === foundEvent.srcState && value.Cause != foundEvent.cause);

    foundEvent.updateFromWsiEvent(value);
    eventsToNotify.push(foundEvent);
    if (sendBackToNormalNotif) {
      // send notification for back to normal state
      if (this._enableNotifications === true &&
        !this._discardFirstEventsBackToNormal) {
        this.notifyForNewEvents(value.Cause, foundEvent.originalCreationTime!, value.EventId, foundEvent.icon!, foundEvent.category!, true);
        if (this._firstEventDate === undefined) {
          this._firstEventDate = foundEvent.originalCreationTime!;
        }
      }
    }
    if (foundEvent.stateId === EventStates.Closed) {
      // remove event from _eventsCounted if found
      if (this._enableNotifications === true && this._eventsCounted.has(value.Id)) {
        this._eventsCounted.delete(value.Id);
      }
      this.notificationService.cancel(this._notificationSenderNewEvents, value.EventId);

      const toRemove = this.selectedEvents.filter(ev => ev.eventId === foundEvent.eventId);
      toRemove.forEach(evt => {
        const ev = this.selectedEvents.findIndex(e => e.eventId === evt.eventId);
        this.selectedEvents.splice(ev, 1);
      });

      this.allEvents.delete(eventId);
    } else if (this.eventsFilterPredicate(foundEvent, 0) === false) {
      foundEvent.markAsClosed();
    }
    return foundEvent;
  }

  private notifyForNewEvents(cause: string, creationTime: Date, id: number, icon: string, category: Category, backToNormal: boolean): void {
    const userLang: string | undefined = this.translateService.getBrowserCultureLang();
    const bgColor = `rgb(${category.colors!.get(EventColors.ButtonGradientDark)})`;

    const notificationDefaultAction: Action = new Action('default')
      .setCallback(this.defaultNotificationActionNewEvents
        .bind(this))
      .setDescription('default');
    const notificationHideAction: Action = new Action('hide')
      .setCallback(this.hideNotificationActionNewEvents
        .bind(this));
    const notificationHideActionBackToNormal: Action = new Action('hide')
      .setCallback(this.hideNotificationActionBackToNormal
        .bind(this));
    const notificationGroupAction: Action = new Action('group')
      .setCallback(this.groupNotificationActionNewEvents
        .bind(this))
      .setDescription('group');

    const notification: Notification = new Notification(id)
      .setIcon(icon)
      .setIconBg(bgColor)
      .setAutoCancel(false)
      .setActions([notificationDefaultAction, notificationHideAction, notificationGroupAction])
      .setCustomData([creationTime, category.id])
      .setToastText(creationTime.toLocaleString(userLang));

    if (backToNormal === false) {
      notification
        .setTitle(cause)
        .setText(creationTime.toLocaleString(userLang))
        .setToastTitle(this._newEventsToastTitle);
    } else {
      notification
        .setTitle(cause)
        .setText(creationTime.toLocaleString(userLang))
        .setToastTitle(this._backToNormalToastTitle);
    }
    notification.getActions()[1].setDescription(this._notificationHideLabel);
    this.notificationService.notify(this._notificationSenderNewEvents, Object.create(notification));
  }

  private defaultNotificationActionNewEvents(notification: Notification): boolean {
    const filter: EventFilter = {
      empty: false,
      creationDateTime: EventDateTimeFilterValues.Custom,
      from: notification.getCustomData()[0],
      to: notification.getCustomData()[0]
    };
    if (!this.multimonitorService.runsInElectron) {
      this.notificationActionFilter(filter);
    } else {
      // send message to the Electron window containing the Event List
      const evtMessage: EventMessage = {
        type: EventMessageType.EventFiltering,
        data: filter
      };
      this.multimonitorService.sendEvent(evtMessage);
    }
    return true;
  }

  private hideNotificationActionNewEvents(notification: Notification): boolean {
    this.notificationService.cancel(this._notificationSenderNewEvents, notification.id);
    return true;
  }

  private hideNotificationActionBackToNormal(notification: Notification): boolean {
    this.notificationService.cancel(this._notificationSenderBackToNormal, notification.id);
    return true;
  }

  private groupNotificationActionNewEvents(notifications: Notification[] | any): boolean {
    const filter: EventFilter = {
      empty: false,
      creationDateTime: EventDateTimeFilterValues.Custom,
      from: notifications[0].getCustomData()[0],
      to: notifications[notifications.length - 1].getCustomData()[0]
    };
    this._consumersInfo.forEach(info => {
      info.filterSubject.next(filter);
    });
    return true;
  }
  // region event filtering
  private firstCheckForNullFilter(filter: EventFilter, event: Event): boolean | undefined {
    if (isNullOrUndefined(filter) || filter.empty) {
      return true;
    }
    if (filter.id !== undefined && filter.id.length > 0) {
      if (filter.id !== event.id) {
        return false;
      }
    }
    return undefined;
  }
  // manage filtering by category, discipline, state, srcState, srcSystem
  private secondLevelCheckForNullFilter(filter: EventFilter, event: Event): boolean | undefined {
    if (filter.categories !== undefined && filter.categories.length > 0) {
      if (filter.categories.find((value: number) => value === event.categoryId) === undefined) {
        return false;
      }
    }
    if (filter.disciplines !== undefined && filter.disciplines.length > 0) {
      if (filter.disciplines.find((value: number) => value === event.srcDisciplineId) === undefined) {
        return false;
      }
    }
    if (filter.states !== undefined && filter.states.length > 0) {
      if (filter.states.find((value: string) => value === event.state!.substring(0, value.length)) === undefined) {
        event.markAsClosed();
      }
    }
    if (filter.srcState !== undefined && filter.srcState.length > 0) {
      if (filter.srcState.find((value: string) => value === event.srcState) === undefined) {
        return false;
      }
    }
    if (filter.srcSystem !== undefined && filter.srcSystem.length > 0) {
      if (filter.srcSystem.find((value: number) => value === event.srcSystemId) === undefined) {
        return false;
      }
    }
    return undefined;
  }

  private checkForDescriptorFilter(filter: EventFilter, event: Event, id: number): boolean | undefined {
    if (filter.srcDescriptor !== undefined && filter.srcDescriptor.length > 0) {
      let eventMatchFilter = false;
      for (let i = 0; i < event.descriptionLocationsList!.length; i++) {
        if (this.matchString(filter.srcDescriptor, event.descriptionLocationsList![i].Descriptor) ||
        this.matchString(filter.srcDescriptor, event.descriptionList![i].Descriptor)) {
          eventMatchFilter = true;
        }
      }
      return eventMatchFilter;
    }
    return undefined;
  }
  // region filter by designation
  private checkForDesignationFilter(filter: EventFilter, event: Event, id: number): boolean | undefined {
    if (filter.srcDesignations !== undefined && filter.srcDesignations.length > 0) {
      if (id !== 0) {
        return this.checkDesignation(filter.srcDesignations, event.designationList);
      }
      return this.checkDesignationIDZero(filter.srcDesignations, event.designationList);
    }
    return undefined;
  }

  private checkDesignationIDZero(srcDesignations: string[], designationList: EventDetailsList[] | undefined): boolean {
    let satisfyFilterRequirements = false;

    for (let i = 0; i < srcDesignations.length && !satisfyFilterRequirements; i++) {
      for (let j = 0; j < designationList!.length && !satisfyFilterRequirements; j++) {
        const currSrcDesignation: string = srcDesignations[i];

        if (currSrcDesignation.endsWith('**')) { // special source designation filtering procedure as requested by the Device Viewer snapin
          if (designationList![j].Descriptor.startsWith(currSrcDesignation.slice(0, -2) + '.') ||
          designationList![j].Descriptor === currSrcDesignation.slice(0, -2)) {
            satisfyFilterRequirements = true;
          }
        } else if (currSrcDesignation === designationList![j].Descriptor) {
          satisfyFilterRequirements = true;
        }
      }
    }
    return satisfyFilterRequirements;
  }

  private checkDesignation(srcDesignations: string[], designationList: EventDetailsList[] | undefined): boolean {
    for (const designation of srcDesignations) {
      if (designation.endsWith('**')) { // special source designation filtering procedure as requested by the Device Viewer snapin
        if (designationList!.find(d => d.Descriptor.startsWith(designation.slice(0, -2) + '.') ||
        d.Descriptor === designation.slice(0, -2))) {
          return true;
        }
        continue;
      }

      if (designationList!.find(d => designation == d.Descriptor)) {
        return true;
      }
    }
    return false;
  }
  // endregion
  private checkForAliasFilter(filter: EventFilter, event: Event): boolean | undefined {
    if (filter.srcAlias !== undefined && filter.srcAlias.length > 0) {
      if (event.srcAlias !== undefined && event.srcAlias.length > 0) {
        if (this.matchString(filter.srcAlias, event.srcAlias)) {
          return true;
        }
      }
      return false;
    }
    return undefined;
  }

  private checkForNameFilter(filter: EventFilter, event: Event): boolean | undefined {
    if (filter.srcName !== undefined && filter.srcName.length > 0) {
      let satisfyFilterRequirements = false;

      for (let i = 0; i < event.sourceDesignationList!.length && !satisfyFilterRequirements; i++) {
        if (this.matchString(filter.srcName, event.sourceDesignationList![i].Descriptor) === true) {
          satisfyFilterRequirements = true;
        }
      }
      return satisfyFilterRequirements;
    }
    return undefined;
  }

  private checkForPropertyIdFilter(filter: EventFilter, event: Event): boolean | undefined {
    if (filter.srcPropertyIds !== undefined && filter.srcPropertyIds.length > 0) {
      const currSrcPropertyId: string = event.srcPropertyId!;

      for (const srcPropertyId of filter.srcPropertyIds) {
        if (this.matchString(srcPropertyId, currSrcPropertyId) === true) {
          return true;
        }
      }
      return false;
    }
    return undefined;
  }

  private checkForInformationalTextFilter(filter: EventFilter, event: Event): boolean | undefined {
    if (filter.informationalText !== undefined && filter.informationalText.length > 0) {
      if (this.matchString(filter.informationalText, event.informationalText!) === false) {
        return false;
      }
    }
  }
  // region filter by time
  private checkForTimeFilters(filter: EventFilter, event: Event): boolean | undefined {
    if (filter.creationDateTime !== undefined && filter.creationDateTime !== EventDateTimeFilterValues.None) {
      if (!isNullOrUndefined(this.checkForFilterHours(filter, event))) {
        return this.checkForFilterHours(filter, event)!;
      }
      const today: Date = new Date();
      if (!isNullOrUndefined(this.checkForFilterLastNightAndYesterday(filter, event, today))) {
        return this.checkForFilterLastNightAndYesterday(filter, event, today)!;
      }
      if (!isNullOrUndefined(this.checkForFilterToday(filter, event, today))) {
        return this.checkForFilterToday(filter, event, today)!;
      }
      if (!isNullOrUndefined(this.checkForFilterCustom(filter, event))) {
        return this.checkForFilterCustom(filter, event)!;
      }
    }
  }

  private checkForFilterHours(filter: EventFilter, event: Event): boolean | undefined {
    const creationDate = new Date(event.creationTime!.split(' .').join('.'));

    if (filter.creationDateTime === EventDateTimeFilterValues.LastQuarterHour) {
      if (creationDate!.getTime() < (Date.now() - 15 * 60000)) {
        return false;
      }
    }
    if (filter.creationDateTime === EventDateTimeFilterValues.LastHalfHour) {
      if (creationDate!.getTime() < (Date.now() - 30 * 60000)) {
        return false;
      }
    }
    if (filter.creationDateTime === EventDateTimeFilterValues.LastHour) {
      if (creationDate!.getTime() < (Date.now() - 60 * 60000)) {
        return false;
      }
    }
    return undefined;
  }

  private checkForFilterLastNightAndYesterday(filter: EventFilter, event: Event, today: Date): boolean | undefined {
    const creationDate = new Date(event.creationTime!.split(' .').join('.'));

    if (filter.creationDateTime === EventDateTimeFilterValues.LastNight) {
      const yesterday: Date = new Date(Date.now() - 86400 * 1000);
      const begin: number = new Date(yesterday.getFullYear(),
        yesterday.getMonth(),
        yesterday.getDate(), 20, 0, 0, 0).getTime();
      const end: number = new Date(today.getFullYear(),
        today.getMonth(),
        today.getDate(), 7, 59, 59, 999).getTime();
      if ((creationDate!.getTime() < begin) || (creationDate!.getTime() > end)) {
        return false;
      }
    }
    if (filter.creationDateTime === EventDateTimeFilterValues.Yesterday) {
      const yesterday: Date = new Date(Date.now() - 86400 * 1000);
      const begin: number = new Date(yesterday.getFullYear(),
        yesterday.getMonth(),
        yesterday.getDate(), 0, 0, 0, 0).getTime();
      const end: number = new Date(yesterday.getFullYear(),
        yesterday.getMonth(),
        yesterday.getDate(), 23, 59, 59, 999).getTime();
      if ((creationDate!.getTime() < begin) || (creationDate!.getTime() > end)) {
        return false;
      }
    }
    return undefined;
  }

  private checkForFilterToday(filter: EventFilter, event: Event, today: Date): boolean | undefined {
    const creationDate = new Date(event.creationTime!.split(' .').join('.'));

    if (filter.creationDateTime === EventDateTimeFilterValues.Today) {
      const begin: number = new Date(today.getFullYear(),
        today.getMonth(),
        today.getDate(), 0, 0, 0, 0).getTime();
      if (creationDate!.getTime() < begin) {
        return false;
      }
    }
    return undefined;
  }

  private checkForFilterCustom(filter: EventFilter, event: Event): boolean | undefined {
    const creationDate = new Date(event.creationTime!.split(' .').join('.'));

    if (filter.creationDateTime === EventDateTimeFilterValues.Custom) {
      if (filter.to && creationDate!.getTime() > filter.to.getTime()) {
        return false;
      }
      if (filter.from && creationDate!.getTime() < filter.from.getTime()) {
        return false;
      }
    }
    return undefined;
  }
  // endregion
  private eventsFilterPredicate(event: Event, id: number): boolean {
    const filter: EventFilter = this._consumersInfo.get(id)!.filterSubject.getValue()!;

    if (!isNullOrUndefined(this.firstCheckForNullFilter(filter, event))) {
      return this.firstCheckForNullFilter(filter, event)!;
    }
    if (!isNullOrUndefined(this.secondLevelCheckForNullFilter(filter, event))) {
      return this.secondLevelCheckForNullFilter(filter, event)!;
    }
    if (!isNullOrUndefined(this.checkForTimeFilters(filter, event))) {
      return this.checkForTimeFilters(filter, event)!;
    }
    if (!isNullOrUndefined(this.checkForDesignationFilter(filter, event, id))) {
      return this.checkForDesignationFilter(filter, event, id)!;
    }
    if (!isNullOrUndefined(this.checkForDescriptorFilter(filter, event, id))) {
      return this.checkForDescriptorFilter(filter, event, id)!;
    }
    if (!isNullOrUndefined(this.checkForAliasFilter(filter, event))) {
      return this.checkForAliasFilter(filter, event)!;
    }
    if (!isNullOrUndefined(this.checkForNameFilter(filter, event))) {
      return this.checkForNameFilter(filter, event)!;
    }
    if (!isNullOrUndefined(this.checkForPropertyIdFilter(filter, event))) {
      return this.checkForPropertyIdFilter(filter, event)!;
    }
    if (!isNullOrUndefined(this.checkForInformationalTextFilter(filter, event))) {
      this.checkForInformationalTextFilter(filter, event)!;
    }
    return true;
  }

  private matchString(pattern: string, text: string): boolean {
    const escapeRegex = (t: string): string => t.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, '\\$1');
    return new RegExp('^' + pattern.toUpperCase().split('*').map(escapeRegex).join('.*') + '').test(text.toUpperCase());
  }
  // endregion

  private async onGetDisciplineTexts(disciplineTexts: TextEntry[]): Promise<void> {
    for (const text of disciplineTexts) {

      const discipline: Discipline = new Discipline(text.value, text.text, '', []);

      for (const subText of text.subText!) {
        const subDiscipline: SubDiscipline = new SubDiscipline(subText.value, subText.text, '');
        discipline.subDisciplines!.push(subDiscipline);
        subDiscipline.icon = this.iconMapperService.getGlobalIconSync(TablesEx.SubDisciplines, subText.value);
      }

      this.disciplines.push(discipline);

      discipline.icon = this.iconMapperService.getGlobalIconSync(TablesEx.Disciplines, text.value);
    }
  }

  private onNotifyConnectionState(connectionState: ConnectionState): void {
    const traceMsg = `EventService.onNotifyConnectionState() state: ${SubscriptionUtility.getTextForConnection(connectionState)}`;
    this.traceService.info(TraceModules.eventsTiming, traceMsg);
    this.traceService.info(TraceModules.events, traceMsg);

    if (connectionState === ConnectionState.Disconnected && !this.gotDisconnected) {
      this.gotDisconnected = true;
      this.allEvents.clear();
      this._consumersInfo.forEach(info => {
        info.connectionStateSubject.next('disconnected');
      });
    } else if ((connectionState === ConnectionState.Connected) && this.gotDisconnected) {
      this.gotDisconnected = false;
      this._discardFirstEvents = true;
      this._discardFirstEventsBackToNormal = true;
      this._consumersInfo.forEach(info => {
        info.connectionStateSubject.next('connected');
      });
      this.eventProxyService.subscribeEvents();

      this.traceService.info(TraceModules.events, 'EventService.onNotifyConnectionState(): Connection reestablished');
    }
  }
}
