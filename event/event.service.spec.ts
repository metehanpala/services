import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { EventEmitter } from '@angular/core';
import { inject, TestBed, waitForAsync } from '@angular/core/testing';
import { Router } from '@angular/router';
import {
  AuthenticationServiceBase, ErrorNotificationServiceBase, MockTraceService, MockWsiEndpointService, NotifConfiguration, NotificationServiceBase, TraceService
} from '@gms-flex/services-common';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import { Observable, of, Subscription } from 'rxjs';

import { SiIconMapperService } from '../icons-mapper/si-icon-mapper.service';
import { DiagnosticsServiceBase } from '../public-api';
import { MultiMonitorServiceBase } from '../shared';
import { ErrorNotificationService } from '../shared/error-notification.service';
import { MockWsiUtilityService } from '../shared/mock-wsi-utility.service';
import { WsiUtilityService } from '../shared/wsi-utility.service';
import { MockSignalRService } from '../signalr/mock-signalr.service';
import { SignalRService } from '../signalr/signalr.service';
import { TimerService } from '../timer/timer.service';
import { TimerServiceBase } from '../timer/timer.service.base';
import { WsiEndpointService } from '../wsi-endpoint/wsi-endpoint.service';
import { AutomaticTreatmentData, EventCommand, EventDetailsList, WSIEvent } from '../wsi-proxy-api/event/data.model';
import { EventProxyServiceBase } from '../wsi-proxy-api/event/event-proxy.service.base';
import { TablesServiceBase } from '../wsi-proxy-api/tables/tables.service.base';
import { CategoryService } from './category.service';
import { Category, Discipline, Event, EventFilter, SubDiscipline } from './data.model';
import { EventProxyService } from './event-proxy.service';
import { EventService } from './event.service';
import { MockCategoryService } from './mock-category.service';
import { MockSiIconMapperService } from './mock-si-icon-mapper.service';
import { MockTablesService } from './mock-tables.service';

/* eslint-disable @typescript-eslint/naming-convention */

const eventCommands: EventCommand[] = [
  {
    EventId: 'EventId',
    Id: 'Id',
    Configuration: 1
  },
  {
    EventId: 'EventId',
    Id: 'Id',
    Configuration: 2
  }
];

const eventDetailsLists: EventDetailsList[] = [
  {
    ViewId: 1,
    Descriptor: 'Descriptor'
  },
  {
    ViewId: 2,
    Descriptor: 'Descriptor'
  }
];

const automaticTreatmentData: AutomaticTreatmentData = {
  HasFilter: true,
  Stations: ['_#webclient#_', 'md3hemhc'],
  Timeout: 300,
  Users: [2, 3],
  CloseTreatmentWhen: 'UponUserRequest',
  OnNewEvent: 'OpenEventList',
  OnNewHigherPrioEvent: 'SwitchToNew'
};

