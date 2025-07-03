import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { inject, TestBed, waitForAsync } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthenticationServiceBase, ErrorNotificationServiceBase,
  MockTraceService, MockWsiEndpointService, TraceService } from '@gms-flex/services-common';
import { Observable, Subscription } from 'rxjs';

import { ErrorNotificationService } from '../shared/error-notification.service';
import { MockWsiUtilityService } from '../shared/mock-wsi-utility.service';
import { WsiUtilityService } from '../shared/wsi-utility.service';
import { WsiEndpointService } from '../wsi-endpoint/wsi-endpoint.service';
import { TimerService } from './timer.service';

class RouterStub {}
// Tests  /////////////
describe('Timer Service', () => {

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [],
      providers: [
        { provide: TraceService, useClass: MockTraceService },
        { provide: Router, useClass: RouterStub },
        { provide: WsiEndpointService, useClass: MockWsiEndpointService },
        { provide: 'productSettingFilePath', useValue: 'noMatter' },
        { provide: 'wsiSettingFilePath', useValue: 'https://fake-server.com' },
        { provide: WsiUtilityService, useClass: MockWsiUtilityService },
        { provide: ErrorNotificationServiceBase, useClass: ErrorNotificationService },
        AuthenticationServiceBase,
        TimerService,
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting()
      ]
    })
      .compileComponents();
  }));

  it('should create TimerService Service',
    inject([TimerService], (timerService: TimerService) => {
      expect(timerService instanceof TimerService).toBe(true);
    }));

  it('should subscribe to OnTimer', inject([TimerService], (timerService: TimerService) => {
    const timer: Observable<number> = timerService.getTimer(500);
    const timer2: Observable<number> = timerService.getTimer(500);
    expect(timer).toBe(timer2);
    const timer3: Observable<number> = timerService.getTimer(100);
    expect(timer3).not.toBe(timer2);
  }));
});
