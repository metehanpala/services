import { inject, TestBed, waitForAsync } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthenticationServiceBase, ErrorNotificationServiceBase, MockTraceService, MockWsiEndpointService, TraceService } from '@gms-flex/services-common';
import { TranslateFakeLoader, TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core';

import { ErrorNotificationService } from '../shared/error-notification.service';
import { WsiEndpointService } from '../wsi-endpoint/wsi-endpoint.service';
import { WsiUtilityService } from './wsi-utility.service';

class RouterStub {}
// Tests  /////////////
describe('WsiUtility Service', () => {

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        TranslateModule.forRoot({
          loader: { provide: TranslateLoader, useClass: TranslateFakeLoader }
        })],
      providers: [
        { provide: TraceService, useClass: MockTraceService },
        { provide: Router, useClass: RouterStub },
        { provide: WsiEndpointService, useClass: MockWsiEndpointService },
        { provide: 'wsiSettingFilePath', useValue: 'https://fake-server.com' },
        WsiUtilityService,
        { provide: ErrorNotificationServiceBase, useClass: ErrorNotificationService },
        AuthenticationServiceBase,
        TranslateService
      ]
    })
      .compileComponents();
  }));

  it('should create WsiUtility Service',
    inject([WsiUtilityService], (wsiUtilityService: WsiUtilityService) => {
      expect(wsiUtilityService instanceof WsiUtilityService).toBe(true);
    }));

});