const events: WSIEvent[] = [
  {
    CategoryDescriptor: 'CategoryDescriptor',
    CategoryId: 1,
    Cause: 'Cause',
    Commands: eventCommands,
    CreationTime: 'CreationTime',
    Deleted: false,
    Direction: 'Direction',
    EventId: 1,
    Id: 'Id',
    InfoDescriptor: 'InfoDescriptor',
    Sound: 'Sound',
    SrcDesignation: 'SrcDesignation',
    SrcDisciplineDescriptor: 'SrcDisciplineDescriptor',
    SrcDisciplineId: 1,
    SrcLocation: 'SrcLocationstring',
    SrcName: 'SrcName',
    SrcObservedPropertyId: 'SrcObservedPropertyIdstring',
    SrcPropertyId: 'SrcPropertyId',
    SrcState: 'SrcStatestring',
    SrcSystemId: 1,
    SrcViewDescriptor: 'SrcViewDescriptor',
    SrcViewName: 'string',
    State: 'State',
    InProcessBy: 'InProcessBy',
    SourceDesignationList: eventDetailsLists,
    DescriptionLocationsList: eventDetailsLists,
    DesignationList: eventDetailsLists,
    DescriptionList: eventDetailsLists,
    MessageText: [],
    NextCommand: 'Ack',
    SrcDescriptor: 'SrcDescriptor',
    SuggestedAction: 'Ack',
    SrcSystemName: '',
    SrcSubDisciplineId: 2,
    SrcAlias: 'Alias',
    OperatingProcedureId: null!,
    InformationText: 'InfoText',
    Timer: null!,
    AutomaticTreatmentData: automaticTreatmentData
  },
  {
    CategoryDescriptor: 'CategoryDescriptor',
    CategoryId: 1,
    Cause: 'Cause',
    Commands: eventCommands,
    CreationTime: 'CreationTime',
    Deleted: false,
    Direction: 'Direction',
    EventId: 1,
    Id: 'Id',
    InfoDescriptor: 'InfoDescriptor',
    SrcDesignation: 'SrcDesignation',
    SrcDisciplineDescriptor: 'SrcDisciplineDescriptor',
    SrcDisciplineId: 1,
    SrcLocation: 'SrcLocationstring',
    SrcName: 'SrcName',
    SrcObservedPropertyId: 'SrcObservedPropertyIdstring',
    SrcPropertyId: 'SrcPropertyId',
    SrcState: 'SrcStatestring',
    SrcSystemId: 1,
    SrcViewDescriptor: 'SrcViewDescriptor',
    SrcViewName: 'string',
    State: 'State',
    InProcessBy: 'InProcessBy',
    SourceDesignationList: eventDetailsLists,
    DescriptionLocationsList: eventDetailsLists,
    DesignationList: eventDetailsLists,
    DescriptionList: eventDetailsLists,
    MessageText: [],
    NextCommand: 'Ack',
    SrcDescriptor: 'SrcDescriptor',
    SuggestedAction: 'Ack',
    SrcSystemName: '',
    SrcSubDisciplineId: 2,
    SrcAlias: 'Alias',
    OperatingProcedureId: null!,
    InformationText: 'InfoText',
    Timer: null!,
    AutomaticTreatmentData: automaticTreatmentData,
    Sound: 'Sound'
  }
];

/* eslint-enable @typescript-eslint/naming-convention */

const notifConfiguration: NotifConfiguration = new NotifConfiguration('newEvents')
  .setIcon('marengo-alarm-outline')
  .setShow(true)
  .setToast('none');

const configReturn: Map<string, NotifConfiguration> = new Map<string, NotifConfiguration>();
configReturn.set('newEvents', notifConfiguration);

const mockNotificationServiceBase: any = jasmine.createSpyObj('mockNotificationServiceBase', [
  'register',
  'cancel',
  'cancelAll',
  'notify',
  'subscribeConfigurations'
]);
mockNotificationServiceBase.subscribeConfigurations.and.returnValue(of(configReturn));

class MockTranslateService {
  public onLangChange: EventEmitter<LangChangeEvent> = new EventEmitter(undefined);
  public get(): Observable<any> {
    return of('test');
  }
}

class MockDiagnosticsServiceBase {
  public ping(): Observable<any> {
    return of(Date.now);
  }
}

