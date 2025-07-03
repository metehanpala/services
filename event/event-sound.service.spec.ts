import { HttpRequest, HttpResponse, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting, TestRequest } from '@angular/common/http/testing';
import { inject, TestBed, waitForAsync } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthenticationServiceBase, ErrorNotificationServiceBase, MockTraceService, MockWsiEndpointService, TraceService } from '@gms-flex/services-common';
import { BehaviorSubject, Subject, Subscription } from 'rxjs';

import { MockFilesService } from '../files/mock-files.service';
import { ErrorNotificationService } from '../shared/error-notification.service';
import { MockWsiUtilityService } from '../shared/mock-wsi-utility.service';
import { SubscribeContextChannelizedSingle } from '../shared/subscription/subscribe-context-channelized-single';
import { WsiUtilityService } from '../shared/wsi-utility.service';
import { HubProxyEvent } from '../signalr/hub-proxy-event';
import { MockSignalRService } from '../signalr/mock-signalr.service';
import { SignalRService } from '../signalr/signalr.service';
import { WsiEndpointService } from '../wsi-endpoint/wsi-endpoint.service';
import { EventSoundWsi, ResoundCategory, SubscriptionWsiEventSound } from '../wsi-proxy-api/event/data.model';
import { EventSoundProxyServiceBase } from '../wsi-proxy-api/event/event-sound-proxy.service.base';
import { FilesServiceBase } from '../wsi-proxy-api/files/files.service.base';
import { EventSound } from './data.model';
import { EventSoundProxyService } from './event-sound-proxy.service';
import { EventSoundService } from './event-sound.service';

/* eslint-disable @typescript-eslint/naming-convention */

const eventSoundWsi: EventSoundWsi = {
  FileName: '3f4c8f8d-1db2-4735-867f-37fd099a71d3.wav',
  ResoundData: [],
  _links: [
    {
      'Rel': 'DownloadSoundFile',
      'Href': 'api/files/1/Libraries%5cGlobal_Events_HQ_1%5cMediaLibrary%5c3f4c8f8d-1db2-4735-867f-37fd099a71d3.wav',
      'IsTemplated': false
    }
  ],
  Visibility: 0
};
const eventSoundWsiNoLinks: EventSoundWsi = {
  FileName: '',
  ResoundData: [],
  _links: [
  ],
  Visibility: 0
};

/* eslint-enable @typescript-eslint/naming-convention */

const eventSound: EventSound = new EventSound(eventSoundWsi);

