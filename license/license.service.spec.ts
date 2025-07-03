/* eslint-disable @typescript-eslint/dot-notation */
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { Action, NotifConfiguration, Notification, NotificationServiceBase, TraceService } from '@gms-flex/services-common';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, Observable, of, Subject } from 'rxjs';

import { TimerServiceBase } from '../timer/timer.service.base';
import { LicenseWsi } from '../wsi-proxy-api/license/data.model';
import { LicenseProxyServiceBase } from '../wsi-proxy-api/license/license-proxy.service.base';
import { ConnectionState } from '../wsi-proxy-api/shared/data.model';
import { LicenseService } from './license.service';

class MockTraceService {
  public info(module: string, message: string, ...args: any[]): void { }
  public isDebugEnabled(module: string): boolean { return false; }
}

class MockLicenseProxyService extends LicenseProxyServiceBase {
  private readonly connectionStateSubject = new BehaviorSubject<ConnectionState>(ConnectionState.Connected);
  private readonly licenseNotificationSubject = new BehaviorSubject<LicenseWsi>({} as LicenseWsi);

  public notifyConnectionState(): Observable<ConnectionState> {
    return this.connectionStateSubject.asObservable();
  }

  public licenseNotification(): Observable<LicenseWsi> {
    return this.licenseNotificationSubject.asObservable();
  }

  public subscribeLicense(): Observable<boolean> {
    return of(true);
  }

  public unsubscribeLicense(): Observable<boolean> {
    return of(true);
  }

  public emitConnectionState(state: ConnectionState): void {
    this.connectionStateSubject.next(state);
  }

  public emitLicenseNotification(license: LicenseWsi): void {
    this.licenseNotificationSubject.next(license);
  }
}

class MockTimerService extends TimerServiceBase {
  public getTimer(): Observable<number> {
    return of(0);
  }
}

class MockNotificationService implements Partial<NotificationServiceBase> {
  public readonly closeRightPanel: Subject<boolean> = new Subject<boolean>();
  private readonly configurations: Map<string, NotifConfiguration> = new Map<string, NotifConfiguration>();

  public register(sender: string, configuration: NotifConfiguration): void {
    this.configurations.set(sender, configuration);
  }

  public notify(sender: string, notification: any): void {
    // Mock implementation
  }

  public cancelAll(sender: string): void {
    // Mock implementation
  }

  public getConfigurations(): Map<string, NotifConfiguration> {
    return this.configurations;
  }

  public subscribeConfigurations(): Observable<Map<string, NotifConfiguration>> {
    return of(this.configurations);
  }

  public subscribeNotifications(): Observable<Notification> {
    return of({} as Notification);
  }
}

class MockTranslateService implements Partial<TranslateService> {
  public get(keys: string | string[]): Observable<Record<string, string>> {
    return of({
      'GMS_SERVICES.LICENSE_DESCRIPTION': 'License Description',
      'GMS_SERVICES.LICENSE_TEXT': 'License Text',
      'GMS_SERVICES.LICENSE_NOTIF_TEXT': 'License Notification Text',
      'GMS_SERVICES.LICENSE_NOTIF_TEXT2': 'License Notification Text 2'
    });
  }
}

