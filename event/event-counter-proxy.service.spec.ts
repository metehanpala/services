import { HttpErrorResponse, HttpRequest, HttpResponse, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting, TestRequest } from '@angular/common/http/testing';
import { fakeAsync, inject, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthenticationServiceBase, ErrorNotificationServiceBase, MockTraceService, MockWsiEndpointService, TraceService } from '@gms-flex/services-common';
import { BehaviorSubject, Subject } from 'rxjs';

import { ErrorNotificationService } from '../shared/error-notification.service';
import { MockWsiUtilityService } from '../shared/mock-wsi-utility.service';
import { WsiUtilityService } from '../shared/wsi-utility.service';
import { HubProxyEvent } from '../signalr/hub-proxy-event';
import { MockSignalRService } from '../signalr/mock-signalr.service';
import { SignalRService } from '../signalr/signalr.service';
import { WsiEndpointService } from '../wsi-endpoint/wsi-endpoint.service';
import { ConnectionState } from '../wsi-proxy-api';
import { EventCounter, EventCounterList, SubscriptionWsiEventCounters } from '../wsi-proxy-api/event/data.model';
import { EventCounterProxyServiceBase } from '../wsi-proxy-api/event/event-counter-proxy.service.base';
import { EventCounterProxyService } from './event-counter-proxy.service';

/* eslint-disable @typescript-eslint/naming-convention */

const eventCounters: EventCounter[] = [
  {
    CategoryId: 1,
    CategoryDescriptor: 'CategoryDescriptor',
    TotalCount: 1,
    UnprocessedCount: 1,
    TotalSubsequentGrouping: 1,
    UnprocessedSubsequentGrouping: 1
  },
  {
    CategoryId: 1,
    CategoryDescriptor: 'CategoryDescriptor',
    TotalCount: 1,
    UnprocessedCount: 1,
    TotalSubsequentGrouping: 1,
    UnprocessedSubsequentGrouping: 1
  }
];

const eventCounterList: EventCounterList = {
  EventCategoryCounters: eventCounters,
  TotalCounters: 1,
  TotalUnprocessedCounters: 1
};

/* eslint-enable @typescript-eslint/naming-convention */

const eventCountersUrl = '/api/eventcounters/';
const eventCountersSubscriptionUrl = '/api/sr/eventcounterssubscriptions/';
const eventCountersSubscriptionChannelizeUrl = '/api/sr/eventcounterssubscriptions/channelize/';