class RouterStub {}
// Tests  /////////////
describe('EventService', () => {

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [],
      providers: [
        { provide: TraceService, useClass: MockTraceService },
        { provide: Router, useClass: RouterStub },
        { provide: WsiEndpointService, useClass: MockWsiEndpointService },
        { provide: CategoryService, useClass: MockCategoryService },
        { provide: EventProxyServiceBase, useClass: EventProxyService },
        { provide: TablesServiceBase, useClass: MockTablesService },
        { provide: SiIconMapperService, useClass: MockSiIconMapperService },
        { provide: TimerServiceBase, useClass: TimerService },
        { provide: 'wsiSettingFilePath', useValue: 'https://fake-server.com' },
        { provide: SignalRService, useClass: MockSignalRService },
        { provide: WsiUtilityService, useClass: MockWsiUtilityService },
        { provide: NotificationServiceBase, useValue: mockNotificationServiceBase },
        { provide: TranslateService, useClass: MockTranslateService },
        { provide: ErrorNotificationServiceBase, useClass: ErrorNotificationService },
        { provide: DiagnosticsServiceBase, useClass: MockDiagnosticsServiceBase },
        MultiMonitorServiceBase,
        AuthenticationServiceBase,
        EventService,
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting()
      ]
    })
      .compileComponents();
  }));

  it('should create EventService',
    inject([EventService], (eventService: EventService) => {
      expect(eventService instanceof EventService).toBe(true);
    }
    ));

  it('should get event blinker correctly', (done: DoneFn) => {
    inject([EventService], (eventService: EventService) => {
      let counter = 0;
      let value1: boolean;
      let value2: boolean;
      const blinker: Observable<boolean> = eventService.getBlinker();
      const blinker2: Observable<boolean> = eventService.getBlinker();
      expect(blinker).toBe(blinker2);

      const subscription: Subscription = blinker.subscribe(value => {
        if (counter === 0) {
          value1 = value;
        } else if (counter === 1) {
          value2 = value;
        } else {
          if (value1) {
            expect(value2 && value).toBe(false);
          } else if (value2) {
            expect(value1 && value).toBe(false);
          } else {
            expect(value1 && value2).toBe(false);
          }
          subscription.unsubscribe();
          done();
        }
        counter++;
      });
    })();
  });

  it('should subscribe with subscribeEvents',
    inject([EventService], (eventService: EventService) => {

      // eventService.eventsNotification()
      //   .subscribe(
      //     (data: Event[]) => {
      //       const eventsData: Event[] = [];
      //       expect(data).toEqual(eventsData);
      //     },
      //     error => error as any);

      eventService.filteredEventsNotification()
        .subscribe(
          (data: Event[]) => {
            const eventsData: Event[] = [];
            expect(data).toEqual(eventsData);
          },
          error => error as any);

      const filterData: EventFilter = new EventFilter(false);

      eventService.setEventsFilter(filterData);

      eventService.eventCommand([], 'commandId');
    }
    ));

  it('should unsubscribe with unSubscribeEvents',
    inject([EventService], (eventService: EventService) => {

      eventService.unSubscribeEvents()
        .subscribe(
          (data: boolean) => {
            expect(data).toBe(true);
          },
          error => error as any);

    }
    ));

  it('should get and set visibleCategoryLamps, defaultCategoryLamps',
    inject([EventService], (eventService: EventService) => {
      eventService.visibleCategoryLamps = [0, 1, 2, 3];
      expect(eventService.visibleCategoryLamps).toEqual([0, 1, 2, 3]);

      eventService.defaultCategoryLamp = 1;
      expect(eventService.defaultCategoryLamp).toEqual(1);
    })
  );

  it('should setEnableNotifications, setDiscardNotifications',
    inject([EventService], (eventService: any) => {
      eventService.setEnableNotifications(true);
      expect(eventService._enableNotifications).toBeTrue();

      eventService.setDiscardNotifications();
      expect(eventService._discardFirstEvents).toBeTrue();
      expect(eventService._discardFirstEventsBackToNormal).toBeTrue();
    })
  );

  it('should addConsumer, removeConsumer',
    inject([EventService], (eventService: any) => {
      eventService.addConsumer();
      expect(eventService._snapinsSubscribed).toEqual(1);

      eventService.removeConsumer();
      expect(eventService._snapinsSubscribed).toEqual(0);
    })
  );

  it('should createEventSubscription, destroyEventSubscription',
    inject([EventService], (eventService: any) => {
      eventService.addConsumer();

      eventService.createEventSubscription()
      expect(eventService._consumersInfo.get(0)).toBeDefined();

      eventService.destroyEventSubscription(0)
      expect(eventService._consumersInfo.get(0).referenceCounter).toEqual(-1);
    })
  );

  it('should getCategories, getDisciplines, getCategory, getDiscipline, getSubDiscipline, getIcon',
    inject([EventService], (eventService: any) => {
      const cat1 = new Category(0, 'test1cat');
      const cat2 = new Category(1, 'test2cat');
      const cats = [cat1, cat2];
      eventService.categories = cats;

      const subDiscipline: SubDiscipline = new SubDiscipline(0, 'test1subdisc', 'icon1subdisc');
      const discipline: Discipline = new Discipline(0, 'test1disc', 'icon1disc', [subDiscipline]);
      eventService.disciplines = [discipline]

      expect(eventService.getCategories()).toEqual(cats);
      expect(eventService.getCategory(0)).toEqual(cat1);

      expect(eventService.getDisciplines()).toEqual([discipline]);
      expect(eventService.getDiscipline(0)).toEqual(discipline);
      expect(eventService.getSubDiscipline(0, 0)).toEqual(subDiscipline);
      expect(eventService.getIcon(0, 0)).toEqual('icon1subdisc');
    })
  );

  it('should setHiddenEvents, getHiddenEvents',
    inject([EventService], (eventService: any) => {
      eventService.setHiddenEvents(true);
      expect(eventService.showHiddenEvents).toBeTrue();

      expect(eventService.getHiddenEvents()).toBeDefined();
    })
  );

});