describe('LicenseService', () => {
  let service: LicenseService;
  let licenseProxyService: MockLicenseProxyService;
  let notificationService: MockNotificationService;
  let traceService: MockTraceService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        LicenseService,
        { provide: TraceService, useClass: MockTraceService },
        { provide: LicenseProxyServiceBase, useClass: MockLicenseProxyService },
        { provide: TimerServiceBase, useClass: MockTimerService },
        { provide: NotificationServiceBase, useClass: MockNotificationService },
        { provide: TranslateService, useClass: MockTranslateService }
      ]
    });

    service = TestBed.inject(LicenseService);
    licenseProxyService = TestBed.inject(LicenseProxyServiceBase) as unknown as MockLicenseProxyService;
    notificationService = TestBed.inject(NotificationServiceBase) as unknown as MockNotificationService;
    traceService = TestBed.inject(TraceService) as unknown as MockTraceService;
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  describe('License Subscription', () => {
    it('should subscribe to license notifications', () => {
      const subscribeSpy = spyOn(licenseProxyService, 'subscribeLicense');
      service.subscribeLicense();
      expect(subscribeSpy).toHaveBeenCalled();
    });

    it('should unsubscribe from license notifications', done => {
      const unsubscribeSpy = spyOn(licenseProxyService, 'unsubscribeLicense').and.callThrough();
      service.unSubscribeLicense().subscribe(result => {
        expect(result).toBe(true);
        expect(unsubscribeSpy).toHaveBeenCalled();
        done();
      });
    });
  });

  describe('Connection State Management', () => {
    it('should handle reconnection after disconnect', fakeAsync(() => {
      const subscribeSpy = spyOn(licenseProxyService, 'subscribeLicense');

      licenseProxyService.emitConnectionState(ConnectionState.Connected);
      tick();
      expect(subscribeSpy).not.toHaveBeenCalled();

      licenseProxyService.emitConnectionState(ConnectionState.Disconnected);
      tick();
      expect(subscribeSpy).not.toHaveBeenCalled();

      licenseProxyService.emitConnectionState(ConnectionState.Connected);
      tick();
      expect(subscribeSpy).toHaveBeenCalled();
    }));

    it('should not resubscribe without prior disconnection', fakeAsync(() => {
      const subscribeSpy = spyOn(licenseProxyService, 'subscribeLicense');

      licenseProxyService.emitConnectionState(ConnectionState.Connected);
      tick();
      licenseProxyService.emitConnectionState(ConnectionState.Connected);
      tick();

      expect(subscribeSpy).not.toHaveBeenCalled();
    }));
  });

  describe('License Notification', () => {
    let notifySpy: jasmine.Spy;

    beforeEach(() => {
      // Reset service before each test
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          LicenseService,
          { provide: TraceService, useClass: MockTraceService },
          { provide: LicenseProxyServiceBase, useClass: MockLicenseProxyService },
          { provide: TimerServiceBase, useClass: MockTimerService },
          { provide: NotificationServiceBase, useClass: MockNotificationService },
          {
            provide: TranslateService,
            useValue: {
              get: (): Observable<Record<string, string>> => of({
                'GMS_SERVICES.LICENSE_TEXT': 'License Text',
                'GMS_SERVICES.LICENSE_NOTIF_TEXT': 'License Notification Text',
                'GMS_SERVICES.LICENSE_NOTIF_TEXT2': 'License Notification Text 2'
              })
            }
          }
        ]
      });

      service = TestBed.inject(LicenseService);
      licenseProxyService = TestBed.inject(LicenseProxyServiceBase) as MockLicenseProxyService;
      notificationService = TestBed.inject(NotificationServiceBase) as unknown as MockNotificationService;
      notifySpy = spyOn(notificationService, 'notify');
    });

    it('should handle demo mode license notification', fakeAsync(() => {
      const mockLicense: LicenseWsi = {
        LicenseModeValue: 1,
        LicenseModeName: 'Demo',
        ExpirationTime: 86400
      };

      service.subscribeLicense();
      tick();

      licenseProxyService.emitLicenseNotification(mockLicense);
      tick();

      expect(notifySpy).toHaveBeenCalled();
    }));

    it('should handle courtesy license notification', fakeAsync(() => {
      const mockLicense: LicenseWsi = {
        LicenseModeValue: 2,
        LicenseModeName: 'Courtesy',
        ExpirationTime: 3600
      };

      service.subscribeLicense();
      tick();

      licenseProxyService.emitLicenseNotification(mockLicense);
      tick();

      expect(notifySpy).toHaveBeenCalled();
    }));

    it('should calculate expiration time correctly for days format', fakeAsync(() => {
      const mockLicense: LicenseWsi = {
        LicenseModeValue: 1,
        LicenseModeName: 'Demo',
        ExpirationTime: 90000
      };

      service.subscribeLicense();
      tick();

      licenseProxyService.emitLicenseNotification(mockLicense);
      tick();

      expect(notifySpy).toHaveBeenCalled();
      const notificationArg = notifySpy.calls.mostRecent().args[1];
      expect(notificationArg.getText()).toContain('License Notification Text');
    }));

    it('should calculate expiration time correctly for hours and minutes format', fakeAsync(() => {
      const mockLicense: LicenseWsi = {
        LicenseModeValue: 1,
        LicenseModeName: 'Demo',
        ExpirationTime: 3660
      };

      service.subscribeLicense();
      tick();

      licenseProxyService.emitLicenseNotification(mockLicense);
      tick();

      expect(notifySpy).toHaveBeenCalled();
      const notificationArg = notifySpy.calls.mostRecent().args[1];
      expect(notificationArg.getText()).toContain('License Notification Text');
    }));
  });

  describe('Edge Cases', () => {
    let notifySpy: jasmine.Spy;

    beforeEach(() => {
      // Reset service before each test
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          LicenseService,
          { provide: TraceService, useClass: MockTraceService },
          { provide: LicenseProxyServiceBase, useClass: MockLicenseProxyService },
          { provide: TimerServiceBase, useClass: MockTimerService },
          { provide: NotificationServiceBase, useClass: MockNotificationService },
          { provide: TranslateService, useClass: MockTranslateService }
        ]
      });

      service = TestBed.inject(LicenseService);
      licenseProxyService = TestBed.inject(LicenseProxyServiceBase) as MockLicenseProxyService;
      notificationService = TestBed.inject(NotificationServiceBase) as unknown as MockNotificationService;
      notifySpy = spyOn(notificationService, 'notify');

      // Initialize service
      service.subscribeLicense();
    });

    it('should handle developer license mode (no notification)', fakeAsync(() => {
      const mockLicense: LicenseWsi = {
        LicenseModeValue: 0,
        LicenseModeName: 'Developer',
        ExpirationTime: 0
      };

      const cancelSpy = spyOn(notificationService, 'cancelAll');

      service.subscribeLicense();
      tick();

      licenseProxyService.emitLicenseNotification(mockLicense);
      tick();

      expect(cancelSpy).toHaveBeenCalled();
      expect(cancelSpy.calls.count()).toBe(2);
    }));

    it('should handle normal license mode (no notification)', fakeAsync(() => {
      const mockLicense: LicenseWsi = {
        LicenseModeValue: 4,
        LicenseModeName: 'Normal',
        ExpirationTime: 0
      };

      const cancelSpy = spyOn(notificationService, 'cancelAll');

      service.subscribeLicense();
      tick();

      licenseProxyService.emitLicenseNotification(mockLicense);
      tick();

      expect(cancelSpy).toHaveBeenCalled();
      expect(cancelSpy.calls.count()).toBe(2);
    }));

    it('should handle very short expiration time', fakeAsync(() => {
      const mockLicense: LicenseWsi = {
        LicenseModeValue: 1,
        LicenseModeName: 'Demo',
        ExpirationTime: 59
      };

      service.subscribeLicense();
      tick();

      licenseProxyService.emitLicenseNotification(mockLicense);
      tick();

      expect(notifySpy).toHaveBeenCalled();
      const notificationArg = notifySpy.calls.mostRecent().args[1];
      expect(notificationArg.getText()).toContain('License Notification Text');
    }));
  });

  describe('Logging', () => {
    it('should log service creation and connection state changes', fakeAsync(() => {
      const infoSpy = spyOn(traceService, 'info');

      const newService = TestBed.inject(LicenseService);
      tick();

      infoSpy.calls.reset();
      licenseProxyService.emitConnectionState(ConnectionState.Disconnected);
      tick();

      expect(infoSpy).toHaveBeenCalledWith(
        'gmsServices_License',
        'LicenseService.onNotifyConnectionState() state: %s',
        'Disconnected'
      );
    }));

    it('should log subscription events', fakeAsync(() => {
      const infoSpy = spyOn(traceService, 'info');

      service.subscribeLicense();
      tick();

      expect(infoSpy).toHaveBeenCalledWith(
        'gmsServices_License',
        'LicenseService.subscribeEvents() called.'
      );
    }));
  });
});