class RouterStub {}
// Tests  /////////////
describe('Event-Counter-Service', () => {

  const counter = 0;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [],
      providers: [
        { provide: TraceService, useClass: MockTraceService },
        { provide: Router, useClass: RouterStub },
        { provide: WsiEndpointService, useClass: MockWsiEndpointService },
        { provide: 'wsiSettingFilePath', useValue: 'http://CH1W80106.ad001.siemens.net:80' },
        { provide: SignalRService, useClass: MockSignalRService },
        { provide: WsiUtilityService, useClass: MockWsiUtilityService },
        { provide: ErrorNotificationServiceBase, useClass: ErrorNotificationService },
        AuthenticationServiceBase,
        { provide: EventCounterProxyServiceBase, useClass: EventCounterProxyService },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting()
      ]
    })
      .compileComponents();
  }));

  it('should create EventCounterProxyServiceBase',
    inject([EventCounterProxyServiceBase], (eventCounterService: EventCounterProxyServiceBase) => {
      expect(eventCounterService instanceof EventCounterProxyServiceBase).toBe(true);
    }
    ));

  it('should call getEventCountersAll',
    inject([HttpTestingController, EventCounterProxyServiceBase],
      (httpTestingController: HttpTestingController, eventCounterService: EventCounterProxyServiceBase) => {

        eventCounterService.getEventCountersAll()
          .subscribe(
            (data: EventCounterList) => expect(data).toBe(eventCounterList),
            error => fail(error));

        // eventCounterService should have made one request to GET getEventCountersAll
        const req: TestRequest = httpTestingController.expectOne('protocol://site:port/host/api/eventcounters/');

        req.flush(eventCounterList);
        httpTestingController.verify();
      }
    ));

  it('should call getEventCountersAll and fails',
    inject([HttpTestingController, EventCounterProxyServiceBase],
      (httpTestingController: HttpTestingController, eventCounterService: EventCounterProxyServiceBase) => {

        const msg = '404';
        eventCounterService.getEventCountersAll().subscribe(
          (data: EventCounterList) => fail('expected that %s to fail: ' + data),
          (error: HttpErrorResponse) => expect(error.message).toContain(msg)
        );

        const req: TestRequest = httpTestingController.expectOne('protocol://site:port/host/api/eventcounters/');

        // respond with a 404 and the error message in the body
        req.flush(msg, { status: 404, statusText: 'Not Found' });
      }));

  it('should call getEventCounters',
    inject([HttpTestingController, EventCounterProxyServiceBase],
      (httpTestingController: HttpTestingController, eventCounterService: EventCounterProxyServiceBase) => {

        eventCounterService.getEventCounters(1)
          .subscribe(
            (data: EventCounter) => expect(data).toBe(eventCounters[0]),
            error => fail(error));

        // eventCounterService should have made one request to GET getEventCountersAll
        const req: TestRequest = httpTestingController.expectOne('protocol://site:port/host/api/eventcounters/1');

        req.flush(eventCounters[0]);
        httpTestingController.verify();
      }
    ));

  it('should call getEventCounters and fails',
    inject([HttpTestingController, EventCounterProxyServiceBase],
      (httpTestingController: HttpTestingController, eventCounterService: EventCounterProxyServiceBase) => {

        const msg = '404';
        eventCounterService.getEventCounters(1).subscribe(
          (data: EventCounter) => fail('expected that %s to fail: ' + data),
          (error: HttpErrorResponse) => expect(error.message).toContain(msg)
        );

        const req: TestRequest = httpTestingController.expectOne('protocol://site:port/host/api/eventcounters/1');

        // respond with a 404 and the error message in the body
        req.flush(msg, { status: 404, statusText: 'Not Found' });
      }));

  it('should subscribe with subscribeEventCounters',
    inject([EventCounterProxyServiceBase, HttpTestingController, SignalRService, WsiEndpointService],
      (eventCounterService: EventCounterProxyServiceBase,
        httpTestingController: HttpTestingController, mockSignalRService: MockSignalRService, wsiEndpointService: WsiEndpointService) => {
        const urlStart: string = wsiEndpointService.entryPoint + eventCountersSubscriptionChannelizeUrl;

        eventCounterService.subscribeEventCounters()
          .subscribe(
            (data: boolean) => expect(data).toBe(true),
            error => fail(error));

        const req: TestRequest = httpTestingController.expectOne((request: HttpRequest<any>) =>
          request.url.startsWith(urlStart));
        expect(req.request.method).toBe('POST');
        req.flush(new HttpResponse<any>());

        const proxy: HubProxyEvent<SubscriptionWsiEventCounters> = mockSignalRService.getNorisHub().proxies[1];
        /* eslint-disable @typescript-eslint/naming-convention */
        const subscription: SubscriptionWsiEventCounters = {
          ErrorCode: 0,
          RequestId: (counter - 1).toString(),
          RequestFor: 'notifyEventCounters'
        };
        /* eslint-enable @typescript-eslint/naming-convention */

        proxy.notifyEvents(subscription);
      }
    ));

  it('should handle an error in subscription',
    inject([EventCounterProxyServiceBase, HttpTestingController, SignalRService, WsiEndpointService],
      (eventCounterService: EventCounterProxyServiceBase, httpTestingController: HttpTestingController,
        mockSignalRService: MockSignalRService, wsiEndpointService: WsiEndpointService) => {
        const urlStart: string = wsiEndpointService.entryPoint + eventCountersSubscriptionChannelizeUrl;

        eventCounterService.subscribeEventCounters()
          .subscribe(
            (data: boolean) => expect(data).toBe(true),
            error => expect(error instanceof Error).toBe(true));

        const req: TestRequest = httpTestingController.expectOne((request: HttpRequest<any>) =>
          request.url.startsWith(urlStart));
        expect(req.request.method).toBe('POST');
        req.error(new ErrorEvent('error'));

        const proxy: HubProxyEvent<SubscriptionWsiEventCounters> = mockSignalRService.getNorisHub().proxies[1];
        /* eslint-disable @typescript-eslint/naming-convention */
        const subscription: SubscriptionWsiEventCounters = {
          ErrorCode: 0,
          RequestId: 'request',
          RequestFor: 'notifyEventCounters'
        };
        /* eslint-enable @typescript-eslint/naming-convention */

        proxy.notifyEvents(subscription);
      }
    ));

  it('should subscribe with subscribeEventCounters with disconnected hub',
    inject([EventCounterProxyServiceBase, HttpTestingController, SignalRService, WsiEndpointService],
      (eventCounterService: EventCounterProxyServiceBase, httpTestingController: HttpTestingController,
        mockSignalRService: MockSignalRService, wsiEndpointService: WsiEndpointService) => {
        const urlStart: string = wsiEndpointService.entryPoint + eventCountersSubscriptionChannelizeUrl;
        ((mockSignalRService.getNorisHub().hubConnection.connected) as BehaviorSubject<boolean>).next(false);
        eventCounterService.subscribeEventCounters()
          .subscribe(
            (data: boolean) => expect(data).toBe(true),
            error => fail(error));

        const req: TestRequest = httpTestingController.expectOne((request: HttpRequest<any>) =>
          request.url.startsWith(urlStart));
        expect(req.request.method).toBe('POST');
        req.flush(new HttpResponse<any>());
      }
    ));

  it('should handle an error in subscribe with disconnected hub',
    inject([EventCounterProxyServiceBase, SignalRService, HttpTestingController, WsiEndpointService],
      fakeAsync((eventCounterService: EventCounterProxyServiceBase,
        mockSignalRService: MockSignalRService,
        httpTestingController: HttpTestingController, wsiEndpointService: WsiEndpointService) => {
        ((mockSignalRService.getNorisHub().hubConnection.connected) as BehaviorSubject<boolean>).next(false);
        const urlStart: string = wsiEndpointService.entryPoint + eventCountersSubscriptionChannelizeUrl;
        eventCounterService.subscribeEventCounters()
          .subscribe(
            (data: boolean) => expect(data).toBe(true),
            error => expect(error instanceof Error).toBe(true));

        const req: TestRequest = httpTestingController.expectOne((request: HttpRequest<any>) =>
          request.url.startsWith(urlStart));
        expect(req.request.method).toBe('POST');
        req.error(new ErrorEvent('error'));

        httpTestingController.verify();
        tick();
      }
      )));

  it('should call eventCountersNotification',
    inject([EventCounterProxyServiceBase, SignalRService, TraceService], (eventCounterService: EventCounterProxyServiceBase,
      mockSignalRService: MockSignalRService, mockTraceService: MockTraceService) => {
      mockTraceService.traceSettings.debugEnabled = true;
      eventCounterService.eventCountersNotification()
        .subscribe(
          (data: EventCounterList) => expect(data).toBe(eventCounterList),
          error => fail(error));

      const proxy: HubProxyEvent<EventCounterList> = mockSignalRService.getNorisHub().proxies[0];
      proxy.notifyEvents(eventCounterList);

    }
    ));

  it('should unsubscribe with unSubscribeEventCounters',
    inject([EventCounterProxyServiceBase, HttpTestingController], (eventCounterService: EventCounterProxyServiceBase,
      httpTestingController: HttpTestingController) => {

      eventCounterService.unSubscribeEventCounters()
        .subscribe(
          (data: boolean) => expect(data).toBe(true),
          error => fail(error));

      const req: TestRequest = httpTestingController.expectOne(
        'protocol://site:port/host/api/sr/eventcounterssubscriptions/TestClientConnectionId');
      expect(req.request.method).toBe('DELETE');
      const result = true;
      req.event(new HttpResponse<boolean>({ body: true }));
    }
    ));

  it('should unsubscribe with unSubscribeEventCounters with disconnected hub',
    inject([EventCounterProxyServiceBase, HttpTestingController, SignalRService],
      (eventCounterService: EventCounterProxyServiceBase,
        httpTestingController: HttpTestingController, mockSignalRService: MockSignalRService) => {
        ((mockSignalRService.getNorisHub().hubConnection.connected) as BehaviorSubject<boolean>).next(false);
        eventCounterService.unSubscribeEventCounters()
          .subscribe(
            (data: boolean) => expect(data).toBe(true),
            error => fail(error));

        const req: TestRequest = httpTestingController.expectOne(
          'protocol://site:port/host/api/sr/eventcounterssubscriptions/TestClientConnectionId');
        expect(req.request.method).toBe('DELETE');
        const result = true;
        req.event(new HttpResponse<boolean>({ body: true }));
      }
    ));

  it('should handle an error in unsubscription',
    inject([EventCounterProxyServiceBase, HttpTestingController], (eventCounterService: EventCounterProxyServiceBase,
      httpTestingController: HttpTestingController) => {

      eventCounterService.unSubscribeEventCounters()
        .subscribe(
          (data: boolean) => expect(data).toBe(true),
          error => expect(error instanceof Error).toBe(true));

      const req: TestRequest = httpTestingController.expectOne(
        'protocol://site:port/host/api/sr/eventcounterssubscriptions/TestClientConnectionId');
      expect(req.request.method).toBe('DELETE');
      req.error(new ErrorEvent('error'));
    }
    ));

  it('should handle an error in unsubscription with disconnected hub',
    inject([EventCounterProxyServiceBase, HttpTestingController, SignalRService],
      (eventCounterService: EventCounterProxyServiceBase,
        httpTestingController: HttpTestingController, mockSignalRService: MockSignalRService) => {
        ((mockSignalRService.getNorisHub().hubConnection.connected) as BehaviorSubject<boolean>).next(false);
        eventCounterService.unSubscribeEventCounters()
          .subscribe(
            (data: boolean) => expect(data).toBe(true),
            error => expect(error instanceof Error).toBe(true));

        const req: TestRequest = httpTestingController.expectOne(
          'protocol://site:port/host/api/sr/eventcounterssubscriptions/TestClientConnectionId');
        expect(req.request.method).toBe('DELETE');
        req.error(new ErrorEvent('error'));
      }
    ));

  it('should receive signalrdisconnection',
    inject([EventCounterProxyServiceBase, SignalRService], (eventCounterService: EventCounterProxyServiceBase,
      mockSignalR: MockSignalRService) => {
      mockSignalR.getNorisHub().hubConnection.connectionStarted.subscribe(
        (isSubscribed: boolean) => expect(isSubscribed).toBe(true)
      );
      ((mockSignalR.getNorisHub().hubConnection.disconnected) as Subject<boolean>).next(true);
    }
    ));

  it('should receive signalrdisconnection error',
    inject([EventCounterProxyServiceBase, SignalRService], (eventCounterService: EventCounterProxyServiceBase,
      mockSignalR: MockSignalRService) => {
      ((mockSignalR.getNorisHub().hubConnection.disconnected) as Subject<boolean>).error({ message: 'error' });
    }
    ));

  it('should send connection state notifications',
    inject([EventCounterProxyServiceBase, SignalRService], (eventCounterService: EventCounterProxyServiceBase) => {
      eventCounterService.notifyConnectionState().subscribe((value: ConnectionState) => {
        expect(value).toBe(ConnectionState.Disconnected);
      });
    }
    ));

  it('should handle signalr reconnection',
    inject([EventCounterProxyServiceBase, SignalRService], (eventCounterService: EventCounterProxyServiceBase,
      mockSignalR: MockSignalRService) => {
      ((mockSignalR.getNorisHub().hubConnection.connectionState) as BehaviorSubject<SignalR.ConnectionState>).next(SignalR.ConnectionState.Disconnected);
      ((mockSignalR.getNorisHub().hubConnection.connectionState) as BehaviorSubject<SignalR.ConnectionState>).next(SignalR.ConnectionState.Connected);
    }));
});