class RouterStub {}
// Tests  /////////////
describe('EventSoundService', () => {
  const counter = 0;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [],
      providers: [
        { provide: TraceService, useClass: MockTraceService },
        { provide: Router, useClass: RouterStub },
        { provide: WsiEndpointService, useClass: MockWsiEndpointService },
        { provide: SignalRService, useClass: MockSignalRService },
        { provide: 'wsiSettingFilePath', useValue: 'http://CH1W80106.ad001.siemens.net:80' },
        { provide: WsiUtilityService, useClass: MockWsiUtilityService },
        { provide: ErrorNotificationServiceBase, useClass: ErrorNotificationService },
        { provide: EventSoundProxyServiceBase, useClass: EventSoundProxyService },
        AuthenticationServiceBase,
        EventSoundService,
        { provide: FilesServiceBase, useClass: MockFilesService },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting()
      ]
    })
      .compileComponents();
  }));

  it('should create EventSoundService',
    inject([EventSoundService], (eventSoundService: EventSoundService) => {
      expect(eventSoundService instanceof EventSoundService).toBe(true);
    }
    ));

  it('should call getEventSound',
    inject([EventSoundService, HttpTestingController, TraceService], (eventSoundService: EventSoundService,
      httpTestingController: HttpTestingController, mockTraceService: MockTraceService) => {
      mockTraceService.traceSettings.debugEnabled = true;
      eventSoundService.getCurrentSound()
        .subscribe(
          (data: EventSound) => expect(data).toBe(eventSound),
          error => fail(error));

      const req: TestRequest = httpTestingController.expectOne('protocol://site:port/host/api/eventcategorysounds');
      expect(req.request.method).toBe('GET');

      req.flush(eventSoundWsi);
      httpTestingController.verify();

    }
    ));

  it('should call getEventSound and fails',
    inject([EventSoundService], (eventSoundService: EventSoundService) => {

      eventSoundService.getCurrentSound().
        subscribe(
          (data: EventSound) => expect(data).toBe(data),
          (err: Error) => expect(err).toMatch(/Response with status/, '404 null for URL: null')).unsubscribe();
    }));

  it('should call getEventSound with no sound',
    inject([EventSoundService, HttpTestingController], (eventSoundService: EventSoundService,
      httpTestingController: HttpTestingController) => {

      eventSoundService.getCurrentSound().
        subscribe(
          (data: EventSound) => expect(data).toBe(data),
          error => fail(error));

      const req: TestRequest = httpTestingController.expectOne('protocol://site:port/host/api/eventcategorysounds');
      expect(req.request.method).toBe('GET');

      req.flush(eventSoundWsiNoLinks);
      httpTestingController.verify();
    }));

  it('should call getEventSound with error',
    inject([EventSoundService, HttpTestingController], (eventSoundService: EventSoundService,
      httpTestingController: HttpTestingController) => {

      eventSoundService.getCurrentSound().
        subscribe(
          (data: EventSound) => expect(data).toBe(data),
          error => fail(error));

      const req: TestRequest = httpTestingController.expectOne('protocol://site:port/host/api/eventcategorysounds');
      expect(req.request.method).toBe('GET');

      req.error(new ErrorEvent('error'));
      httpTestingController.verify();
    }));

  /* it('should call getEventSound and get sound from cache',
    (done: DoneFn) => {
      inject([EventSoundService, HttpTestingController, FilesServiceBase],
        (eventSoundService: EventSoundService, httpTestingController: HttpTestingController, mockFileService: MockFilesService) => {

          let subscription: Subscription = eventSoundService.getCurrentSound().
            subscribe(
              (data: EventSound) => {
                subscription.unsubscribe();

                subscription = eventSoundService.getCurrentSound().
                  subscribe(
                    (data2: EventSound) => { // },
                    error => fail(error)
                  );

                const reqGet: TestRequest = httpTestingController.expectOne('protocol://site:port/host/api/eventcategorysounds');
                expect(reqGet.request.method).toBe('GET');

                reqGet.flush(eventSoundWsi);
                httpTestingController.verify();

                setTimeout(() => {
                  subscription.unsubscribe();
                  done();
                }, 1);
              },
              error => fail(error));

          const req: TestRequest = httpTestingController.expectOne('protocol://site:port/host/api/eventcategorysounds');
          expect(req.request.method).toBe('GET');

          req.flush(eventSoundWsi);
          httpTestingController.verify();

          setTimeout(() => {
            mockFileService.observer?.next(new Blob(['0', '1', '2']));
          }, 1);

        })();
    }); */

  it('should call getEventSound and get error from file service',
    (done: DoneFn) => {
      inject([EventSoundService, HttpTestingController, FilesServiceBase],
        (eventSoundService: EventSoundService, httpTestingController: HttpTestingController, mockFileService: MockFilesService) => {

          eventSoundService.getCurrentSound().subscribe();

          const req: TestRequest = httpTestingController.expectOne('protocol://site:port/host/api/eventcategorysounds');
          expect(req.request.method).toBe('GET');

          req.flush(eventSoundWsi);
          httpTestingController.verify();

          setTimeout(() => {
            mockFileService.observer?.error(new Error('error'));
            done();
          }, 1);

        })();
    });

  it('should subscribe with subscribeEventSound',
    inject([EventSoundService, EventSoundProxyServiceBase, TraceService, HttpTestingController,
      SignalRService], (eventSoundService: EventSoundService,
      eventSoundProxy: EventSoundProxyService, mockTraceService: MockTraceService,
      httpTestingController: HttpTestingController, mockSignalRService: MockSignalRService) => {

      mockTraceService.traceSettings.debugEnabled = true;
      eventSoundService.subscribeEventSound()
        .subscribe(
          (data: boolean) => expect(data).toBe(true),
          error => fail(error));

      const req: TestRequest = httpTestingController.expectOne((request: HttpRequest<any>) =>
        request.url.startsWith(
          'protocol://site:port/host/api/sr/eventcategorysoundssubscriptions/channelize/'));
      expect(req.request.method).toBe('POST');
      req.flush(new HttpResponse<any>());
      const id: string = req.request.url.substr('protocol://site:port/host/api/sr/eventcategorysoundssubscriptions/channelize/'.length, 1);
      const proxy: HubProxyEvent<SubscriptionWsiEventSound> = mockSignalRService.getNorisHub().proxies[1];
      /* eslint-disable @typescript-eslint/naming-convention */
      const subscription: SubscriptionWsiEventSound = {
        ErrorCode: 0,
        RequestId: id,
        RequestFor: 'notifySounds'
      };
      /* eslint-enable @typescript-eslint/naming-convention */

      proxy.notifyEvents(subscription);

      eventSoundProxy.hubProxyEventSound?.notifyEvents(eventSoundWsi);

    }
    ));

  it('should subscribe and handle error with subscribeEventSound',
    inject([EventSoundService, EventSoundProxyServiceBase, TraceService, HttpTestingController,
      SignalRService], (eventSoundService: EventSoundService,
      eventSoundProxy: EventSoundProxyService, mockTraceService: MockTraceService,
      httpTestingController: HttpTestingController, mockSignalRService: MockSignalRService) => {

      mockTraceService.traceSettings.debugEnabled = true;
      eventSoundService.subscribeEventSound()
        .subscribe(
          (data: boolean) => expect(data).toBe(true),
          error => expect(error instanceof Error).toBeTruthy());

      const req: TestRequest = httpTestingController.expectOne((request: HttpRequest<any>) =>
        request.url.startsWith(
          'protocol://site:port/host/api/sr/eventcategorysoundssubscriptions/channelize/'));
      expect(req.request.method).toBe('POST');
      req.error(new ErrorEvent('error'));
    }
    ));

  it('should subscribe with subscribeEventSound with disconnected hub',
    inject([EventSoundService, EventSoundProxyServiceBase, TraceService, HttpTestingController,
      SignalRService], (eventSoundService: EventSoundService,
      eventSoundProxy: EventSoundProxyService, mockTraceService: MockTraceService,
      httpTestingController: HttpTestingController, mockSignalRService: MockSignalRService) => {
      ((mockSignalRService.getNorisHub().hubConnection.connected) as Subject<boolean>).next(false);
      mockTraceService.traceSettings.debugEnabled = true;
      eventSoundService.subscribeEventSound()
        .subscribe(
          (data: boolean) => expect(data).toBe(true),
          error => fail(error));

      const req: TestRequest = httpTestingController.expectOne((request: HttpRequest<any>) =>
        request.url.startsWith(
          'protocol://site:port/host/api/sr/eventcategorysoundssubscriptions/channelize/'));
      expect(req.request.method).toBe('POST');
      req.flush(new HttpResponse<any>());
    }
    ));

  it('should handle error with subscribeEventSound with disconnected hub',
    inject([EventSoundService, EventSoundProxyServiceBase, TraceService, HttpTestingController,
      SignalRService], (eventSoundService: EventSoundService,
      eventSoundProxy: EventSoundProxyService, mockTraceService: MockTraceService,
      httpTestingController: HttpTestingController, mockSignalRService: MockSignalRService) => {
      ((mockSignalRService.getNorisHub().hubConnection.connected) as Subject<boolean>).next(false);
      mockTraceService.traceSettings.debugEnabled = true;
      eventSoundService.subscribeEventSound()
        .subscribe(
          (data: boolean) => expect(data).toBe(true),
          error => expect(error instanceof Error).toBeTruthy());

      const req: TestRequest = httpTestingController.expectOne((request: HttpRequest<any>) =>
        request.url.startsWith(
          'protocol://site:port/host/api/sr/eventcategorysoundssubscriptions/channelize/'));
      expect(req.request.method).toBe('POST');
      req.error(new ErrorEvent('error'));
    }
    ));

  it('should call eventSoundNotification',
    inject([EventSoundService], (eventSoundService: EventSoundService) => {

      eventSoundService.subscribedEventSound?.next(eventSound);

      eventSoundService.eventSoundNotification()
        .subscribe(
          (data: EventSound) => expect(data).toBe(eventSound),
          error => fail(error));
    }
    ));

  it('should unsubscribe with unSubscribeEventSound',
    inject([EventSoundService, HttpTestingController], (eventSoundService: EventSoundService,
      httpTestingController: HttpTestingController) => {

      eventSoundService.unSubscribeEventSound()
        .subscribe(
          (data: boolean) => expect(data).toBe(true),
          error => fail(error));

      const req: TestRequest = httpTestingController.expectOne(
        'protocol://site:port/host/api/sr/eventcategorysoundssubscriptions/TestClientConnectionId');
      expect(req.request.method).toBe('DELETE');
      const result = true;
      req.event(new HttpResponse<boolean>({ body: true }));
    }
    ));

  it('should unsubscribe with unSubscribeEventSound and handle error',
    inject([EventSoundService, HttpTestingController], (eventSoundService: EventSoundService,
      httpTestingController: HttpTestingController) => {

      eventSoundService.unSubscribeEventSound()
        .subscribe(
          (data: boolean) => expect(data).toBe(true),
          error => expect(error instanceof Error).toBeTruthy());

      const req: TestRequest = httpTestingController.expectOne(
        'protocol://site:port/host/api/sr/eventcategorysoundssubscriptions/TestClientConnectionId');
      expect(req.request.method).toBe('DELETE');
      const result = true;
      req.error(new ErrorEvent('error'));
    }
    ));

  it('should unsubscribe with unSubscribeEventSound with disconnected hub',
    inject([EventSoundService, HttpTestingController, SignalRService],
      (eventSoundService: EventSoundService, httpTestingController: HttpTestingController, mockSignalRService: MockSignalRService) => {
        ((mockSignalRService.getNorisHub().hubConnection.connected) as Subject<boolean>).next(false);
        eventSoundService.unSubscribeEventSound()
          .subscribe(
            (data: boolean) => expect(data).toBe(true),
            error => fail(error));

        const req: TestRequest = httpTestingController.expectOne(
          'protocol://site:port/host/api/sr/eventcategorysoundssubscriptions/TestClientConnectionId');
        expect(req.request.method).toBe('DELETE');
        const result = true;
        req.event(new HttpResponse<boolean>({ body: true }));
      }
    ));

  it('should unsubscribe with unSubscribeEventSound with disconnected hub and handle error',
    inject([EventSoundService, HttpTestingController, SignalRService],
      (eventSoundService: EventSoundService, httpTestingController: HttpTestingController, mockSignalRService: MockSignalRService) => {
        ((mockSignalRService.getNorisHub().hubConnection.connected) as Subject<boolean>).next(false);
        eventSoundService.unSubscribeEventSound()
          .subscribe(
            (data: boolean) => expect(data).toBe(true),
            error => expect(error instanceof Error).toBeTruthy());

        const req: TestRequest = httpTestingController.expectOne(
          'protocol://site:port/host/api/sr/eventcategorysoundssubscriptions/TestClientConnectionId');
        expect(req.request.method).toBe('DELETE');
        const result = true;
        req.error(new ErrorEvent('error'));
      }
    ));

  it('should process connection state notifications',
    inject([EventSoundService, SignalRService], (eventSoundService: EventSoundService,
      mockSignalR: MockSignalRService) => {
      ((mockSignalR.getNorisHubConnection().connectionState) as BehaviorSubject<SignalR.ConnectionState>).next(SignalR.ConnectionState.Disconnected);
      expect(eventSoundService.eventSoundNotification()).not.toBeNull();
      ((mockSignalR.getNorisHubConnection().connectionState) as BehaviorSubject<SignalR.ConnectionState>).next(SignalR.ConnectionState.Connected);
    }
    ));

  it('should handle various event sounds',
    inject([EventSoundService, EventSoundProxyServiceBase, TraceService], (eventSoundService: EventSoundService,
      eventSoundProxy: EventSoundProxyService, mockTraceService: MockTraceService) => {

      eventSoundProxy.hubProxyEventSound?.notifyEvents(eventSoundWsiNoLinks);
    }
    ));

  it('should receive signalrdisconnection',
    inject([EventSoundService, SignalRService], (eventSoundService: EventSoundService,
      mockSignalR: MockSignalRService) => {
      mockSignalR.getNorisHub().hubConnection.connectionStarted.subscribe(
        (isSubscribed: boolean) => expect(isSubscribed).toBe(true)
      );
      ((mockSignalR.getNorisHub().hubConnection.disconnected) as Subject<boolean>).next(true);
    }
    ));

  it('should receive signalrdisconnection error',
    inject([EventSoundService, SignalRService], (eventSoundService: EventSoundService,
      mockSignalR: MockSignalRService) => {
      ((mockSignalR.getNorisHub().hubConnection.disconnected) as Subject<boolean>).error({ message: 'error' });
    }
    ));
});
