import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { inject, TestBed, waitForAsync } from '@angular/core/testing';
import { AuthenticationServiceBase, ErrorNotificationServiceBase } from '@gms-flex/services-common';

import { WsiUtilityService } from '../shared';
import { ErrorNotificationService } from '../shared/error-notification.service';
import { MockWsiUtilityService } from '../shared/mock-wsi-utility.service';
import { SignalRService } from '../signalr';
import { MockSignalRService } from '../signalr/mock-signalr.service';
import { SessionsSubscriptionsServiceBase } from '../wsi-proxy-api';
import { SessionsSubscriptionsService } from './sessions-subscriptions.service';

describe('SessionsSubscriptionsService Service', () => {
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [],
      providers: [
        AuthenticationServiceBase,
        { provide: ErrorNotificationServiceBase, useClass: ErrorNotificationService },
        { provide: SessionsSubscriptionsServiceBase, useClass: SessionsSubscriptionsService },
        { provide: 'appSettingFilePath', useValue: 'noMatter' },
        { provide: 'wsiSettingFilePath', useValue: 'config/wsi-endpoint.settings.json' },
        { provide: SignalRService, useClass: MockSignalRService },
        { provide: WsiUtilityService, useClass: MockWsiUtilityService },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting()
      ]
    })
      .compileComponents();
  }));

  it('should create SessionsSubscriptionsService Service',
    inject([SessionsSubscriptionsServiceBase], (sessions: SessionsSubscriptionsServiceBase) => {
      expect(sessions instanceof SessionsSubscriptionsService).toBe(true);
    }));
});